"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database.types";
import { getPublicUrl } from "@/lib/supabase/storage";
import type { ServiceFilters } from "@/types";

type ServiceInsert = Database["public"]["Tables"]["services"]["Insert"];
type ServiceUpdate = Database["public"]["Tables"]["services"]["Update"];

// Extended types for form data that includes category_ids
type ServiceFormInsert = Omit<ServiceInsert, "stylist_id"> & {
    category_ids: string[];
};

type ServiceFormUpdate = Omit<ServiceUpdate, "stylist_id"> & {
    category_ids?: string[];
};

export async function getServices(stylistId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
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
        is_preview_image,
        created_at
      )
    `)
        .eq("stylist_id", stylistId)
        .order("created_at", { ascending: false });

    return { data, error };
}

export async function getService(serviceId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
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
        is_preview_image,
        created_at
      )
    `)
        .eq("id", serviceId)
        .single();

    return { data, error };
}

export async function createService(serviceData: ServiceFormInsert) {
    const supabase = await createClient();

    // Get current user to verify they can create services
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "Authentication required", data: null };
    }

    // Verify user is a stylist
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || profile.role !== "stylist") {
        return { error: "Only stylists can create services", data: null };
    }

    // Extract category_ids and remove it from service data
    const { category_ids, ...serviceFields } = serviceData;

    // Ensure the service is created by the authenticated user
    const serviceToCreate = {
        ...serviceFields,
        stylist_id: user.id,
    };

    // Create the service
    const { data: service, error: serviceError } = await supabase
        .from("services")
        .insert(serviceToCreate)
        .select()
        .single();

    if (serviceError || !service) {
        return { error: serviceError, data: null };
    }

    // Create service-category relationships
    if (category_ids && category_ids.length > 0) {
        const categoryRelations = category_ids.map((categoryId) => ({
            service_id: service.id,
            category_id: categoryId,
        }));

        const { error: categoryError } = await supabase
            .from("service_service_categories")
            .insert(categoryRelations);

        if (categoryError) {
            // If category relations fail, clean up the created service
            await supabase.from("services").delete().eq("id", service.id);
            return { error: categoryError, data: null };
        }
    }

    revalidatePath(`/profiler/${user.id}/mine-tjenester`);
    return { data: service, error: null };
}

export async function updateService(
    serviceId: string,
    serviceData: ServiceFormUpdate,
) {
    const supabase = await createClient();

    // Get current user to verify they can update this service
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "Authentication required", data: null };
    }

    // Verify the service belongs to the current user
    const { data: existingService } = await supabase
        .from("services")
        .select("stylist_id")
        .eq("id", serviceId)
        .single();

    if (!existingService || existingService.stylist_id !== user.id) {
        return { error: "Service not found or unauthorized", data: null };
    }

    // Extract category_ids and remove it from service data
    const { category_ids, ...serviceFields } = serviceData;

    // Update the service
    const { data: service, error: serviceError } = await supabase
        .from("services")
        .update(serviceFields)
        .eq("id", serviceId)
        .select()
        .single();

    if (serviceError || !service) {
        return { error: serviceError, data: null };
    }

    // Update service-category relationships if category_ids is provided
    if (category_ids !== undefined) {
        // First, delete existing category relationships
        const { error: deleteError } = await supabase
            .from("service_service_categories")
            .delete()
            .eq("service_id", serviceId);

        if (deleteError) {
            return { error: deleteError, data: null };
        }

        // Then, create new category relationships
        if (category_ids.length > 0) {
            const categoryRelations = category_ids.map((categoryId) => ({
                service_id: serviceId,
                category_id: categoryId,
            }));

            const { error: categoryError } = await supabase
                .from("service_service_categories")
                .insert(categoryRelations);

            if (categoryError) {
                return { error: categoryError, data: null };
            }
        }
    }

    revalidatePath(`/profiler/${user.id}/mine-tjenester`);
    return { data: service, error: null };
}

export async function deleteService(serviceId: string) {
    const supabase = await createClient();

    // Get current user to verify they can delete this service
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "Authentication required", data: null };
    }

    // Verify the service belongs to the current user
    const { data: existingService } = await supabase
        .from("services")
        .select("stylist_id")
        .eq("id", serviceId)
        .single();

    if (!existingService || existingService.stylist_id !== user.id) {
        return { error: "Service not found or unauthorized", data: null };
    }

    const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", serviceId);

    if (!error) {
        revalidatePath(`/profiler/${user.id}/mine-tjenester`);
    }

    return { error };
}

export async function getServiceCategories() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("name");

    return { data, error };
}

export async function getPublicServices(filters: ServiceFilters = {}) {
    const supabase = await createClient();

    const {
        search,
        categories,
        location,
        stylistIds,
        minPrice: minPriceString,
        maxPrice: maxPriceString,
        sortBy = "newest",
        page = 1,
        limit = 12,
    } = filters;

    const minPrice = minPriceString ? parseFloat(minPriceString) : undefined;
    const maxPrice = maxPriceString ? parseFloat(maxPriceString) : undefined;

    let query = supabase
        .from("services")
        .select(
            `
            *,
            service_service_categories (
                service_categories (
                    id,
                    name,
                    description,
                    parent_category_id
                )
            ),
            media (
                id,
                file_path,
                media_type,
                is_preview_image,
                created_at
            ),
            profiles!inner (
                id,
                full_name,
                stylist_details (
                    bio,
                    can_travel,
                    has_own_place,
                    travel_distance_km
                ),
                addresses (
                    id,
                    city,
                    postal_code,
                    street_address,
                    is_primary
                )
            )
        `,
            { count: "exact" },
        )
        .eq("is_published", true);

    // Apply search filter - focus only on service title and categories
    if (search) {
        query = query.or(
            `title.ilike.%${search}%,description.ilike.%${search}%`,
        );
    }

    // Apply category filter
    if (categories && categories.length > 0) {
        // Get service IDs that belong to this category
        const { data: serviceIds } = await supabase
            .from("service_service_categories")
            .select("service_id")
            .in("category_id", categories);

        if (serviceIds && serviceIds.length > 0) {
            const ids = serviceIds.map((item) => item.service_id);
            query = query.in("id", ids);
        } else {
            // No services in this category, return empty result
            return {
                data: [],
                error: null,
                count: 0,
                totalPages: 0,
                currentPage: page,
                hasMore: false,
            };
        }
    }

    // Apply stylist filter
    if (stylistIds && stylistIds.length > 0) {
        query = query.in("stylist_id", stylistIds);
    }

    // Apply price filters
    if (minPrice !== undefined) {
        query = query.gte("price", minPrice * 100); // Convert to øre
    }
    if (maxPrice !== undefined) {
        query = query.lte("price", maxPrice * 100); // Convert to øre
    }

    // // Apply location filter (if provided, filter by city)
    // if (location?.address) {
    //     query = query.eq("profiles.addresses.city", location.address);
    // }

    // Apply sorting
    switch (sortBy) {
        case "price_asc":
            query = query.order("price", { ascending: true });
            break;
        case "price_desc":
            query = query.order("price", { ascending: false });
            break;
        case "newest":
            query = query.order("created_at", { ascending: false });
            break;
        default:
            query = query.order("created_at", { ascending: false });
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error || !data) {
        return {
            data,
            error,
            count,
            totalPages: count ? Math.ceil(count / limit) : 0,
            currentPage: page,
            hasMore: count ? page * limit < count : false,
        };
    }

    // Add public URLs for media
    const servicesWithUrls = data.map((service) => ({
        ...service,
        media: service.media?.map((media) => ({
            ...media,
            // Use file_path as URL if it's already a full URL (Unsplash), otherwise use Supabase storage
            publicUrl: media.file_path.startsWith("https://images.unsplash.com/")
                ? media.file_path
                : getPublicUrl(supabase, "service-media", media.file_path),
        })),
    }));

    return {
        data: servicesWithUrls,
        error,
        count,
        totalPages: count ? Math.ceil(count / limit) : 0,
        currentPage: page,
        hasMore: count ? page * limit < count : false,
    };
}

export type PublicServiceData = Awaited<
    ReturnType<typeof getPublicService>
>["data"];

export async function getPublicService(serviceId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("services")
        .select(`
            *,
            service_service_categories!inner (
                service_categories (
                    id,
                    name,
                    description,
                    parent_category_id
                )
            ),
            media (
                id,
                file_path,
                media_type,
                is_preview_image,
                created_at
            ),
            profiles!inner (
                id,
                full_name,
                stylist_details (
                    bio,
                    can_travel,
                    has_own_place,
                    travel_distance_km,
                    instagram_profile,
                    facebook_profile,
                    tiktok_profile
                ),
                addresses (
                    id,
                    city,
                    postal_code,
                    street_address,
                    is_primary
                )
            )
        `)
        .eq("id", serviceId)
        .eq("is_published", true)
        .single();

    if (error || !data) {
        return { data, error };
    }

    // Add public URLs for media
    const serviceWithUrls = {
        ...data,
        media: data.media?.map((media) => ({
            ...media,
            // Use file_path as URL if it's already a full URL (Unsplash), otherwise use Supabase storage
            publicUrl: media.file_path.startsWith("https://images.unsplash.com/")
                ? media.file_path
                : getPublicUrl(supabase, "service-media", media.file_path),
        })),
    };

    return { data: serviceWithUrls, error };
}

export async function getServiceCategoriesWithCounts() {
    const supabase = await createClient();

    // Get all categories
    const { data: categories, error: categoryError } = await supabase
        .from("service_categories")
        .select("*")
        .order("name");

    if (categoryError || !categories) {
        return { data: null, error: categoryError };
    }

    // Get service counts for each category
    const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
            const { count } = await supabase
                .from("service_service_categories")
                .select("services!inner(id)", { count: "exact" })
                .eq("category_id", category.id)
                .eq("services.is_published", true);

            return {
                ...category,
                service_count: count || 0,
            };
        }),
    );

    return { data: categoriesWithCounts, error: null };
}

/**
 * Delete a service image
 */
export async function deleteServiceImage(imageId: string) {
    try {
        const supabase = await createClient();

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth
            .getUser();
        if (userError || !user) {
            return { data: null, error: "Du må være logget inn" };
        }

        // Get image details first
        const { data: imageData, error: imageError } = await supabase
            .from("media")
            .select(`
                id,
                file_path,
                service_id,
                services!inner (
                    stylist_id
                )
            `)
            .eq("id", imageId)
            .single();

        if (imageError) {
            return { data: null, error: "Bildet ble ikke funnet" };
        }

        // Check if user owns the service
        if (imageData.services.stylist_id !== user.id) {
            return {
                data: null,
                error: "Du har ikke tilgang til å slette dette bildet",
            };
        }

        // Delete from storage
        const { error: storageError } = await supabase.storage
            .from("service-media")
            .remove([imageData.file_path]);

        if (storageError) {
            console.error("Storage deletion error:", storageError);
            // Continue with database deletion even if storage fails
        }

        // Delete from database
        const { error: deleteError } = await supabase
            .from("media")
            .delete()
            .eq("id", imageId);

        if (deleteError) {
            return {
                data: null,
                error: "Kunne ikke slette bildet fra databasen",
            };
        }

        return { data: { success: true }, error: null };
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
 * Set a service image as preview
 */
export async function setServiceImageAsPreview(imageId: string) {
    try {
        const supabase = await createClient();

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth
            .getUser();
        if (userError || !user) {
            return { data: null, error: "Du må være logget inn" };
        }

        // Get image details first
        const { data: imageData, error: imageError } = await supabase
            .from("media")
            .select(`
                id,
                service_id,
                services!inner (
                    stylist_id
                )
            `)
            .eq("id", imageId)
            .single();

        if (imageError) {
            return { data: null, error: "Bildet ble ikke funnet" };
        }

        // Check if user owns the service
        if (imageData.services.stylist_id !== user.id) {
            return {
                data: null,
                error: "Du har ikke tilgang til å endre dette bildet",
            };
        }

        // Use a transaction-like approach: first unset all, then set the new one
        if (!imageData.service_id) {
            return {
                data: null,
                error: "Kunne ikke finne tjeneste for bildet",
            };
        }

        // Step 1: Unset ALL existing preview images for this service
        const { error: unsetError } = await supabase
            .from("media")
            .update({ is_preview_image: false })
            .eq("service_id", imageData.service_id)
            .eq("media_type", "service_image");

        if (unsetError) {
            console.error("Error unsetting all previews:", unsetError);
            return {
                data: null,
                error: "Kunne ikke oppdatere eksisterende hovedbilde",
            };
        }

        // Step 2: Set this specific image as the new preview
        const { error: setError } = await supabase
            .from("media")
            .update({ is_preview_image: true })
            .eq("id", imageId);

        if (setError) {
            console.error("Error setting new preview:", setError);
            return {
                data: null,
                error: "Kunne ikke sette bildet som hovedbilde",
            };
        }

        return { data: { success: true }, error: null };
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
 * Get service images with preview first
 */
export async function getServiceImages(serviceId: string) {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("media")
            .select("*")
            .eq("service_id", serviceId)
            .eq("media_type", "service_image")
            .order("is_preview_image", { ascending: false })
            .order("created_at", { ascending: true });

        if (error) {
            return { data: null, error: error.message };
        }

        // Generate public URLs for each image
        const imagesWithUrls = data.map((image) => ({
            ...image,
            // Use file_path as URL if it's already a full URL (Unsplash), otherwise use Supabase storage
            publicUrl: image.file_path.startsWith("http")
                ? image.file_path
                : getPublicUrl(supabase, "service-media", image.file_path),
        }));

        return { data: imagesWithUrls, error: null };
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
 * Get filtered services for a stylist (used in mine-tjenester page)
 */
export async function getFilteredStylistServices(
    stylistId: string,
    filters: ServiceFilters = {},
) {
    const supabase = await createClient();

    // Get current user to verify they can access this stylist's services
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "Authentication required", data: null };
    }

    if (user.id !== stylistId) {
        return { error: "Unauthorized access", data: null };
    }

    const {
        search,
        categories,
        serviceDestination,
        minPrice,
        maxPrice,
        sortBy = "newest",
        page = 1,
        limit = 12,
    } = filters;

    let query = supabase
        .from("services")
        .select(
            `
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
                is_preview_image,
                created_at
            )
        `,
            { count: "exact" },
        )
        .eq("stylist_id", stylistId);

    // Apply search filter
    if (search) {
        query = query.or(
            `title.ilike.%${search}%,description.ilike.%${search}%`,
        );
    }

    // Apply category filter
    if (categories && categories.length > 0) {
        const { data: serviceIds } = await supabase
            .from("service_service_categories")
            .select("service_id")
            .in("category_id", categories);

        if (serviceIds && serviceIds.length > 0) {
            const ids = serviceIds.map((item) => item.service_id);
            query = query.in("id", ids);
        } else {
            return {
                data: [],
                error: null,
                count: 0,
                totalPages: 0,
                currentPage: page,
                hasMore: false,
            };
        }
    }

    // Apply service destination filter
    if (
        serviceDestination?.atCustomerPlace &&
        !serviceDestination?.atStylistPlace
    ) {
        query = query.eq("at_customer_place", true);
    } else if (
        serviceDestination?.atStylistPlace &&
        !serviceDestination?.atCustomerPlace
    ) {
        query = query.eq("at_stylist_place", true);
    }

    // Apply price filters
    if (minPrice) {
        query = query.gte("price", parseFloat(minPrice));
    }
    if (maxPrice) {
        query = query.lte("price", parseFloat(maxPrice));
    }

    // Apply sorting
    switch (sortBy) {
        case "price_asc":
            query = query.order("price", { ascending: true });
            break;
        case "price_desc":
            query = query.order("price", { ascending: false });
            break;
        case "newest":
            query = query.order("created_at", { ascending: false });
            break;
        default:
            query = query.order("created_at", { ascending: false });
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
        return { error: error.message, data: null };
    }

    if (!data) {
        return {
            data: [],
            error: null,
            count: 0,
            totalPages: 0,
            currentPage: page,
            hasMore: false,
        };
    }

    // Add public URLs for media
    const servicesWithUrls = data.map((service) => ({
        ...service,
        media: service.media?.map((media) => ({
            ...media,
            publicUrl: media.file_path.startsWith("https://images.unsplash.com/")
                ? media.file_path
                : getPublicUrl(supabase, "service-media", media.file_path),
        })),
    }));

    return {
        data: servicesWithUrls,
        error: null,
        count: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
        currentPage: page,
        hasMore: count ? page * limit < count : false,
    };
}

/**
 * Get reviews for a specific service
 */
export async function getServiceReviews(serviceId: string, limit = 10) {
    const supabase = await createClient();

    // Use raw SQL query - convert the working SQL to RPC or use the simpler approach
    // First get all booking IDs for this service
    const { data: bookingServiceData, error: bsError } = await supabase
        .from("booking_services")
        .select("booking_id")
        .eq("service_id", serviceId);

    console.log("booking_services data:", bookingServiceData, bsError);

    if (bsError || !bookingServiceData || bookingServiceData.length === 0) {
        return { data: [], error: bsError };
    }

    const bookingIds = bookingServiceData.map((bs) => bs.booking_id);

    // Now get reviews for those bookings
    const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select(`
            id,
            rating,
            comment,
            created_at,
            profiles!reviews_customer_id_fkey (
                id,
                full_name
            )
        `)
        .in("booking_id", bookingIds)
        .order("created_at", { ascending: false })
        .limit(limit);

    console.log("reviews data:", reviewsData, reviewsError);

    if (reviewsError) {
        return { data: null, error: reviewsError };
    }

    // Transform the data
    const transformedReviews = reviewsData?.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment || "",
        created_at: review.created_at,
        customer_name: review.profiles?.full_name || "Anonym kunde",
        customer_initial: review.profiles?.full_name?.charAt(0) || "?",
    })) || [];

    console.log("transformedReviews:", transformedReviews);

    return { data: transformedReviews, error: null };
}

/**
 * Get review statistics for a specific service
 */
export async function getServiceReviewStats(serviceId: string) {
    const supabase = await createClient();

    // First get all booking IDs for this service
    const { data: bookingServiceData, error: bsError } = await supabase
        .from("booking_services")
        .select("booking_id")
        .eq("service_id", serviceId);

    if (bsError || !bookingServiceData || bookingServiceData.length === 0) {
        return {
            data: {
                total_reviews: 0,
                average_rating: 0,
                rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            },
            error: null,
        };
    }

    const bookingIds = bookingServiceData.map((bs) => bs.booking_id);

    // Get ratings for those bookings
    const { data, error } = await supabase
        .from("reviews")
        .select("rating")
        .in("booking_id", bookingIds);

    if (error) {
        return { data: null, error };
    }

    if (!data || data.length === 0) {
        return {
            data: {
                total_reviews: 0,
                average_rating: 0,
                rating_distribution: {
                    5: 0,
                    4: 0,
                    3: 0,
                    2: 0,
                    1: 0,
                },
            },
            error: null,
        };
    }

    const totalReviews = data.length;
    const averageRating = data.reduce((sum, review) => sum + review.rating, 0) /
        totalReviews;

    const ratingDistribution = data.reduce((acc, review) => {
        acc[review.rating as keyof typeof acc]++;
        return acc;
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

    return {
        data: {
            total_reviews: totalReviews,
            average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            rating_distribution: ratingDistribution,
        },
        error: null,
    };
}
