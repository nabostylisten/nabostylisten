"use server";

import { createClient } from "@/lib/supabase/server";
import {
    addressesInsertSchema,
    bookingsInsertSchema,
    bookingsUpdateSchema,
    discountsInsertSchema,
} from "@/schemas/database.schema";
import type { BookingFilters, DatabaseTables } from "@/types";
import { 
    createStripePaymentIntent, 
    updateStripePaymentIntentMetadata 
} from "@/lib/stripe/connect";
import { calculatePlatformFee } from "@/schemas/platform-config.schema";
import { sendEmail } from "@/lib/resend-utils";
import { BookingStatusUpdateEmail } from "@/transactional/emails/booking-status-update";
import { NewBookingRequestEmail } from "@/transactional/emails/new-booking-request";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { getNabostylistenLogoUrl } from "@/lib/supabase/utils";
import { shouldReceiveNotification } from "@/server/preferences.actions";

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
    if (
        !user || (data.customer_id !== user.id && data.stylist_id !== user.id)
    ) {
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
        let discountId: string | null = null;
        let discountAmount = 0;

        if (input.discountCode) {
            const { data: discount, error: discountError } = await supabase
                .from("discounts")
                .select("*")
                .eq("code", input.discountCode)
                .eq("is_active", true)
                .single();

            if (discountError || !discount) {
                return { error: "Invalid discount code", data: null };
            }

            // Check if discount is still valid
            const now = new Date();
            const validFrom = new Date(discount.valid_from);
            const expiresAt = discount.expires_at
                ? new Date(discount.expires_at)
                : null;

            if (now < validFrom || (expiresAt && now > expiresAt)) {
                return { error: "Discount code expired", data: null };
            }

            // Check usage limits
            if (
                discount.max_uses && discount.current_uses >= discount.max_uses
            ) {
                return {
                    error: "Discount code usage limit reached",
                    data: null,
                };
            }

            // Check minimum order amount
            if (
                discount.minimum_order_amount &&
                (input.totalPrice * 100) < discount.minimum_order_amount
            ) {
                return {
                    error: "Order amount below minimum for discount",
                    data: null,
                };
            }

            // Calculate discount amount
            if (discount.discount_percentage) {
                discountAmount =
                    (input.totalPrice * discount.discount_percentage) / 100;
            } else if (discount.discount_amount) {
                discountAmount = discount.discount_amount / 100; // Convert from øre to NOK
            }

            discountId = discount.id;

            // Update discount usage count
            await supabase
                .from("discounts")
                .update({ current_uses: discount.current_uses + 1 })
                .eq("id", discount.id);
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
                // Create a new address
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
                        // TODO: Add location coordinates when Mapbox integration is complete
                        // location: ...
                    })
                    .select()
                    .single();

                if (addressError || !address) {
                    return { error: "Failed to create address", data: null };
                }

                addressId = address.id;
            }
        }

        // 3. Calculate final price after discount
        const finalPrice = Math.max(0, input.totalPrice - discountAmount);

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
            discountAmountNOK: discountAmount,
            discountCode: input.discountCode,
        });

        if (paymentIntentResult.error || !paymentIntentResult.data) {
            return {
                error: paymentIntentResult.error || "Failed to create payment intent",
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
            discount_id: discountId,
            discount_applied: discountAmount,
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
            console.error("Booking creation failed, PaymentIntent may need cleanup:", stripePaymentIntentId);
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
            console.error("Failed to update PaymentIntent metadata:", metadataUpdateResult.error);
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
            console.error("Service linking failed, PaymentIntent may need cleanup:", stripePaymentIntentId);
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

        // Create comprehensive payment record using new schema
        const platformFeeCalculation = calculatePlatformFee({
            totalAmountNOK: finalPrice,
            hasAffiliate: false, // TODO: Implement affiliate logic
        });

        const { error: paymentError } = await supabase
            .from("payments")
            .insert({
                booking_id: booking.id,
                payment_intent_id: stripePaymentIntentId,
                original_amount: Math.round(input.totalPrice * 100), // Original amount in øre
                discount_amount: Math.round(discountAmount * 100), // Discount amount in øre
                final_amount: Math.round(finalPrice * 100), // Final amount in øre
                platform_fee: Math.round(platformFeeCalculation.platformFeeNOK * 100), // Platform fee in øre
                stylist_payout: Math.round(platformFeeCalculation.stylistPayoutNOK * 100), // Stylist payout in øre
                affiliate_commission: Math.round((platformFeeCalculation.affiliateCommissionNOK || 0) * 100), // Affiliate commission in øre
                stripe_application_fee_amount: Math.round(paymentIntentResult.data.applicationFeeNOK * 100), // Stripe application fee in øre
                currency: "NOK",
                status: "pending",
                refunded_amount: 0, // Default to 0, will be updated when refunds occur
                discount_code: input.discountCode,
                discount_percentage: discountId ? null : undefined, // TODO: Get from discount record
                discount_fixed_amount: discountId ? Math.round(discountAmount * 100) : undefined,
                // TODO: Add affiliate fields when affiliate system is implemented
                // affiliate_id: affiliateId,
                // affiliate_commission_percentage: affiliateCommissionPercentage,
            });

        if (paymentError) {
            console.error("Failed to create payment record:", paymentError);
            // Don't fail the booking creation, but log the error
        }

        // Send new booking request email to stylist (respecting preferences)
        try {
            // Get stylist and customer information for email
            const { data: stylist } = await supabase
                .from("profiles")
                .select("id, full_name, email")
                .eq("id", input.stylistId)
                .single();

            const { data: customer } = await supabase
                .from("profiles") 
                .select("id, full_name, email")
                .eq("id", user.id)
                .single();

            if (stylist?.email && customer) {
                // Check if stylist wants new booking request notifications
                const canSendToStylist = await shouldReceiveNotification(
                    input.stylistId, 
                    'new_booking_requests'
                );

                if (canSendToStylist) {
                    // Get service details for email
                    const { data: services } = await supabase
                        .from("services")
                        .select("id, title, description, price, duration_minutes")
                        .in("id", input.serviceIds);

                    const serviceName = services && services.length > 0 
                        ? services[0]?.title || "Booking"
                        : "Booking";
                    const serviceNameWithCount = services && services.length > 1
                        ? `${serviceName} +${services.length - 1} til`
                        : serviceName;

                    const startTime = input.startTime;
                    const endTime = input.endTime;
                    const bookingDate = format(startTime, "EEEE d. MMMM yyyy", { locale: nb });
                    const bookingTime = `${format(startTime, "HH:mm")} - ${format(endTime, "HH:mm")}`;

                    // Determine location and address
                    let customerAddress = undefined;
                    if (input.location === "customer") {
                        if (input.customerAddress) {
                            customerAddress = `${input.customerAddress.streetAddress}, ${input.customerAddress.postalCode} ${input.customerAddress.city}`;
                        } else if (addressId) {
                            // Get address details if using existing address
                            const { data: address } = await supabase
                                .from("addresses")
                                .select("street_address, city, postal_code")
                                .eq("id", addressId)
                                .single();
                            
                            if (address) {
                                customerAddress = `${address.street_address}, ${address.postal_code} ${address.city}`;
                            }
                        }
                    }

                    const { error: newBookingEmailError } = await sendEmail({
                        to: [stylist.email],
                        subject: `Ny bookingforespørsel fra ${customer.full_name || 'kunde'}`,
                        react: NewBookingRequestEmail({
                            logoUrl: getNabostylistenLogoUrl("png"),
                            stylistProfileId: input.stylistId,
                            stylistName: stylist.full_name || "Stylist",
                            customerName: customer.full_name || "Kunde",
                            bookingId: booking.id,
                            serviceName: serviceNameWithCount,
                            requestedDate: bookingDate,
                            requestedTime: bookingTime,
                            location: input.location,
                            customerAddress: customerAddress,
                            messageFromCustomer: input.messageToStylist,
                            totalPrice: finalPrice,
                            currency: "NOK",
                            estimatedDuration: input.totalDurationMinutes,
                            urgency: "medium" as const,
                        }),
                    });

                    if (newBookingEmailError) {
                        console.error("Error sending new booking request email:", newBookingEmailError);
                    }
                }
            }
        } catch (emailError) {
            console.error("Error sending new booking request email:", emailError);
            // Don't fail the booking creation if email fails
        }

        return {
            data: {
                booking,
                stripePaymentIntentId,
                paymentIntentClientSecret,
                finalPrice,
                discountAmount,
                platformFeeNOK: platformFeeCalculation.platformFeeNOK,
                stylistPayoutNOK: platformFeeCalculation.stylistPayoutNOK,
                affiliateCommissionNOK: platformFeeCalculation.affiliateCommissionNOK,
            },
            error: null,
        };
    } catch (error) {
        console.error("Error creating booking:", error);
        return { error: "An unexpected error occurred", data: null };
    }
}

export async function confirmBookingPayment(
    bookingId: string,
    _paymentIntentId: string,
) {
    // TODO: Implement Stripe payment confirmation
    // 1. Confirm payment with Stripe
    // 2. Update booking status to 'confirmed'
    // 3. Update payment record status
    // 4. Send confirmation emails

    const supabase = await createClient();

    // For now, just update booking status
    const { data, error } = await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", bookingId)
        .select()
        .single();

    if (error) {
        return { error: "Failed to confirm booking", data: null };
    }

    return { data, error: null };
}

export async function cancelBooking(bookingId: string, reason?: string) {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
        return { error: "User not authenticated", data: null };
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

    if (bookingError || !booking) {
        return { error: "Booking not found", data: null };
    }

    // Check if user is authorized to cancel (customer or stylist)
    if (booking.customer_id !== user.id && booking.stylist_id !== user.id) {
        return { error: "Not authorized to cancel this booking", data: null };
    }

    // Check if booking can be cancelled (24+ hours before appointment for refund)
    const startTime = new Date(booking.start_time);
    const now = new Date();
    const hoursUntilAppointment = (startTime.getTime() - now.getTime()) /
        (1000 * 60 * 60);
    const eligibleForRefund = hoursUntilAppointment >= 24;

    // TODO: Handle Stripe refund if eligible
    // if (eligibleForRefund && booking.stripe_payment_intent_id) {
    //     const refund = await stripe.refunds.create({
    //         payment_intent: booking.stripe_payment_intent_id,
    //     });
    // }

    // Update booking status
    const { data, error } = await supabase
        .from("bookings")
        .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            cancellation_reason: reason,
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
                shouldReceiveNotification(fullBooking.customer_id, 'booking_cancellations'),
                shouldReceiveNotification(fullBooking.stylist_id, 'booking_cancellations')
            ]);

            if (canSendToCustomer || canSendToStylist) {
                // Prepare common email data
                const services = fullBooking.booking_services?.map((bs) => bs.services).filter(Boolean) || [];
                const serviceName = services.length > 0 ? services[0]?.title || "Booking" : "Booking";
                const serviceNameWithCount = services.length > 1
                    ? `${serviceName} +${services.length - 1} til`
                    : serviceName;

                const startTime = new Date(fullBooking.start_time);
                const endTime = new Date(fullBooking.end_time);
                const bookingDate = format(startTime, "EEEE d. MMMM yyyy", { locale: nb });
                const bookingTime = `${format(startTime, "HH:mm")} - ${format(endTime, "HH:mm")}`;

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
                        console.error("Error sending customer cancellation email:", customerEmailError);
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
                        console.error("Error sending stylist cancellation email:", stylistEmailError);
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
            eligibleForRefund,
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
                    status === 'confirmed' ? 'booking_confirmations' : 'booking_status_updates'
                ),
                shouldReceiveNotification(
                    booking.stylist_id, 
                    status === 'confirmed' ? 'booking_confirmations' : 'booking_status_updates'  
                )
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
                    console.error("Error sending customer status update email:", customerEmailError);
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
                    console.error("Error sending stylist status update email:", stylistEmailError);
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
