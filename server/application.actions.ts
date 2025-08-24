"use server";

import { createClient } from "@/lib/supabase/server";
import { applicationsInsertSchema } from "@/schemas/database.schema";
import type { Database } from "@/types/database.types";
import { uploadApplicationImage } from "@/server/files.actions";
import { sendEmail } from "@/lib/resend-utils";
import { StylistApplicationEmail } from "@/transactional/emails/stylist-application";
import { ApplicationStatusUpdateEmail } from "@/transactional/emails/application-status-update";
import { createServiceClient } from "@/lib/supabase/service";
import { getNabostylistenLogoUrl } from "@/lib/supabase/utils";
import { shouldReceiveNotification } from "@/lib/preferences-utils";
import { createConnectedAccount, createAccountOnboardingLink, createStripeCustomer } from "@/server/stripe.actions";

export interface ApplicationFormData {
    // Personal information
    fullName: string;
    email: string;
    phoneNumber: string;
    birthDate: string; // Coming from form as string, will be converted to Date

    // Address information
    address: {
        nickname?: string;
        streetAddress: string;
        city: string;
        postalCode: string;
        country: string;
        entryInstructions?: string;
    };

    // Professional information
    professionalExperience: string;
    priceRangeFrom: number;
    priceRangeTo: number;

    // Service categories
    serviceCategories: string[];

    // Portfolio images (URLs)
    portfolioImageUrls: string[];
}

/**
 * Upload application portfolio images to Supabase storage and return public URLs
 */
export async function uploadPortfolioImages(
    files: File[],
    applicationId: string,
) {
    try {
        // Upload all files to the applications bucket
        const uploadPromises = files.map(async (file) => {
            const uploadResult = await uploadApplicationImage({
                applicationId,
                file,
            });

            if (uploadResult.error) {
                throw new Error(
                    `Kunne ikke laste opp bilde ${file.name}: ${uploadResult.error}`,
                );
            }

            if (!uploadResult.data) {
                throw new Error(
                    `Ingen data returnert for opplasting av ${file.name}`,
                );
            }

            return uploadResult.data.publicUrl || uploadResult.data.fullPath;
        });

        const results = await Promise.all(uploadPromises);

        return {
            data: results,
            error: null,
        };
    } catch (error) {
        console.error("Error uploading portfolio images:", error);
        return {
            data: null,
            error: error instanceof Error
                ? error.message
                : "En ukjent feil oppstod",
        };
    }
}

/**
 * Create a new stylist application
 */
export async function createApplication(data: ApplicationFormData) {
    try {
        const supabase = await createClient();

        // Get current user (optional - applications can be submitted without auth)
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || null;

        // Create application with all data stored directly
        const applicationData = {
            user_id: userId,
            full_name: data.fullName,
            email: data.email,
            phone_number: data.phoneNumber,
            birth_date: new Date(data.birthDate).toISOString().split("T")[0], // Convert string to Date and format as YYYY-MM-DD
            address_nickname: data.address.nickname,
            street_address: data.address.streetAddress,
            city: data.address.city,
            postal_code: data.address.postalCode,
            country: data.address.country,
            entry_instructions: data.address.entryInstructions,
            professional_experience: data.professionalExperience,
            price_range_from: data.priceRangeFrom,
            price_range_to: data.priceRangeTo,
            price_range_currency: "NOK",
            status: "applied" as const,
        };

        const applicationValidation = applicationsInsertSchema.safeParse(
            applicationData,
        );

        if (!applicationValidation.success) {
            throw new Error(
                "Ugyldig søknadsdata: " +
                    applicationValidation.error.message,
            );
        }

        const { data: applicationResult, error: applicationError } =
            await supabase
                .from("applications")
                .insert(applicationValidation.data)
                .select()
                .single();

        if (applicationError || !applicationResult) {
            throw new Error(
                "Kunne ikke opprette søknad: " + applicationError?.message,
            );
        }

        // Create media records for portfolio image URLs
        const mediaPromises = data.portfolioImageUrls.map(async (imageUrl) => {
            // Extract the file path from the full URL
            const urlParts = imageUrl.split("/");
            const bucketIndex = urlParts.findIndex((part) =>
                part === "applications"
            );
            const filePath = bucketIndex !== -1
                ? urlParts.slice(bucketIndex + 1).join("/")
                : imageUrl;

            // Create media record (owner_id can be null for application images)
            const { error: mediaError } = await supabase
                .from("media")
                .insert({
                    application_id: applicationResult.id,
                    file_path: filePath,
                    media_type: "application_image",
                    owner_id: userId, // Can be null for unauthenticated applications
                });

            if (mediaError) {
                console.error("Error creating media record:", mediaError);
                throw new Error(
                    `Kunne ikke opprette media record: ${mediaError.message}`,
                );
            }

            return { path: filePath, publicUrl: imageUrl };
        });

        const mediaResults = await Promise.all(mediaPromises);

        // Send email notification to admin
        try {
            const { error: emailError } = await sendEmail({
                to: [process.env.ADMIN_EMAIL || "magnus.rodseth@gmail.com"], // Admin email
                subject: "Ny stylist-søknad mottatt",
                react: StylistApplicationEmail({
                    logoUrl: getNabostylistenLogoUrl("png"),
                    applicantName: data.fullName,
                    applicantEmail: data.email,
                    applicationId: applicationResult.id,
                    submittedAt: new Date(),
                    portfolioImageCount: data.portfolioImageUrls.length,
                    serviceCategories: data.serviceCategories,
                    priceRange: {
                        from: data.priceRangeFrom,
                        to: data.priceRangeTo,
                        currency: "NOK",
                    },
                }),
            });

            if (emailError) {
                console.error("Error sending admin notification email:", emailError);
            }
        } catch (emailError) {
            console.error("Error sending notification email:", emailError);
            // Don't throw here, the application was created successfully
        }

        return {
            data: {
                applicationId: applicationResult.id,
                uploadedImages: mediaResults.length,
            },
            error: null,
        };
    } catch (error) {
        console.error("Error creating application:", error);
        return {
            data: null,
            error: error instanceof Error
                ? error.message
                : "En ukjent feil oppstod",
        };
    }
}

/**
 * Get application by ID
 */
export async function getApplication(applicationId: string) {
    try {
        const supabase = await createClient();

        const { data: application, error } = await supabase
            .from("applications")
            .select(`
      *,
      addresses (*),
      profiles (full_name, email, phone_number),
      media (*)
    `)
            .eq("id", applicationId)
            .single();

        if (error) {
            throw new Error("Kunne ikke hente søknad: " + error.message);
        }

        return { data: application, error: null };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error
                ? error.message
                : "En ukjent feil oppstod",
        };
    }
}

/**
 * Get all applications (admin only)
 */
export async function getAllApplications() {
    try {
        const supabase = await createClient();

        // Check if user is admin
        const { data: userRole } = await supabase.rpc("get_my_role");
        if (userRole !== "admin") {
            throw new Error("Ikke autorisert");
        }

        const { data: applications, error } = await supabase
            .from("applications")
            .select(`
      *,
      addresses (*),
      profiles (full_name, email, phone_number),
      media (*)
    `)
            .order("created_at", { ascending: false });

        if (error) {
            throw new Error("Kunne ikke hente søknader: " + error.message);
        }

        return { data: applications, error: null };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error
                ? error.message
                : "En ukjent feil oppstod",
        };
    }
}

/**
 * Update application status (admin only)
 */
export async function updateApplicationStatus({
    applicationId,
    status,
    message,
}: {
    applicationId: string;
    status: Database["public"]["Enums"]["application_status"];
    message?: string;
}) {
    try {
        const supabase = await createClient();
        const serviceSupabaseClient = await createServiceClient();

        // Check if user is admin
        const { data: userRole } = await supabase.rpc("get_my_role");
        if (userRole !== "admin") {
            throw new Error("Ikke autorisert");
        }

        // Get application details first
        const { data: application, error: getError } = await supabase
            .from("applications")
            .select("*")
            .eq("id", applicationId)
            .single();

        if (getError || !application) {
            throw new Error("Kunne ikke finne søknad");
        }

        // Update application status
        const { data: updatedApplication, error } = await supabase
            .from("applications")
            .update({ status })
            .eq("id", applicationId)
            .select()
            .single();

        if (error) {
            throw new Error(
                "Kunne ikke oppdatere søknadsstatus: " + error.message,
            );
        }

        // Handle different status updates
        if (status === "pending_info") {
            // For pending_info, we don't send an email automatically
            // Admin must manually send email with what information is missing
            console.log(
                "Application marked as pending_info. Admin must manually send email to:",
                application.email,
            );

            return {
                data: updatedApplication,
                error: null,
                requiresManualEmail: true,
                applicantEmail: application.email,
                applicationId: application.id,
            };
        }

        if (status === "rejected") {
            // For rejected applications, send email with rejection reason
            if (!message) {
                throw new Error("Melding er påkrevd for avviste søknader");
            }

            // Check if user wants application status update notifications
            // If no user exists yet (application before approval), assume they want notifications
            let canSendEmail = true;
            if (application.user_id) {
                canSendEmail = await shouldReceiveNotification(
                    supabase,
                    application.user_id,
                    "application.statusUpdates"
                );
            }

            if (canSendEmail) {
                const { error: emailError } = await sendEmail({
                    to: [application.email],
                    subject: "Søknadsstatus oppdatert - Avvist",
                    react: ApplicationStatusUpdateEmail({
                        logoUrl: getNabostylistenLogoUrl("png"),
                        applicantName: application.full_name,
                        applicationId: application.id,
                        status,
                        message,
                    }),
                });

                if (emailError) {
                    console.error("Error sending rejection email:", emailError);
                    throw new Error("Kunne ikke sende avvisnings-e-post");
                } else {
                    console.log(`[APPLICATION_STATUS] Sent rejection email to ${application.email}`);
                }
            } else {
                console.log(`[APPLICATION_STATUS] Skipping rejection email for user ${application.user_id} - preferences disabled`);
            }
        }

        if (status === "approved") {
            // For approved applications, create auth user and profile
            try {
                // Create auth user with email
                const { data: authUser, error: authError } =
                    await serviceSupabaseClient.auth
                        .admin.createUser({
                            email: application.email,
                            email_confirm: true, // Auto-confirm email since we're creating it programmatically
                            user_metadata: {
                                full_name: application.full_name,
                                phone_number: application.phone_number,
                                role: "stylist",
                                application_id: application.id,
                            },
                            app_metadata: {
                                role: "stylist",
                            },
                        });

                if (authError) {
                    throw new Error(
                        `Kunne ikke opprette bruker: ${authError.message}`,
                    );
                }

                if (!authUser.user) {
                    throw new Error(
                        "Ingen bruker returnert fra auth opprettelse",
                    );
                }

                // Update the application with the new user_id
                const { error: updateError } = await supabase
                    .from("applications")
                    .update({ user_id: authUser.user.id })
                    .eq("id", applicationId);

                if (updateError) {
                    console.error(
                        "Error updating application with user_id:",
                        updateError,
                    );
                    // Don't throw here, the user was created successfully
                }

                // Send approval email with login instructions
                // Check if newly created user should receive application status notifications
                const canSendApprovalEmail = await shouldReceiveNotification(
                    supabase,
                    authUser.user.id,
                    "application.statusUpdates"
                );

                if (canSendApprovalEmail) {
                    const { error: emailError } = await sendEmail({
                        to: [application.email], // Send to the actual applicant email
                        subject: "Søknadsstatus oppdatert - Godkjent",
                        react: ApplicationStatusUpdateEmail({
                            logoUrl: getNabostylistenLogoUrl("png"),
                            applicantName: application.full_name,
                            applicationId: application.id,
                            status,
                            message: message ||
                                "Din søknad er godkjent! Du kan nå logge inn på platformen.",
                        }),
                    });

                    if (emailError) {
                        console.error("Error sending approval email:", emailError);
                        // Don't throw here, the user was created successfully
                    } else {
                        console.log(`[APPLICATION_STATUS] Sent approval email to ${application.email}`);
                    }
                } else {
                    console.log(`[APPLICATION_STATUS] Skipping approval email for user ${authUser.user.id} - preferences disabled`);
                }

                // Create Stripe integrations for the approved stylist
                let stripeAccountId: string | null = null;
                let onboardingUrl: string | null = null;
                let stripeCustomerId: string | null = null;
                
                // Step 1: Create Stripe Customer (stylists can also purchase services)
                try {
                    console.log(`[STRIPE_CUSTOMER] Creating customer for user ${authUser.user.id}`);
                    
                    const customerResult = await createStripeCustomer({
                        profileId: authUser.user.id,
                        email: application.email,
                        fullName: application.full_name,
                    });
                    
                    if (customerResult.error || !customerResult.data) {
                        console.error("Error creating Stripe customer:", customerResult.error);
                        // Don't throw - continue with Connect account creation
                    } else {
                        stripeCustomerId = customerResult.data.stripeCustomerId;
                        console.log(`[STRIPE_CUSTOMER] Created customer ${stripeCustomerId} for user ${authUser.user.id}`);
                    }
                } catch (customerError) {
                    console.error("Unexpected error creating Stripe customer:", customerError);
                    // Don't throw - continue with Connect account creation
                }
                
                // Step 2: Create Stripe Connect account for receiving payments
                try {
                    console.log(`[STRIPE_CONNECT] Creating connected account for user ${authUser.user.id}`);
                    
                    const stripeResult = await createConnectedAccount({
                        profileId: authUser.user.id,
                        email: application.email,
                    });
                    
                    if (stripeResult.error || !stripeResult.data) {
                        console.error("Error creating Stripe account:", stripeResult.error);
                        // Don't throw - user creation was successful, just log the issue
                    } else {
                        stripeAccountId = stripeResult.data.stripeAccountId;
                        console.log(`[STRIPE_CONNECT] Created account ${stripeAccountId} for user ${authUser.user.id}`);
                        
                        // Create onboarding link for email
                        const linkResult = await createAccountOnboardingLink({
                            stripeAccountId,
                        });
                        
                        if (linkResult.error || !linkResult.data) {
                            console.error("Error creating onboarding link:", linkResult.error);
                        } else {
                            onboardingUrl = linkResult.data.url;
                            console.log(`[STRIPE_CONNECT] Created onboarding link for account ${stripeAccountId}`);
                        }
                    }
                } catch (stripeError) {
                    console.error("Unexpected error with Stripe integration:", stripeError);
                    // Don't throw - user creation was successful
                }

                return {
                    data: updatedApplication,
                    error: null,
                    createdUserId: authUser.user.id,
                    stripeAccountId,
                    stripeCustomerId,
                    onboardingUrl,
                };
            } catch (userCreationError) {
                console.error("Error creating auth user:", userCreationError);
                throw new Error(
                    `Kunne ikke opprette bruker: ${
                        userCreationError instanceof Error
                            ? userCreationError.message
                            : "Ukjent feil"
                    }`,
                );
            }
        }

        return { data: updatedApplication, error: null };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error
                ? error.message
                : "En ukjent feil oppstod",
        };
    }
}
