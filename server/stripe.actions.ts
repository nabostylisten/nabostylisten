"use server";

import { createClient } from "@/lib/supabase/server";
import {
  cancelStripePaymentIntent,
  captureStripePaymentIntent,
  createConnectedAccountWithDatabase,
  createCustomerWithDatabase,
  createStripeAccountOnboardingLink,
  createStripeExpressDashboardLink,
  createStripePaymentIntent,
  createStripeRefund,
  deleteStripeCustomerAddress,
  getStripeAccountStatus as getStripeAccountStatusService,
  type StripeCustomerUpdateParams,
  updateStripeCustomer,
} from "@/lib/stripe/connect";

// TODO: Implement Stripe-related server actions

/**
 * Create a Stripe PaymentIntent for a booking with destination charges
 * Server action wrapper around service function
 */
export async function createPaymentIntent({
  bookingId,
  totalAmountNOK,
  discountAmountNOK = 0,
  discountCode,
  affiliateId,
}: {
  bookingId: string;
  totalAmountNOK: number;
  discountAmountNOK?: number;
  discountCode?: string;
  affiliateId?: string;
}) {
  const supabase = await createClient();

  try {
    // Get booking details with stylist information
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        stylist:profiles!bookings_stylist_id_fkey(
          id,
          full_name,
          stylist_details(stripe_account_id)
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return { data: null, error: "Booking not found" };
    }

    // Check if stylist has Stripe account
    const stylistStripeAccountId = booking.stylist?.stylist_details
      ?.stripe_account_id;
    if (!stylistStripeAccountId) {
      return {
        data: null,
        error: "Stylist has not completed Stripe onboarding",
      };
    }

    // Create PaymentIntent using service function
    const paymentIntentResult = await createStripePaymentIntent({
      totalAmountNOK,
      stylistStripeAccountId,
      bookingId,
      customerId: booking.customer_id,
      stylistId: booking.stylist_id,
      hasAffiliate: !!affiliateId,
      affiliateId,
      discountAmountNOK,
      discountCode,
    });

    if (paymentIntentResult.error || !paymentIntentResult.data) {
      return {
        data: null,
        error: paymentIntentResult.error || "Failed to create payment intent",
      };
    }

    // Update booking with payment intent ID
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        stripe_payment_intent_id: paymentIntentResult.data.paymentIntentId,
        // Update total_price to reflect final amount after discounts
        total_price: paymentIntentResult.data.amountNOK,
      })
      .eq("id", bookingId);

    if (updateError) {
      console.error(
        "Failed to update booking with payment intent:",
        updateError,
      );
      // TODO: Consider cancelling the PaymentIntent if database update fails
    }

    // TODO: Create payment record for tracking
    // This will be implemented when we update the database schema

    return {
      data: {
        clientSecret: paymentIntentResult.data.clientSecret,
        paymentIntentId: paymentIntentResult.data.paymentIntentId,
        amountNOK: paymentIntentResult.data.amountNOK,
        platformFeeNOK: paymentIntentResult.data.applicationFeeNOK,
        stylistPayoutNOK: paymentIntentResult.data.stylistPayoutNOK,
        affiliateCommissionNOK: paymentIntentResult.data.affiliateCommissionNOK,
        discountAmountNOK: paymentIntentResult.data.discountAmountNOK,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error in createPaymentIntent:", error);
    return {
      data: null,
      error: "An unexpected error occurred while creating payment intent",
    };
  }
}

/**
 * Capture payment before appointment
 * TODO: This should be called by a scheduled job/cron
 * Server action wrapper around service function
 */
export async function capturePaymentBeforeAppointment(bookingId: string) {
  const supabase = await createClient();

  try {
    // TODO: Get booking and payment intent details
    // TODO: Verify it's N hours before appointment, see PLATFORM_CONFIG
    // TODO: Use captureStripePaymentIntent service function
    // TODO: Update booking and payment records in database
    // TODO: Send confirmation emails to customer and stylist

    return { data: null, error: "Capture flow not yet implemented" };
  } catch (error) {
    console.error("Error capturing payment:", error);
    return { data: null, error: "Failed to capture payment" };
  }
}

/**
 * Process refund for cancelled booking
 * Server action wrapper around service function
 */
export async function processRefund(bookingId: string, reason?: string) {
  const supabase = await createClient();

  try {
    // TODO: Get booking and payment details
    // TODO: Check refund eligibility (N+ hours before appointment)
    // TODO: Calculate refund amount based on cancellation timing
    // TODO: Use createStripeRefund or cancelStripePaymentIntent service functions
    // TODO: Update booking and payment records
    // TODO: Send refund confirmation email

    return { data: null, error: "Refund flow not yet implemented" };
  } catch (error) {
    console.error("Error processing refund:", error);
    return { data: null, error: "Failed to process refund" };
  }
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

export type GetStripeAccountStatusResult = Awaited<
  ReturnType<typeof getStripeAccountStatus>
>;

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

  try {
    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error in getCurrentUserStripeStatus:", authError);
      return { data: null, error: "Du må være logget inn for å se inntektsinformasjon." };
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching profile:", profileError);
      return { data: null, error: "Kunne ikke finne brukerprofil." };
    }

    // Check if user is a stylist
    if (profile.role !== "stylist") {
      return { data: null, error: "Kun stylister har tilgang til inntektsinformasjon." };
    }

    // Get stylist details to check for Stripe account
    const { data: stylistDetails, error: stylistError } = await supabase
      .from("stylist_details")
      .select("*")
      .eq("profile_id", user.id)
      .single();

    if (stylistError || !stylistDetails) {
      console.error("Error fetching stylist details:", stylistError);
      return { data: null, error: "Kunne ikke finne stylistinformasjon." };
    }

    if (!stylistDetails.stripe_account_id) {
      return {
        data: {
          stripeAccountId: null,
          status: null,
          isFullyOnboarded: false,
          profile,
          stylistDetails,
        },
        error: null,
      };
    }

    const statusResult = await getStripeAccountStatusService({
      stripeAccountId: stylistDetails.stripe_account_id,
    });

    if (statusResult.data) {
      const isFullyOnboarded = statusResult.data.charges_enabled &&
        statusResult.data.details_submitted &&
        statusResult.data.payouts_enabled;

      return {
        data: {
          stripeAccountId: stylistDetails.stripe_account_id,
          status: statusResult.data,
          isFullyOnboarded,
          profile,
          stylistDetails,
        },
        error: null,
      };
    } else {
      console.error("Error fetching Stripe account status:", statusResult.error);
      return {
        data: {
          stripeAccountId: stylistDetails.stripe_account_id,
          status: null,
          isFullyOnboarded: false,
          profile,
          stylistDetails,
        },
        error: "Kunne ikke hente status fra Stripe. Prøv igjen senere.",
      };
    }
  } catch (error) {
    console.error("Unexpected error in getCurrentUserStripeStatus:", error);
    return {
      data: null,
      error: "En uventet feil oppstod. Prøv igjen senere.",
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
  phoneNumber,
}: {
  profileId: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
}) {
  const supabase = await createClient();

  return await createCustomerWithDatabase({
    supabaseClient: supabase,
    profileId,
    email,
    fullName,
    phoneNumber,
  });
}

/**
 * Transfer funds to stylist after successful payment
 * TODO: Implement when Stripe Connect is configured
 */
export async function transferToStylist(
  paymentIntentId: string,
  bookingId: string,
) {
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

/**
 * Update Stripe customer
 * Server action wrapper around service function
 */
export async function updateStripeCustomerAction({
  customerId,
  updateParams,
}: {
  customerId: string;
  updateParams: StripeCustomerUpdateParams;
}) {
  return await updateStripeCustomer({
    customerId,
    updateParams,
  });
}

/**
 * Delete Stripe customer address
 * Server action wrapper around service function
 */
export async function deleteStripeCustomerAddressAction({
  customerId,
}: {
  customerId: string;
}) {
  return await deleteStripeCustomerAddress({ customerId });
}

/**
 * Create Express Dashboard login link for stylist
 * Server action wrapper around service function
 * Only allows stylists to access their own dashboard
 */
export async function createExpressDashboardLink({
  stripeAccountId,
}: {
  stripeAccountId: string;
}) {
  const supabase = await createClient();

  try {
    // Verify user is authenticated and owns the Stripe account
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error in createExpressDashboardLink:", authError);
      return { data: null, error: "Du må være logget inn for å få tilgang til dashboard." };
    }

    // Check if user is a stylist and owns this Stripe account
    const { data: stylistDetails, error: stylistError } = await supabase
      .from("stylist_details")
      .select("stripe_account_id")
      .eq("profile_id", user.id)
      .single();

    if (stylistError || !stylistDetails) {
      console.error("Error fetching stylist details:", stylistError);
      return { data: null, error: "Kunne ikke finne stylistinformasjon." };
    }

    if (stylistDetails.stripe_account_id !== stripeAccountId) {
      console.error("Unauthorized Stripe account access attempt:", {
        userId: user.id,
        requestedAccount: stripeAccountId,
        ownedAccount: stylistDetails.stripe_account_id,
      });
      return { data: null, error: "Du har ikke tilgang til denne kontoen." };
    }

    const result = await createStripeExpressDashboardLink({ stripeAccountId });
    
    if (result.error) {
      console.error("Error creating Stripe Express Dashboard link:", result.error);
      return { data: null, error: "Kunne ikke opprette tilgang til dashboard. Prøv igjen senere." };
    }

    return result;
  } catch (error) {
    console.error("Unexpected error in createExpressDashboardLink:", error);
    return { data: null, error: "En uventet feil oppstod. Prøv igjen senere." };
  }
}
