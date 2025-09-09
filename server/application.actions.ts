"use server";

import { createClient } from "@/lib/supabase/server";
import { applicationsInsertSchema } from "@/schemas/database.schema";
import type { Database } from "@/types/database.types";
import { uploadApplicationImage } from "@/server/files.actions";
import { sendEmail } from "@/lib/resend-utils";
import { StylistApplicationEmail } from "@/transactional/emails/stylist-application";
import { ApplicationStatusUpdateEmail } from "@/transactional/emails/application-status-update";
import { StylistOnboardingEmail } from "@/transactional/emails/stylist-onboarding";
import { createServiceClient } from "@/lib/supabase/service";
import { getNabostylistenLogoUrl } from "@/lib/supabase/utils";
import { shouldReceiveNotification } from "@/lib/preferences-utils";
import { getCountryCode } from "@/lib/country-utils";
// Note: We import Stripe service functions directly to use with serviceSupabaseClient
// import { createConnectedAccount, createStripeCustomer } from "@/server/stripe.actions";

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
        countryCode?: string; // ISO country code from Mapbox
        entryInstructions?: string;
        geometry?: [number, number]; // [lng, lat] from Mapbox
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
 * Get current user's profile data for prepopulating the application form
 */
export async function getCurrentUserApplicationData() {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: null, error: null }; // No user logged in
        }

        // Get user's profile data
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        if (profileError) {
            console.error("Error fetching profile:", profileError);
            return { data: null, error: null }; // Don't throw, just return null
        }

        // Get user's primary address if it exists
        const { data: address } = await supabase
            .from("addresses")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_primary", true)
            .single();

        // Prepare the data for the form
        const formData = {
            fullName: profile?.full_name || undefined,
            email: profile?.email || user.email || undefined,
            phoneNumber: profile?.phone_number || undefined,
            address: address
                ? {
                    nickname: address.nickname || undefined,
                    streetAddress: address.street_address || undefined,
                    city: address.city || undefined,
                    postalCode: address.postal_code || undefined,
                    country: address.country || undefined,
                    countryCode: address.country_code || undefined,
                    entryInstructions: address.entry_instructions || undefined,
                    // Convert PostGIS point to [lng, lat] array if location exists
                    geometry: address.location ? undefined : undefined, // We'll handle this separately if needed
                }
                : undefined,
        };

        return { data: formData, error: null };
    } catch (error) {
        console.error("Error fetching current user data:", error);
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
            country_code: data.address.countryCode, // ISO country code from Mapbox
            entry_instructions: data.address.entryInstructions,
            // Store geometry as PostGIS Point if provided from Mapbox
            address_geometry: data.address.geometry
                ? `POINT(${data.address.geometry[0]} ${
                    data.address.geometry[1]
                })`
                : null,
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
            // Extract the file path from the full URL using storage utils
            let filePath: string;
            try {
                // Try to extract path from Supabase storage URL
                const url = new URL(imageUrl);
                const pathParts = url.pathname.split("/");

                // Find the applications bucket segment
                const bucketIndex = pathParts.findIndex((part) =>
                    part === "applications"
                );
                if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
                    // Get the path after the bucket name
                    filePath = pathParts.slice(bucketIndex + 1).join("/");
                } else {
                    // Fallback: use the last parts of the path
                    filePath = pathParts.slice(-2).join("/"); // applicationId/filename
                }

                console.log(
                    `[MEDIA_CREATION] Extracted file path: ${filePath} from URL: ${imageUrl}`,
                );
            } catch (error) {
                console.error("Error parsing image URL:", error);
                // Fallback to using the URL as-is
                filePath = imageUrl;
            }

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
                console.error(
                    "Error sending admin notification email:",
                    emailError,
                );
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
                    "application.statusUpdates",
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
                    console.log(
                        `[APPLICATION_STATUS] Sent rejection email to ${application.email}`,
                    );
                }
            } else {
                console.log(
                    `[APPLICATION_STATUS] Skipping rejection email for user ${application.user_id} - preferences disabled`,
                );
            }
        }

        if (status === "approved") {
            // For approved applications, handle both new and existing users
            console.log(
                `[APPROVAL_PROCESS] Starting complete onboarding process for application ${applicationId}`,
            );
            console.log(
                `[APPROVAL_PROCESS] Applicant: ${application.full_name} (${application.email})`,
            );

            let authUserId: string;
            let isExistingUser = false;

            try {
                // First check if user already exists (they might be a customer)
                if (application.user_id) {
                    // User already exists and is linked to the application
                    authUserId = application.user_id;
                    isExistingUser = true;
                    console.log(
                        `[APPROVAL_PROCESS] Using existing user: ${authUserId}`,
                    );
                } else {
                    // Check if a user with this email exists
                    const { data: existingUser } = await supabase.from(
                        "profiles",
                    )
                        .select("id")
                        .eq("email", application.email)
                        .single();

                    if (existingUser) {
                        // User exists, use their ID
                        authUserId = existingUser.id;
                        isExistingUser = true;
                        console.log(
                            `[APPROVAL_PROCESS] Found existing user with email ${application.email}: ${authUserId}`,
                        );
                    } else {
                        // Create new auth user
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

                        authUserId = authUser.user.id;
                        console.log(
                            `[USER_CREATION] Successfully created new auth user: ${authUserId}`,
                        );
                    }
                }

                // Update the user's role to stylist if they were a customer
                if (isExistingUser) {
                    console.log(
                        `[ROLE_UPDATE] Updating role to stylist for user ${authUserId}`,
                    );

                    // Update the user's metadata to reflect stylist role
                    const { error: updateAuthError } =
                        await serviceSupabaseClient.auth
                            .admin.updateUserById(authUserId, {
                                user_metadata: {
                                    role: "stylist",
                                    application_id: application.id,
                                },
                                app_metadata: {
                                    role: "stylist",
                                },
                            });

                    if (updateAuthError) {
                        console.error(
                            "Error updating user auth metadata:",
                            updateAuthError,
                        );
                    }

                    // Update the profile role
                    const { error: profileUpdateError } =
                        await serviceSupabaseClient
                            .from("profiles")
                            .update({ role: "stylist" })
                            .eq("id", authUserId);

                    if (profileUpdateError) {
                        console.error(
                            "Error updating profile role:",
                            profileUpdateError,
                        );
                        throw new Error(
                            `Kunne ikke oppdatere brukerrolle: ${profileUpdateError.message}`,
                        );
                    }

                    console.log(
                        `[ROLE_UPDATE] Successfully updated role to stylist for user ${authUserId}`,
                    );
                }

                // Update the application with the user_id (if not already set)
                if (!application.user_id) {
                    const { error: updateError } = await supabase
                        .from("applications")
                        .update({ user_id: authUserId })
                        .eq("id", applicationId);

                    if (updateError) {
                        console.error(
                            "Error updating application with user_id:",
                            updateError,
                        );
                        // Don't throw here, the user was created successfully
                    } else {
                        console.log(
                            `[APPLICATION_UPDATE] Successfully linked application ${applicationId} to user ${authUserId}`,
                        );
                    }
                }

                // Create address record from application data (only if user doesn't already have one)
                try {
                    // Check if user already has a primary address
                    const { data: existingAddress } = await supabase
                        .from("addresses")
                        .select("id")
                        .eq("user_id", authUserId)
                        .eq("is_primary", true)
                        .single();

                    if (!existingAddress) {
                        let addressGeometry = application.address_geometry;

                        // If no geometry from application, try to get it from Mapbox
                        if (!addressGeometry) {
                            try {
                                const { getGeometryFromAddressComponents } =
                                    await import("@/lib/mapbox");
                                const geometry =
                                    await getGeometryFromAddressComponents({
                                        streetAddress:
                                            application.street_address,
                                        city: application.city,
                                        postalCode: application.postal_code,
                                        country: application.country,
                                    });

                                if (geometry) {
                                    addressGeometry = `POINT(${geometry[0]} ${
                                        geometry[1]
                                    })`;
                                    console.log(
                                        `[APPLICATION_APPROVAL] Retrieved geometry from Mapbox for address: ${
                                            geometry[0]
                                        }, ${geometry[1]}`,
                                    );
                                }
                            } catch (mapboxError) {
                                console.error(
                                    "Error fetching geometry from Mapbox:",
                                    mapboxError,
                                );
                                // Continue without geometry - not critical for address creation
                            }
                        }

                        const addressData:
                            Database["public"]["Tables"]["addresses"][
                                "Insert"
                            ] = {
                                user_id: authUserId,
                                nickname: application.address_nickname ||
                                    "Hjemme",
                                street_address: application.street_address,
                                city: application.city,
                                postal_code: application.postal_code,
                                country: application.country,
                                country_code: application.country_code, // Use stored country code from application
                                entry_instructions:
                                    application.entry_instructions,
                                // Transfer geometry if available (from application or Mapbox fallback)
                                location: addressGeometry,
                                is_primary: true, // Set as primary address
                            };

                        const { error: addressError } = await supabase
                            .from("addresses")
                            .insert(addressData);

                        if (addressError) {
                            console.error(
                                "[ADDRESS_CREATION] Error creating address for approved stylist:",
                                addressError,
                            );
                            console.error(
                                "[ADDRESS_CREATION] Address data:",
                                JSON.stringify(addressData, null, 2),
                            );
                            // Don't throw - address creation is not critical for user creation
                        } else {
                            console.log(
                                `[ADDRESS_CREATION] Successfully created address for stylist ${authUserId}`,
                            );
                        }
                    } else {
                        console.log(
                            `[ADDRESS_CREATION] User ${authUserId} already has a primary address, skipping creation`,
                        );
                    }
                } catch (addressCreateError) {
                    console.error(
                        "Unexpected error creating address:",
                        addressCreateError,
                    );
                    // Don't throw - address creation is not critical
                }

                // Send approval email with login instructions
                // Check if user should receive application status notifications
                const canSendApprovalEmail = await shouldReceiveNotification(
                    supabase,
                    authUserId,
                    "application.statusUpdates",
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
                        console.error(
                            "Error sending approval email:",
                            emailError,
                        );
                        // Don't throw here, the user was created successfully
                    } else {
                        console.log(
                            `[APPLICATION_STATUS] Sent approval email to ${application.email}`,
                        );
                    }
                } else {
                    console.log(
                        `[APPLICATION_STATUS] Skipping approval email for user ${authUserId} - preferences disabled`,
                    );
                }

                // Send stylist onboarding email (always send to newly approved stylists)
                try {
                    const { error: onboardingEmailError } = await sendEmail({
                        to: [application.email],
                        subject: "Fullfør din onboarding som stylist",
                        react: StylistOnboardingEmail({
                            logoUrl: getNabostylistenLogoUrl("png"),
                            stylistName: application.full_name,
                            userId: authUserId,
                        }),
                    });

                    if (onboardingEmailError) {
                        console.error(
                            "Error sending stylist onboarding email:",
                            onboardingEmailError,
                        );
                    } else {
                        console.log(
                            `[STYLIST_ONBOARDING] Sent onboarding email to ${application.email}`,
                        );
                    }
                } catch (onboardingEmailError) {
                    console.error(
                        "Unexpected error sending stylist onboarding email:",
                        onboardingEmailError,
                    );
                    // Don't throw - this is not critical for the approval process
                }

                // Create Stripe integrations for the approved stylist
                let stripeAccountId: string | null = null;
                let stripeCustomerId: string | null = null;

                // Step 1: Create Stripe Customer (stylists can also purchase services)
                // Only create if user doesn't already have a Stripe customer ID
                try {
                    // Check if user already has a Stripe customer ID
                    const { data: existingProfile } = await supabase
                        .from("profiles")
                        .select("stripe_customer_id")
                        .eq("id", authUserId)
                        .single();

                    if (!existingProfile?.stripe_customer_id) {
                        console.log(
                            `[STRIPE_CUSTOMER] Creating customer for user ${authUserId}`,
                        );

                        // Import the service function directly and use the service client
                        const { createCustomerWithDatabase } = await import(
                            "@/lib/stripe/connect"
                        );
                        const customerResult = await createCustomerWithDatabase(
                            {
                                supabaseClient: serviceSupabaseClient, // Use service client for admin operations
                                profileId: authUserId,
                                email: application.email,
                                fullName: application.full_name,
                            },
                        );

                        if (customerResult.error || !customerResult.data) {
                            console.error(
                                "[STRIPE_CUSTOMER] Error creating Stripe customer:",
                                customerResult.error,
                            );
                            // Don't throw - continue with Connect account creation
                        } else {
                            stripeCustomerId =
                                customerResult.data.stripeCustomerId;
                            console.log(
                                `[STRIPE_CUSTOMER] Successfully created customer ${stripeCustomerId} for user ${authUserId}`,
                            );
                            console.log(
                                `[STRIPE_CUSTOMER] Database save status: ${
                                    customerResult.data.savedToDatabase
                                        ? "SUCCESS"
                                        : "FAILED"
                                }`,
                            );
                        }
                    } else {
                        stripeCustomerId = existingProfile.stripe_customer_id;
                        console.log(
                            `[STRIPE_CUSTOMER] User ${authUserId} already has Stripe customer ID: ${stripeCustomerId}`,
                        );
                    }
                } catch (customerError) {
                    console.error(
                        "Unexpected error creating Stripe customer:",
                        customerError,
                    );
                    // Don't throw - continue with Connect account creation
                }

                // Step 2: Create Stripe Connect account for receiving payments
                // Only create if user doesn't already have a Connect account
                try {
                    // Check if user already has a Stripe Connect account
                    const { data: existingStylistDetails } = await supabase
                        .from("stylist_details")
                        .select("stripe_account_id")
                        .eq("profile_id", authUserId)
                        .single();

                    if (!existingStylistDetails?.stripe_account_id) {
                        console.log(
                            `[STRIPE_CONNECT] Creating connected account for user ${authUserId}`,
                        );

                        // Import the service function directly and use the service client
                        const { createConnectedAccountWithDatabase } =
                            await import(
                                "@/lib/stripe/connect"
                            );

                        const countryCode = getCountryCode(
                            application.country_code || "NO",
                        ); // Fallback to Norway if no country code is provided

                        const stripeResult =
                            await createConnectedAccountWithDatabase({
                                supabaseClient: serviceSupabaseClient, // Use service client for admin operations
                                profileId: authUserId,
                                email: application.email,
                                name: application.full_name,
                                address: {
                                    addressLine1: application.street_address,
                                    addressLine2: "", // Not stored separately in applications
                                    city: application.city,
                                    state: "", // Norway doesn't have states like US
                                    postalCode: application.postal_code,
                                    country: countryCode, // Use ISO code instead of country name
                                },
                            });

                        if (stripeResult.error || !stripeResult.data) {
                            console.error(
                                "[STRIPE_CONNECT] Error creating Stripe account:",
                                stripeResult.error,
                            );
                            // Don't throw - user creation was successful, just log the issue
                        } else {
                            stripeAccountId = stripeResult.data.stripeAccountId;
                            console.log(
                                `[STRIPE_CONNECT] Successfully created account ${stripeAccountId} for user ${authUserId}`,
                            );
                            console.log(
                                `[STRIPE_CONNECT] Database save status: ${
                                    stripeResult.data.savedToDatabase
                                        ? "SUCCESS"
                                        : "FAILED"
                                }`,
                            );

                            // Note: Onboarding link will be created when stylist visits /stylist/stripe page
                            // This allows better UX with authentication flow and status checking
                        }
                    } else {
                        stripeAccountId =
                            existingStylistDetails.stripe_account_id;
                        console.log(
                            `[STRIPE_CONNECT] User ${authUserId} already has Stripe Connect account: ${stripeAccountId}`,
                        );
                    }
                } catch (stripeError) {
                    console.error(
                        "Unexpected error with Stripe integration:",
                        stripeError,
                    );
                    // Don't throw - user creation was successful
                }

                // Create stylist_details record (required for stylist functionality)
                // Only create if it doesn't already exist
                try {
                    // Check if stylist_details already exists for this user
                    const { data: existingDetails } = await supabase
                        .from("stylist_details")
                        .select("profile_id")
                        .eq("profile_id", authUserId)
                        .single();

                    if (!existingDetails) {
                        console.log(
                            `[STYLIST_DETAILS] Creating stylist details for user ${authUserId}`,
                        );
                        console.log(
                            `[STYLIST_DETAILS] Using service client to bypass RLS policies for admin operation`,
                        );

                        const stylistDetailsData:
                            Database["public"]["Tables"]["stylist_details"][
                                "Insert"
                            ] = {
                                profile_id: authUserId,
                                stripe_account_id: stripeAccountId, // Link to the Stripe Connect account
                                // Set sensible defaults for required fields
                                can_travel: true,
                                has_own_place: true,
                                travel_distance_km: 20,
                            };

                        console.log(
                            `[STYLIST_DETAILS] Inserting data:`,
                            JSON.stringify(stylistDetailsData, null, 2),
                        );

                        const {
                            data: insertedData,
                            error: stylistDetailsError,
                        } = await serviceSupabaseClient
                            .from("stylist_details")
                            .insert(stylistDetailsData)
                            .select();

                        if (stylistDetailsError) {
                            console.error(
                                "[STYLIST_DETAILS] Error creating stylist details:",
                                stylistDetailsError,
                            );
                            console.error(
                                "[STYLIST_DETAILS] Error details:",
                                JSON.stringify(stylistDetailsError, null, 2),
                            );
                            // Don't throw - this would break the approval flow
                            // The stylist can still access the platform, they just might need manual intervention
                        } else {
                            console.log(
                                `[STYLIST_DETAILS] Successfully created stylist details for user ${authUserId}`,
                            );
                            console.log(
                                `[STYLIST_DETAILS] Inserted record:`,
                                JSON.stringify(insertedData, null, 2),
                            );
                        }
                    } else {
                        console.log(
                            `[STYLIST_DETAILS] User ${authUserId} already has stylist details, skipping creation`,
                        );

                        // Update with Stripe account ID if it wasn't set before
                        if (stripeAccountId) {
                            const { error: updateError } =
                                await serviceSupabaseClient
                                    .from("stylist_details")
                                    .update({
                                        stripe_account_id: stripeAccountId,
                                    })
                                    .eq("profile_id", authUserId);

                            if (updateError) {
                                console.error(
                                    "[STYLIST_DETAILS] Error updating Stripe account ID:",
                                    updateError,
                                );
                            } else {
                                console.log(
                                    `[STYLIST_DETAILS] Updated Stripe account ID for user ${authUserId}`,
                                );
                            }
                        }
                    }
                } catch (stylistDetailsCreationError) {
                    console.error(
                        "[STYLIST_DETAILS] Unexpected error creating stylist details:",
                        stylistDetailsCreationError,
                    );
                    console.error(
                        "[STYLIST_DETAILS] Error stack:",
                        stylistDetailsCreationError instanceof Error
                            ? stylistDetailsCreationError.stack
                            : "No stack trace",
                    );
                    // Don't throw - user creation was successful, just log the issue
                }

                console.log(
                    `[APPROVAL_PROCESS] ✅ Successfully completed onboarding for user ${authUserId}`,
                );
                console.log(
                    `[APPROVAL_PROCESS] Summary - User: ${authUserId}, Stripe Connect: ${
                        stripeAccountId || "FAILED"
                    }, Stripe Customer: ${
                        stripeCustomerId || "FAILED"
                    }, Existing User: ${isExistingUser}`,
                );

                return {
                    data: updatedApplication,
                    error: null,
                    createdUserId: authUserId,
                    stripeAccountId,
                    stripeCustomerId,
                    wasExistingUser: isExistingUser,
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
