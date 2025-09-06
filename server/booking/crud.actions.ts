"use server";

import { createClient } from "@/lib/supabase/server";
import {
    bookingsInsertSchema,
    bookingsUpdateSchema,
} from "@/schemas/database.schema";
import type { BookingFilters, DatabaseTables } from "@/types";

export async function getBooking(id: string) {
    const supabase = await createClient();
    return await supabase.from("bookings").select("*").eq(
        "id",
        id,
    );
}

export async function createBooking(
    booking: DatabaseTables["bookings"]["Insert"],
) {
    const { success, data } = bookingsInsertSchema.safeParse(booking);
    if (!success) {
        return {
            error: "Invalid booking data",
            data: null,
        };
    }

    const supabase = await createClient();
    return await supabase.from("bookings").insert(data);
}

export async function updateBooking(
    id: string,
    booking: DatabaseTables["bookings"]["Update"],
) {
    const { success, data } = bookingsUpdateSchema.safeParse(booking);
    if (!success) {
        return {
            error: "Invalid booking data",
            data: null,
        };
    }
    const supabase = await createClient();

    return await supabase.from("bookings").update(data).eq("id", id);
}

export async function deleteBooking(
    id: DatabaseTables["bookings"]["Row"]["id"],
) {
    const supabase = await createClient();
    return await supabase.from("bookings").delete().eq("id", id);
}

export async function getUserBookings(
    userId: string,
    filters: BookingFilters = {},
    userRole: "customer" | "stylist" = "customer",
) {
    const supabase = await createClient();

    // Get current user to verify access
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError || user.id !== userId) {
        return {
            error: "Unauthorized access",
            data: null,
            total: 0,
            totalPages: 0,
        };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 4;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from("bookings")
        .select(`
            *,
            customer:profiles!bookings_customer_id_fkey(
                id,
                full_name,
                email,
                phone_number,
                role
            ),
            stylist:profiles!bookings_stylist_id_fkey(
                id,
                full_name,
                email,
                phone_number,
                role,
                stylist_details(
                    bio,
                    can_travel,
                    has_own_place,
                    travel_distance_km
                )
            ),
            address:addresses(
                id,
                nickname,
                street_address,
                city,
                postal_code,
                country,
                country_code,
                entry_instructions
            ),
            discount:discounts(
                id,
                code,
                description,
                discount_percentage,
                discount_amount,
                currency
            ),
            booking_services(
                service:services(
                    id,
                    title,
                    description,
                    price,
                    currency,
                    duration_minutes,
                    is_published,
                    at_customer_place,
                    at_stylist_place
                )
            ),
            chats(
                id,
                created_at,
                updated_at
            ),
            payments(
                id,
                original_amount,
                discount_amount,
                final_amount,
                platform_fee,
                stylist_payout,
                currency,
                status,
                succeeded_at
            ),
            trial_booking:bookings!trial_booking_id(
                id,
                start_time,
                end_time,
                status
            ),
            main_booking:bookings!main_booking_id(
                id,
                start_time,
                end_time,
                status
            )
        `);

    // Filter by role - customers see their bookings, stylists see bookings assigned to them
    if (userRole === "customer") {
        query = query.eq("customer_id", userId);
    } else {
        query = query.eq("stylist_id", userId);
    }

    // Apply search filter
    if (filters.search?.trim()) {
        // Search in service titles, stylist names, or booking messages
        query = query.or(`
            message_to_stylist.ilike.%${filters.search}%,
            booking_services.service.title.ilike.%${filters.search}%,
            stylist.full_name.ilike.%${filters.search}%
        `);
    }

    // Apply status filter
    if (filters.status) {
        query = query.eq("status", filters.status);
    }

    // Apply date range filter
    if (filters.dateRange) {
        const now = new Date().toISOString();
        if (filters.dateRange === "upcoming") {
            query = query.gt("start_time", now);
        } else if (filters.dateRange === "completed") {
            query = query.lt("start_time", now);
        } else if (filters.dateRange === "to_be_confirmed") {
            // Stylist view: pending bookings
            query = query.eq("status", "pending");
        } else if (filters.dateRange === "planned") {
            // Stylist view: confirmed bookings that are upcoming
            query = query.eq("status", "confirmed").gt("start_time", now);
        }
    }

    // Apply sorting
    switch (filters.sortBy) {
        case "date_asc":
            query = query.order("start_time", { ascending: true });
            break;
        case "date_desc":
            query = query.order("start_time", { ascending: false });
            break;
        case "price_asc":
            query = query.order("total_price", { ascending: true });
            break;
        case "price_desc":
            query = query.order("total_price", { ascending: false });
            break;
        default:
        case "newest":
            query = query.order("created_at", { ascending: false });
            break;
    }

    // Get total count for pagination
    const countQuery = supabase
        .from("bookings")
        .select("*", { count: "exact", head: true });

    // Apply same role-based filtering for count
    if (userRole === "customer") {
        countQuery.eq("customer_id", userId);
    } else {
        countQuery.eq("stylist_id", userId);
    }

    // Apply the same filters for counting
    if (filters.search?.trim()) {
        countQuery.or(`
            message_to_stylist.ilike.%${filters.search}%,
            booking_services.service.title.ilike.%${filters.search}%,
            stylist.full_name.ilike.%${filters.search}%
        `);
    }

    if (filters.status) {
        countQuery.eq("status", filters.status);
    }

    if (filters.dateRange) {
        const now = new Date().toISOString();
        if (filters.dateRange === "upcoming") {
            countQuery.gt("start_time", now);
        } else if (filters.dateRange === "completed") {
            countQuery.lt("start_time", now);
        } else if (filters.dateRange === "to_be_confirmed") {
            countQuery.eq("status", "pending");
        } else if (filters.dateRange === "planned") {
            countQuery.eq("status", "confirmed").gt("start_time", now);
        }
    }

    // Execute queries
    const [{ data, error }, { count, error: countError }] = await Promise.all([
        query.range(from, to),
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

export async function getBookingDetails(bookingId: string) {
    const supabase = await createClient();

    // Check authentication first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "User not authenticated", data: null };
    }

    // 1. Get main booking data first
    const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

    if (bookingError) {
        return { error: bookingError.message, data: null };
    }

    if (!booking) {
        return { error: "Booking not found", data: null };
    }

    // Get user profile to check role
    const { data: userProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    // Check if user has access - customer, stylist, or admin
    const hasAccess = booking.customer_id === user.id ||
        booking.stylist_id === user.id ||
        userProfile?.role === "admin";

    if (!hasAccess) {
        return { error: "Unauthorized access", data: null };
    }

    // 2. Get customer profile
    const customer = booking.customer_id
        ? (await supabase
            .from("profiles")
            .select("id, full_name, email, phone_number")
            .eq("id", booking.customer_id)
            .single()).data
        : null;

    // 3. Get stylist profile with details
    const stylistProfile = booking.stylist_id
        ? (await supabase
            .from("profiles")
            .select("id, full_name, email, phone_number")
            .eq("id", booking.stylist_id)
            .single()).data
        : null;

    const stylistDetails = booking.stylist_id
        ? (await supabase
            .from("stylist_details")
            .select(`
                bio,
                instagram_profile,
                facebook_profile,
                tiktok_profile,
                youtube_profile,
                snapchat_profile,
                other_social_media_urls,
                can_travel,
                has_own_place,
                travel_distance_km
            `)
            .eq("profile_id", booking.stylist_id)
            .single()).data
        : null;

    const stylist = stylistProfile
        ? {
            ...stylistProfile,
            stylist_details: stylistDetails || null,
        }
        : null;

    // 4. Get address if exists
    const address = booking.address_id
        ? (await supabase
            .from("addresses")
            .select(`
                id,
                nickname,
                street_address,
                city,
                postal_code,
                country,
                country_code,
                entry_instructions
            `)
            .eq("id", booking.address_id)
            .single()).data
        : null;

    // 5. Get discount if exists
    const discount = booking.discount_id
        ? (await supabase
            .from("discounts")
            .select(`
                id,
                code,
                description,
                discount_percentage,
                discount_amount,
                currency
            `)
            .eq("id", booking.discount_id)
            .single()).data
        : null;

    // 6. Get booking services with service details
    const { data: bookingServices } = await supabase
        .from("booking_services")
        .select("service_id")
        .eq("booking_id", bookingId);

    const booking_services = [];
    if (bookingServices && bookingServices.length > 0) {
        for (const bs of bookingServices) {
            const { data: serviceData } = await supabase
                .from("services")
                .select(`
                    id,
                    title,
                    description,
                    price,
                    currency,
                    duration_minutes,
                    includes,
                    requirements,
                    at_customer_place,
                    at_stylist_place,
                    is_published,
                    has_trial_session,
                    trial_session_price,
                    trial_session_duration_minutes,
                    trial_session_description
                `)
                .eq("id", bs.service_id)
                .single();

            if (serviceData) {
                booking_services.push({ service: serviceData });
            }
        }
    }

    // 7. Get trial booking if exists
    const trial_booking = booking.trial_booking_id
        ? (await supabase
            .from("bookings")
            .select(`
                id,
                start_time,
                end_time,
                total_price,
                total_duration_minutes,
                status,
                is_trial_session,
                message_to_stylist,
                discount_applied
            `)
            .eq("id", booking.trial_booking_id)
            .single()).data
        : null;

    // 7a. Get main booking if this is a trial session
    const main_booking = booking.main_booking_id
        ? (await supabase
            .from("bookings")
            .select(`
                id,
                start_time,
                end_time,
                total_price,
                total_duration_minutes,
                status,
                is_trial_session,
                message_to_stylist,
                discount_applied,
                discount_id,
                booking_services(
                    service:services(
                        id,
                        title,
                        price,
                        currency,
                        duration_minutes
                    )
                )
            `)
            .eq("id", booking.main_booking_id)
            .single()).data
        : null;

    // 8. Get chats with messages
    const { data: chatsData } = await supabase
        .from("chats")
        .select("id, created_at, updated_at")
        .eq("booking_id", bookingId);

    const chats = [];
    if (chatsData && chatsData.length > 0) {
        for (const chat of chatsData) {
            const { data: messages } = await supabase
                .from("chat_messages")
                .select("id, content, created_at, sender_id, is_read")
                .eq("chat_id", chat.id)
                .order("created_at", { ascending: true });

            chats.push({
                ...chat,
                chat_messages: messages || [],
            });
        }
    }

    // 9. Get payments
    const { data: payments } = await supabase
        .from("payments")
        .select(`
            id,
            payment_intent_id,
            original_amount,
            discount_amount,
            final_amount,
            platform_fee,
            stylist_payout,
            affiliate_commission,
            currency,
            status,
            authorized_at,
            captured_at,
            succeeded_at,
            payout_initiated_at,
            payout_completed_at,
            refunded_amount,
            refund_reason,
            affiliate_id,
            affiliate_commission_percentage,
            discount_code,
            discount_percentage,
            discount_fixed_amount
        `)
        .eq("booking_id", bookingId);

    // Combine all data into the expected structure
    const data = {
        ...booking,
        customer,
        stylist,
        address,
        discount,
        booking_services,
        trial_booking,
        main_booking,
        chats,
        payments: payments || [],
    };

    return { data, error: null };
}

export async function getBookingCounts(
    userId: string,
    userRole: "customer" | "stylist" = "customer",
) {
    const supabase = await createClient();

    // Get current user to verify access
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError || user.id !== userId) {
        return {
            error: "Unauthorized access",
            data: null,
        };
    }

    try {
        const now = new Date().toISOString();

        // Build base query based on role
        const baseQuery = supabase.from("bookings").select("*", {
            count: "exact",
            head: true,
        });

        if (userRole === "customer") {
            baseQuery.eq("customer_id", userId);
        } else {
            baseQuery.eq("stylist_id", userId);
        }

        // Execute different count queries in parallel
        const queries = [];

        if (userRole === "customer") {
            // Customer view counts
            queries.push(
                // All bookings
                supabase
                    .from("bookings")
                    .select("*", { count: "exact", head: true })
                    .eq("customer_id", userId),
                // Pending bookings
                supabase
                    .from("bookings")
                    .select("*", { count: "exact", head: true })
                    .eq("customer_id", userId)
                    .eq("status", "pending"),
                // Confirmed bookings
                supabase
                    .from("bookings")
                    .select("*", { count: "exact", head: true })
                    .eq("customer_id", userId)
                    .eq("status", "confirmed"),
                // Completed bookings
                supabase
                    .from("bookings")
                    .select("*", { count: "exact", head: true })
                    .eq("customer_id", userId)
                    .eq("status", "completed"),
                // Cancelled bookings
                supabase
                    .from("bookings")
                    .select("*", { count: "exact", head: true })
                    .eq("customer_id", userId)
                    .eq("status", "cancelled"),
            );
        } else {
            // Stylist view counts
            queries.push(
                // All bookings
                supabase
                    .from("bookings")
                    .select("*", { count: "exact", head: true })
                    .eq("stylist_id", userId),
                // To be confirmed (pending)
                supabase
                    .from("bookings")
                    .select("*", { count: "exact", head: true })
                    .eq("stylist_id", userId)
                    .eq("status", "pending"),
                // Planned (confirmed and upcoming)
                supabase
                    .from("bookings")
                    .select("*", { count: "exact", head: true })
                    .eq("stylist_id", userId)
                    .eq("status", "confirmed")
                    .gt("start_time", now),
                // Completed
                supabase
                    .from("bookings")
                    .select("*", { count: "exact", head: true })
                    .eq("stylist_id", userId)
                    .eq("status", "completed"),
                // Cancelled
                supabase
                    .from("bookings")
                    .select("*", { count: "exact", head: true })
                    .eq("stylist_id", userId)
                    .eq("status", "cancelled"),
            );
        }

        const results = await Promise.all(queries);

        if (userRole === "customer") {
            return {
                data: {
                    all: results[0].count || 0,
                    pending: results[1].count || 0,
                    confirmed: results[2].count || 0,
                    completed: results[3].count || 0,
                    cancelled: results[4].count || 0,
                },
                error: null,
            };
        } else {
            return {
                data: {
                    all: results[0].count || 0,
                    to_be_confirmed: results[1].count || 0,
                    planned: results[2].count || 0,
                    completed: results[3].count || 0,
                    cancelled: results[4].count || 0,
                },
                error: null,
            };
        }
    } catch (error) {
        console.error("Error fetching booking counts:", error);
        return {
            error: "Failed to fetch booking counts",
            data: null,
        };
    }
}