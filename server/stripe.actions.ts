"use server";

import { createClient } from "@/lib/supabase/server";

// TODO: Implement Stripe-related server actions

/**
 * Create a Stripe PaymentIntent for a booking
 * TODO: Implement when Stripe is configured
 */
export async function createPaymentIntent(bookingId: string) {
  const supabase = await createClient();
  
  // TODO: Get booking details
  // const { data: booking } = await supabase
  //   .from("bookings")
  //   .select("*, services(*)")
  //   .eq("id", bookingId)
  //   .single();
  
  // TODO: Create PaymentIntent with Stripe
  // const paymentIntent = await stripe.paymentIntents.create({
  //   amount: booking.total_price * 100, // Convert to øre
  //   currency: 'nok',
  //   capture_method: 'manual', // Capture 24 hours before appointment
  //   metadata: {
  //     bookingId,
  //     customerId: booking.customer_id,
  //     stylistId: booking.stylist_id,
  //   },
  // });
  
  // TODO: Update booking with payment intent ID
  // await supabase
  //   .from("bookings")
  //   .update({ stripe_payment_intent_id: paymentIntent.id })
  //   .eq("id", bookingId);
  
  // TODO: Return client secret for frontend
  // return { clientSecret: paymentIntent.client_secret };
  
  return { error: "Stripe integration pending" };
}

/**
 * Capture payment 24 hours before appointment
 * TODO: This should be called by a scheduled job/cron
 */
export async function capturePaymentBeforeAppointment(bookingId: string) {
  // TODO: Get booking and payment intent
  // TODO: Check if it's 24 hours before appointment
  // TODO: Capture the payment
  // TODO: Update booking and payment records
  // TODO: Send confirmation emails
}

/**
 * Process refund for cancelled booking
 * TODO: Implement when Stripe is configured
 */
export async function processRefund(bookingId: string, reason?: string) {
  // TODO: Get booking and payment details
  // TODO: Check refund eligibility (24+ hours before appointment)
  // TODO: Create refund with Stripe
  // TODO: Update booking and payment records
  // TODO: Send refund confirmation email
}

/**
 * Create Stripe Connect account for stylist
 * TODO: Implement when Stripe Connect is configured
 */
export async function createStylistStripeAccount(stylistId: string) {
  // TODO: Create Stripe Connect account
  // const account = await stripe.accounts.create({
  //   type: 'express',
  //   country: 'NO',
  //   email: stylistEmail,
  //   capabilities: {
  //     card_payments: { requested: true },
  //     transfers: { requested: true },
  //   },
  // });
  
  // TODO: Save account ID to stylist_details
  // await supabase
  //   .from("stylist_details")
  //   .update({ stripe_account_id: account.id })
  //   .eq("profile_id", stylistId);
  
  // TODO: Create account link for onboarding
  // const accountLink = await stripe.accountLinks.create({
  //   account: account.id,
  //   refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/stylist/stripe/refresh`,
  //   return_url: `${process.env.NEXT_PUBLIC_APP_URL}/stylist/stripe/return`,
  //   type: 'account_onboarding',
  // });
  
  // TODO: Return onboarding URL
  // return { url: accountLink.url };
}

/**
 * Transfer funds to stylist after successful payment
 * TODO: Implement when Stripe Connect is configured
 */
export async function transferToStylist(paymentIntentId: string, bookingId: string) {
  // TODO: Get payment and booking details
  // TODO: Calculate platform fee and stylist payout
  // TODO: Create transfer to stylist's Stripe account
  // TODO: Update payment record with transfer details
  // TODO: Send payout notification to stylist
}

/**
 * Get Stripe dashboard link for stylist
 * TODO: Implement when Stripe Connect is configured
 */
export async function getStylistDashboardLink(stylistId: string) {
  // TODO: Get stylist's Stripe account ID
  // TODO: Create login link
  // const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);
  // return { url: loginLink.url };
}