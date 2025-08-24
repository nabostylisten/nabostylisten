import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { shouldReceiveNotification } from "@/lib/preferences-utils";
import { resend } from "@/lib/resend";
import { PaymentNotificationEmail } from "@/transactional/emails/payment-notification";
import { format, addHours } from "date-fns";
import { nb } from "date-fns/locale";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = await createClient();

    // Calculate the target date range (24 hours from now for payment capture)
    const now = new Date();
    const paymentCaptureTime = addHours(now, 24); // 24 hours from now
    
    console.log(`[PAYMENT_PROCESSING] Processing payments for bookings at ${paymentCaptureTime.toISOString()}`);

    // Query confirmed bookings that need payment processing (24 hours before start)
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        *,
        customer:profiles!customer_id(id, email, full_name),
        stylist:profiles!stylist_id(id, email, full_name),
        booking_services(
          service:services(
            name,
            title
          )
        )
      `)
      .eq("status", "confirmed")
      .gte("start_time", addHours(paymentCaptureTime, -1).toISOString()) // 1 hour window
      .lte("start_time", addHours(paymentCaptureTime, 1).toISOString())
      .is("payment_captured_at", null); // Only bookings where payment hasn't been captured yet

    if (bookingsError) {
      console.error("[PAYMENT_PROCESSING] Error fetching bookings:", bookingsError);
      return new Response("Error fetching bookings", { status: 500 });
    }

    if (!bookings || bookings.length === 0) {
      console.log("[PAYMENT_PROCESSING] No bookings found for payment processing");
      return new Response("No payments to process", { status: 200 });
    }

    console.log(`[PAYMENT_PROCESSING] Found ${bookings.length} bookings for payment processing`);

    let paymentsProcessed = 0;
    let errorsCount = 0;
    let emailsSent = 0;

    // Process each booking
    for (const booking of bookings) {
      try {
        console.log(`[PAYMENT_PROCESSING] Processing payment for booking ${booking.id}`);

        // TODO: Implement actual Stripe payment capture when Stripe integration is ready
        // For now, we'll simulate the payment processing and send notifications
        
        // 1. TODO: Capture payment with Stripe
        // const paymentResult = await stripe.paymentIntents.capture(booking.stripe_payment_intent_id);
        
        // 2. TODO: Calculate platform fee and stylist payout
        const totalAmount = booking.total_price || 0;
        const platformFeePercent = 0.15; // 15% platform fee
        const platformFee = totalAmount * platformFeePercent;
        const stylistPayout = totalAmount - platformFee;
        
        // 3. Update booking with payment capture timestamp
        const { error: updateError } = await supabase
          .from("bookings")
          .update({ 
            payment_captured_at: new Date().toISOString(),
            // TODO: Add actual payment details when Stripe is integrated
            // stripe_payment_intent_id: paymentResult.id,
            // stripe_charge_id: paymentResult.charges.data[0].id,
          })
          .eq("id", booking.id);

        if (updateError) {
          console.error(`[PAYMENT_PROCESSING] Failed to update booking ${booking.id}:`, updateError);
          errorsCount++;
          continue;
        }

        paymentsProcessed++;

        // 4. Send payment notification to customer
        if (booking.customer?.email) {
          const canSendToCustomer = await shouldReceiveNotification(
            supabase,
            booking.customer_id,
            "booking.confirmations"
          );

          if (canSendToCustomer) {
            try {
              const bookingDate = format(new Date(booking.start_time), "d. MMMM yyyy", { locale: nb });
              const serviceName = booking.booking_services
                ?.map(bs => bs.service?.title || bs.service?.name)
                .filter(Boolean)[0] || "Skjønnhetstjeneste";

              await resend.emails.send({
                from: "Nabostylisten <no-reply@nabostylisten.no>",
                to: [booking.customer.email],
                subject: `Betaling bekreftet - ${serviceName}`,
                react: PaymentNotificationEmail({
                  logoUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/logo-email.png`,
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

              emailsSent++;
              console.log(`[PAYMENT_PROCESSING] Sent payment confirmation to customer ${booking.customer.email}`);
            } catch (emailError) {
              console.error(`[PAYMENT_PROCESSING] Failed to send customer email for booking ${booking.id}:`, emailError);
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
            "stylist.paymentNotifications"
          );

          if (canSendToStylist) {
            try {
              const bookingDate = format(new Date(booking.start_time), "d. MMMM yyyy", { locale: nb });
              const serviceName = booking.booking_services
                ?.map(bs => bs.service?.title || bs.service?.name)
                .filter(Boolean)[0] || "Skjønnhetstjeneste";

              // TODO: Only send payout notification after service completion
              // For now, we'll send a payment received notification to stylist
              await resend.emails.send({
                from: "Nabostylisten <no-reply@nabostylisten.no>",
                to: [booking.stylist.email],
                subject: `Betaling mottatt - ${serviceName}`,
                react: PaymentNotificationEmail({
                  logoUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/logo-email.png`,
                  recipientProfileId: booking.stylist_id,
                  recipientName: booking.stylist.full_name || "Stylist",
                  recipientRole: "stylist",
                  notificationType: "payment_received", // TODO: Change to "payout_processed" after service completion
                  bookingId: booking.id,
                  serviceName: serviceName,
                  serviceDate: bookingDate,
                  totalAmount: totalAmount,
                  currency: "NOK",
                  platformFee: platformFee,
                  stylistPayout: stylistPayout,
                  paymentMethod: "Bankkort", // TODO: Get actual payment method
                  transactionId: `booking_${booking.id}`, // TODO: Use actual Stripe transaction ID
                  payoutMethod: "Bankkonto", // TODO: Get actual payout method from Stripe Connect
                }),
              });

              emailsSent++;
              console.log(`[PAYMENT_PROCESSING] Sent payment notification to stylist ${booking.stylist.email}`);
            } catch (emailError) {
              console.error(`[PAYMENT_PROCESSING] Failed to send stylist email for booking ${booking.id}:`, emailError);
            }
          }
        }

        console.log(`[PAYMENT_PROCESSING] Successfully processed payment for booking ${booking.id}`);

      } catch (error) {
        console.error(`[PAYMENT_PROCESSING] Error processing booking ${booking.id}:`, error);
        errorsCount++;
      }
    }

    console.log(`[PAYMENT_PROCESSING] Completed: ${paymentsProcessed} payments processed, ${emailsSent} emails sent, ${errorsCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        bookingsProcessed: bookings.length,
        paymentsProcessed,
        emailsSent,
        errors: errorsCount,
        message: "Payment processing completed. Note: Full Stripe integration pending.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[PAYMENT_PROCESSING] Cron job failed:", error);
    return new Response("Internal server error", { status: 500 });
  }
}