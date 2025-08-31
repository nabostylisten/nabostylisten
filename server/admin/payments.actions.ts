"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/server/admin/middleware";
import { stripe } from "@/lib/stripe/config";
import type Stripe from "stripe";
import type { Database } from "@/types/database.types";

// Type-safe payment status
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];

export type PaymentWithDetails = {
  id: string;
  created_at: string;
  updated_at: string;
  booking_id: string;
  payment_intent_id: string;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  platform_fee: number;
  stylist_payout: number;
  affiliate_commission: number;
  currency: string;
  discount_code: string | null;
  status: PaymentStatus;
  captured_at: string | null;
  succeeded_at: string | null;
  refunded_amount: number;
  refund_reason: string | null;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  stylist_id: string;
  stylist_name: string;
  stylist_email: string;
  booking_date: string;
  stripe_status?: string;
  stripe_amount?: number;
  stripe_charge_id?: string;
};

/**
 * Get all payments with customer and stylist details
 */
export async function getAllPayments(options: {
  searchTerm?: string;
  statusFilter?: string;
  limit?: number;
  offset?: number;
} = {}) {
  await requireAdmin();

  // Use service client to bypass RLS for admin operations
  const supabase = createServiceClient();

  try {
    // See get_admin_payments in supabase/schemas/00-schema.sql for definition
    const { data: payments, error } = await supabase.rpc("get_admin_payments", {
      search_term: options.searchTerm || undefined,
      status_filter: options.statusFilter || undefined,
      limit_count: options.limit || 20,
      offset_count: options.offset || 0,
    });

    if (error) {
      console.error("❌ getAllPayments: Error fetching payments:", error);
      throw error;
    }

    if (!payments) {
      return { data: [], error: null };
    }

    // Transform the data to match our expected interface
    const transformedPayments: PaymentWithDetails[] = payments.map(
      (payment) => ({
        id: payment.id,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        booking_id: payment.booking_id,
        payment_intent_id: payment.payment_intent_id,
        original_amount: Number(payment.original_amount),
        discount_amount: Number(payment.discount_amount),
        final_amount: Number(payment.final_amount),
        platform_fee: Number(payment.platform_fee),
        stylist_payout: Number(payment.stylist_payout),
        affiliate_commission: Number(payment.affiliate_commission),
        currency: payment.currency,
        discount_code: payment.discount_code,
        status: payment.status,
        captured_at: payment.captured_at,
        succeeded_at: payment.succeeded_at,
        refunded_amount: Number(payment.refunded_amount),
        refund_reason: payment.refund_reason,
        customer_id: payment.customer_id,
        customer_name: payment.customer_name || "Ukjent kunde",
        customer_email: payment.customer_email || "",
        stylist_id: payment.stylist_id,
        stylist_name: payment.stylist_name || "Ukjent stylist",
        stylist_email: payment.stylist_email || "",
        booking_date: payment.booking_date,
      }),
    );

    return { data: transformedPayments, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error
        ? error.message
        : "Failed to fetch payments",
    };
  }
}

/**
 * Get detailed payment information including Stripe data
 */
export async function getPaymentDetails(paymentId: string) {
  await requireAdmin();

  // Use service client for admin operations to bypass RLS
  const supabase = createServiceClient();

  try {
    const { data: payment, error } = await supabase
      .from("payments")
      .select(`
        *,
        booking:bookings!inner(
          *,
          customer:profiles!customer_id(*),
          stylist:profiles!stylist_id(*),
          booking_services(
            service:services(*)
          )
        )
      `)
      .eq("id", paymentId)
      .single();

    if (error) {
      throw error;
    }

    // Fetch live Stripe data if payment intent exists
    let stripeData = null;
    if (payment.payment_intent_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          payment.payment_intent_id,
          {
            expand: ["latest_charge"],
          },
        );

        stripeData = {
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          charge_id: (paymentIntent.latest_charge as Stripe.Charge)?.id,
          receipt_url: (paymentIntent.latest_charge as Stripe.Charge)
            ?.receipt_url,
          created: paymentIntent.created,
          description: paymentIntent.description,
        };
      } catch (stripeError) {
        console.error("Error fetching Stripe data:", stripeError);
        // Continue without Stripe data if fetch fails
      }
    }

    return {
      data: {
        ...payment,
        stripe: stripeData,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error in getPaymentDetails:", error);
    return {
      data: null,
      error: error instanceof Error
        ? error.message
        : "Failed to fetch payment details",
    };
  }
}

/**
 * Get live payment intent data from Stripe
 */
export async function getStripePaymentIntent(paymentIntentId: string) {
  await requireAdmin();

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId,
      {
        expand: ["latest_charge", "customer", "application"],
      },
    );

    return { data: paymentIntent, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error
        ? error.message
        : "Failed to fetch Stripe data",
    };
  }
}

/**
 * Initiate a refund for a payment (stub for future implementation)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function initiateRefund(_params: {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
}) {
  await requireAdmin();

  // TODO: Implement refund logic
  // This will involve:
  // 1. Creating refund in Stripe
  // 2. Updating payment record in database
  // 3. Updating booking status if fully refunded
  // 4. Sending notification emails

  return {
    data: null,
    error: "Refund functionality not yet implemented",
  };
}

/**
 * Get payment counts by status for the admin dashboard
 */
export async function getPaymentCountsByStatus() {
  await requireAdmin();

  const supabase = createServiceClient();

  try {
    const { data: payments, error } = await supabase
      .from("payments")
      .select("status, refunded_amount");

    if (error) {
      console.error("Error fetching payment counts:", error);
      return {
        data: {
          all: 0,
          pending: 0,
          processing: 0,
          succeeded: 0,
          canceled: 0,
          refunded: 0,
        },
        error: null,
      };
    }

    const counts = {
      all: payments?.length || 0,
      pending: 0,
      processing: 0,
      succeeded: 0,
      canceled: 0,
      refunded: 0,
    };

    payments?.forEach((payment) => {
      const status = payment.status;
      if (status === "pending") counts.pending++;
      else if (["requires_payment_method", "requires_confirmation", "requires_action", "processing", "requires_capture"].includes(status)) {
        counts.processing++;
      }
      else if (status === "succeeded") counts.succeeded++;
      else if (status === "cancelled") counts.canceled++;
      
      // Check for refunds separately based on refunded_amount
      if (payment.refunded_amount > 0) counts.refunded++;
    });

    return { data: counts, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error
        ? error.message
        : "Failed to fetch payment counts",
    };
  }
}
