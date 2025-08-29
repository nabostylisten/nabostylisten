"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/server/admin/middleware";
import { stripe } from "@/lib/stripe/config";
import type Stripe from "stripe";
import type { Database } from "@/types/database.types";

type PaymentDetails = {
  // Payment data
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
  discount_percentage: number | null;
  discount_fixed_amount: number | null;
  status: Database["public"]["Enums"]["payment_status"];
  captured_at: string | null;
  succeeded_at: string | null;
  authorized_at: string | null;
  payout_initiated_at: string | null;
  payout_completed_at: string | null;
  refunded_amount: number;
  refund_reason: string | null;
  stylist_transfer_id: string | null;
  stripe_application_fee_amount: number;

  // Booking data
  booking: {
    id: string;
    start_time: string;
    end_time: string;
    message_to_stylist: string | null;
    status: Database["public"]["Enums"]["booking_status"];
    total_price: number;
    total_duration_minutes: number;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    rescheduled_from: string | null;
    rescheduled_at: string | null;
    reschedule_reason: string | null;

    // Customer details
    customer: {
      id: string;
      full_name: string | null;
      email: string | null;
      phone_number: string | null;
      role: Database["public"]["Enums"]["user_role"];
    };

    // Stylist details
    stylist: {
      id: string;
      full_name: string | null;
      email: string | null;
      phone_number: string | null;
      role: Database["public"]["Enums"]["user_role"];
    };

    // Address details
    address: {
      id: string;
      nickname: string | null;
      street_address: string;
      city: string;
      postal_code: string;
      country: string;
      entry_instructions: string | null;
    } | null;

    // Discount details
    discount: {
      id: string;
      code: string;
      description: string | null;
      discount_percentage: number | null;
      discount_amount: number | null;
      currency: string;
    } | null;

    // Services
    services: Array<{
      id: string;
      title: string;
      description: string | null;
      price: number;
      currency: string;
      duration_minutes: number;
    }>;

    // Review
    review: {
      id: string;
      rating: number;
      comment: string | null;
      created_at: string;
    } | null;

    // Booking notes
    booking_notes: Array<{
      id: string;
      content: string;
      category: Database["public"]["Enums"]["booking_note_category"];
      customer_visible: boolean;
      duration_minutes: number | null;
      next_appointment_suggestion: string | null;
      tags: string[];
      created_at: string;
    }>;
  };

  // Affiliate details
  affiliate: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;

  // Stripe data
  stripe_data: {
    status: string;
    amount: number;
    currency: string;
    charge_id: string | null;
    receipt_url: string | null;
    created: number;
    description: string | null;
    payment_method_types: string[];
    client_secret: string | null;
  } | null;
};

/**
 * Get comprehensive payment details for admin view
 */
export async function getPaymentDetails(paymentId: string) {
  await requireAdmin();

  const supabase = createServiceClient();

  try {
    // Fetch payment with all related data
    const { data: payment, error } = await supabase
      .from("payments")
      .select(`
        *,
        booking:bookings!inner(
          *,
          customer:profiles!customer_id(
            id,
            full_name,
            email,
            phone_number,
            role
          ),
          stylist:profiles!stylist_id(
            id,
            full_name,
            email,
            phone_number,
            role
          ),
          address:addresses(
            id,
            nickname,
            street_address,
            city,
            postal_code,
            country,
            entry_instructions
          ),
          discount:discounts(
            id,
            code,
            description,
            discount_percentage,
            discount_amount,
            currency
          ),
          booking_services(
            service:services(
              id,
              title,
              description,
              price,
              currency,
              duration_minutes
            )
          ),
          reviews(
            id,
            rating,
            comment,
            created_at
          ),
          booking_notes(
            id,
            content,
            category,
            customer_visible,
            duration_minutes,
            next_appointment_suggestion,
            tags,
            created_at
          )
        ),
        affiliate:profiles!affiliate_id(
          id,
          full_name,
          email
        )
      `)
      .eq("id", paymentId)
      .single();

    if (error) {
      console.error("❌ getPaymentDetails: Error fetching payment:", error);
      throw error;
    }

    if (!payment) {
      return {
        data: null,
        error: "Payment not found",
      };
    }

    // Fetch Stripe payment intent data
    let stripeData = null;
    if (payment.payment_intent_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          payment.payment_intent_id,
          {
            expand: ["latest_charge", "payment_method"],
          },
        );

        stripeData = {
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          charge_id: (paymentIntent.latest_charge as Stripe.Charge)?.id || null,
          receipt_url:
            (paymentIntent.latest_charge as Stripe.Charge)?.receipt_url || null,
          created: paymentIntent.created,
          description: paymentIntent.description,
          payment_method_types: paymentIntent.payment_method_types,
          client_secret: paymentIntent.client_secret,
        };
      } catch (stripeError) {
        console.error(
          "❌ getPaymentDetails: Error fetching Stripe data:",
          stripeError,
        );
        // Continue without Stripe data
      }
    }

    // Transform the data
    const transformedPayment: PaymentDetails = {
      // Payment fields
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
      discount_percentage: payment.discount_percentage
        ? Number(payment.discount_percentage)
        : null,
      discount_fixed_amount: payment.discount_fixed_amount
        ? Number(payment.discount_fixed_amount)
        : null,
      status: payment.status,
      captured_at: payment.captured_at,
      succeeded_at: payment.succeeded_at,
      authorized_at: payment.authorized_at,
      payout_initiated_at: payment.payout_initiated_at,
      payout_completed_at: payment.payout_completed_at,
      refunded_amount: Number(payment.refunded_amount),
      refund_reason: payment.refund_reason,
      stylist_transfer_id: payment.stylist_transfer_id,
      stripe_application_fee_amount: payment.stripe_application_fee_amount,

      // Booking data
      booking: {
        id: payment.booking.id,
        start_time: payment.booking.start_time,
        end_time: payment.booking.end_time,
        message_to_stylist: payment.booking.message_to_stylist,
        status: payment.booking.status,
        total_price: Number(payment.booking.total_price),
        total_duration_minutes: payment.booking.total_duration_minutes,
        cancelled_at: payment.booking.cancelled_at,
        cancellation_reason: payment.booking.cancellation_reason,
        rescheduled_from: payment.booking.rescheduled_from,
        rescheduled_at: payment.booking.rescheduled_at,
        reschedule_reason: payment.booking.reschedule_reason,

        customer: payment.booking.customer,
        stylist: payment.booking.stylist,
        address: payment.booking.address,
        discount: payment.booking.discount,

        services: (payment.booking.booking_services || []).map(
          (bs) => bs.service,
        ),
        review: payment.booking.reviews || null,
        booking_notes: payment.booking.booking_notes || [],
      },

      affiliate: payment.affiliate,
      stripe_data: stripeData,
    };

    return {
      data: transformedPayment,
      error: null,
    };
  } catch (error) {
    console.error("❌ getPaymentDetails: Unexpected error:", error);
    return {
      data: null,
      error: error instanceof Error
        ? error.message
        : "Failed to fetch payment details",
    };
  }
}
