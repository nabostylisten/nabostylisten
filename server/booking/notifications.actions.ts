"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend-utils";
import { BookingReceiptEmail } from "@/transactional/emails/booking-receipt";
import { NewBookingRequestEmail } from "@/transactional/emails/new-booking-request";
import { StripeOnboardingRequired } from "@/transactional/emails/stripe-onboarding-required";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { getNabostylistenLogoUrl } from "@/lib/supabase/utils";
import { shouldReceiveNotificationServerSide } from "@/server/preferences.actions";

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
                        duration_minutes
                    )
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
                )
            `)
            .eq("id", bookingId)
            .single();

        if (bookingError || !booking) {
            console.error("Failed to get booking for post-payment emails:", bookingError);
            return { error: "Booking not found", data: null };
        }

        // Check if emails have already been sent to prevent duplicates
        if (
            booking.customer_receipt_email_sent_at &&
            booking.stylist_request_email_sent_at
        ) {
            console.log("Both emails already sent for booking:", bookingId);
            return {
                data: {
                    customerEmailSent: true,
                    stylistEmailSent: true,
                    alreadySent: true,
                },
                error: null,
            };
        }

        // Check user preferences for receipt/booking notifications
        const [canSendReceiptToCustomer, canSendRequestToStylist] =
            await Promise.all([
                shouldReceiveNotificationServerSide(
                    booking.customer_id,
                    "booking_receipts",
                ),
                shouldReceiveNotificationServerSide(
                    booking.stylist_id,
                    "booking_requests",
                ),
            ]);

        if (!canSendReceiptToCustomer && !canSendRequestToStylist) {
            console.log(
                "Both parties have disabled notifications for this booking:",
                bookingId,
            );
            return {
                data: {
                    customerEmailSent: false,
                    stylistEmailSent: false,
                    skipped: "Both parties disabled notifications",
                },
                error: null,
            };
        }

        // Prepare common email data
        const services = booking.booking_services?.map((bs) => bs.service).filter(Boolean) || [];
        const serviceName = services.length > 0 ? services[0]?.title || "Booking" : "Booking";
        const serviceNameWithCount = services.length > 1
            ? `${serviceName} +${services.length - 1} til`
            : serviceName;

        const payment = booking.payments?.[0];
        if (!payment) {
            console.error("No payment found for booking:", bookingId);
            return { error: "No payment found for booking", data: null };
        }

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
        let locationDetails = null;
        if (booking.address_id && booking.address) {
            location = "Hjemme hos deg";
            locationDetails = {
                street: booking.address.street_address,
                city: booking.address.city,
                postalCode: booking.address.postal_code,
                entryInstructions: booking.address.entry_instructions,
            };
        }

        const logoUrl = getNabostylistenLogoUrl("png");

        const emailPromises: Promise<any>[] = [];
        const emailTracking = {
            customerEmailAttempted: false,
            stylistEmailAttempted: false,
        };

        // Send booking receipt email to customer
        if (
            canSendReceiptToCustomer &&
            booking.customer?.email &&
            !booking.customer_receipt_email_sent_at
        ) {
            emailTracking.customerEmailAttempted = true;

            emailPromises.push(
                sendEmail({
                    to: [booking.customer.email],
                    subject: `Betalingskvittering: ${serviceName} - Nabostylisten`,
                    react: BookingReceiptEmail({
                        logoUrl,
                        customerName: booking.customer.full_name || "Kunde",
                        stylistName: booking.stylist?.full_name || "Stylist",
                        bookingId: bookingId,
                        serviceName: serviceNameWithCount,
                        bookingDate,
                        bookingTime,
                        location,
                        locationDetails,
                        totalAmount: payment.final_amount,
                        originalAmount: payment.original_amount,
                        discountAmount: payment.discount_amount || 0,
                        discountCode: booking.discount?.code,
                        currency: payment.currency || "NOK",
                        services: services.map((service) => ({
                            title: service.title,
                            price: service.price,
                            duration: service.duration_minutes,
                        })),
                        isTrialSession: booking.is_trial_session || false,
                        messageToStylist: booking.message_to_stylist,
                    }),
                }),
            );
        }

        // Send booking request email to stylist
        if (
            canSendRequestToStylist &&
            booking.stylist?.email &&
            !booking.stylist_request_email_sent_at
        ) {
            emailTracking.stylistEmailAttempted = true;

            emailPromises.push(
                sendEmail({
                    to: [booking.stylist.email],
                    subject: `Ny booking: ${serviceName} - Nabostylisten`,
                    react: NewBookingRequestEmail({
                        logoUrl,
                        customerName: booking.customer?.full_name || "Kunde",
                        stylistName: booking.stylist.full_name || "Stylist",
                        bookingId: bookingId,
                        serviceName: serviceNameWithCount,
                        bookingDate,
                        bookingTime,
                        location,
                        locationDetails,
                        totalAmount: payment.final_amount,
                        currency: payment.currency || "NOK",
                        services: services.map((service) => ({
                            title: service.title,
                            price: service.price,
                            duration: service.duration_minutes,
                        })),
                        isTrialSession: booking.is_trial_session || false,
                        messageToStylist: booking.message_to_stylist,
                        customerEmail: booking.customer?.email || "",
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

        // Determine which emails were successfully sent
        let customerEmailSent = false;
        let stylistEmailSent = false;

        if (emailTracking.customerEmailAttempted && emailTracking.stylistEmailAttempted) {
            // Both emails attempted
            customerEmailSent = emailResults[0]?.status === "fulfilled";
            stylistEmailSent = emailResults[1]?.status === "fulfilled";
        } else if (emailTracking.customerEmailAttempted) {
            // Only customer email attempted
            customerEmailSent = emailResults[0]?.status === "fulfilled";
        } else if (emailTracking.stylistEmailAttempted) {
            // Only stylist email attempted
            stylistEmailSent = emailResults[0]?.status === "fulfilled";
        }

        // Update database with timestamps for successfully sent emails
        const updateData: any = {};
        if (customerEmailSent) {
            updateData.customer_receipt_email_sent_at = new Date().toISOString();
        }
        if (stylistEmailSent) {
            updateData.stylist_request_email_sent_at = new Date().toISOString();
        }

        // Update booking record if any emails were sent
        if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
                .from("bookings")
                .update(updateData)
                .eq("id", bookingId);

            if (updateError) {
                console.error(
                    "Failed to update booking email timestamps:",
                    updateError,
                );
                // Don't fail the entire operation for timestamp update failure
            }
        }

        return {
            data: {
                customerEmailSent,
                stylistEmailSent,
                emailsAttempted: emailPromises.length,
                emailsSuccessful: emailResults.filter((r) =>
                    r.status === "fulfilled"
                ).length,
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