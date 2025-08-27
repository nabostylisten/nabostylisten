import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { shouldReceiveNotification } from "@/lib/preferences-utils";
import { sendEmail } from "@/lib/resend-utils";
import { PaymentNotificationEmail } from "@/transactional/emails/payment-notification";
import { format, subHours } from "date-fns";
import { nb } from "date-fns/locale";
import { getNabostylistenLogoUrl } from "@/lib/supabase/utils";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = await createClient();
    const now = new Date();

    // Find completed bookings that need payout processing
    // Process bookings that ended 1-2 hours ago to allow for service completion
    const windowStart = subHours(now, 2);
    const windowEnd = subHours(now, 1);

    console.log(
      `[PAYOUT_PROCESSING] Processing payouts for bookings completed between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`,
    );

    // Query completed bookings that need payout processing
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        *,
        customer:profiles!customer_id(id, email, full_name),
        stylist:profiles!stylist_id(id, email, full_name),
        booking_services(
          service:services(
            title
          )
        ),
        payments(
          id,
          final_amount,
          stylist_payout,
          platform_fee,
          payment_intent_id,
          captured_at
        )
      `)
      .eq("status", "completed")
      .gte("end_time", windowStart.toISOString())
      .lt("end_time", windowEnd.toISOString())
      .not("payment_captured_at", "is", null) // Payment must have been captured
      .is("payout_processed_at", null); // Payout not yet processed

    if (bookingsError) {
      console.error(
        "[PAYOUT_PROCESSING] Error fetching bookings:",
        bookingsError,
      );
      return new Response("Error fetching bookings", { status: 500 });
    }

    if (!bookings || bookings.length === 0) {
      console.log(
        "[PAYOUT_PROCESSING] No bookings found for payout processing",
      );
      return new Response("No payouts to process", { status: 200 });
    }

    console.log(
      `[PAYOUT_PROCESSING] Found ${bookings.length} bookings for payout processing`,
    );

    let payoutsProcessed = 0;
    let errorsCount = 0;
    let emailsSent = 0;

    // Process each booking
    for (const booking of bookings) {
      try {
        // Skip if no payment record
        if (!booking.payments) {
          console.log(
            `[PAYOUT_PROCESSING] Skipping booking ${booking.id} - no payment record`,
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
            `[PAYOUT_PROCESSING] Skipping booking ${booking.id} - stylist missing Stripe account`,
          );
          continue;
        }

        const payment = booking.payments;

        console.log(
          `[PAYOUT_PROCESSING] Processing payout for booking ${booking.id}`,
        );

        // TODO: Implement actual Stripe Connect transfer when ready
        // For now, we'll simulate the transfer
        const transferResult = { 
          data: { transferId: `transfer_${booking.id}_${Date.now()}` }, 
          error: null as string | null
        };
        
        // When Stripe Connect is ready, replace the above with:
        // const transferResult = await transferToStylist(
        //   payment.payment_intent_id,
        //   booking.id,
        // );

        if (transferResult.error || !transferResult.data) {
          console.error(
            `[PAYOUT_PROCESSING] Failed to transfer payout for booking ${booking.id}:`,
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
            payout_email_sent_at: now.toISOString()
          })
          .eq("id", booking.id);

        if (updateError) {
          console.error(
            `[PAYOUT_PROCESSING] Failed to update payout_processed_at for booking ${booking.id}:`,
            updateError,
          );
        }

        // Also update the payment record
        const { error: paymentUpdateError } = await supabase
          .from("payments")
          .update({
            payout_initiated_at: now.toISOString(),
            payout_completed_at: now.toISOString(),
            stylist_transfer_id: transferResult.data.transferId
          })
          .eq("booking_id", booking.id);

        if (paymentUpdateError) {
          console.error(
            `[PAYOUT_PROCESSING] Failed to update payment record for booking ${booking.id}:`,
            paymentUpdateError,
          );
        }

        payoutsProcessed++;

        const bookingDate = format(
          new Date(booking.start_time),
          "d. MMMM yyyy",
          { locale: nb },
        );
        const serviceName = booking.booking_services
          ?.map((bs) => bs.service?.title)
          .filter(Boolean)[0] || "Skjønnhetstjeneste";

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
                subject: `Utbetaling behandlet - ${serviceName}`,
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
                  `[PAYOUT_PROCESSING] Failed to send stylist email for booking ${booking.id}:`,
                  stylistPayoutEmailError,
                );
              } else {
                emailsSent++;
                console.log(
                  `[PAYOUT_PROCESSING] Sent payout notification to stylist ${booking.stylist.email}`,
                );
              }
            } catch (emailError) {
              console.error(
                `[PAYOUT_PROCESSING] Failed to send stylist email for booking ${booking.id}:`,
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
              const { error: customerPayoutEmailError } = await sendEmail({
                to: [booking.customer.email],
                subject: `Tjeneste fullført - ${serviceName}`,
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
                  `[PAYOUT_PROCESSING] Failed to send customer email for booking ${booking.id}:`,
                  customerPayoutEmailError,
                );
              } else {
                emailsSent++;
                console.log(
                  `[PAYOUT_PROCESSING] Sent service completion notification to customer ${booking.customer.email}`,
                );
              }
            } catch (emailError) {
              console.error(
                `[PAYOUT_PROCESSING] Failed to send customer email for booking ${booking.id}:`,
                emailError,
              );
            }
          }
        }

        console.log(
          `[PAYOUT_PROCESSING] Successfully processed payout for booking ${booking.id}`,
        );
      } catch (error) {
        console.error(
          `[PAYOUT_PROCESSING] Error processing booking ${booking.id}:`,
          error,
        );
        errorsCount++;
      }
    }

    console.log(
      `[PAYOUT_PROCESSING] Completed: ${payoutsProcessed} payouts processed, ${emailsSent} emails sent, ${errorsCount} errors`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        bookingsProcessed: bookings.length,
        payoutsProcessed,
        emailsSent,
        errors: errorsCount,
        message: "Payout processing completed.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[PAYOUT_PROCESSING] Cron job failed:", error);
    return new Response("Internal server error", { status: 500 });
  }
}