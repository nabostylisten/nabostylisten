"use server";

import { createClient } from "@/lib/supabase/server";
import { profilesInsertSchema } from "@/schemas/database.schema";
import type { Database } from "@/types/database.types";
export async function getProfile(id: string) {
    const supabase = await createClient();
    return await supabase.from("profiles").select("*").eq("id", id).single();
}

export async function createProfile(data: {
    full_name: string;
    phone_number?: string;
}) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth
            .getUser();
        if (userError || !user) {
            return { error: "User not authenticated", data: null };
        }

        // Check if profile already exists
        const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .single();

        if (existingProfile) {
            return { error: "Profile already exists", data: null };
        }

        // Create profile data
        const profileData = {
            id: user.id,
            full_name: data.full_name,
            phone_number: data.phone_number || null,
            email: user.email,
            role: "customer" as const,
            subscribed_to_newsletter: false,
        };

        const validation = profilesInsertSchema.safeParse(profileData);
        if (!validation.success) {
            return {
                error: "Invalid profile data: " + validation.error.message,
                data: null,
            };
        }

        const { data: profile, error } = await supabase
            .from("profiles")
            .insert(validation.data)
            .select()
            .single();

        if (error) {
            return { error: error.message, data: null };
        }

        return { error: null, data: profile };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "An error occurred",
            data: null,
        };
    }
}

export async function updateProfile(
    id: string,
    data: Database["public"]["Tables"]["profiles"]["Update"],
) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth
            .getUser();
        if (userError || !user) {
            return { error: "User not authenticated", data: null };
        }

        // Ensure user can only update their own profile
        if (user.id !== id) {
            return { error: "Unauthorized", data: null };
        }

        const { data: profile, error } = await supabase
            .from("profiles")
            .update(data)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return { error: error.message, data: null };
        }

        return { error: null, data: profile };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "An error occurred",
            data: null,
        };
    }
}

export async function checkProfileExists(userId: string) {
    try {
        const supabase = await createClient();

        const { data: profile, error } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", userId)
            .single();

        if (error && error.code !== "PGRST116") {
            return { error: error.message, exists: false };
        }

        return { error: null, exists: !!profile };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "An error occurred",
            exists: false,
        };
    }
}

export async function getStylists() {
    try {
        const supabase = await createClient();

        const { data: stylists, error } = await supabase
            .from("profiles")
            .select(`
                id,
                full_name,
                stylist_details (
                    bio,
                    can_travel,
                    has_own_place
                ),
                addresses (
                    city
                )
            `)
            .eq("role", "stylist")
            .order("full_name");

        if (error) {
            return { error: error.message, data: null };
        }

        return { error: null, data: stylists };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "An error occurred",
            data: null,
        };
    }
}

export type StylistProfileData = Awaited<ReturnType<typeof getStylistProfileWithServices>>["data"];

export async function getStylistProfileWithServices(profileId: string) {
    try {
        const supabase = await createClient();

        // Get stylist profile with details
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select(`
                *,
                stylist_details (
                    *
                ),
                addresses (
                    *
                ),
                media!media_owner_id_fkey (
                    id,
                    file_path,
                    media_type
                )
            `)
            .eq("id", profileId)
            .eq("role", "stylist")
            .single();

        if (profileError || !profile) {
            return { error: profileError?.message || "Stylist not found", data: null };
        }

        // Get stylist's services with categories and media
        const { data: services, error: servicesError } = await supabase
            .from("services")
            .select(`
                *,
                service_service_categories (
                    service_categories (
                        id,
                        name,
                        description
                    )
                ),
                media (
                    id,
                    file_path,
                    media_type,
                    is_preview_image
                )
            `)
            .eq("stylist_id", profileId)
            .eq("is_published", true)
            .order("created_at", { ascending: false });

        if (servicesError) {
            return { error: servicesError.message, data: null };
        }

        // Get reviews for the stylist
        const { data: reviews, error: reviewsError } = await supabase
            .from("reviews")
            .select(`
                *,
                profiles!reviews_customer_id_fkey (
                    id,
                    full_name
                ),
                bookings (
                    booking_services (
                        services (
                            title
                        )
                    )
                )
            `)
            .eq("stylist_id", profileId)
            .order("created_at", { ascending: false })
            .limit(10);

        if (reviewsError) {
            // Don't fail if reviews can't be fetched
            console.error("Error fetching reviews:", reviewsError);
        }

        // Calculate average rating
        const avgRating = reviews?.length 
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
            : null;

        // Get public URLs for media
        if (services) {
            for (const service of services) {
                if (service.media) {
                    for (const media of service.media) {
                        const { data: { publicUrl } } = supabase.storage
                            .from("media")
                            .getPublicUrl(media.file_path);
                        media.publicUrl = publicUrl;
                    }
                }
            }
        }

        // Get avatar URL
        let avatarUrl = null;
        const avatar = profile.media?.find((m: any) => m.media_type === "avatar");
        if (avatar) {
            const { data: { publicUrl } } = supabase.storage
                .from("media")
                .getPublicUrl(avatar.file_path);
            avatarUrl = publicUrl;
        }

        return {
            error: null,
            data: {
                profile: {
                    ...profile,
                    avatarUrl,
                },
                services: services || [],
                reviews: reviews || [],
                stats: {
                    totalReviews: reviews?.length || 0,
                    averageRating: avgRating,
                    totalServices: services?.length || 0,
                }
            }
        };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "An error occurred",
            data: null,
        };
    }
}
