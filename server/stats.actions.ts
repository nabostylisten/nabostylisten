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
      // Count stylists (profiles with role = 'stylist')
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "stylist"),
      
      // Count published services
      supabase
        .from("services")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true),
      
      // Count service categories
      supabase
        .from("service_categories")
        .select("*", { count: "exact", head: true }),
      
      // Count confirmed bookings
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "confirmed"),
      
      // Get average rating from reviews
      supabase
        .from("reviews")
        .select("rating"),
    ]);

    // Calculate average rating
    let averageRating = 0;
    if (ratingsResult.data && ratingsResult.data.length > 0) {
      const totalRating = ratingsResult.data.reduce((sum, review) => sum + review.rating, 0);
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

export type PopularService = Awaited<ReturnType<typeof getPopularServices>>['data'] extends (infer T)[] | null ? T : never;

export async function getPopularServices(limit: number = 10) {
  const supabase = await createClient();

  try {
    // Fetch services with their reviews and stylist information
    const { data: services, error } = await supabase
      .from("services")
      .select(`
        *,
        profiles!stylist_id (
          id,
          full_name
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
      .limit(limit);

    if (error) throw error;

    // Fetch reviews for these services
    const serviceIds = services?.map(s => s.id) || [];
    
    if (serviceIds.length === 0) {
      return { data: [], error: null };
    }

    // Get bookings with reviews for these services
    const { data: reviewData } = await supabase
      .from("bookings")
      .select(`
        booking_services!inner (
          service_id
        ),
        reviews (
          rating
        )
      `)
      .in("booking_services.service_id", serviceIds)
      .not("reviews", "is", null);

    // Calculate average ratings and review counts for each service
    const serviceRatings = new Map();
    
    if (reviewData) {
      reviewData.forEach(booking => {
        if (booking.reviews && booking.booking_services) {
          booking.booking_services.forEach((bs) => {
            const serviceId = bs.service_id;
            if (!serviceRatings.has(serviceId)) {
              serviceRatings.set(serviceId, { total: 0, count: 0 });
            }
            const stats = serviceRatings.get(serviceId);
            stats.total += booking.reviews?.rating || 0;
            stats.count += 1;
          });
        }
      });
    }

    // Combine services with their ratings
    const servicesWithRatings = services?.map(service => {
      const ratingStats = serviceRatings.get(service.id) || { total: 0, count: 0 };
      return {
        ...service,
        average_rating: ratingStats.count > 0 ? ratingStats.total / ratingStats.count : 0,
        total_reviews: ratingStats.count,
      };
    }) || [];

    // Sort by rating (highest first), then by review count
    servicesWithRatings.sort((a, b) => {
      if (b.average_rating !== a.average_rating) {
        return b.average_rating - a.average_rating;
      }
      return b.total_reviews - a.total_reviews;
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