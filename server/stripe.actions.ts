"use server";

import { createClient } from "@/lib/supabase/server";
import { 
  createConnectedAccountWithDatabase, 
  createStripeAccountOnboardingLink,
  getStripeAccountStatus as getStripeAccountStatusService,
  createCustomerWithDatabase 
} from "@/lib/stripe/connect";

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
 * Server action wrapper around service function
 */
export async function createConnectedAccount({
  profileId,
  email,
}: {
  profileId: string;
  email: string;
}) {
  const supabase = await createClient();

  return await createConnectedAccountWithDatabase({
    supabaseClient: supabase,
    profileId,
    email,
  });
}

/**
 * Create account onboarding link for stylist
 * Server action wrapper around service function
 */
export async function createAccountOnboardingLink({
  stripeAccountId,
}: {
  stripeAccountId: string;
}) {
  return await createStripeAccountOnboardingLink({ stripeAccountId });
}

export type GetStripeAccountStatusResult = Awaited<ReturnType<typeof getStripeAccountStatus>>;

/**
 * Get Stripe account status for a stylist
 * Server action wrapper around service function
 */
export async function getStripeAccountStatus({
  stripeAccountId,
}: {
  stripeAccountId: string;
}) {
  return await getStripeAccountStatusService({ stripeAccountId });
}

/**
 * Get Stripe account status for the current user (client-side safe)
 * Checks user permissions and fetches their Stripe account status
 */
export async function getCurrentUserStripeStatus() {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: "Not authenticated" };
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { data: null, error: "Profile not found" };
  }

  // Check if user is a stylist
  if (profile.role !== "stylist") {
    return { data: null, error: "User is not a stylist" };
  }

  // Get stylist details to check for Stripe account
  const { data: stylistDetails, error: stylistError } = await supabase
    .from("stylist_details")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  if (stylistError || !stylistDetails) {
    return { data: null, error: "Stylist details not found" };
  }

  if (!stylistDetails.stripe_account_id) {
    return { 
      data: { 
        stripeAccountId: null, 
        status: null, 
        isFullyOnboarded: false,
        profile,
        stylistDetails 
      }, 
      error: null 
    };
  }

  try {
    const statusResult = await getStripeAccountStatusService({
      stripeAccountId: stylistDetails.stripe_account_id,
    });

    if (statusResult.data) {
      const isFullyOnboarded = 
        statusResult.data.charges_enabled &&
        statusResult.data.details_submitted &&
        statusResult.data.payouts_enabled;

      return {
        data: {
          stripeAccountId: stylistDetails.stripe_account_id,
          status: statusResult.data,
          isFullyOnboarded,
          profile,
          stylistDetails
        },
        error: null
      };
    } else {
      return { 
        data: { 
          stripeAccountId: stylistDetails.stripe_account_id, 
          status: null, 
          isFullyOnboarded: false,
          profile,
          stylistDetails 
        }, 
        error: statusResult.error 
      };
    }
  } catch (error) {
    console.error("Error fetching Stripe account status:", error);
    return { 
      data: { 
        stripeAccountId: stylistDetails.stripe_account_id, 
        status: null, 
        isFullyOnboarded: false,
        profile,
        stylistDetails 
      }, 
      error: "Failed to fetch Stripe status" 
    };
  }
}

/**
 * Create Stripe customer for a user
 * Server action wrapper around service function
 */
export async function createStripeCustomer({
  profileId,
  email,
  fullName,
}: {
  profileId: string;
  email: string;
  fullName?: string;
}) {
  const supabase = await createClient();

  return await createCustomerWithDatabase({
    supabaseClient: supabase,
    profileId,
    email,
    fullName,
  });
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