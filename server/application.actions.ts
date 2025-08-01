"use server";

import { createClient } from "@/lib/supabase/server";
import { applicationsInsertSchema } from "@/schemas/database.schema";
import type { Database } from "@/types/database.types";
import { uploadApplicationImage } from "@/server/files.actions";
import { resend } from "@/lib/resend";
import { StylistApplicationEmail } from "@/transactional/emails/stylist-application";

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
            await resend.emails.send({
                from: "Nabostylisten <no-reply@nabostylisten.no>",
                to: ["admin@nabostylisten.no"], // Replace with actual admin email
                subject: "Ny stylist-søknad mottatt",
                react: StylistApplicationEmail({
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
export async function updateApplicationStatus(
    applicationId: string,
    status: Database["public"]["Enums"]["application_status"],
) {
    try {
        const supabase = await createClient();

        // Check if user is admin
        const { data: userRole } = await supabase.rpc("get_my_role");
        if (userRole !== "admin") {
            throw new Error("Ikke autorisert");
        }

        const { data: application, error } = await supabase
            .from("applications")
            .update({ status })
            .eq("id", applicationId)
            .select(`
      *,
      profiles (full_name, email)
    `)
            .single();

        if (error) {
            throw new Error(
                "Kunne ikke oppdatere søknadsstatus: " + error.message,
            );
        }

        // TODO: Send status update email to applicant

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
