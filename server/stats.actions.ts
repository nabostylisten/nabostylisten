"use server";

import { createClient } from "@/lib/supabase/server";

export async function getPlatformStats() {
  const supabase = await createClient();

  try {
    // Fetch counts in parallel for better performance
    const [
      stylistsResult,
      servicesResult,
      categoriesResult,
      bookingsResult,
      ratingsResult,
    ] = await Promise.all([
      // Count verified stylists (profiles with role = 'stylist' and identity verification completed)
      supabase
        .from("profiles")
        .select(`
          *,
          stylist_details!inner (
            identity_verification_completed_at
          )
        `, { count: "exact", head: true })
        .eq("role", "stylist")
        .not("stylist_details.identity_verification_completed_at", "is", null),

      // Count published services from verified stylists
      supabase
        .from("services")
        .select(`
          *,
          profiles!stylist_id (
            stylist_details!inner (
              identity_verification_completed_at
            )
          )
        `, { count: "exact", head: true })
        .eq("is_published", true)
        .not("profiles.stylist_details.identity_verification_completed_at", "is", null),

      // Count service categories
      supabase
        .from("service_categories")
        .select("*", { count: "exact", head: true }),

      // Count confirmed bookings for verified stylists
      supabase
        .from("bookings")
        .select(`
          *,
          stylist:profiles!stylist_id (
            stylist_details!inner (
              identity_verification_completed_at
            )
          )
        `, { count: "exact", head: true })
        .eq("status", "confirmed")
        .not("stylist.stylist_details.identity_verification_completed_at", "is", null),

      // Get average rating from reviews for verified stylists
      supabase
        .from("reviews")
        .select(`
          rating,
          stylist:profiles!stylist_id (
            stylist_details!inner (
              identity_verification_completed_at
            )
          )
        `)
        .not("stylist.stylist_details.identity_verification_completed_at", "is", null),
    ]);

    // Calculate average rating
    let averageRating = 0;
    if (ratingsResult.data && ratingsResult.data.length > 0) {
      const totalRating = ratingsResult.data.reduce(
        (sum, review) => sum + review.rating,
        0,
      );
      averageRating = totalRating / ratingsResult.data.length;
    }

    return {
      data: {
        stylists: stylistsResult.count || 0,
        services: servicesResult.count || 0,
        categories: categoriesResult.count || 0,
        bookings: bookingsResult.count || 0,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    return {
      data: null,
      error: "Failed to fetch platform statistics",
    };
  }
}

export type PopularService =
  Awaited<ReturnType<typeof getPopularServices>>["data"] extends
    (infer T)[] | null ? T : never;

export async function getPopularServices(limit: number = 10) {
  const supabase = await createClient();

  try {
    // First, get all services with reviews by joining through booking_services and bookings
    const { data: reviewData, error: reviewError } = await supabase
      .from("reviews")
      .select(`
        rating,
        bookings!inner (
          id,
          booking_services!inner (
            service_id
          )
        )
      `);

    if (reviewError) throw reviewError;

    // Calculate average ratings and review counts for each service
    const serviceRatings = new Map<string, { total: number; count: number }>();

    if (reviewData) {
      reviewData.forEach((review) => {
        const booking = review.bookings;
        if (booking && booking.booking_services) {
          booking.booking_services.forEach((bs) => {
            const serviceId = bs.service_id;
            if (!serviceRatings.has(serviceId)) {
              serviceRatings.set(serviceId, { total: 0, count: 0 });
            }
            const stats = serviceRatings.get(serviceId)!;
            stats.total += review.rating;
            stats.count += 1;
          });
        }
      });
    }

    // Get services that have reviews, sorted by rating
    const serviceIdsWithReviews = Array.from(serviceRatings.keys());

    // If no services have reviews, fetch any published services
    // IMPORTANT: Only include services from verified stylists
    const { data: services, error } = await supabase
      .from("services")
      .select(`
        *,
        profiles!stylist_id (
          id,
          full_name,
          stylist_details!inner (
            identity_verification_completed_at
          )
        ),
        service_service_categories (
          service_categories (
            id,
            name
          )
        ),
        media (
          id,
          file_path,
          is_preview_image
        )
      `)
      .eq("is_published", true)
      .not("profiles.stylist_details.identity_verification_completed_at", "is", null)
      .in(
        "id",
        serviceIdsWithReviews.length > 0
          ? serviceIdsWithReviews
          : ["00000000-0000-0000-0000-000000000000"],
      );

    if (error) throw error;

    // If we have no services with reviews, get some without reviews
    // Filter to only include services from verified stylists
    let finalServices = (services || []).filter(service =>
      service.profiles?.stylist_details?.identity_verification_completed_at
    );

    if (serviceIdsWithReviews.length === 0 || finalServices.length < limit) {
      let additionalServicesQuery = supabase
        .from("services")
        .select(`
          *,
          profiles!stylist_id (
            id,
            full_name,
            stylist_details!inner (
              identity_verification_completed_at
            )
          ),
          service_service_categories (
            service_categories (
              id,
              name
            )
          ),
          media (
            id,
            file_path,
            is_preview_image
          )
        `)
        .eq("is_published", true)
        .not("profiles.stylist_details.identity_verification_completed_at", "is", null)
        .limit(limit - finalServices.length);

      // Only exclude services with reviews if there are any
      if (serviceIdsWithReviews.length > 0) {
        additionalServicesQuery = additionalServicesQuery.not(
          "id",
          "in",
          `(${serviceIdsWithReviews.join(",")})`,
        );
      }

      const { data: additionalServices } = await additionalServicesQuery;

      if (additionalServices) {
        // Filter additional services as well
        const verifiedAdditionalServices = additionalServices.filter(service =>
          service.profiles?.stylist_details?.identity_verification_completed_at
        );
        finalServices = [...finalServices, ...verifiedAdditionalServices];
      }
    }

    // Combine services with their ratings
    const servicesWithRatings = finalServices.map((service) => {
      const ratingStats = serviceRatings.get(service.id) ||
        { total: 0, count: 0 };
      return {
        ...service,
        average_rating: ratingStats.count > 0
          ? ratingStats.total / ratingStats.count
          : 0,
        total_reviews: ratingStats.count,
      };
    });

    // Sort by rating (highest first), then by review count, then by newest
    servicesWithRatings.sort((a, b) => {
      // First priority: services with reviews come before those without
      if (a.total_reviews > 0 && b.total_reviews === 0) return -1;
      if (a.total_reviews === 0 && b.total_reviews > 0) return 1;

      // Second priority: higher average rating
      if (a.average_rating !== b.average_rating) {
        return b.average_rating - a.average_rating;
      }

      // Third priority: more reviews
      if (a.total_reviews !== b.total_reviews) {
        return b.total_reviews - a.total_reviews;
      }

      // Fourth priority: newer services
      return new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime();
    });

    return {
      data: servicesWithRatings.slice(0, limit),
      error: null,
    };
  } catch (error) {
    console.error("Error fetching popular services:", error);
    return {
      data: null,
      error: "Failed to fetch popular services",
    };
  }
}
