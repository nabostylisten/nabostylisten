"use server";

import { createClient } from "@/lib/supabase/server";
import {
  cancelStripePaymentIntent,
  captureStripePaymentIntent,
  createConnectedAccountWithDatabase,
  createCustomerWithDatabase,
  createIdentityVerificationSession,
  createStripeAccountOnboardingLink,
  createStripeExpressDashboardLink,
  createStripePaymentIntent,
  createStripeRefund,
  deleteStripeCustomerAddress,
  getIdentityVerificationSessionStatus,
  getStripeAccountStatus as getStripeAccountStatusService,
  type StripeCustomerUpdateParams,
  updateStripeCustomer,
} from "@/lib/stripe/connect";
import { getPublicUrl } from "@/lib/utils";
import { canCreateServices } from "@/lib/stylist-onboarding-status";
import { stripe } from "@/lib/stripe/config";

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
 * Called by scheduled job/cron 24 hours before appointment
 * Server action wrapper around service function
 */
export async function capturePaymentBeforeAppointment(bookingId: string) {
  const supabase = await createClient();

  try {
    // Get booking details with payment intent ID
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        customer:profiles!bookings_customer_id_fkey(
          id,
          full_name,
          email
        ),
        stylist:profiles!bookings_stylist_id_fkey(
          id,
          full_name
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return { data: null, error: "Booking not found" };
    }

    if (!booking.stripe_payment_intent_id) {
      return { data: null, error: "No payment intent found for booking" };
    }

    // Check if payment has already been captured by looking at payments table
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("captured_at")
      .eq("booking_id", bookingId)
      .single();

    if (existingPayment?.captured_at) {
      return { data: null, error: "Payment already captured for this booking" };
    }

    // Capture the payment using Stripe
    const captureResult = await captureStripePaymentIntent({
      paymentIntentId: booking.stripe_payment_intent_id,
    });

    if (captureResult.error || !captureResult.data) {
      return {
        data: null,
        error: captureResult.error || "Failed to capture payment with Stripe",
      };
    }

    // Update booking status to confirmed after payment capture
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "confirmed", // Ensure status is confirmed after payment capture
      })
      .eq("id", bookingId);

    if (updateError) {
      console.error(
        "Failed to update booking after payment capture:",
        updateError,
      );
      return {
        data: null,
        error: "Payment captured but failed to update booking record",
      };
    }

    // Update payment record status if exists
    const { error: paymentUpdateError } = await supabase
      .from("payments")
      .update({
        status: "succeeded",
        captured_at: captureResult.data.capturedAt,
        succeeded_at: captureResult.data.capturedAt,
      })
      .eq("booking_id", bookingId);

    if (paymentUpdateError) {
      console.error("Failed to update payment record:", paymentUpdateError);
      // Don't return error here since payment was successfully captured
    }

    // Track affiliate commission if payment has affiliate data
    try {
      const { trackAffiliateCommission } = await import(
        "@/server/affiliate/affiliate-commission.actions"
      );
      const commissionResult = await trackAffiliateCommission(bookingId);

      if (commissionResult.error) {
        console.error(
          "Failed to track affiliate commission:",
          commissionResult.error,
        );
        // Don't fail the entire operation - commission tracking is supplementary
      } else if (commissionResult.data) {
        console.log(
          "✅ Affiliate commission tracked successfully:",
          commissionResult.data.id,
        );
      }
    } catch (commissionError) {
      console.error("Error tracking affiliate commission:", commissionError);
      // Don't fail the entire operation - commission tracking is supplementary
    }

    return {
      data: {
        bookingId,
        paymentIntentId: captureResult.data.paymentIntentId,
        status: captureResult.data.status,
        capturedAt: captureResult.data.capturedAt,
        amountCaptured: captureResult.data.amountCaptured,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error in capturePaymentBeforeAppointment:", error);
    return {
      data: null,
      error: "An unexpected error occurred while capturing payment",
    };
  }
}

/**
 * Process refund for cancelled booking
 * Handles both uncaptured (cancel) and captured (refund) payments
 */
export async function processRefund({
  bookingId,
  paymentIntentId,
  refundAmountNOK,
  refundReason,
  stylistCompensationNOK = 0,
}: {
  bookingId: string;
  paymentIntentId: string;
  refundAmountNOK: number;
  refundReason: string;
  stylistCompensationNOK?: number;
}) {
  const supabase = await createClient();

  try {
    // Get payment record from database
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("booking_id", bookingId)
      .single();

    if (paymentError || !payment) {
      console.error("Payment record not found for booking:", bookingId);
      // Try to proceed without payment record (might be legacy booking)
    }

    // Get PaymentIntent status from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    let refundResult;
    const refundAmountOre = Math.round(refundAmountNOK * 100);

    // Check if payment has been captured
    if (
      paymentIntent.status === "requires_capture" ||
      paymentIntent.status === "requires_payment_method"
    ) {
      // Payment not yet captured - cancel the PaymentIntent
      refundResult = await cancelStripePaymentIntent({
        paymentIntentId,
        cancellationReason: "requested_by_customer",
      });

      if (refundResult.error) {
        return {
          data: null,
          error: `Failed to cancel payment: ${refundResult.error}`,
        };
      }

      // Update payment record if exists
      if (payment) {
        await supabase
          .from("payments")
          .update({
            status: "cancelled",
            refunded_amount: refundAmountNOK,
            refund_reason: refundReason,
          })
          .eq("id", payment.id);
      }

      // Reverse affiliate commission if one exists for this booking (for cancelled payments)
      try {
        const { reverseAffiliateCommission } = await import(
          "@/server/affiliate/affiliate-commission.actions"
        );
        const commissionReversalResult = await reverseAffiliateCommission(bookingId);
        
        if (commissionReversalResult.error) {
          console.error("Failed to reverse affiliate commission:", commissionReversalResult.error);
          // Don't fail the cancellation if commission reversal fails - log and continue
        } else if (commissionReversalResult.data) {
          console.log("✅ Affiliate commission reversed successfully for cancelled payment:", commissionReversalResult.data.id);
        }
      } catch (commissionError) {
        console.error("Error reversing affiliate commission:", commissionError);
        // Don't fail the cancellation if commission reversal fails
      }

      return {
        data: {
          refundId: null,
          refundAmountNOK,
          method: "cancelled",
          status: "cancelled",
        },
        error: null,
      };
    } else if (paymentIntent.status === "succeeded") {
      // Payment has been captured - create a refund
      if (refundAmountOre > 0) {
        refundResult = await createStripeRefund({
          paymentIntentId,
          amountOre: refundAmountOre,
          reason: "requested_by_customer",
        });

        if (refundResult.error) {
          return {
            data: null,
            error: `Failed to create refund: ${refundResult.error}`,
          };
        }

        // Update payment record if exists
        if (payment) {
          const newRefundedAmount = (payment.refunded_amount || 0) +
            refundAmountNOK;
          await supabase
            .from("payments")
            .update({
              refunded_amount: newRefundedAmount,
              refund_reason: refundReason,
            })
            .eq("id", payment.id);
        }

        // Handle stylist compensation for partial refunds
        if (stylistCompensationNOK > 0 && payment) {
          // Get stylist stripe account from booking
          const { data: booking } = await supabase
            .from("bookings")
            .select(`
              stylist:profiles!bookings_stylist_id_fkey(
                stylist_details(stripe_account_id)
              )
            `)
            .eq("id", bookingId)
            .single();

          if (booking?.stylist?.stylist_details?.stripe_account_id) {
            // Create a transfer to stylist for their compensation
            // This is the 50% they keep when customer cancels 24-48h before
            try {
              const compensationOre = Math.round(stylistCompensationNOK * 100);
              const transfer = await stripe.transfers.create({
                amount: compensationOre,
                currency: "nok",
                destination: booking.stylist.stylist_details.stripe_account_id,
                description: `Compensation for cancelled booking ${bookingId}`,
                metadata: {
                  booking_id: bookingId,
                  type: "cancellation_compensation",
                  original_payment_intent: paymentIntentId,
                },
              });

              console.log(
                "Stylist compensation transfer created:",
                transfer.id,
              );
            } catch (transferError) {
              console.error(
                "Failed to create stylist compensation transfer:",
                transferError,
              );
              // Don't fail the refund if compensation transfer fails
            }
          }
        }

        // Reverse affiliate commission if one exists for this booking
        try {
          const { reverseAffiliateCommission } = await import(
            "@/server/affiliate/affiliate-commission.actions"
          );
          const commissionReversalResult = await reverseAffiliateCommission(bookingId);
          
          if (commissionReversalResult.error) {
            console.error("Failed to reverse affiliate commission:", commissionReversalResult.error);
            // Don't fail the refund if commission reversal fails - log and continue
          } else if (commissionReversalResult.data) {
            console.log("✅ Affiliate commission reversed successfully:", commissionReversalResult.data.id);
          }
        } catch (commissionError) {
          console.error("Error reversing affiliate commission:", commissionError);
          // Don't fail the refund if commission reversal fails
        }

        return {
          data: {
            refundId: refundResult.data?.refundId,
            refundAmountNOK,
            stylistCompensationNOK,
            method: "refunded",
            status: refundResult.data?.status,
          },
          error: null,
        };
      } else {
        // No refund amount but payment was captured (customer gets nothing)
        return {
          data: {
            refundId: null,
            refundAmountNOK: 0,
            stylistCompensationNOK: 0,
            method: "no_refund",
            status: "no_refund_due",
          },
          error: null,
        };
      }
    } else {
      // Payment in unexpected state
      return {
        data: null,
        error: `Payment in unexpected state: ${paymentIntent.status}`,
      };
    }
  } catch (error) {
    console.error("Error processing refund:", error);
    return {
      data: null,
      error: error instanceof Error
        ? error.message
        : "Failed to process refund",
    };
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
      console.error(
        "Authentication error in getCurrentUserStripeStatus:",
        authError,
      );
      return {
        data: null,
        error: "Du må være logget inn for å se inntektsinformasjon.",
      };
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
      return {
        data: null,
        error: "Kun stylister har tilgang til inntektsinformasjon.",
      };
    }

    // Get stylist details to check for Stripe account and identity verification
    const { data: stylistDetails, error: stylistError } = await supabase
      .from("stylist_details")
      .select(
        "*, stripe_verification_session_id, identity_verification_completed_at",
      )
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
      // Use the new canCreateServices function to determine if fully onboarded
      const isFullyOnboarded = canCreateServices(
        statusResult.data,
        stylistDetails.identity_verification_completed_at,
      );

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
      console.error(
        "Error fetching Stripe account status:",
        statusResult.error,
      );
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
      console.error(
        "Authentication error in createExpressDashboardLink:",
        authError,
      );
      return {
        data: null,
        error: "Du må være logget inn for å få tilgang til dashboard.",
      };
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
      console.error(
        "Error creating Stripe Express Dashboard link:",
        result.error,
      );
      return {
        data: null,
        error: "Kunne ikke opprette tilgang til dashboard. Prøv igjen senere.",
      };
    }

    return result;
  } catch (error) {
    console.error("Unexpected error in createExpressDashboardLink:", error);
    return { data: null, error: "En uventet feil oppstod. Prøv igjen senere." };
  }
}

/**
 * Create identity verification session for the current user
 * Server action wrapper around service function
 */
export async function createIdentityVerificationForCurrentUser() {
  const supabase = await createClient();

  try {
    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: "Du må være logget inn for å starte identitetsverifisering.",
      };
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || !profile.email) {
      return {
        data: null,
        error: "Kunne ikke finne brukerprofil eller e-postadresse.",
      };
    }

    // Check if user is a stylist
    if (profile.role !== "stylist") {
      return {
        data: null,
        error: "Kun stylister kan utføre identitetsverifisering.",
      };
    }

    // Get stylist details
    const { data: stylistDetails, error: stylistError } = await supabase
      .from("stylist_details")
      .select(
        "stripe_verification_session_id, identity_verification_completed_at",
      )
      .eq("profile_id", user.id)
      .single();

    if (stylistError || !stylistDetails) {
      return { data: null, error: "Kunne ikke finne stylistinformasjon." };
    }

    // Check if verification is already completed
    if (stylistDetails.identity_verification_completed_at) {
      return {
        data: null,
        error: "Identitetsverifisering er allerede fullført.",
      };
    }

    // If there's an existing session, check its status
    if (stylistDetails.stripe_verification_session_id) {
      const statusResult = await getIdentityVerificationSessionStatus({
        sessionId: stylistDetails.stripe_verification_session_id,
      });

      console.log({ statusResult });

      if (statusResult.data?.status === "verified") {
        // If verification is verified but not marked as completed in DB, update it
        if (!stylistDetails.identity_verification_completed_at) {
          const { error: updateError } = await supabase
            .from("stylist_details")
            .update({
              identity_verification_completed_at: new Date().toISOString(),
            })
            .eq("profile_id", user.id);

          if (updateError) {
            console.error(
              "Failed to update verification completion:",
              updateError,
            );
          }
        }

        return {
          data: null,
          error: "Identitetsverifisering er allerede fullført.",
        };
      }

      if (statusResult.data?.status === "processing") {
        // For processing status, we can't get the URL from status check
        // User needs to wait or create a new session
        return {
          data: null,
          error:
            "Identitetsverifisering behandles. Vennligst vent på at prosessen fullføres.",
        };
      }

      // If status is requires_input or failed, we'll create a new session
    }

    // Create verification session
    const verificationResult = await createIdentityVerificationSession({
      profileId: user.id,
      email: profile.email,
      returnUrl:
        `${getPublicUrl()}/stylist/stripe/identity-verification/return`,
    });

    if (verificationResult.error || !verificationResult.data) {
      return { data: null, error: verificationResult.error };
    }

    // Store session ID in database (replace any existing session ID)
    const { error: updateError } = await supabase
      .from("stylist_details")
      .update({
        stripe_verification_session_id: verificationResult.data.sessionId,
        identity_verification_completed_at: null, // Reset completion status for new session
      })
      .eq("profile_id", user.id);

    if (updateError) {
      console.error("Failed to store verification session ID:", updateError);
      return {
        data: null,
        error: "Kunne ikke lagre verifiseringssesjon.",
      };
    }

    return {
      data: {
        verificationUrl: verificationResult.data.url,
        sessionId: verificationResult.data.sessionId,
      },
      error: null,
    };
  } catch (error) {
    console.error(
      "Unexpected error in createIdentityVerificationForCurrentUser:",
      error,
    );
    return {
      data: null,
      error: "En uventet feil oppstod. Prøv igjen senere.",
    };
  }
}

/**
 * Check identity verification status for the current user
 * Server action wrapper around service function
 */
export async function checkIdentityVerificationStatus() {
  const supabase = await createClient();

  try {
    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Not authenticated" };
    }

    // Get stylist details with verification info
    const { data: stylistDetails, error: stylistError } = await supabase
      .from("stylist_details")
      .select(
        "stripe_verification_session_id, identity_verification_completed_at",
      )
      .eq("profile_id", user.id)
      .single();

    if (stylistError || !stylistDetails) {
      return { data: null, error: "Stylist details not found" };
    }

    if (!stylistDetails.stripe_verification_session_id) {
      return {
        data: {
          status: "not_started",
          hasSession: false,
          completedAt: null,
        },
        error: null,
      };
    }

    // Get session status from Stripe
    const sessionResult = await getIdentityVerificationSessionStatus({
      sessionId: stylistDetails.stripe_verification_session_id,
    });

    return {
      data: {
        status: sessionResult.data?.status || "unknown",
        hasSession: true,
        completedAt: stylistDetails.identity_verification_completed_at,
        sessionData: sessionResult.data,
      },
      error: sessionResult.error,
    };
  } catch (error) {
    console.error("Error checking identity verification status:", error);
    return {
      data: null,
      error: "Failed to check verification status",
    };
  }
}
