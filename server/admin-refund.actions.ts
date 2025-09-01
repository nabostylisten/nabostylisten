"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/server/admin/middleware";
import { processRefund } from "@/server/stripe.actions";
import { revalidatePath } from "next/cache";

export type AdminRefundParams = {
  paymentIntentId: string;
  refundAmountNOK: number;
  refundReason: string;
};

/**
 * Process a refund initiated by an admin
 * This wraps the existing processRefund function with admin authorization
 * and enhanced audit logging
 */
export async function processAdminRefund({
  paymentIntentId,
  refundAmountNOK,
  refundReason,
}: AdminRefundParams) {
  // Verify admin authorization
  const adminProfile = await requireAdmin();
  const serviceSupabase = createServiceClient();

  try {
    // First, get the payment and booking details from the database
    const { data: payment, error: paymentError } = await serviceSupabase
      .from("payments")
      .select(`
        *,
        booking:bookings!inner(
          id,
          status,
          start_time,
          customer_id,
          stylist_id
        )
      `)
      .eq("payment_intent_id", paymentIntentId)
      .single();

    if (paymentError || !payment) {
      console.error(
        "Payment not found for PaymentIntent:",
        paymentIntentId,
        paymentError,
      );
      return {
        data: null,
        error: "Betaling ikke funnet i systemet",
      };
    }

    // Validate refund amount
    const maxRefundable = payment.final_amount - (payment.refunded_amount || 0);
    if (refundAmountNOK > maxRefundable) {
      return {
        data: null,
        error: `Refunderingsbeløp kan ikke overstige ${maxRefundable} NOK`,
      };
    }

    if (refundAmountNOK <= 0) {
      return {
        data: null,
        error: "Refunderingsbeløp må være større enn 0",
      };
    }

    // Log the admin refund attempt before processing
    console.log(`Admin refund initiated:`, {
      adminId: adminProfile.user.id,
      adminEmail: adminProfile.user.email,
      paymentIntentId,
      refundAmountNOK,
      refundReason,
      bookingId: payment.booking.id,
      timestamp: new Date().toISOString(),
    });

    // Use the existing processRefund function with admin context
    const refundResult = await processRefund({
      bookingId: payment.booking.id,
      paymentIntentId,
      refundAmountNOK,
      refundReason: `Admin refund: ${refundReason}`,
      stylistCompensationNOK: 0, // Admin refunds don't include stylist compensation by default
    });

    if (refundResult.error) {
      // Log the failure
      console.error(`Admin refund failed:`, {
        adminId: adminProfile.user.id,
        paymentIntentId,
        error: refundResult.error,
        timestamp: new Date().toISOString(),
      });

      return {
        data: null,
        error: refundResult.error,
      };
    }

    // TODO: Update payment record with admin refund metadata when schema is updated
    // For now, we'll log this information and rely on existing refund_reason field
    // const { error: updateError } = await serviceSupabase
    //   .from("payments")
    //   .update({
    //     refund_initiated_by: adminProfile.id,
    //     refund_initiated_at: new Date().toISOString(),
    //     admin_refund_reason: refundReason,
    //   })
    //   .eq("payment_intent_id", paymentIntentId);

    // Update the existing refund_reason field to include admin context
    const { error: updateError } = await serviceSupabase
      .from("payments")
      .update({
        refund_reason:
          `Admin refund by ${adminProfile.user.email}: ${refundReason}`,
      })
      .eq("payment_intent_id", paymentIntentId);

    if (updateError) {
      console.error("Failed to update admin refund reason:", updateError);
      // Don't fail the entire operation if metadata update fails
    }

    // Log successful refund
    console.log(`Admin refund successful:`, {
      adminId: adminProfile.user.id,
      adminEmail: adminProfile.user.email,
      paymentIntentId,
      refundAmountNOK,
      refundResult: refundResult.data,
      timestamp: new Date().toISOString(),
    });

    // Revalidate the admin payments page to show updated data
    revalidatePath("/protected/admin/payments");

    return {
      data: {
        ...refundResult.data,
        processedBy: {
          id: adminProfile.user.id,
          email: adminProfile.user.email,
          name: adminProfile.profile.full_name,
        },
        processedAt: new Date().toISOString(),
      },
      error: null,
    };
  } catch (error) {
    console.error("Unexpected error in processAdminRefund:", error);

    // Log the unexpected error
    console.error(`Admin refund unexpected error:`, {
      adminId: adminProfile.user.id,
      paymentIntentId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    return {
      data: null,
      error: error instanceof Error
        ? error.message
        : "En uventet feil oppstod ved behandling av refunderingen",
    };
  }
}

/**
 * Get refund history for a specific payment
 * Admin-only function to view all refund activities
 */
export async function getPaymentRefundHistory(paymentIntentId: string) {
  await requireAdmin();

  const serviceSupabase = createServiceClient();

  try {
    const { data: payment, error } = await serviceSupabase
      .from("payments")
      .select(`
        *,
        booking:bookings!inner(
          id,
          cancelled_at,
          cancellation_reason,
          customer:profiles!customer_id(full_name, email),
          stylist:profiles!stylist_id(full_name, email)
        )
      `)
      .eq("payment_intent_id", paymentIntentId)
      .single();

    if (error || !payment) {
      return {
        data: null,
        error: "Betaling ikke funnet",
      };
    }

    // Build refund history timeline
    const refundHistory = [];

    if (payment.refunded_amount > 0) {
      refundHistory.push({
        type: "refund" as const,
        amount: payment.refunded_amount,
        reason: payment.refund_reason,
        // TODO: Extract admin details from refund_reason when schema is updated
        adminReason: payment.refund_reason?.includes("Admin refund")
          ? payment.refund_reason
          : null,
        processedBy: null, // TODO: Use refund_initiated_by_profile when schema is updated
        processedAt: null, // TODO: Use refund_initiated_at when schema is updated
        createdAt: payment.updated_at,
      });
    }

    if (payment.booking?.cancelled_at) {
      refundHistory.push({
        type: "cancellation" as const,
        reason: payment.booking.cancellation_reason,
        cancelledAt: payment.booking.cancelled_at,
      });
    }

    // Sort by most recent first
    refundHistory.sort((a, b) => {
      const dateA = new Date(a.processedAt || a.cancelledAt || a.createdAt || 0)
        .getTime();
      const dateB = new Date(b.processedAt || b.cancelledAt || b.createdAt || 0)
        .getTime();

      return dateB - dateA;
    });

    return {
      data: {
        payment,
        refundHistory,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching refund history:", error);
    return {
      data: null,
      error: "Kunne ikke hente refunderingshistorikk",
    };
  }
}

/**
 * Get admin refund statistics
 * Useful for monitoring and reporting
 */
export async function getAdminRefundStats() {
  await requireAdmin();

  const serviceSupabase = createServiceClient();

  try {
    // Get refund statistics for the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyRefunds, error: monthlyError } = await serviceSupabase
      .from("payments")
      .select("refunded_amount, updated_at, refund_reason")
      .gte("updated_at", startOfMonth.toISOString())
      .gt("refunded_amount", 0);

    if (monthlyError) {
      console.error("Error fetching monthly refunds:", monthlyError);
    }

    // Get all-time statistics
    const { data: allRefunds, error: allError } = await serviceSupabase
      .from("payments")
      .select("refunded_amount, refund_reason")
      .gt("refunded_amount", 0);

    if (allError) {
      console.error("Error fetching all refunds:", allError);
    }

    const monthlyStats = monthlyRefunds
      ? {
        totalAmount: monthlyRefunds.reduce(
          (sum, r) => sum + r.refunded_amount,
          0,
        ),
        totalCount: monthlyRefunds.length,
        adminRefunds: monthlyRefunds.filter((r) =>
          r.refund_reason?.includes("Admin refund")
        ).length,
        systemRefunds: monthlyRefunds.filter((r) =>
          !r.refund_reason?.includes("Admin refund")
        ).length,
      }
      : {
        totalAmount: 0,
        totalCount: 0,
        adminRefunds: 0,
        systemRefunds: 0,
      };

    const allTimeStats = allRefunds
      ? {
        totalAmount: allRefunds.reduce((sum, r) =>
          sum + r.refunded_amount, 0),
        totalCount: allRefunds.length,
        adminRefunds: allRefunds.filter((r) =>
          r.refund_reason?.includes("Admin refund")
        ).length,
        systemRefunds: allRefunds.filter((r) =>
          !r.refund_reason?.includes("Admin refund")
        ).length,
      }
      : {
        totalAmount: 0,
        totalCount: 0,
        adminRefunds: 0,
        systemRefunds: 0,
      };

    return {
      data: {
        monthly: monthlyStats,
        allTime: allTimeStats,
        period: {
          monthStart: startOfMonth.toISOString(),
          current: new Date().toISOString(),
        },
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching admin refund stats:", error);
    return {
      data: null,
      error: "Kunne ikke hente refunderingsstatistikk",
    };
  }
}
