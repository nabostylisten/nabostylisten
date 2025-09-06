"use server";

import { createClient } from "@/lib/supabase/server";
import { bookingsUpdateSchema } from "@/schemas/database.schema";
import type { DatabaseTables } from "@/types";
import type { BookingWithRelated } from "./shared/types";
import { sendEmail } from "@/lib/resend-utils";
import { BookingStatusUpdateEmail } from "@/transactional/emails/booking-status-update";
import BookingRescheduledEmail from "@/transactional/emails/booking-rescheduled";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { getNabostylistenLogoUrl } from "@/lib/supabase/utils";
import {
    shouldReceiveNotification,
    shouldReceiveNotificationServerSide,
} from "@/server/preferences.actions";
import { DEFAULT_PLATFORM_CONFIG } from "@/schemas/platform-config.schema";

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
        const { processRefund } = await import("../stripe.actions");
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
                    isTrialSession: fullBooking.is_trial_session || false,
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
                isTrialSession: booking.is_trial_session || false,
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
 * Reschedule a booking to a new time slot
 * Only stylists can reschedule their own bookings
 */
export async function rescheduleBooking({
    bookingId,
    newStartTime,
    newEndTime,
    rescheduleReason,
    moveBothBookings = false,
}: {
    bookingId: string;
    newStartTime: string;
    newEndTime: string;
    rescheduleReason: string;
    moveBothBookings?: boolean;
}) {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
        return { error: "User not authenticated", data: null };
    }

    // Get booking details first
    const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();
        
    if (bookingError || !booking) {
        return { error: "Booking not found", data: null };
    }

    // Get related trial/main booking data separately
    let trialBooking = null;
    let mainBooking = null;
    
    if (booking.trial_booking_id) {
        const { data: trial } = await supabase
            .from("bookings")
            .select("id, start_time, end_time, status, is_trial_session")
            .eq("id", booking.trial_booking_id)
            .single();
        trialBooking = trial;
    }
    
    if (booking.main_booking_id) {
        const { data: main } = await supabase
            .from("bookings")
            .select("id, start_time, end_time, status, is_trial_session")
            .eq("id", booking.main_booking_id)
            .single();
        mainBooking = main;
    }
    
    // Create extended booking object with related bookings
    const bookingWithRelated: BookingWithRelated = {
        ...booking,
        trial_booking: trialBooking,
        main_booking: mainBooking,
    };
        
    console.log("Debug: Booking with separate queries:", JSON.stringify({
        booking: {
            id: bookingWithRelated.id,
            is_trial_session: bookingWithRelated.is_trial_session,
            trial_booking_id: bookingWithRelated.trial_booking_id,
            main_booking_id: bookingWithRelated.main_booking_id,
            trial_booking: bookingWithRelated.trial_booking,
            main_booking: bookingWithRelated.main_booking
        }
    }, null, 2));

    // Check if user is the assigned stylist
    if (bookingWithRelated.stylist_id !== user.id) {
        return {
            error: "Not authorized to reschedule this booking",
            data: null,
        };
    }

    // Only allow rescheduling for pending or confirmed bookings
    if (bookingWithRelated.status !== "pending" && bookingWithRelated.status !== "confirmed") {
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

    // Validate trial session constraints
    const isTrialSession = bookingWithRelated.is_trial_session === true;
    const hasTrialSession = bookingWithRelated.trial_booking != null && bookingWithRelated.trial_booking_id != null;
    
    console.log("Debug: Trial session constraints:", {
        isTrialSession,
        hasTrialSession,
        moveBothBookings,
        trial_booking_id: bookingWithRelated.trial_booking_id,
        main_booking_id: bookingWithRelated.main_booking_id,
        trial_booking_exists: !!bookingWithRelated.trial_booking,
        main_booking_exists: !!bookingWithRelated.main_booking
    });

    if (isTrialSession && bookingWithRelated.main_booking) {
        const mainBookingDate = new Date(bookingWithRelated.main_booking.start_time);
        
        // Trial session must be before main booking
        if (newStart >= mainBookingDate) {
            return { 
                error: "Prøvetimen må være før hovedbookingen", 
                data: null 
            };
        }
        
        // Must be at least 24 hours before main booking
        const hoursBeforeMain = (mainBookingDate.getTime() - newEnd.getTime()) / (1000 * 60 * 60);
        if (hoursBeforeMain < 24) {
            return { 
                error: "Prøvetimen må være minst 24 timer før hovedbookingen", 
                data: null 
            };
        }
    }

    if (hasTrialSession && !isTrialSession && bookingWithRelated.trial_booking) {
        const trialBookingDate = new Date(bookingWithRelated.trial_booking.start_time);
        
        // Main booking must be after trial session (unless we're moving both)
        if (!moveBothBookings && newStart <= trialBookingDate) {
            return { 
                error: "Hovedbookingen må være etter prøvetimen. Aktiver 'Flytt også prøvetimen' for å flytte begge.", 
                data: null 
            };
        }
    }

    // Store original times for tracking
    const originalStartTime = bookingWithRelated.start_time;
    const originalEndTime = bookingWithRelated.end_time;

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

    // Handle moving trial session booking if requested
    if (moveBothBookings && hasTrialSession && !isTrialSession && bookingWithRelated.trial_booking) {
        try {
            console.log("Debug: Full booking object:", JSON.stringify({
                id: bookingWithRelated.id,
                start_time: bookingWithRelated.start_time,
                end_time: bookingWithRelated.end_time,
                trial_booking: bookingWithRelated.trial_booking,
                trial_booking_id: bookingWithRelated.trial_booking_id
            }, null, 2));
            
            if (!bookingWithRelated.trial_booking.start_time || !bookingWithRelated.trial_booking.end_time) {
                console.error("Missing trial booking dates:", {
                    trial_booking: bookingWithRelated.trial_booking,
                    trial_booking_id: bookingWithRelated.trial_booking_id
                });
                return { 
                    error: "Prøvetimen mangler datoer", 
                    data: null 
                };
            }
            
            const originalMainStart = new Date(bookingWithRelated.start_time);
            const originalMainEnd = new Date(bookingWithRelated.end_time);
            const originalTrialStart = new Date(bookingWithRelated.trial_booking.start_time);
            const originalTrialEnd = new Date(bookingWithRelated.trial_booking.end_time);
            
            // Validate original dates
            if (isNaN(originalMainStart.getTime()) || isNaN(originalTrialStart.getTime()) || 
                isNaN(originalTrialEnd.getTime()) || isNaN(originalMainEnd.getTime())) {
                console.error("Invalid original dates:", {
                    originalMainStart: bookingWithRelated.start_time,
                    originalTrialStart: bookingWithRelated.trial_booking.start_time,
                    originalTrialEnd: bookingWithRelated.trial_booking.end_time,
                    originalMainEnd: bookingWithRelated.end_time
                });
                return { 
                    error: "Ugyldig dato i opprinnelige bookinger", 
                    data: null 
                };
            }
            
            // Calculate the time difference between original trial and main bookings
            const timeDifference = originalMainStart.getTime() - originalTrialStart.getTime();
            const trialDuration = originalTrialEnd.getTime() - originalTrialStart.getTime();
            
            // Calculate new trial session times maintaining the same relative timing
            const newTrialStart = new Date(newStart.getTime() - timeDifference);
            const newTrialEnd = new Date(newTrialStart.getTime() + trialDuration);
            
            // Validate calculated dates
            if (isNaN(newTrialStart.getTime()) || isNaN(newTrialEnd.getTime())) {
                console.error("Invalid calculated trial dates:", {
                    newStart: newStart.toISOString(),
                    timeDifference,
                    trialDuration,
                    newTrialStart: newTrialStart.toString(),
                    newTrialEnd: newTrialEnd.toString()
                });
                return { 
                    error: "Kunne ikke beregne nye datoer for prøvetimen", 
                    data: null 
                };
            }
            
            // Validate that the new trial times are in the future
            if (newTrialStart <= now) {
                return { 
                    error: "Den nye prøvetimen ville være i fortiden. Velg et senere tidspunkt for hovedbookingen.", 
                    data: null 
                };
            }
            
            // Ensure trial is still before main booking with 24h gap
            const hoursBeforeMain = (newStart.getTime() - newTrialEnd.getTime()) / (1000 * 60 * 60);
            if (hoursBeforeMain < 24) {
                return { 
                    error: "Den nye prøvetimen ville være for nær hovedbookingen. Velg et senere tidspunkt for hovedbookingen.", 
                    data: null 
                };
            }
            
            // Update the trial booking
            const trialUpdateData: DatabaseTables["bookings"]["Update"] = {
                start_time: newTrialStart.toISOString(),
                end_time: newTrialEnd.toISOString(),
                rescheduled_from: bookingWithRelated.trial_booking.start_time,
                rescheduled_at: new Date().toISOString(),
                reschedule_reason: `Flyttet sammen med hovedbooking: ${rescheduleReason}`.trim(),
            };
            
            const { success: trialSuccess, data: validatedTrialData } = bookingsUpdateSchema.safeParse(trialUpdateData);
            if (!trialSuccess) {
                console.error("Trial booking validation failed:", trialSuccess);
                return { error: "Invalid trial booking data", data: null };
            }
            
            const { error: trialUpdateError } = await supabase
                .from("bookings")
                .update(validatedTrialData)
                .eq("id", bookingWithRelated.trial_booking.id);
                
            if (trialUpdateError) {
                // Log the error but don't fail the entire operation since main booking succeeded
                console.error("Failed to update trial booking:", trialUpdateError);
                // Could consider a partial success response here
            }
        } catch (error) {
            console.error("Error in trial booking update:", error);
            return { 
                error: "Feil ved oppdatering av prøvetimen", 
                data: null 
            };
        }
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
                const originalEnd = new Date(originalEndTime);
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
                    isTrialSession: fullBooking.is_trial_session || false,
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