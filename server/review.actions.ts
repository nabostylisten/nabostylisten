"use server";

import { createClient } from "@/lib/supabase/server";
import type { DatabaseTables, ReviewFilters } from "@/types";

export async function getReview(id: string) {
    const supabase = await createClient();
    return await supabase.from("reviews").select("*").eq("id", id);
}

export async function createReview(
    review: DatabaseTables["reviews"]["Insert"],
) {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
        return { error: "User not authenticated", data: null };
    }

    // Verify that the user is the customer of the booking
    const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("customer_id, stylist_id, status")
        .eq("id", review.booking_id)
        .single();

    if (bookingError || !booking) {
        return { error: "Booking not found", data: null };
    }

    if (booking.customer_id !== user.id) {
        return { error: "Not authorized to review this booking", data: null };
    }

    if (booking.status !== "completed") {
        return { error: "Can only review completed bookings", data: null };
    }

    // Check if review already exists for this booking
    const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("booking_id", review.booking_id)
        .single();

    if (existingReview) {
        return { error: "Review already exists for this booking", data: null };
    }

    // Set customer_id and stylist_id from booking
    const reviewData = {
        ...review,
        customer_id: booking.customer_id,
        stylist_id: booking.stylist_id,
    };

    return await supabase.from("reviews").insert(reviewData).select().single();
}

export async function updateReview(
    id: string,
    review: DatabaseTables["reviews"]["Update"],
) {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
        return { error: "User not authenticated", data: null };
    }

    // Verify that the user is the author of the review
    const { data: existingReview, error: reviewError } = await supabase
        .from("reviews")
        .select("customer_id")
        .eq("id", id)
        .single();

    if (reviewError || !existingReview) {
        return { error: "Review not found", data: null };
    }

    if (existingReview.customer_id !== user.id) {
        return { error: "Not authorized to update this review", data: null };
    }

    return await supabase.from("reviews").update(review).eq("id", id).select()
        .single();
}

export async function deleteReview(id: string) {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
        return { error: "User not authenticated", data: null };
    }

    // Verify that the user is the author of the review
    const { data: existingReview, error: reviewError } = await supabase
        .from("reviews")
        .select("customer_id")
        .eq("id", id)
        .single();

    if (reviewError || !existingReview) {
        return { error: "Review not found", data: null };
    }

    if (existingReview.customer_id !== user.id) {
        return { error: "Not authorized to delete this review", data: null };
    }

    return await supabase.from("reviews").delete().eq("id", id);
}

export async function getReviewByBookingId(bookingId: string) {
    const supabase = await createClient();
    return await supabase
        .from("reviews")
        .select(`
            *,
            customer:profiles!reviews_customer_id_fkey(
                id,
                full_name
            ),
            stylist:profiles!reviews_stylist_id_fkey(
                id,
                full_name
            ),
            media(
                id,
                file_path,
                media_type
            )
        `)
        .eq("booking_id", bookingId)
        .single();
}

export async function getStylistReviews(
    stylistId: string,
    options: ReviewFilters = {},
) {
    const supabase = await createClient();

    const { page = 1, limit = 10, search, rating, sortBy = "newest" } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build base query
    let reviewsQuery = supabase
        .from("reviews")
        .select(`
            *,
            customer:profiles!reviews_customer_id_fkey(
                id,
                full_name
            ),
            booking:bookings!reviews_booking_id_fkey(
                id,
                start_time,
                booking_services(
                    services(
                        id,
                        title
                    )
                )
            ),
            media(
                id,
                file_path,
                media_type
            )
        `)
        .eq("stylist_id", stylistId);

    let countQuery = supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("stylist_id", stylistId);

    // Apply filters
    if (search) {
        reviewsQuery = reviewsQuery.ilike("comment", `%${search}%`);
        countQuery = countQuery.ilike("comment", `%${search}%`);
    }

    if (rating) {
        reviewsQuery = reviewsQuery.eq("rating", rating);
        countQuery = countQuery.eq("rating", rating);
    }

    // Apply sorting
    switch (sortBy) {
        case "oldest":
            reviewsQuery = reviewsQuery.order("created_at", {
                ascending: true,
            });
            break;
        case "highest":
            reviewsQuery = reviewsQuery.order("rating", { ascending: false })
                .order("created_at", { ascending: false });
            break;
        case "lowest":
            reviewsQuery = reviewsQuery.order("rating", { ascending: true })
                .order("created_at", { ascending: false });
            break;
        case "newest":
        default:
            reviewsQuery = reviewsQuery.order("created_at", {
                ascending: false,
            });
            break;
    }

    // Apply pagination
    reviewsQuery = reviewsQuery.range(from, to);

    const [{ data, error }, { count, error: countError }] = await Promise.all([
        reviewsQuery,
        countQuery,
    ]);

    if (error) {
        return { error: error.message, data: null, total: 0, totalPages: 0 };
    }

    if (countError) {
        return {
            error: countError.message,
            data: null,
            total: 0,
            totalPages: 0,
        };
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return { data, error: null, total, totalPages, currentPage: page };
}

export async function getCustomerReviews(
    customerId: string,
    options: ReviewFilters = {},
) {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError || user.id !== customerId) {
        return {
            error: "Unauthorized access",
            data: null,
            total: 0,
            totalPages: 0,
        };
    }

    const { page = 1, limit = 10, search, rating, sortBy = "newest" } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build base query
    let reviewsQuery = supabase
        .from("reviews")
        .select(`
            *,
            stylist:profiles!reviews_stylist_id_fkey(
                id,
                full_name
            ),
            booking:bookings!reviews_booking_id_fkey(
                id,
                start_time,
                booking_services(
                    services(
                        id,
                        title
                    )
                )
            ),
            media(
                id,
                file_path,
                media_type
            )
        `)
        .eq("customer_id", customerId);

    let countQuery = supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", customerId);

    // Apply filters
    if (search) {
        reviewsQuery = reviewsQuery.ilike("comment", `%${search}%`);
        countQuery = countQuery.ilike("comment", `%${search}%`);
    }

    if (rating) {
        reviewsQuery = reviewsQuery.eq("rating", rating);
        countQuery = countQuery.eq("rating", rating);
    }

    // Apply sorting
    switch (sortBy) {
        case "oldest":
            reviewsQuery = reviewsQuery.order("created_at", {
                ascending: true,
            });
            break;
        case "highest":
            reviewsQuery = reviewsQuery.order("rating", { ascending: false })
                .order("created_at", { ascending: false });
            break;
        case "lowest":
            reviewsQuery = reviewsQuery.order("rating", { ascending: true })
                .order("created_at", { ascending: false });
            break;
        case "newest":
        default:
            reviewsQuery = reviewsQuery.order("created_at", {
                ascending: false,
            });
            break;
    }

    // Apply pagination
    reviewsQuery = reviewsQuery.range(from, to);

    const [{ data, error }, { count, error: countError }] = await Promise.all([
        reviewsQuery,
        countQuery,
    ]);

    if (error) {
        return { error: error.message, data: null, total: 0, totalPages: 0 };
    }

    if (countError) {
        return {
            error: countError.message,
            data: null,
            total: 0,
            totalPages: 0,
        };
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return { data, error: null, total, totalPages, currentPage: page };
}

export async function upsertReview(
    review: DatabaseTables["reviews"]["Insert"],
) {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
        return { error: "User not authenticated", data: null };
    }

    // Verify that the user is the customer of the booking
    const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("customer_id, stylist_id, status")
        .eq("id", review.booking_id)
        .single();

    if (bookingError || !booking) {
        return { error: "Booking not found", data: null };
    }

    if (booking.customer_id !== user.id) {
        return { error: "Not authorized to review this booking", data: null };
    }

    if (booking.status !== "completed") {
        return { error: "Can only review completed bookings", data: null };
    }

    // Check if review already exists for this booking
    const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("booking_id", review.booking_id)
        .single();

    // Set customer_id and stylist_id from booking
    const reviewData = {
        ...review,
        customer_id: booking.customer_id,
        stylist_id: booking.stylist_id,
    };

    if (existingReview) {
        // Update existing review
        const updateData: DatabaseTables["reviews"]["Update"] = {
            rating: reviewData.rating,
            comment: reviewData.comment,
        };

        return await supabase
            .from("reviews")
            .update(updateData)
            .eq("id", existingReview.id)
            .select()
            .single();
    } else {
        // Create new review
        return await supabase.from("reviews").insert(reviewData).select()
            .single();
    }
}

export async function getStylistAverageRating(stylistId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("stylist_id", stylistId);

    if (error) {
        return { error: error.message, average: 0, count: 0 };
    }

    if (!data || data.length === 0) {
        return { error: null, average: 0, count: 0 };
    }

    const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
    const average = Number((totalRating / data.length).toFixed(1));

    return { error: null, average, count: data.length };
}

export async function getCompletedBookingsWithoutReviews(customerId: string) {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError || user.id !== customerId) {
        return { error: "Unauthorized access", data: null };
    }

    const { data, error } = await supabase
        .from("bookings")
        .select(`
            id,
            start_time,
            stylist:profiles!bookings_stylist_id_fkey(
                id,
                full_name
            ),
            booking_services(
                services(
                    id,
                    title
                )
            )
        `)
        .eq("customer_id", customerId)
        .eq("status", "completed")
        .not(
            "id",
            "in",
            `(${
                // Subquery to get booking IDs that already have reviews
                await supabase
                    .from("reviews")
                    .select("booking_id")
                    .eq("customer_id", customerId)
                    .then(({ data: reviews }) =>
                        reviews?.map((r) => r.booking_id).join(",") || "null"
                    )})`,
        )
        .order("start_time", { ascending: false });

    return { data, error };
}

export async function deleteReviewImage(imageId: string) {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
        return { error: "User not authenticated", data: null };
    }

    // Get the image and verify ownership through the review
    const { data: image, error: imageError } = await supabase
        .from("media")
        .select(`
            id,
            review_id,
            file_path,
            reviews!inner(customer_id)
        `)
        .eq("id", imageId)
        .eq("media_type", "review_image")
        .single();

    if (imageError || !image) {
        return { error: "Review image not found", data: null };
    }

    // Verify that the user owns the review
    if (image.reviews.customer_id !== user.id) {
        return { error: "Not authorized to delete this image", data: null };
    }

    // Delete the file from storage
    const { error: storageError } = await supabase.storage
        .from("review-media")
        .remove([image.file_path]);

    if (storageError) {
        console.error("Failed to delete image from storage:", storageError);
        // Continue with database deletion even if storage deletion fails
    }

    // Delete the media record
    const { error: deleteError } = await supabase
        .from("media")
        .delete()
        .eq("id", imageId);

    if (deleteError) {
        return { error: deleteError.message, data: null };
    }

    return { error: null, data: { id: imageId } };
}
