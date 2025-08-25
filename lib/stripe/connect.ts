/**
 * Stripe Connect service functions
 *
 * These functions handle pure Stripe operations and can be called from:
 * - Server actions (with Supabase client)
 * - Standalone scripts (without request context)
 * - Background jobs
 */

import { getOnboardingUrls, stripe, STRIPE_CONNECT_CONFIG } from "./config";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type Stripe from "stripe";
import { calculatePlatformFee, PLATFORM_CONFIG } from "@/lib/platform-config";

// Common type for Stripe customer updates
export type StripeCustomerUpdateParams = Stripe.CustomerUpdateParams;

/**
 * Create a Stripe Connect account
 * Pure Stripe operation - no database interaction
 */
export async function createStripeConnectedAccount({
  email,
  name,
  address,
}: {
  email: string;
  name: string;
  address: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}) {
  const firstName = name.split(" ")[0];
  const lastName = name.split(" ").slice(1).join(" ");
  try {
    const account = await stripe.accounts.create({
      ...STRIPE_CONNECT_CONFIG,
      email,
      business_profile: {
        ...STRIPE_CONNECT_CONFIG.business_profile,
        name,
      },
      individual: {
        ...STRIPE_CONNECT_CONFIG.individual,
        first_name: firstName,
        last_name: lastName,
        address: {
          line1: address.addressLine1,
          line2: address.addressLine2,
          city: address.city,
          state: address.state,
          postal_code: address.postalCode,
          country: address.country,
        },
        email,
      },
    });

    return {
      data: {
        stripeAccountId: account.id,
        email,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error creating Stripe Connect account:", error);
    return {
      data: null,
      error: error instanceof Error
        ? error.message
        : "Failed to create Stripe account",
    };
  }
}

/**
 * Create account onboarding link
 * Pure Stripe operation - no database interaction
 */
export async function createStripeAccountOnboardingLink({
  stripeAccountId,
}: {
  stripeAccountId: string;
}) {
  try {
    const { return_url, refresh_url } = getOnboardingUrls();

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url,
      return_url,
      type: "account_onboarding",
    });

    return {
      data: {
        url: accountLink.url,
        stripeAccountId,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error creating account onboarding link:", error);
    return {
      data: null,
      error: error instanceof Error
        ? error.message
        : "Failed to create onboarding link",
    };
  }
}

/**
 * Get Stripe account status
 * Pure Stripe operation - no database interaction
 */
export async function getStripeAccountStatus({
  stripeAccountId,
}: {
  stripeAccountId: string;
}) {
  try {
    const account = await stripe.accounts.retrieve(stripeAccountId);

    return {
      data: {
        id: account.id,
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled,
        requirements: account.requirements,
        country: account.country,
        default_currency: account.default_currency,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error retrieving Stripe account status:", error);
    return {
      data: null,
      error: error instanceof Error
        ? error.message
        : "Failed to get account status",
    };
  }
}

/**
 * Save Stripe account ID to database
 * Database operation that can be called with any Supabase client
 */
export async function saveStripeAccountIdToDatabase({
  supabaseClient,
  profileId,
  stripeAccountId,
}: {
  supabaseClient: SupabaseClient<Database>;
  profileId: string;
  stripeAccountId: string;
}) {
  try {
    const { error } = await supabaseClient
      .from("stylist_details")
      .update({ stripe_account_id: stripeAccountId })
      .eq("profile_id", profileId);

    if (error) {
      console.error("Error saving Stripe account ID:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Unexpected error saving Stripe account ID:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create a Stripe customer for a user
 * Pure Stripe operation - no database interaction
 */
export async function createStripeCustomer({
  email,
  name,
  phone,
  metadata = {},
}: {
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
}) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      phone,
      preferred_locales: ["no"],
      metadata,
    });

    return {
      data: {
        customerId: customer.id,
        email: customer.email,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    return {
      data: null,
      error: error instanceof Error
        ? error.message
        : "Failed to create Stripe customer",
    };
  }
}

/**
 * Save Stripe customer ID to database
 * Database operation that can be called with any Supabase client
 */
export async function saveStripeCustomerIdToDatabase({
  supabaseClient,
  profileId,
  stripeCustomerId,
}: {
  supabaseClient: SupabaseClient<Database>;
  profileId: string;
  stripeCustomerId: string;
}) {
  try {
    const { error } = await supabaseClient
      .from("profiles")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", profileId);

    if (error) {
      console.error("Error saving Stripe customer ID:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Unexpected error saving Stripe customer ID:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Complete Connect account creation with database storage
 * Combines Stripe account creation with database storage
 * Can be called with any Supabase client (server or service client)
 */
export async function createConnectedAccountWithDatabase({
  supabaseClient,
  profileId,
  email,
  name,
  address,
}: {
  supabaseClient: SupabaseClient<Database>;
  profileId: string;
  email: string;
  name?: string;
  address?: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}) {
  // Step 1: Create Stripe account with proper parameters
  const stripeResult = await createStripeConnectedAccount({
    email,
    name: name || "Unknown", // Fallback name
    address: address || {
      addressLine1: "Unknown",
      addressLine2: "",
      city: "Unknown",
      state: "",
      postalCode: "0000",
      country: "NO",
    },
  });

  if (stripeResult.error || !stripeResult.data) {
    return {
      data: null,
      error: stripeResult.error,
    };
  }

  const stripeAccountId = stripeResult.data.stripeAccountId;

  // Step 2: Save to database
  const dbResult = await saveStripeAccountIdToDatabase({
    supabaseClient,
    profileId,
    stripeAccountId,
  });

  if (!dbResult.success) {
    console.error(
      "Stripe account created but failed to save to database:",
      stripeAccountId,
    );
    // Don't throw - the Stripe account was created successfully
  }

  return {
    data: {
      stripeAccountId,
      profileId,
      savedToDatabase: dbResult.success,
    },
    error: null,
  };
}

/**
 * Update Stripe customer
 * Pure Stripe operation - no database interaction
 */
export async function updateStripeCustomer({
  customerId,
  updateParams,
}: {
  customerId: string;
  updateParams: StripeCustomerUpdateParams;
}) {
  const shippingParams: Stripe.CustomerUpdateParams["shipping"] =
    updateParams.address && updateParams.name && updateParams.phone
      ? {
        name: updateParams.name,
        phone: updateParams.phone,
        address: updateParams.address,
      }
      : undefined;

  try {
    const customer = await stripe.customers.update(customerId, {
      ...updateParams,
      shipping: shippingParams,
    });

    return {
      data: {
        customerId: customer.id,
        customer,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error updating Stripe customer address:", error);
    return {
      data: null,
      error: error instanceof Error
        ? error.message
        : "Failed to update Stripe customer address",
    };
  }
}

export async function deleteStripeCustomerAddress({
  customerId,
}: {
  customerId: string;
}) {
  await stripe.customers.update(customerId, {
    address: undefined,
    shipping: undefined,
  });
}

/**
 * Complete customer creation with database storage
 * Creates both Stripe customer and saves to database
 * Stylists need to be customers too since they can purchase services
 */
export async function createCustomerWithDatabase({
  supabaseClient,
  profileId,
  email,
  fullName,
  phoneNumber,
}: {
  supabaseClient: SupabaseClient<Database>;
  profileId: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
}) {
  // Step 1: Create Stripe customer
  const customerResult = await createStripeCustomer({
    email,
    name: fullName,
    phone: phoneNumber,
    metadata: {
      profile_id: profileId,
      source: "marketplace_registration",
    },
  });

  if (customerResult.error || !customerResult.data) {
    return {
      data: null,
      error: customerResult.error,
    };
  }

  const stripeCustomerId = customerResult.data.customerId;

  // Step 2: Save to database
  const dbResult = await saveStripeCustomerIdToDatabase({
    supabaseClient,
    profileId,
    stripeCustomerId,
  });

  if (!dbResult.success) {
    console.error(
      "Stripe customer created but failed to save to database:",
      stripeCustomerId,
    );
    // Don't throw - the Stripe customer was created successfully
  }

  return {
    data: {
      stripeCustomerId,
      profileId,
      savedToDatabase: dbResult.success,
    },
    error: null,
  };
}

/**
 * Create a Stripe PaymentIntent for a booking with destination charges
 * Pure Stripe operation - no database interaction
 */
export async function createStripePaymentIntent({
  totalAmountNOK,
  stylistStripeAccountId,
  bookingId,
  customerId,
  stylistId,
  hasAffiliate = false,
  affiliateId,
  discountAmountNOK = 0,
  discountCode,
}: {
  totalAmountNOK: number;
  stylistStripeAccountId: string;
  bookingId: string;
  customerId: string;
  stylistId: string;
  hasAffiliate?: boolean;
  affiliateId?: string;
  discountAmountNOK?: number;
  discountCode?: string;
}) {
  try {
    // Apply discount to total amount
    const finalAmountNOK = Math.max(0, totalAmountNOK - discountAmountNOK);
    const finalAmountOre = Math.round(finalAmountNOK * 100);

    // Calculate fees
    const feeCalculation = calculatePlatformFee({
      totalAmountNOK: finalAmountNOK,
      hasAffiliate,
    });

    const applicationFeeOre = Math.round(feeCalculation.platformFeeNOK * 100);

    // Build metadata object with essential booking information
    const metadata: Record<string, string> = {
      booking_id: bookingId,
      customer_id: customerId,
      stylist_id: stylistId,
      original_amount_nok: totalAmountNOK.toString(),
      final_amount_nok: finalAmountNOK.toString(),
      platform_fee_nok: feeCalculation.platformFeeNOK.toString(),
      stylist_payout_nok: feeCalculation.stylistPayoutNOK.toString(),
    };

    // Add affiliate information if applicable
    if (hasAffiliate && affiliateId) {
      metadata.has_affiliate = "true";
      metadata.affiliate_id = affiliateId;
      metadata.affiliate_commission_nok = feeCalculation.affiliateCommissionNOK
        .toString();
    }

    // Add discount information if applicable
    if (discountAmountNOK > 0) {
      metadata.discount_amount_nok = discountAmountNOK.toString();
      if (discountCode) {
        metadata.discount_code = discountCode;
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmountOre,
      currency: PLATFORM_CONFIG.payment.defaultCurrency.toLowerCase(),
      application_fee_amount: applicationFeeOre,
      transfer_data: {
        destination: stylistStripeAccountId,
      },
      capture_method: "manual", // Will be captured by cron job before appointment
      metadata,
      // Add description for better tracking
      description: `Booking ${bookingId} - Stylist services`,
    });

    return {
      data: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amountOre: finalAmountOre,
        amountNOK: finalAmountNOK,
        applicationFeeOre,
        applicationFeeNOK: feeCalculation.platformFeeNOK,
        stylistPayoutNOK: feeCalculation.stylistPayoutNOK,
        affiliateCommissionNOK: feeCalculation.affiliateCommissionNOK,
        discountAmountNOK,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error creating Stripe PaymentIntent:", error);
    return {
      data: null,
      error: error instanceof Error
        ? error.message
        : "Failed to create payment intent",
    };
  }
}

/**
 * Capture a PaymentIntent manually
 * This will be called by cron job 24 hours before appointment
 * Pure Stripe operation - no database interaction
 */
export async function captureStripePaymentIntent({
  paymentIntentId,
}: {
  paymentIntentId: string;
}) {
  try {
    const paymentIntent = await stripe.paymentIntents.capture(
      paymentIntentId,
    );

    return {
      data: {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        capturedAt: new Date().toISOString(),
        amountCaptured: paymentIntent.amount_received,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error capturing PaymentIntent:", error);
    return {
      data: null,
      error: error instanceof Error
        ? error.message
        : "Failed to capture payment",
    };
  }
}

/**
 * Cancel a PaymentIntent
 * Used when booking is cancelled before capture
 * Pure Stripe operation - no database interaction
 */
export async function cancelStripePaymentIntent({
  paymentIntentId,
  cancellationReason,
}: {
  paymentIntentId: string;
  cancellationReason?: Stripe.PaymentIntentCancelParams.CancellationReason;
}) {
  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId, {
      cancellation_reason: cancellationReason,
    });

    return {
      data: {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        cancelledAt: new Date().toISOString(),
      },
      error: null,
    };
  } catch (error) {
    console.error("Error cancelling PaymentIntent:", error);
    return {
      data: null,
      error: error instanceof Error
        ? error.message
        : "Failed to cancel payment",
    };
  }
}

/**
 * Create a refund for a captured PaymentIntent
 * Pure Stripe operation - no database interaction
 */
export async function createStripeRefund({
  paymentIntentId,
  amountOre,
  reason,
}: {
  paymentIntentId: string;
  amountOre?: number; // If not provided, refunds full amount
  reason?: string;
}) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amountOre,
      reason: reason as Stripe.RefundCreateParams.Reason,
    });

    return {
      data: {
        refundId: refund.id,
        paymentIntentId,
        status: refund.status,
        amountRefunded: refund.amount,
        createdAt: new Date(refund.created * 1000).toISOString(),
      },
      error: null,
    };
  } catch (error) {
    console.error("Error creating refund:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create refund",
    };
  }
}
