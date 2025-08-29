"use server";

import { createClient } from "@/lib/supabase/server";
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
export async function getAllPayments() {
  await requireAdmin();
  
  console.log("🔍 getAllPayments: Starting to fetch payments...");

  const supabase = await createClient();

  try {
    const { data: payments, error } = await supabase
      .from("payments")
      .select(`
        *,
        booking:bookings(
          id,
          start_time,
          customer:profiles!bookings_customer_id_fkey(
            id,
            full_name,
            email
          ),
          stylist:profiles!bookings_stylist_id_fkey(
            id,
            full_name,
            email
          )
        )
      `)
      .order("created_at", { ascending: false });

    console.log("📊 getAllPayments: Raw Supabase response:", { 
      dataLength: payments?.length || 0,
      error: error?.message || null,
      firstPayment: payments?.[0] || null
    });

    if (error) {
      console.error("❌ getAllPayments: Error fetching payments:", error);
      throw error;
    }

    // Transform the data to flatten the structure
    const transformedPayments: PaymentWithDetails[] = (payments || []).map(
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
        customer_id: payment.booking?.customer?.id || "",
        customer_name: payment.booking?.customer?.full_name || "Ukjent kunde",
        customer_email: payment.booking?.customer?.email || "",
        stylist_id: payment.booking?.stylist?.id || "",
        stylist_name: payment.booking?.stylist?.full_name || "Ukjent stylist",
        stylist_email: payment.booking?.stylist?.email || "",
        booking_date: payment.booking?.start_time || new Date().toISOString(),
      }),
    );

    console.log("✅ getAllPayments: Transformed payments:", {
      originalCount: payments?.length || 0,
      transformedCount: transformedPayments.length,
      sampleTransformed: transformedPayments.slice(0, 2)
    });

    return { data: transformedPayments, error: null };
  } catch (error) {
    console.error("Error in getAllPayments:", error);
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

  const supabase = await createClient();

  try {
    const { data: payment, error } = await supabase
      .from("payments")
      .select(`
        *,
        booking:bookings!inner(
          *,
          customer:profiles!bookings_customer_id_fkey(*),
          stylist:profiles!bookings_stylist_id_fkey(*),
          booking_services(
            service:services(*)
          )
        )
      `)
      .eq("id", paymentId)
      .single();

    if (error) {
      console.error("Error fetching payment details:", error);
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
    console.error("Error fetching Stripe payment intent:", error);
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
export async function initiateRefund({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  paymentIntentId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  amount,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reason,
}: {
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
