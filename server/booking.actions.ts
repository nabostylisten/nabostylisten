"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
    bookingsInsertSchema,
    bookingsUpdateSchema,
} from "@/schemas/database.schema";
import type { BookingFilters, DatabaseTables } from "@/types";
import {
    createStripePaymentIntent,
    updateStripePaymentIntentMetadata,
} from "@/lib/stripe/connect";
import { calculatePlatformFee } from "@/schemas/platform-config.schema";
import { sendEmail } from "@/lib/resend-utils";
import { BookingStatusUpdateEmail } from "@/transactional/emails/booking-status-update";
import { NewBookingRequestEmail } from "@/transactional/emails/new-booking-request";
import { BookingReceiptEmail } from "@/transactional/emails/booking-receipt";
import { StripeOnboardingRequired } from "@/transactional/emails/stripe-onboarding-required";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { getNabostylistenLogoUrl } from "@/lib/supabase/utils";
import {
    shouldReceiveNotification,
    shouldReceiveNotificationServerSide,
} from "@/server/preferences.actions";
import BookingRescheduledEmail from "@/transactional/emails/booking-rescheduled";
import { DEFAULT_PLATFORM_CONFIG } from "@/schemas/platform-config.schema";

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
                final_amount,
                platform_fee,
                stylist_payout,
                currency,
                status,
                succeeded_at
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

    const { data, error } = await supabase
        .from("bookings")
        .select(`
            *,
            customer:profiles!bookings_customer_id_fkey(
                id,
                full_name,
                email,
                phone_number
            ),
            stylist:profiles!bookings_stylist_id_fkey(
                id,
                full_name,
                email,
                phone_number,
                stylist_details(
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
                    includes,
                    requirements,
                    at_customer_place,
                    at_stylist_place,
                    is_published
                )
            ),
            chats(
                id,
                created_at,
                updated_at,
                chat_messages(
                    id,
                    content,
                    created_at,
                    sender_id,
                    is_read
                )
            ),
            payments(
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
            )
        `)
        .eq("id", bookingId)
        .single();

    if (error) {
        return { error: error.message, data: null };
    }

    // Check if user has access to this booking
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "User not authenticated", data: null };
    }

    // Get user profile to check role
    const { data: userProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    // Check if user has access - customer, stylist, or admin
    const hasAccess = data.customer_id === user.id ||
        data.stylist_id === user.id ||
        userProfile?.role === "admin";

    if (!hasAccess) {
        return { error: "Unauthorized access", data: null };
    }

    return { data, error: null };
}

interface CreateBookingWithServicesInput {
    // Service details
    serviceIds: string[];
    stylistId: string;

    // Timing
    startTime: Date;
    endTime: Date;

    // Location
    location: "stylist" | "customer";
    customerAddress?: {
        streetAddress: string;
        city: string;
        postalCode: string;
        country: string;
        entryInstructions?: string;
    };
    customerAddressId?: string; // ID of existing address from addresses table

    // Additional details
    messageToStylist?: string;
    discountCode?: string;

    // Calculated totals
    totalPrice: number;
    totalDurationMinutes: number;
}

export async function createBookingWithServices(
    input: CreateBookingWithServicesInput,
) {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
        return { error: "User not authenticated", data: null };
    }

    // Start a transaction-like operation
    try {
        // 1. Handle discount validation if provided
        let validatedDiscount: {
            id: string;
            discountPercentage?: number;
            discountAmountNOK?: number;
        } | null = null;

        if (input.discountCode) {
            // Use discount validation server action
            const { validateDiscountCode, trackDiscountUsage } = await import(
                "./discounts.actions"
            );

            const validationResult = await validateDiscountCode({
                code: input.discountCode,
                orderAmountCents: Math.round(input.totalPrice * 100),
                profileId: user.id,
            });

            if (!validationResult.isValid || validationResult.error) {
                return {
                    error: validationResult.error || "Invalid discount code",
                    data: null,
                };
            }

            const discount = validationResult.discount!;

            // Track usage (this will increment the usage counter)
            const trackingResult = await trackDiscountUsage({
                discountId: discount.id,
                profileId: user.id,
                bookingId: undefined, // Will be set later after booking creation
            });

            if (trackingResult.error) {
                return { error: trackingResult.error, data: null };
            }

            validatedDiscount = {
                id: discount.id,
                discountPercentage: discount.discount_percentage || undefined,
                discountAmountNOK: validationResult.discountAmount
                    ? (validationResult.discountAmount / 100)
                    : undefined,
            };
        }

        // 2. Handle address for customer location
        let addressId: string | null = null;

        if (input.location === "customer") {
            if (input.customerAddressId) {
                // Use existing address ID
                addressId = input.customerAddressId;

                // Verify the address belongs to the user
                const { data: existingAddress, error: verifyError } =
                    await supabase
                        .from("addresses")
                        .select("id")
                        .eq("id", input.customerAddressId)
                        .eq("user_id", user.id)
                        .single();

                if (verifyError || !existingAddress) {
                    return { error: "Invalid address selected", data: null };
                }
            } else if (input.customerAddress) {
                // Get geometry coordinates from Mapbox
                const { getGeometryFromAddressComponents } = await import(
                    "@/lib/mapbox"
                );
                const geometry = await getGeometryFromAddressComponents({
                    streetAddress: input.customerAddress.streetAddress,
                    city: input.customerAddress.city,
                    postalCode: input.customerAddress.postalCode,
                    country: input.customerAddress.country,
                });

                // Create a new address with location coordinates
                const { data: address, error: addressError } = await supabase
                    .from("addresses")
                    .insert({
                        user_id: user.id,
                        street_address: input.customerAddress.streetAddress,
                        city: input.customerAddress.city,
                        postal_code: input.customerAddress.postalCode,
                        country: input.customerAddress.country,
                        entry_instructions:
                            input.customerAddress.entryInstructions,
                        nickname: "Booking Address",
                        is_primary: false,
                        // Add location coordinates from Mapbox
                        location: geometry
                            ? `POINT(${geometry[0]} ${geometry[1]})`
                            : null,
                    })
                    .select()
                    .single();

                if (addressError || !address) {
                    return { error: "Failed to create address", data: null };
                }

                addressId = address.id;
            }
        }

        // 3. Calculate enhanced payment breakdown with discount support
        const { calculateBookingPaymentBreakdown } = await import(
            "@/schemas/platform-config.schema"
        );

        const paymentBreakdown = calculateBookingPaymentBreakdown({
            serviceAmountNOK: input.totalPrice,
            hasAffiliate: false, // TODO: Implement affiliate logic
            appliedDiscount: validatedDiscount
                ? {
                    discountPercentage: validatedDiscount.discountPercentage,
                    discountAmountNOK: validatedDiscount.discountAmountNOK,
                }
                : undefined,
        });

        const finalPrice = paymentBreakdown.totalAmountNOK;

        // Get stylist Stripe account ID for payment processing
        const { data: stylistDetails, error: stylistError } = await supabase
            .from("stylist_details")
            .select("stripe_account_id")
            .eq("profile_id", input.stylistId)
            .single();

        if (stylistError || !stylistDetails?.stripe_account_id) {
            return {
                error: "Stylist has not completed Stripe onboarding",
                data: null,
            };
        }

        // Create Stripe PaymentIntent with real integration
        const paymentIntentResult = await createStripePaymentIntent({
            totalAmountNOK: finalPrice,
            stylistStripeAccountId: stylistDetails.stripe_account_id,
            bookingId: `temp_${Date.now()}`, // Temporary ID, will be updated after booking creation
            customerId: user.id,
            stylistId: input.stylistId,
            hasAffiliate: false, // TODO: Implement affiliate logic
            discountAmountNOK: paymentBreakdown.discountAmountNOK || 0,
            discountCode: input.discountCode,
        });

        if (paymentIntentResult.error || !paymentIntentResult.data) {
            // Check if this is a Stripe onboarding error
            const isOnboardingError =
                paymentIntentResult.error?.includes("transfers") ||
                paymentIntentResult.error?.includes("capabilities") ||
                paymentIntentResult.error?.includes("crypto_transfers") ||
                paymentIntentResult.error?.includes("legacy_payments");

            if (isOnboardingError) {
                // Trigger notification emails in the background (don't await to avoid blocking user)
                notifyStripeOnboardingRequired({
                    stylistId: input.stylistId,
                    customerName: user.email || "Kunde", // Use email as fallback if full_name not available
                }).catch((error) => {
                    console.error(
                        "Failed to send onboarding notification emails:",
                        error,
                    );
                });

                return {
                    error: "stripe_onboarding_required",
                    data: {
                        stylistId: input.stylistId,
                        requiresOnboarding: true,
                    },
                };
            }

            return {
                error: paymentIntentResult.error ||
                    "Failed to create payment intent",
                data: null,
            };
        }

        const stripePaymentIntentId = paymentIntentResult.data.paymentIntentId;
        const paymentIntentClientSecret = paymentIntentResult.data.clientSecret;

        // 4. Create the booking
        const bookingData: DatabaseTables["bookings"]["Insert"] = {
            customer_id: user.id,
            stylist_id: input.stylistId,
            start_time: input.startTime.toISOString(),
            end_time: input.endTime.toISOString(),
            message_to_stylist: input.messageToStylist,
            status: "pending",
            address_id: addressId,
            discount_id: validatedDiscount?.id || null,
            discount_applied: paymentBreakdown.discountAmountNOK || 0,
            total_price: finalPrice,
            total_duration_minutes: input.totalDurationMinutes,
            stripe_payment_intent_id: stripePaymentIntentId,
        };

        const { data: booking, error: bookingError } = await supabase
            .from("bookings")
            .insert(bookingData)
            .select()
            .single();

        if (bookingError || !booking) {
            // TODO: Cancel Stripe PaymentIntent if booking creation fails
            // This should be implemented with proper error handling
            console.error(
                "Booking creation failed, PaymentIntent may need cleanup:",
                stripePaymentIntentId,
            );
            return { error: "Failed to create booking", data: null };
        }

        // Update PaymentIntent metadata with the real booking ID
        const metadataUpdateResult = await updateStripePaymentIntentMetadata({
            paymentIntentId: stripePaymentIntentId,
            metadata: {
                booking_id: booking.id,
                customer_id: user.id,
                stylist_id: input.stylistId,
            },
        });

        if (metadataUpdateResult.error) {
            console.error(
                "Failed to update PaymentIntent metadata:",
                metadataUpdateResult.error,
            );
            // Don't fail the entire booking creation for metadata update failure
        }

        // 5. Link services to the booking
        const bookingServices = input.serviceIds.map((serviceId) => ({
            booking_id: booking.id,
            service_id: serviceId,
        }));

        const { error: servicesError } = await supabase
            .from("booking_services")
            .insert(bookingServices);

        if (servicesError) {
            // Rollback: delete the booking
            await supabase.from("bookings").delete().eq("id", booking.id);
            // TODO: Cancel Stripe PaymentIntent
            console.error(
                "Service linking failed, PaymentIntent may need cleanup:",
                stripePaymentIntentId,
            );
            return { error: "Failed to link services to booking", data: null };
        }

        // 6. Create a chat for the booking
        const { error: chatError } = await supabase
            .from("chats")
            .insert({
                booking_id: booking.id,
            });

        if (chatError) {
            // Chat creation failure is not critical, log but don't fail the booking
            console.error("Failed to create chat for booking:", chatError);
        }

        // Create comprehensive payment record using enhanced payment breakdown
        // Use service client for payment record creation to bypass RLS
        const serviceClient = createServiceClient();
        const { error: paymentError } = await serviceClient
            .from("payments")
            .insert({
                booking_id: booking.id,
                payment_intent_id: stripePaymentIntentId,
                original_amount: Math.round(
                    paymentBreakdown.originalTotalAmountNOK * 100,
                ), // Original amount in øre
                discount_amount: Math.round(
                    (paymentBreakdown.discountAmountNOK || 0) * 100,
                ), // Discount amount in øre
                final_amount: Math.round(paymentBreakdown.totalAmountNOK * 100), // Final amount in øre
                platform_fee: Math.round(paymentBreakdown.platformFeeNOK * 100), // Platform fee in øre
                stylist_payout: Math.round(
                    paymentBreakdown.stylistPayoutNOK * 100,
                ), // Stylist payout in øre
                affiliate_commission: Math.round(
                    (paymentBreakdown.affiliateCommissionNOK || 0) * 100,
                ), // Affiliate commission in øre
                stripe_application_fee_amount: Math.round(
                    paymentIntentResult.data.applicationFeeNOK * 100,
                ), // Stripe application fee in øre
                currency: "NOK",
                status: "pending",
                refunded_amount: 0, // Default to 0, will be updated when refunds occur
                discount_code: input.discountCode,
                discount_percentage: validatedDiscount?.discountPercentage ||
                    null,
                discount_fixed_amount: validatedDiscount?.discountAmountNOK
                    ? Math.round(validatedDiscount.discountAmountNOK * 100)
                    : null,
                // TODO: Add affiliate fields when affiliate system is implemented
                // affiliate_id: affiliateId,
                // affiliate_commission_percentage: affiliateCommissionPercentage,
            });

        if (paymentError) {
            console.error("Failed to create payment record:", paymentError);
            // Don't fail the booking creation, but log the error
        }

        // Note: Booking request emails are now sent after successful payment
        // via the sendPostPaymentEmails function called from checkout success

        return {
            data: {
                booking,
                stripePaymentIntentId,
                paymentIntentClientSecret,
                finalPrice: paymentBreakdown.totalAmountNOK,
                discountAmount: paymentBreakdown.discountAmountNOK || 0,
                platformFeeNOK: paymentBreakdown.platformFeeNOK,
                stylistPayoutNOK: paymentBreakdown.stylistPayoutNOK,
                affiliateCommissionNOK:
                    paymentBreakdown.affiliateCommissionNOK || 0,
                // Additional breakdown for transparency
                originalTotalAmountNOK: paymentBreakdown.originalTotalAmountNOK,
                platformFeeReductionNOK:
                    paymentBreakdown.platformFeeReductionNOK || 0,
                stylistPayoutReductionNOK:
                    paymentBreakdown.stylistPayoutReductionNOK || 0,
            },
            error: null,
        };
    } catch (error) {
        console.error("Error creating booking:", error);
        return { error: "An unexpected error occurred", data: null };
    }
}

export async function cancelBooking(bookingId: string, reason?: string) {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
        return { error: "User not authenticated", data: null };
    }

    // Get booking details with payment information
    const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select(`
            *,
            payments(
                id,
                payment_intent_id,
                final_amount,
                platform_fee,
                stylist_payout,
                status,
                captured_at,
                refunded_amount
            )
        `)
        .eq("id", bookingId)
        .single();

    if (bookingError || !booking) {
        return { error: "Booking not found", data: null };
    }

    // Check if user is authorized to cancel (customer or stylist)
    if (booking.customer_id !== user.id && booking.stylist_id !== user.id) {
        return { error: "Not authorized to cancel this booking", data: null };
    }

    // Don't allow cancelling already cancelled or completed bookings
    if (booking.status === "cancelled" || booking.status === "completed") {
        return {
            error: `Cannot cancel a ${booking.status} booking`,
            data: null,
        };
    }

    // Determine who is cancelling
    const cancelledBy: "customer" | "stylist" = booking.customer_id === user.id
        ? "customer"
        : "stylist";

    // Calculate refund based on platform config and who cancelled
    const startTime = new Date(booking.start_time);
    const now = new Date();
    const hoursUntilAppointment = (startTime.getTime() - now.getTime()) /
        (1000 * 60 * 60);

    // Get platform config for refund rules
    const config = DEFAULT_PLATFORM_CONFIG.payment.refunds;

    let refundPercentage = 0;
    let stylistCompensationPercentage = 0;
    let refundAmountNOK = 0;
    let stylistCompensationNOK = 0;
    let refundReason = "";

    if (cancelledBy === "stylist") {
        // Stylist cancellation = always 100% refund to customer
        refundPercentage = 1.0;
        refundAmountNOK = booking.total_price;
        refundReason = "Stylist cancelled the booking";
    } else {
        // Customer cancellation - check timing
        if (hoursUntilAppointment >= config.fullRefundHours) {
            // More than 48 hours before = 100% refund
            refundPercentage = 1.0;
            refundAmountNOK = booking.total_price;
            refundReason =
                `Customer cancelled more than ${config.fullRefundHours} hours before appointment`;
        } else if (hoursUntilAppointment >= config.partialRefundHours) {
            // Between 24-48 hours = 50% refund to customer, 50% compensation to stylist
            refundPercentage = config.partialRefundPercentage;
            stylistCompensationPercentage = config.partialRefundPercentage;
            refundAmountNOK = booking.total_price * refundPercentage;
            stylistCompensationNOK = booking.total_price *
                stylistCompensationPercentage;
            refundReason =
                `Customer cancelled between ${config.partialRefundHours}-${config.fullRefundHours} hours before appointment`;
        } else {
            // Less than 24 hours = no refund
            refundPercentage = 0;
            refundAmountNOK = 0;
            refundReason =
                `Customer cancelled less than ${config.partialRefundHours} hours before appointment`;
        }
    }

    // Process refund if applicable
    let refundResult = null;
    if (refundAmountNOK > 0 && booking.stripe_payment_intent_id) {
        const { processRefund } = await import("./stripe.actions");
        refundResult = await processRefund({
            bookingId,
            paymentIntentId: booking.stripe_payment_intent_id,
            refundAmountNOK,
            refundReason,
            stylistCompensationNOK,
        });

        if (refundResult.error) {
            console.error("Refund processing error:", refundResult.error);
            // Don't fail the cancellation if refund fails - log and continue
            // The booking should still be cancelled even if refund processing fails
        }
    }

    // Update booking status
    const { data, error } = await supabase
        .from("bookings")
        .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            cancellation_reason: reason || refundReason,
        })
        .eq("id", bookingId)
        .select()
        .single();

    if (error) {
        return { error: "Failed to cancel booking", data: null };
    }

    // Send cancellation emails to both parties (respecting preferences)
    try {
        // Get full booking details with user information for email
        const { data: fullBooking } = await supabase
            .from("bookings")
            .select(`
                *,
                customer:profiles!bookings_customer_id_fkey(
                    id,
                    full_name,
                    email
                ),
                stylist:profiles!bookings_stylist_id_fkey(
                    id,
                    full_name,
                    email
                ),
                addresses(
                    street_address,
                    city,
                    postal_code,
                    entry_instructions
                ),
                booking_services(
                    services(
                        id,
                        title,
                        description
                    )
                )
            `)
            .eq("id", bookingId)
            .single();

        if (fullBooking?.customer?.email && fullBooking?.stylist?.email) {
            // Check user preferences for cancellation notifications
            const [canSendToCustomer, canSendToStylist] = await Promise.all([
                shouldReceiveNotificationServerSide(
                    fullBooking.customer_id,
                    "booking_cancellations",
                ),
                shouldReceiveNotificationServerSide(
                    fullBooking.stylist_id,
                    "booking_cancellations",
                ),
            ]);

            if (canSendToCustomer || canSendToStylist) {
                // Prepare common email data
                const services = fullBooking.booking_services?.map((bs) =>
                    bs.services
                ).filter(Boolean) || [];
                const serviceName = services.length > 0
                    ? services[0]?.title || "Booking"
                    : "Booking";
                const serviceNameWithCount = services.length > 1
                    ? `${serviceName} +${services.length - 1} til`
                    : serviceName;

                const startTime = new Date(fullBooking.start_time);
                const endTime = new Date(fullBooking.end_time);
                const bookingDate = format(startTime, "EEEE d. MMMM yyyy", {
                    locale: nb,
                });
                const bookingTime = `${format(startTime, "HH:mm")} - ${
                    format(endTime, "HH:mm")
                }`;

                // Determine location text
                let location = "Hos stylisten";
                if (fullBooking.address_id && fullBooking.addresses) {
                    location = "Hjemme hos deg";
                }

                const emailProps = {
                    customerName: fullBooking.customer.full_name || "Kunde",
                    stylistName: fullBooking.stylist.full_name || "Stylist",
                    bookingId: bookingId,
                    stylistId: fullBooking.stylist_id,
                    serviceName: serviceNameWithCount,
                    bookingDate,
                    bookingTime,
                    status: "cancelled" as const,
                    message: reason || "Booking cancelled",
                    location,
                    cancelledBy,
                    refundInfo:
                        refundAmountNOK > 0 || stylistCompensationNOK > 0
                            ? {
                                refundAmount: refundAmountNOK,
                                stylistCompensation: stylistCompensationNOK,
                                refundPercentage: refundPercentage,
                            }
                            : undefined,
                };

                const customerEmailSubject = `Booking avlyst: ${serviceName}`;
                const stylistEmailSubject = `Booking avlyst: ${serviceName}`;

                // Send email to customer (only if they want notifications)
                if (canSendToCustomer) {
                    const { error: customerEmailError } = await sendEmail({
                        to: [fullBooking.customer.email],
                        subject: customerEmailSubject,
                        react: BookingStatusUpdateEmail({
                            logoUrl: getNabostylistenLogoUrl("png"),
                            ...emailProps,
                            recipientType: "customer",
                        }),
                    });

                    if (customerEmailError) {
                        console.error(
                            "Error sending customer cancellation email:",
                            customerEmailError,
                        );
                    }
                }

                // Send email to stylist (only if they want notifications)
                if (canSendToStylist) {
                    const { error: stylistEmailError } = await sendEmail({
                        to: [fullBooking.stylist.email],
                        subject: stylistEmailSubject,
                        react: BookingStatusUpdateEmail({
                            logoUrl: getNabostylistenLogoUrl("png"),
                            ...emailProps,
                            recipientType: "stylist",
                        }),
                    });

                    if (stylistEmailError) {
                        console.error(
                            "Error sending stylist cancellation email:",
                            stylistEmailError,
                        );
                    }
                }
            }
        }
    } catch (emailError) {
        console.error("Error sending cancellation emails:", emailError);
        // Don't fail the entire operation if email fails
    }

    return {
        data: {
            booking: data,
            cancelledBy,
            refundAmount: refundAmountNOK,
            refundPercentage,
            stylistCompensation: stylistCompensationNOK,
            hoursUntilAppointment,
            refundProcessed: refundResult?.data ? true : false,
            refundError: refundResult?.error,
        },
        error: null,
    };
}

export async function updateBookingStatus({
    bookingId,
    status,
    message,
}: {
    bookingId: string;
    status: "confirmed" | "cancelled";
    message?: string;
}) {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
        return { error: "User not authenticated", data: null };
    }

    // Get booking details to verify stylist access and gather data for email
    const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select(`
            *,
            customer:profiles!bookings_customer_id_fkey(
                id,
                full_name,
                email
            ),
            stylist:profiles!bookings_stylist_id_fkey(
                id,
                full_name,
                email
            ),
            addresses(
                street_address,
                city,
                postal_code,
                entry_instructions
            ),
            booking_services(
                services(
                    id,
                    title,
                    description
                )
            )
        `)
        .eq("id", bookingId)
        .single();

    if (bookingError || !booking) {
        return { error: "Booking not found", data: null };
    }

    // Check if user is the assigned stylist
    if (booking.stylist_id !== user.id) {
        return { error: "Not authorized to update this booking", data: null };
    }

    // Only allow status updates for pending bookings
    if (booking.status !== "pending") {
        return {
            error: "Can only update status of pending bookings",
            data: null,
        };
    }

    // Prepare update data
    const updateData: DatabaseTables["bookings"]["Update"] = {
        status,
        ...(status === "cancelled" && {
            cancelled_at: new Date().toISOString(),
            cancellation_reason: message || "Cancelled by stylist",
        }),
    };

    // Update booking status
    const { data, error } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", bookingId)
        .select(`
            *,
            customer:profiles!bookings_customer_id_fkey(
                id,
                full_name,
                email,
                phone_number
            ),
            stylist:profiles!bookings_stylist_id_fkey(
                id,
                full_name,
                email,
                phone_number
            )
        `)
        .single();

    if (error) {
        return { error: "Failed to update booking status", data: null };
    }

    // Send email notifications to both customer and stylist about status change
    try {
        if (
            booking.customer?.email && booking.stylist?.full_name &&
            booking.stylist?.email
        ) {
            // Check user preferences for booking notifications
            const [canSendToCustomer, canSendToStylist] = await Promise.all([
                shouldReceiveNotification(
                    booking.customer_id,
                    status === "confirmed"
                        ? "booking_confirmations"
                        : "booking_status_updates",
                ),
                shouldReceiveNotification(
                    booking.stylist_id,
                    status === "confirmed"
                        ? "booking_confirmations"
                        : "booking_status_updates",
                ),
            ]);

            if (!canSendToCustomer && !canSendToStylist) {
                // If neither party wants notifications, skip email sending
                return { data, error: null };
            }
            // Prepare common email data
            const services = booking.booking_services?.map((bs) =>
                bs.services
            ).filter(Boolean) || [];
            const serviceName = services.length > 0
                ? services[0]?.title || "Booking"
                : "Booking";
            const serviceNameWithCount = services.length > 1
                ? `${serviceName} +${services.length - 1} til`
                : serviceName;

            const startTime = new Date(booking.start_time);
            const endTime = new Date(booking.end_time);
            const bookingDate = format(startTime, "EEEE d. MMMM yyyy", {
                locale: nb,
            });
            const bookingTime = `${format(startTime, "HH:mm")} - ${
                format(endTime, "HH:mm")
            }`;

            // Determine location text
            let location = "Hos stylisten";
            if (booking.address_id && booking.addresses) {
                location = "Hjemme hos deg";
            }

            const customerEmailSubject = status === "confirmed"
                ? `Booking bekreftet: ${serviceName}`
                : `Booking avlyst: ${serviceName}`;

            const stylistEmailSubject = status === "confirmed"
                ? `Du bekreftet booking: ${serviceName}`
                : `Du avlyste booking: ${serviceName}`;

            // Common email props
            const emailProps = {
                customerName: booking.customer.full_name || "Kunde",
                stylistName: booking.stylist.full_name,
                bookingId: bookingId,
                stylistId: booking.stylist_id,
                serviceName: serviceNameWithCount,
                bookingDate,
                bookingTime,
                status,
                message,
                location,
            };

            // Send email to customer (only if they want notifications)
            if (canSendToCustomer) {
                const { error: customerEmailError } = await sendEmail({
                    to: [booking.customer.email],
                    subject: customerEmailSubject,
                    react: BookingStatusUpdateEmail({
                        logoUrl: getNabostylistenLogoUrl("png"),
                        ...emailProps,
                        recipientType: "customer",
                    }),
                });

                if (customerEmailError) {
                    console.error(
                        "Error sending customer status update email:",
                        customerEmailError,
                    );
                }
            }

            // Send email to stylist (only if they want notifications)
            if (canSendToStylist) {
                const { error: stylistEmailError } = await sendEmail({
                    to: [booking.stylist.email],
                    subject: stylistEmailSubject,
                    react: BookingStatusUpdateEmail({
                        logoUrl: getNabostylistenLogoUrl("png"),
                        ...emailProps,
                        recipientType: "stylist",
                    }),
                });

                if (stylistEmailError) {
                    console.error(
                        "Error sending stylist status update email:",
                        stylistEmailError,
                    );
                }
            }
        }
    } catch (emailError) {
        console.error("Error sending booking status emails:", emailError);
        // Don't fail the entire operation if email fails - log the error
        // The booking status update was successful, email is a nice-to-have
    }

    // TODO: If confirmed, create payment record or update Stripe PaymentIntent
    // if (status === 'confirmed' && booking.stripe_payment_intent_id) {
    //     await stripe.paymentIntents.update(booking.stripe_payment_intent_id, {
    //         metadata: { status: 'confirmed' }
    //     });
    // }

    return { data, error: null };
}

/**
 * Handle Stripe onboarding notification emails
 * Called when a booking fails due to incomplete stylist Stripe setup
 */
export async function notifyStripeOnboardingRequired({
    stylistId,
    customerName,
}: {
    stylistId: string;
    customerName: string;
}) {
    const supabase = await createClient();

    try {
        // Get stylist information
        const { data: stylist, error: stylistError } = await supabase
            .from("profiles")
            .select(`
                id,
                full_name,
                email,
                stylist_details(
                    stripe_account_id
                )
            `)
            .eq("id", stylistId)
            .single();

        if (stylistError || !stylist) {
            console.error(
                "Error fetching stylist for onboarding notification:",
                stylistError,
            );
            return { error: "Stylist not found", data: null };
        }

        // Get all admin users
        const { data: admins, error: adminError } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("role", "admin");

        if (adminError) {
            console.error("Error fetching admin users:", adminError);
        }

        const logoUrl = getNabostylistenLogoUrl("png");

        const emailPromises: Promise<unknown>[] = [];

        // Send email to stylist
        if (stylist.email) {
            emailPromises.push(
                sendEmail({
                    to: [stylist.email],
                    subject:
                        "Fullfør betalingsoppsett for å motta bookinger - Nabostylisten",
                    react: StripeOnboardingRequired({
                        logoUrl,
                        recipientType: "stylist",
                        stylistName: stylist.full_name || "Stylist",
                        stylistEmail: stylist.email,
                        customerName,
                    }),
                }),
            );
        }

        // Send email to all admin users
        if (admins && admins.length > 0) {
            for (const admin of admins) {
                if (admin.email) {
                    emailPromises.push(
                        sendEmail({
                            to: [admin.email],
                            subject: `Stylist mangler Stripe-onboarding: ${
                                stylist.full_name || "Ukjent stylist"
                            }`,
                            react: StripeOnboardingRequired({
                                logoUrl,
                                recipientType: "admin",
                                stylistName: stylist.full_name ||
                                    "Ukjent stylist",
                                stylistEmail: stylist.email ||
                                    "Ikke oppgitt",
                                customerName,
                            }),
                        }),
                    );
                }
            }
        }

        // Send all emails in parallel
        const emailResults = await Promise.allSettled(emailPromises);

        // Log any email failures
        emailResults.forEach((result, index) => {
            if (result.status === "rejected") {
                console.error(
                    `Failed to send onboarding notification email ${
                        index + 1
                    }:`,
                    result.reason,
                );
            }
        });

        const successfulEmails = emailResults.filter((r) =>
            r.status === "fulfilled"
        ).length;
        const totalEmails = emailResults.length;

        return {
            data: {
                emailsSent: successfulEmails,
                totalAttempted: totalEmails,
                stylistNotified: stylist.email ? successfulEmails > 0 : false,
                adminsNotified: admins
                    ? successfulEmails > (stylist.email ? 1 : 0)
                    : false,
            },
            error: null,
        };
    } catch (error) {
        console.error("Error in notifyStripeOnboardingRequired:", error);
        return {
            error: "Failed to send notification emails",
            data: null,
        };
    }
}

/**
 * Send post-payment confirmation emails
 * Called when payment is successful to send receipt to customer and booking request to stylist
 */
export async function sendPostPaymentEmails(bookingId: string) {
    const supabase = await createClient();

    try {
        // Get comprehensive booking details
        const { data: booking, error: bookingError } = await supabase
            .from("bookings")
            .select(`
                *,
                customer:profiles!bookings_customer_id_fkey(
                    id,
                    full_name,
                    email
                ),
                stylist:profiles!bookings_stylist_id_fkey(
                    id,
                    full_name,
                    email
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
                        includes,
                        requirements,
                        at_customer_place,
                        at_stylist_place,
                        is_published
                    )
                )
            `)
            .eq("id", bookingId)
            .single();

        if (bookingError || !booking) {
            console.error(
                "Error fetching booking for post-payment emails:",
                bookingError,
            );
            return { error: "Booking not found", data: null };
        }

        if (!booking.customer?.email || !booking.stylist?.email) {
            console.error("Missing customer or stylist email addresses");
            return { error: "Missing email addresses", data: null };
        }

        // Check if emails have already been sent to prevent duplicates
        if (
            booking.customer_receipt_email_sent_at &&
            booking.stylist_notification_email_sent_at
        ) {
            console.log(
                "Post-payment emails already sent for booking:",
                bookingId,
            );
            return {
                data: {
                    emailsSent: 2,
                    totalAttempted: 2,
                    customerNotified: true,
                    stylistNotified: true,
                    message: "Emails already sent",
                },
                error: null,
            };
        }

        // Prepare common email data
        const services = booking.booking_services?.map((bs) =>
            bs.service
        ).filter(Boolean) || [];

        const serviceName = services.length > 0
            ? services[0]?.title || "Booking"
            : "Booking";
        const serviceNameWithCount = services.length > 1
            ? `${serviceName} +${services.length - 1} til`
            : serviceName;

        const startTime = new Date(booking.start_time);
        const endTime = new Date(booking.end_time);
        const bookingDate = format(startTime, "EEEE d. MMMM yyyy", {
            locale: nb,
        });
        const bookingTime = `${format(startTime, "HH:mm")} - ${
            format(endTime, "HH:mm")
        }`;

        // Determine location and address
        const location = booking.address_id ? "customer" : "stylist";
        let customerAddress = undefined;
        if (booking.address_id && booking.address) {
            customerAddress =
                `${booking.address.street_address}, ${booking.address.postal_code} ${booking.address.city}`;
        }

        const logoUrl = getNabostylistenLogoUrl("png");

        // Check notification preferences
        const [canSendToCustomer, canSendToStylist] = await Promise.all([
            shouldReceiveNotification(
                booking.customer_id,
                "booking_confirmations",
            ),
            shouldReceiveNotification(
                booking.stylist_id,
                "new_booking_requests",
            ),
        ]);

        const emailPromises: Promise<unknown>[] = [];

        // Send booking receipt email to customer
        if (canSendToCustomer) {
            emailPromises.push(
                sendEmail({
                    to: [booking.customer.email],
                    subject: `Betalingsbekreftelse: ${serviceName}`,
                    react: BookingReceiptEmail({
                        logoUrl,
                        customerName: booking.customer.full_name || "Kunde",
                        customerProfileId: booking.customer_id,
                        stylistName: booking.stylist.full_name || "Stylist",
                        bookingId: booking.id,
                        serviceName: serviceNameWithCount,
                        bookingDate,
                        bookingTime,
                        location: location as "stylist" | "customer",
                        customerAddress,
                        messageFromCustomer: booking.message_to_stylist ||
                            undefined,
                        totalPrice: booking.total_price,
                        currency: "NOK",
                        estimatedDuration: booking.total_duration_minutes,
                    }),
                }),
            );
        }

        // Send booking request email to stylist
        if (canSendToStylist) {
            emailPromises.push(
                sendEmail({
                    to: [booking.stylist.email],
                    subject: `Ny bookingforespørsel fra ${
                        booking.customer.full_name || "kunde"
                    }`,
                    react: NewBookingRequestEmail({
                        logoUrl,
                        stylistProfileId: booking.stylist_id,
                        stylistName: booking.stylist.full_name || "Stylist",
                        customerName: booking.customer.full_name || "Kunde",
                        bookingId: booking.id,
                        serviceName: serviceNameWithCount,
                        requestedDate: bookingDate,
                        requestedTime: bookingTime,
                        location: location,
                        customerAddress: customerAddress,
                        messageFromCustomer: booking.message_to_stylist ||
                            undefined,
                        totalPrice: booking.total_price,
                        currency: "NOK",
                        estimatedDuration: booking.total_duration_minutes,
                        urgency: "medium" as const,
                    }),
                }),
            );
        }

        // Send all emails in parallel
        const emailResults = await Promise.allSettled(emailPromises);

        // Log any email failures
        emailResults.forEach((result, index) => {
            if (result.status === "rejected") {
                console.error(
                    `Failed to send post-payment email ${index + 1}:`,
                    result.reason,
                );
            }
        });

        const successfulEmails = emailResults.filter((r) =>
            r.status === "fulfilled"
        ).length;
        const totalEmails = emailResults.length;

        // Determine which emails were successfully sent
        let customerEmailSent = false;
        let stylistEmailSent = false;

        if (
            canSendToCustomer && canSendToStylist && emailResults.length === 2
        ) {
            // Both emails attempted
            customerEmailSent = emailResults[0].status === "fulfilled";
            stylistEmailSent = emailResults[1].status === "fulfilled";
        } else if (
            canSendToCustomer && !canSendToStylist && emailResults.length === 1
        ) {
            // Only customer email attempted
            customerEmailSent = emailResults[0].status === "fulfilled";
        } else if (
            !canSendToCustomer && canSendToStylist && emailResults.length === 1
        ) {
            // Only stylist email attempted
            stylistEmailSent = emailResults[0].status === "fulfilled";
        }

        // Update database with timestamps for successfully sent emails
        const updateData: Partial<{
            customer_receipt_email_sent_at: string;
            stylist_notification_email_sent_at: string;
        }> = {};
        const now = new Date().toISOString();

        if (customerEmailSent && !booking.customer_receipt_email_sent_at) {
            updateData.customer_receipt_email_sent_at = now;
        }
        if (stylistEmailSent && !booking.stylist_notification_email_sent_at) {
            updateData.stylist_notification_email_sent_at = now;
        }

        // Update booking record if any emails were sent
        if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
                .from("bookings")
                .update(updateData)
                .eq("id", bookingId);

            if (updateError) {
                console.error(
                    "Failed to update email tracking fields:",
                    updateError,
                );
                // Don't fail the entire operation, just log the error
            }
        }

        return {
            data: {
                emailsSent: successfulEmails,
                totalAttempted: totalEmails,
                customerNotified: canSendToCustomer ? customerEmailSent : false,
                stylistNotified: canSendToStylist ? stylistEmailSent : false,
            },
            error: null,
        };
    } catch (error) {
        console.error("Error in sendPostPaymentEmails:", error);
        return {
            error: "Failed to send post-payment emails",
            data: null,
        };
    }
}

/**
 * Get booking counts for different filter categories
 * Used to display counts in booking tabs
 */
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

/**
 * Reschedule a booking to a new time slot
 * Only stylists can reschedule their own bookings
 */
export async function rescheduleBooking({
    bookingId,
    newStartTime,
    newEndTime,
    rescheduleReason,
}: {
    bookingId: string;
    newStartTime: string;
    newEndTime: string;
    rescheduleReason: string;
}) {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
        return { error: "User not authenticated", data: null };
    }

    // Get booking details to verify access and get current times
    const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

    if (bookingError || !booking) {
        return { error: "Booking not found", data: null };
    }

    // Check if user is the assigned stylist
    if (booking.stylist_id !== user.id) {
        return {
            error: "Not authorized to reschedule this booking",
            data: null,
        };
    }

    // Only allow rescheduling for pending or confirmed bookings
    if (booking.status !== "pending" && booking.status !== "confirmed") {
        return {
            error: "Can only reschedule pending or confirmed bookings",
            data: null,
        };
    }

    // Validate new times
    const newStart = new Date(newStartTime);
    const newEnd = new Date(newEndTime);
    const now = new Date();

    if (newStart >= newEnd) {
        return { error: "End time must be after start time", data: null };
    }

    if (newStart <= now) {
        return { error: "New booking time must be in the future", data: null };
    }

    // Store original start time for tracking
    const originalStartTime = booking.start_time;

    // Prepare update data
    const updateData: DatabaseTables["bookings"]["Update"] = {
        start_time: newStartTime,
        end_time: newEndTime,
        rescheduled_from: originalStartTime,
        rescheduled_at: new Date().toISOString(),
        reschedule_reason: rescheduleReason.trim(),
    };

    // Validate update data
    const { success, data: validatedData } = bookingsUpdateSchema.safeParse(
        updateData,
    );
    if (!success) {
        return { error: "Invalid booking data", data: null };
    }

    // Update the booking
    const { data: updatedBooking, error: updateError } = await supabase
        .from("bookings")
        .update(validatedData)
        .eq("id", bookingId)
        .select()
        .single();

    if (updateError || !updatedBooking) {
        return { error: "Failed to reschedule booking", data: null };
    }

    // Send reschedule notification emails to both customer and stylist
    console.log("🔄 Starting reschedule email process for booking:", bookingId);
    try {
        // Get full booking details with user information for email
        const { data: fullBooking } = await supabase
            .from("bookings")
            .select(`
                *,
                customer:profiles!bookings_customer_id_fkey(
                    id,
                    full_name,
                    email
                ),
                stylist:profiles!bookings_stylist_id_fkey(
                    id,
                    full_name,
                    email
                ),
                addresses(
                    street_address,
                    city,
                    postal_code,
                    entry_instructions
                ),
                booking_services(
                    services(
                        id,
                        title,
                        description
                    )
                )
            `)
            .eq("id", bookingId)
            .single();

        if (fullBooking?.customer?.email && fullBooking?.stylist?.email) {
            // Check user preferences for reschedule notifications
            const [canSendToCustomer, canSendToStylist] = await Promise.all([
                shouldReceiveNotificationServerSide(
                    fullBooking.customer_id,
                    "booking_status_updates",
                ),
                shouldReceiveNotificationServerSide(
                    fullBooking.stylist_id,
                    "booking_status_updates",
                ),
            ]);

            if (canSendToCustomer || canSendToStylist) {
                // Prepare common email data
                const services = fullBooking.booking_services?.map((bs) =>
                    bs.services
                ).filter(Boolean) || [];
                const serviceName = services.length > 0
                    ? services[0]?.title || "Booking"
                    : "Booking";
                const serviceNameWithCount = services.length > 1
                    ? `${serviceName} +${services.length - 1} til`
                    : serviceName;

                const originalStart = new Date(originalStartTime);
                const originalEnd = new Date(booking.end_time);
                const newStart = new Date(fullBooking.start_time);
                const newEnd = new Date(fullBooking.end_time);

                const originalBookingDate = format(
                    originalStart,
                    "EEEE d. MMMM yyyy",
                    {
                        locale: nb,
                    },
                );
                const originalBookingTime = `${
                    format(originalStart, "HH:mm")
                } - ${format(originalEnd, "HH:mm")}`;

                const newBookingDate = format(newStart, "EEEE d. MMMM yyyy", {
                    locale: nb,
                });
                const newBookingTime = `${format(newStart, "HH:mm")} - ${
                    format(newEnd, "HH:mm")
                }`;

                // Determine location text
                let location = "Hos stylisten";
                if (fullBooking.address_id && fullBooking.addresses) {
                    location = "Hjemme hos deg";
                }

                const emailProps = {
                    customerName: fullBooking.customer.full_name || "Kunde",
                    stylistName: fullBooking.stylist.full_name || "Stylist",
                    bookingId: bookingId,
                    stylistId: fullBooking.stylist_id,
                    serviceName: serviceNameWithCount,
                    originalBookingDate,
                    originalBookingTime,
                    newBookingDate,
                    newBookingTime,
                    rescheduleReason: rescheduleReason,
                    location,
                };

                const customerEmailSubject = `Booking flyttet: ${serviceName}`;
                const stylistEmailSubject =
                    `Du flyttet booking: ${serviceName}`;

                // Send email to customer (only if they want notifications)
                if (canSendToCustomer) {
                    const { error: customerEmailError } = await sendEmail({
                        to: [fullBooking.customer.email],
                        subject: customerEmailSubject,
                        react: BookingRescheduledEmail({
                            logoUrl: getNabostylistenLogoUrl("png"),
                            ...emailProps,
                            recipientType: "customer",
                        }),
                    });

                    if (customerEmailError) {
                        console.error(
                            "❌ Error sending customer reschedule email:",
                            customerEmailError,
                        );
                    } else {
                        console.log(
                            "✅ Customer reschedule email sent successfully!",
                        );
                    }
                } else {
                    console.log(
                        "❌ Skipping customer email - notifications disabled",
                    );
                }

                // Send email to stylist (only if they want notifications)
                if (canSendToStylist) {
                    console.log(
                        "📤 Sending stylist reschedule email to:",
                        fullBooking.stylist.email,
                    );
                    const { error: stylistEmailError } = await sendEmail({
                        to: [fullBooking.stylist.email],
                        subject: stylistEmailSubject,
                        react: BookingRescheduledEmail({
                            logoUrl: getNabostylistenLogoUrl("png"),
                            ...emailProps,
                            recipientType: "stylist",
                        }),
                    });

                    if (stylistEmailError) {
                        console.error(
                            "❌ Error sending stylist reschedule email:",
                            stylistEmailError,
                        );
                    } else {
                        console.log(
                            "✅ Stylist reschedule email sent successfully!",
                        );
                    }
                } else {
                    console.log(
                        "❌ Skipping stylist email - notifications disabled",
                    );
                }
            } else {
                console.log(
                    "❌ Skipping all emails - both notifications disabled",
                );
            }
        } else {
            console.log(
                "❌ Missing email addresses - Customer:",
                !!fullBooking?.customer?.email,
                "Stylist:",
                !!fullBooking?.stylist?.email,
            );
        }
    } catch (emailError) {
        console.error("💥 FATAL: Error sending reschedule emails:", emailError);
        // Don't fail the entire operation if email fails
    }

    console.log(
        "🏁 Reschedule email process completed for booking:",
        bookingId,
    );

    return { data: updatedBooking, error: null };
}
