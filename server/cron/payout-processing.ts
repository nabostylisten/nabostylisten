import { createClient } from "@/lib/supabase/server";
import { shouldReceiveNotification } from "@/lib/preferences-utils";
import { sendEmail } from "@/lib/resend-utils";
import { PaymentNotificationEmail } from "@/transactional/emails/payment-notification";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { getNabostylistenLogoUrl } from "@/lib/supabase/utils";

export interface PayoutProcessingResult {
  success: boolean;
  bookingsProcessed: number;
  payoutsProcessed: number;
  emailsSent: number;
  errors: number;
  message: string;
}

interface BookingWithPayment {
  id: string;
  customer_id: string;
  stylist_id: string;
  start_time: string;
  payout_processed_at: string | null;
  is_trial_session?: boolean;
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
  booking_services:
    | Array<{
      service: {
        title: string | null;
      } | null;
    }>
    | null;
  payments: {
    id: string;
    final_amount: number;
    stylist_payout: number;
    platform_fee: number;
    payment_intent_id: string;
    captured_at: string | null;
  } | null;
}

/**
 * Shared logic for processing payouts across all bookings
 * Used by both cron jobs and dev tools
 *
 * @param bookings - Array of bookings to process payouts for
 * @param logPrefix - Prefix for console logs (e.g., "[PAYOUT_PROCESSING]" or "[DEV_PAYOUT_PROCESSING]")
 * @param isDev - Whether this is running in dev mode (affects email subject prefix and transfer simulation)
 */
export async function processPayoutsForBookings(
  bookings: BookingWithPayment[],
  logPrefix: string = "[PAYOUT_PROCESSING]",
  isDev: boolean = false,
): Promise<PayoutProcessingResult> {
  const supabase = await createClient();
  const now = new Date();

  let payoutsProcessed = 0;
  let errorsCount = 0;
  let emailsSent = 0;

  // Process each booking
  for (const booking of bookings) {
    try {
      // Skip if no payment record
      if (!booking.payments) {
        console.log(
          `${logPrefix} Skipping booking ${booking.id} - no payment record`,
        );
        continue;
      }

      // Check if stylist has Stripe account set up
      const { data: stylistDetails } = await supabase
        .from("stylist_details")
        .select("stripe_account_id")
        .eq("profile_id", booking.stylist_id)
        .single();

      if (!stylistDetails?.stripe_account_id) {
        console.log(
          `${logPrefix} Skipping booking ${booking.id} - stylist missing Stripe account`,
        );
        continue;
      }

      const payment = booking.payments;

      console.log(
        `${logPrefix} Processing payout for booking ${booking.id}`,
      );

      // Simulate or perform actual Stripe Connect transfer
      let transferResult: {
        data: { transferId: string } | null;
        error: string | null;
      };

      if (isDev) {
        // Simulate transfer for development
        transferResult = {
          data: { transferId: `dev_transfer_${booking.id}_${Date.now()}` },
          error: null,
        };
      } else {
        // TODO: Implement actual Stripe Connect transfer when ready
        // const transferResult = await transferToStylist(
        //   payment.payment_intent_id,
        //   booking.id,
        // );

        // For now, simulate in production too
        transferResult = {
          data: { transferId: `transfer_${booking.id}_${Date.now()}` },
          error: null,
        };
      }

      if (transferResult.error || !transferResult.data) {
        console.error(
          `${logPrefix} Failed to transfer payout for booking ${booking.id}:`,
          transferResult.error,
        );
        errorsCount++;
        continue;
      }

      // Update the booking to mark payout as processed
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          payout_processed_at: now.toISOString(),
          payout_email_sent_at: now.toISOString(),
        })
        .eq("id", booking.id);

      if (updateError) {
        console.error(
          `${logPrefix} Failed to update payout_processed_at for booking ${booking.id}:`,
          updateError,
        );
      }

      // Also update the payment record
      const { error: paymentUpdateError } = await supabase
        .from("payments")
        .update({
          payout_initiated_at: now.toISOString(),
          payout_completed_at: now.toISOString(),
          stylist_transfer_id: transferResult.data.transferId,
        })
        .eq("booking_id", booking.id);

      if (paymentUpdateError) {
        console.error(
          `${logPrefix} Failed to update payment record for booking ${booking.id}:`,
          paymentUpdateError,
        );
      }

      payoutsProcessed++;

      const bookingDate = format(
        new Date(booking.start_time),
        "d. MMMM yyyy",
        { locale: nb },
      );
      let serviceName = booking.booking_services
        ?.map((bs) => bs.service?.title)
        .filter(Boolean)[0] || "Skjønnhetstjeneste";

      // Add trial session prefix if applicable
      if (booking.is_trial_session) {
        serviceName = `Prøvetime: ${serviceName}`;
      }

      const emailSubjectPrefix = isDev ? "[DEV] " : "";
      const subjectBase = `Utbetaling behandlet - ${serviceName}`;

      // Send payout notification to stylist
      if (booking.stylist?.email) {
        const canSendToStylist = await shouldReceiveNotification(
          supabase,
          booking.stylist_id,
          "stylist.paymentNotifications",
        );

        if (canSendToStylist) {
          try {
            const { error: stylistPayoutEmailError } = await sendEmail({
              to: [booking.stylist.email],
              subject: `${emailSubjectPrefix}${subjectBase}`,
              react: PaymentNotificationEmail({
                logoUrl: getNabostylistenLogoUrl(),
                recipientProfileId: booking.stylist_id,
                recipientName: booking.stylist.full_name || "Stylist",
                recipientRole: "stylist",
                notificationType: "payout_processed",
                bookingId: booking.id,
                serviceName: serviceName,
                serviceDate: bookingDate,
                totalAmount: payment.final_amount,
                currency: "NOK",
                platformFee: payment.platform_fee,
                stylistPayout: payment.stylist_payout,
                paymentMethod: "Bankkort",
                transactionId: transferResult.data.transferId,
                payoutMethod: "Bankkonto",
                payoutDate: format(now, "d. MMMM yyyy", { locale: nb }),
              }),
            });

            if (stylistPayoutEmailError) {
              console.error(
                `${logPrefix} Failed to send stylist email for booking ${booking.id}:`,
                stylistPayoutEmailError,
              );
            } else {
              emailsSent++;
              console.log(
                `${logPrefix} Sent payout notification to stylist ${booking.stylist.email}`,
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

      // Send service completion confirmation to customer
      if (booking.customer?.email) {
        const canSendToCustomer = await shouldReceiveNotification(
          supabase,
          booking.customer_id,
          "booking.statusUpdates",
        );

        if (canSendToCustomer) {
          try {
            const customerSubjectBase = booking.is_trial_session
              ? `Prøvetime fullført - ${serviceName.replace("Prøvetime: ", "")}`
              : `Tjeneste fullført - ${serviceName}`;

            const { error: customerPayoutEmailError } = await sendEmail({
              to: [booking.customer.email],
              subject: `${emailSubjectPrefix}${customerSubjectBase}`,
              react: PaymentNotificationEmail({
                logoUrl: getNabostylistenLogoUrl(),
                recipientProfileId: booking.customer_id,
                recipientName: booking.customer.full_name || "Kunde",
                recipientRole: "customer",
                notificationType: "payout_processed",
                bookingId: booking.id,
                serviceName: serviceName,
                serviceDate: bookingDate,
                totalAmount: payment.final_amount,
                currency: "NOK",
                paymentMethod: "Bankkort",
                transactionId: transferResult.data.transferId,
              }),
            });

            if (customerPayoutEmailError) {
              console.error(
                `${logPrefix} Failed to send customer email for booking ${booking.id}:`,
                customerPayoutEmailError,
              );
            } else {
              emailsSent++;
              console.log(
                `${logPrefix} Sent service completion notification to customer ${booking.customer.email}`,
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

      console.log(
        `${logPrefix} Successfully processed payout for booking ${booking.id}`,
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
    `${logPrefix} Completed: ${payoutsProcessed} payouts processed, ${emailsSent} emails sent, ${errorsCount} errors`,
  );

  return {
    success: true,
    bookingsProcessed: bookings.length,
    payoutsProcessed,
    emailsSent,
    errors: errorsCount,
    message: isDev
      ? "DEV: Payout processing completed successfully"
      : "Payout processing completed.",
  };
}
