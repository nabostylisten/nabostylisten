import { createClient } from "@/lib/supabase/server";
import { shouldReceiveNotification } from "@/lib/preferences-utils";
import { sendEmail } from "@/lib/resend-utils";
import { PaymentNotificationEmail } from "@/transactional/emails/payment-notification";
import { capturePaymentBeforeAppointment } from "@/server/stripe.actions";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { calculatePlatformFee } from "@/schemas/platform-config.schema";
import { getNabostylistenLogoUrl } from "@/lib/supabase/utils";

export interface PaymentProcessingResult {
  success: boolean;
  bookingsProcessed: number;
  paymentsProcessed: number;
  emailsSent: number;
  errors: number;
  message: string;
}

interface BookingWithDetails {
  id: string;
  customer_id: string;
  stylist_id: string;
  start_time: string;
  total_price: number;
  payment_captured_at: string | null;
  rescheduled_from: string | null;
  customer: {
    id: string;
    email: string | null;
    full_name: string | null;
  } | null;
  stylist: {
    id: string;
    email: string | null;
    full_name: string | null;
  } | null;
  booking_services: Array<{
    service: {
      title: string | null;
    } | null;
  }> | null;
}

/**
 * Shared logic for processing payments across all bookings
 * Used by both cron jobs and dev tools
 * 
 * @param bookings - Array of bookings to process payments for
 * @param logPrefix - Prefix for console logs (e.g., "[PAYMENT_PROCESSING]" or "[DEV_PAYMENT_PROCESSING]")
 * @param isDev - Whether this is running in dev mode (affects email subject prefix)
 */
export async function processPaymentsForBookings(
  bookings: BookingWithDetails[],
  logPrefix: string = "[PAYMENT_PROCESSING]",
  isDev: boolean = false
): Promise<PaymentProcessingResult> {
  const supabase = await createClient();
  const now = new Date();
  
  let paymentsProcessed = 0;
  let errorsCount = 0;
  let emailsSent = 0;

  // Process each booking
  for (const booking of bookings) {
    try {
      // Skip if payment was already captured (defensive check)
      if (booking.payment_captured_at) {
        console.log(
          `${logPrefix} Skipping booking ${booking.id} - payment already captured at ${booking.payment_captured_at}`,
        );
        continue;
      }

      // Check if this booking was rescheduled
      const isRescheduled = !!booking.rescheduled_from;
      const rescheduleInfo = isRescheduled 
        ? ` (rescheduled from ${booking.rescheduled_from})`
        : "";
      
      console.log(
        `${logPrefix} Processing payment for booking ${booking.id} (starts at ${booking.start_time})${rescheduleInfo}`,
      );

      // Capture the payment using the implemented server action
      const captureResult = await capturePaymentBeforeAppointment(booking.id);

      if (captureResult.error || !captureResult.data) {
        console.error(
          `${logPrefix} Failed to capture payment for booking ${booking.id}:`,
          captureResult.error,
        );
        errorsCount++;
        continue;
      }

      // Update the booking to mark payment as captured
      const { error: updateError } = await supabase
        .from("bookings")
        .update({ payment_captured_at: now.toISOString() })
        .eq("id", booking.id);

      if (updateError) {
        console.error(
          `${logPrefix} Failed to update payment_captured_at for booking ${booking.id}:`,
          updateError,
        );
      }

      console.log(
        `${logPrefix} Successfully captured payment for booking ${booking.id}`,
      );

      // Calculate platform fee and stylist payout for email notifications
      const totalAmount = booking.total_price || 0;
      const { platformFeeNOK, stylistPayoutNOK } = calculatePlatformFee({
        totalAmountNOK: totalAmount,
      });

      paymentsProcessed++;

      // Send payment notification to customer
      if (booking.customer?.email) {
        const canSendToCustomer = await shouldReceiveNotification(
          supabase,
          booking.customer_id,
          "booking.confirmations",
        );

        if (canSendToCustomer) {
          try {
            const bookingDate = format(
              new Date(booking.start_time),
              "d. MMMM yyyy",
              { locale: nb },
            );
            const serviceName = booking.booking_services
              ?.map((bs) => bs.service?.title)
              .filter(Boolean)[0] || "Skjønnhetstjeneste";

            const emailSubjectPrefix = isDev ? "[DEV] " : "";

            const { error: customerPaymentEmailError } = await sendEmail({
              to: [booking.customer.email],
              subject: `${emailSubjectPrefix}Betaling bekreftet - ${serviceName}`,
              react: PaymentNotificationEmail({
                logoUrl: getNabostylistenLogoUrl(),
                recipientProfileId: booking.customer_id,
                recipientName: booking.customer.full_name || "Kunde",
                recipientRole: "customer",
                notificationType: "payment_received",
                bookingId: booking.id,
                serviceName: serviceName,
                serviceDate: bookingDate,
                totalAmount: totalAmount,
                currency: "NOK",
                paymentMethod: "Bankkort", // TODO: Get actual payment method from Stripe
                transactionId: isDev ? `dev_booking_${booking.id}` : `booking_${booking.id}`, // TODO: Use actual Stripe transaction ID
              }),
            });

            if (customerPaymentEmailError) {
              console.error(
                `${logPrefix} Failed to send customer email for booking ${booking.id}:`,
                customerPaymentEmailError,
              );
            } else {
              emailsSent++;
              console.log(
                `${logPrefix} Sent payment confirmation to customer ${booking.customer.email}`,
              );
            }
          } catch (emailError) {
            console.error(
              `${logPrefix} Failed to send customer email for booking ${booking.id}:`,
              emailError,
            );
          }
        }
      }

      // Send payment notification to stylist
      if (booking.stylist?.email) {
        const canSendToStylist = await shouldReceiveNotification(
          supabase,
          booking.stylist_id,
          "stylist.paymentNotifications",
        );

        if (canSendToStylist) {
          try {
            const bookingDate = format(
              new Date(booking.start_time),
              "d. MMMM yyyy",
              { locale: nb },
            );
            const serviceName = booking.booking_services
              ?.map((bs) => bs.service?.title)
              .filter(Boolean)[0] || "Skjønnhetstjeneste";

            const emailSubjectPrefix = isDev ? "[DEV] " : "";

            // TODO: Only send payout notification after service completion
            // For now, we'll send a payment received notification to stylist
            const { error: stylistPaymentEmailError } = await sendEmail({
              to: [booking.stylist.email],
              subject: `${emailSubjectPrefix}Betaling mottatt - ${serviceName}`,
              react: PaymentNotificationEmail({
                logoUrl: getNabostylistenLogoUrl(),
                recipientProfileId: booking.stylist_id,
                recipientName: booking.stylist.full_name || "Stylist",
                recipientRole: "stylist",
                notificationType: "payment_received", // TODO: Change to "payout_processed" after service completion
                bookingId: booking.id,
                serviceName: serviceName,
                serviceDate: bookingDate,
                totalAmount: totalAmount,
                currency: "NOK",
                platformFee: platformFeeNOK,
                stylistPayout: stylistPayoutNOK,
                paymentMethod: "Bankkort", // TODO: Get actual payment method
                transactionId: isDev ? `dev_booking_${booking.id}` : `booking_${booking.id}`, // TODO: Use actual Stripe transaction ID
                payoutMethod: "Bankkonto", // TODO: Get actual payout method from Stripe Connect
              }),
            });

            if (stylistPaymentEmailError) {
              console.error(
                `${logPrefix} Failed to send stylist email for booking ${booking.id}:`,
                stylistPaymentEmailError,
              );
            } else {
              emailsSent++;
              console.log(
                `${logPrefix} Sent payment notification to stylist ${booking.stylist.email}`,
              );
            }
          } catch (emailError) {
            console.error(
              `${logPrefix} Failed to send stylist email for booking ${booking.id}:`,
              emailError,
            );
          }
        }
      }

      console.log(
        `${logPrefix} Successfully processed payment for booking ${booking.id}`,
      );
    } catch (error) {
      console.error(
        `${logPrefix} Error processing booking ${booking.id}:`,
        error,
      );
      errorsCount++;
    }
  }

  console.log(
    `${logPrefix} Completed: ${paymentsProcessed} payments processed, ${emailsSent} emails sent, ${errorsCount} errors`,
  );

  return {
    success: true,
    bookingsProcessed: bookings.length,
    paymentsProcessed,
    emailsSent,
    errors: errorsCount,
    message: isDev 
      ? "DEV: Payment processing completed successfully" 
      : "Payment processing completed. Note: Full Stripe integration pending.",
  };
}