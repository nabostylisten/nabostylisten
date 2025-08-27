import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { shouldReceiveNotification } from "@/lib/preferences-utils";
import { sendEmail } from "@/lib/resend-utils";
import { PaymentNotificationEmail } from "@/transactional/emails/payment-notification";
import { capturePaymentBeforeAppointment } from "@/server/stripe.actions";
import { addHours, format } from "date-fns";
import { nb } from "date-fns/locale";
import { calculatePlatformFee } from "@/schemas/platform-config.schema";
import { getNabostylistenLogoUrl } from "@/lib/supabase/utils";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = await createClient();

    // Calculate the target date range with a 6-hour window
    // We check for bookings 24-30 hours from now to ensure no gaps
    const now = new Date();
    const windowStart = addHours(now, 24); // 24 hours from now
    const windowEnd = addHours(now, 30); // 30 hours from now (6-hour window)

    console.log(
      `[PAYMENT_PROCESSING] Processing payments for bookings between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`,
    );

    // Query confirmed bookings that need payment processing
    // Using a 6-hour window to ensure no bookings are missed
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
        )
      `)
      .eq("status", "confirmed")
      .gte("start_time", windowStart.toISOString())
      .lt("start_time", windowEnd.toISOString())
      .is("payment_captured_at", null); // Only process if not already captured

    if (bookingsError) {
      console.error(
        "[PAYMENT_PROCESSING] Error fetching bookings:",
        bookingsError,
      );
      return new Response("Error fetching bookings", { status: 500 });
    }

    if (!bookings || bookings.length === 0) {
      console.log(
        "[PAYMENT_PROCESSING] No bookings found for payment processing",
      );
      return new Response("No payments to process", { status: 200 });
    }

    console.log(
      `[PAYMENT_PROCESSING] Found ${bookings.length} bookings for payment processing`,
    );

    let paymentsProcessed = 0;
    let errorsCount = 0;
    let emailsSent = 0;

    // Process each booking
    for (const booking of bookings) {
      try {
        // Skip if payment was already captured (defensive check)
        if (booking.payment_captured_at) {
          console.log(
            `[PAYMENT_PROCESSING] Skipping booking ${booking.id} - payment already captured at ${booking.payment_captured_at}`,
          );
          continue;
        }

        console.log(
          `[PAYMENT_PROCESSING] Processing payment for booking ${booking.id} (starts at ${booking.start_time})`,
        );

        // Capture the payment using the implemented server action
        const captureResult = await capturePaymentBeforeAppointment(booking.id);

        if (captureResult.error || !captureResult.data) {
          console.error(
            `[PAYMENT_PROCESSING] Failed to capture payment for booking ${booking.id}:`,
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
            `[PAYMENT_PROCESSING] Failed to update payment_captured_at for booking ${booking.id}:`,
            updateError,
          );
        }

        console.log(
          `[PAYMENT_PROCESSING] Successfully captured payment for booking ${booking.id}`,
        );

        // Calculate platform fee and stylist payout for email notifications
        const totalAmount = booking.total_price || 0;
        const { platformFeeNOK, stylistPayoutNOK } = calculatePlatformFee({
          totalAmountNOK: totalAmount,
        });

        paymentsProcessed++;

        // 4. Send payment notification to customer
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

              const { error: customerPaymentEmailError } = await sendEmail({
                to: [booking.customer.email],
                subject: `Betaling bekreftet - ${serviceName}`,
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
                  transactionId: `booking_${booking.id}`, // TODO: Use actual Stripe transaction ID
                }),
              });

              if (customerPaymentEmailError) {
                console.error(
                  `[PAYMENT_PROCESSING] Failed to send customer email for booking ${booking.id}:`,
                  customerPaymentEmailError,
                );
              }

              emailsSent++;
              console.log(
                `[PAYMENT_PROCESSING] Sent payment confirmation to customer ${booking.customer.email}`,
              );
            } catch (emailError) {
              console.error(
                `[PAYMENT_PROCESSING] Failed to send customer email for booking ${booking.id}:`,
                emailError,
              );
            }
          }
        }

        // 5. TODO: Process payout to stylist when Stripe Connect is ready
        // This would typically happen after the service is completed
        // const payoutResult = await transferToStylist(paymentResult.id, booking.id);

        // 6. Send payout notification to stylist (simulate for now)
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

              // TODO: Only send payout notification after service completion
              // For now, we'll send a payment received notification to stylist
              const { error: stylistPaymentEmailError } = await sendEmail({
                to: [booking.stylist.email],
                subject: `Betaling mottatt - ${serviceName}`,
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
                  transactionId: `booking_${booking.id}`, // TODO: Use actual Stripe transaction ID
                  payoutMethod: "Bankkonto", // TODO: Get actual payout method from Stripe Connect
                }),
              });

              if (stylistPaymentEmailError) {
                console.error(
                  `[PAYMENT_PROCESSING] Failed to send stylist email for booking ${booking.id}:`,
                  stylistPaymentEmailError,
                );
              }

              emailsSent++;
              console.log(
                `[PAYMENT_PROCESSING] Sent payment notification to stylist ${booking.stylist.email}`,
              );
            } catch (emailError) {
              console.error(
                `[PAYMENT_PROCESSING] Failed to send stylist email for booking ${booking.id}:`,
                emailError,
              );
            }
          }
        }

        console.log(
          `[PAYMENT_PROCESSING] Successfully processed payment for booking ${booking.id}`,
        );
      } catch (error) {
        console.error(
          `[PAYMENT_PROCESSING] Error processing booking ${booking.id}:`,
          error,
        );
        errorsCount++;
      }
    }

    console.log(
      `[PAYMENT_PROCESSING] Completed: ${paymentsProcessed} payments processed, ${emailsSent} emails sent, ${errorsCount} errors`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        bookingsProcessed: bookings.length,
        paymentsProcessed,
        emailsSent,
        errors: errorsCount,
        message:
          "Payment processing completed. Note: Full Stripe integration pending.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[PAYMENT_PROCESSING] Cron job failed:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
