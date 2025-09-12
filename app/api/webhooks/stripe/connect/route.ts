import { headers } from "next/headers";
import { stripe } from "@/lib/stripe/config";
import { createServiceClient } from "@/lib/supabase/service";
import { calculatePlatformFee } from "@/schemas/platform-config.schema";
import type Stripe from "stripe";

/**
 * Webhook handler for Stripe Connect account events
 * Handles when stylists complete their onboarding and need payment intent updates
 */
export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_CONNECT_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Webhook signature verification failed", {
      status: 400,
    });
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case "account.updated":
        const account = event.data.object as Stripe.Account;

        // Check if the account is now fully onboarded (charges enabled)
        if (account.charges_enabled && account.details_submitted) {
          console.log(
            `Stripe Connect account ${account.id} is now fully onboarded`,
          );

          // Find the stylist by their Stripe account ID
          const { data: stylistDetails, error: stylistError } = await supabase
            .from("stylist_details")
            .select("profile_id")
            .eq("stripe_account_id", account.id)
            .single();

          if (stylistError || !stylistDetails) {
            console.error(
              "Could not find stylist for Stripe account:",
              account.id,
            );
            break;
          }

          const stylistId = stylistDetails.profile_id;

          // Find all bookings and payments that need destination updates for this stylist
          const bookingsQuery = await supabase
            .from("bookings")
            .select(`
              id,
              stripe_payment_intent_id,
              total_price,
              payments!inner(
                id,
                payment_intent_id,
                needs_destination_update,
                platform_fee,
                stylist_payout
              )
            `)
            .eq("stylist_id", stylistId)
            .eq("needs_destination_update", true)
            .not("stripe_payment_intent_id", "is", null);

          const { data: bookingsNeedingUpdate, error: bookingsError } =
            bookingsQuery;

          if (bookingsError) {
            console.error(
              "Error fetching bookings needing update:",
              bookingsError,
            );
            break;
          }

          console.log(
            `Found ${
              bookingsNeedingUpdate?.length || 0
            } bookings needing destination updates`,
          );

          // Update each payment intent to add the destination
          for (const booking of bookingsNeedingUpdate || []) {
            if (!booking.stripe_payment_intent_id) continue;

            try {
              // Retrieve the current payment intent
              const paymentIntent = await stripe.paymentIntents.retrieve(
                booking.stripe_payment_intent_id,
              );

              // Check if payment intent is still in a state where we can update it
              if (
                paymentIntent.status === "requires_payment_method" ||
                paymentIntent.status === "requires_confirmation" ||
                paymentIntent.status === "requires_capture"
              ) {
                // Calculate application fee based on platform fee from payments table
                const payment = booking.payments;
                let applicationFeeAmount: number;

                if (payment?.platform_fee) {
                  // Use stored platform fee from payments table
                  applicationFeeAmount = Math.round(payment.platform_fee * 100); // Convert NOK to øre
                } else {
                  // Calculate using platform configuration
                  const feeCalculation = calculatePlatformFee({
                    totalAmountNOK: booking.total_price,
                    hasAffiliate: false, // We don't have affiliate info in this context
                  });
                  applicationFeeAmount = Math.round(
                    feeCalculation.platformFeeNOK * 100,
                  ); // Convert NOK to øre
                }

                const stylistPayoutOre = Math.round(
                  payment?.stylist_payout * 100,
                );
                // Update the payment intent with destination charges
                await stripe.paymentIntents.update(
                  booking.stripe_payment_intent_id,
                  {
                    transfer_data: {
                      amount: stylistPayoutOre,
                    },
                    application_fee_amount: applicationFeeAmount,
                    metadata: {
                      ...paymentIntent.metadata,
                      needs_destination_update: "false",
                      destination_added_at: new Date().toISOString(),
                    },
                  },
                );

                console.log(
                  `Updated payment intent ${booking.stripe_payment_intent_id} with destination`,
                );

                // Update database to reflect that destination has been added
                const { error: updateBookingError } = await supabase
                  .from("bookings")
                  .update({ needs_destination_update: false })
                  .eq("id", booking.id);

                if (updateBookingError) {
                  console.error(
                    `Failed to update booking ${booking.id}:`,
                    updateBookingError,
                  );
                }

                // Update payments table as well
                if (payment?.id) {
                  const { error: updatePaymentError } = await supabase
                    .from("payments")
                    .update({ needs_destination_update: false })
                    .eq("id", payment.id);

                  if (updatePaymentError) {
                    console.error(
                      `Failed to update payment ${payment.id}:`,
                      updatePaymentError,
                    );
                  }
                }
              } else {
                console.log(
                  `Payment intent ${booking.stripe_payment_intent_id} is in status ${paymentIntent.status}, cannot update destination`,
                );

                // For captured or succeeded payments, we'll need to handle transfers manually
                // This could be done through separate transfer creation after the fact
                // TODO: Implement manual transfer creation for already captured payments
              }
            } catch (error) {
              console.error(
                `Error updating payment intent ${booking.stripe_payment_intent_id}:`,
                error,
              );
            }
          }

          // Send notification email to stylist about successful onboarding
          // and any payment intents that were updated
          // TODO: Implement email notification
        }
        break;

      case "account.application.authorized":
        // Stylist has authorized the connection but may not be fully onboarded yet
        const authorizedApplication = event.data.object as Stripe.Application;
        console.log(
          `Account application authorized: ${authorizedApplication.id}`,
        );
        break;

      case "account.application.deauthorized":
        // Stylist has disconnected their Stripe account
        const deauthorizedApplication = event.data.object as Stripe.Application;
        console.log(
          `Account application deauthorized: ${deauthorizedApplication.id}`,
        );

        // TODO: Handle account disconnection - maybe mark stylist as inactive
        break;

      default:
        console.log(`Unhandled Connect event type: ${event.type}`);
    }

    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
