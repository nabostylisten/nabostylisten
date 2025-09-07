"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database.types";

type AffiliatePayout = Database["public"]["Tables"]["affiliate_payouts"]["Row"];
type AffiliatePayoutInsert =
  Database["public"]["Tables"]["affiliate_payouts"]["Insert"];

/**
 * Calculate commission for a booking
 */
export async function calculateCommission(
  bookingId: string,
  serviceAmountNOK: number,
  affiliateCode: string,
) {
  const supabase = await createClient();

  // Get affiliate commission percentage
  const { data: affiliate, error } = await supabase
    .from("affiliate_links")
    .select("commission_percentage, stylist_id")
    .eq("link_code", affiliateCode)
    .single();

  if (error || !affiliate) {
    return { error: "Kunne ikke finne partnerkode", data: null };
  }

  // Get platform fee percentage from config (default 20%)
  const platformFeePercentage = 0.20;
  const platformFeeAmount = serviceAmountNOK * platformFeePercentage;

  // Commission is percentage of platform fee
  const commissionAmount = platformFeeAmount * affiliate.commission_percentage;

  return {
    error: null,
    data: {
      commissionAmount,
      commissionPercentage: affiliate.commission_percentage,
      stylistId: affiliate.stylist_id,
      platformFeeAmount,
      serviceAmount: serviceAmountNOK,
    },
  };
}

/**
 * Get affiliate earnings for a stylist
 */
export async function getAffiliateEarnings(stylistId: string, options?: {
  startDate?: string;
  endDate?: string;
  status?: "pending" | "processing" | "paid" | "failed";
}) {
  const supabase = await createClient();

  let query = supabase
    .from("affiliate_clicks")
    .select(`
      *,
      booking:bookings!affiliate_clicks_booking_id_fkey(
        id,
        start_time,
        status,
        total_price
      ),
      affiliate_link:affiliate_links!affiliate_clicks_affiliate_link_id_fkey(
        link_code
      )
    `)
    .eq("stylist_id", stylistId)
    .eq("converted", true)
    .order("converted_at", { ascending: false });

  if (options?.startDate) {
    query = query.gte("converted_at", options.startDate);
  }

  if (options?.endDate) {
    query = query.lte("converted_at", options.endDate);
  }

  const { data: earnings, error } = await query;

  if (error) {
    console.error("Error fetching affiliate earnings:", error);
    return { error: "Kunne ikke hente provisjonsinntekter", data: null };
  }

  // Calculate totals
  const totalEarnings =
    earnings?.reduce((sum, earning) => sum + earning.commission_amount, 0) || 0;
  const totalBookings = earnings?.length || 0;

  // Get payout status information
  const { data: payouts } = await supabase
    .from("affiliate_payouts")
    .select("*")
    .eq("stylist_id", stylistId)
    .order("created_at", { ascending: false });

  const totalPaidOut = payouts?.reduce(
    (sum, payout) =>
      payout.status === "paid" ? sum + Number(payout.payout_amount) : sum,
    0,
  ) || 0;

  const pendingAmount = totalEarnings - totalPaidOut;

  return {
    error: null,
    data: {
      earnings: earnings || [],
      summary: {
        totalEarnings,
        totalBookings,
        totalPaidOut,
        pendingAmount,
        averageCommission: totalBookings > 0
          ? totalEarnings / totalBookings
          : 0,
      },
      payouts: payouts || [],
    },
  };
}

/**
 * Generate payout for affiliate commissions
 */
export async function generateAffiliatePayout(
  stylistId: string,
  periodStart: string,
  periodEnd: string,
  processedBy: string,
) {
  const supabase = await createClient();

  // Get unpaid affiliate commissions for the period
  const { data: unpaidCommissions, error: commissionsError } = await supabase
    .from("affiliate_clicks")
    .select(`
      *,
      booking:bookings!affiliate_clicks_booking_id_fkey(
        start_time,
        status
      )
    `)
    .eq("stylist_id", stylistId)
    .eq("converted", true)
    .gte("converted_at", periodStart)
    .lte("converted_at", periodEnd)
    .is("payout_processed_at", null); // Only unpaid commissions

  if (commissionsError) {
    console.error("Error fetching unpaid commissions:", commissionsError);
    return { error: "Kunne ikke hente ubetalte provisjoner", data: null };
  }

  if (!unpaidCommissions || unpaidCommissions.length === 0) {
    return {
      error: "Ingen ubetalte provisjoner funnet for perioden",
      data: null,
    };
  }

  // Calculate payout totals
  const totalCommission = unpaidCommissions.reduce(
    (sum, comm) => sum + comm.commission_amount,
    0,
  );
  const totalBookings = unpaidCommissions.length;

  // Get affiliate link for this stylist
  const { data: affiliateLink } = await supabase
    .from("affiliate_links")
    .select("id")
    .eq("stylist_id", stylistId)
    .eq("is_active", true)
    .single();

  if (!affiliateLink) {
    return { error: "Kunne ikke finne aktiv partnerkode", data: null };
  }

  // Create payout record
  const { data: payout, error: payoutError } = await supabase
    .from("affiliate_payouts")
    .insert({
      stylist_id: stylistId,
      affiliate_link_id: affiliateLink.id,
      payout_amount: totalCommission,
      currency: "NOK",
      period_start: periodStart,
      period_end: periodEnd,
      total_bookings: totalBookings,
      total_commission_earned: totalCommission,
      status: "pending",
      processed_by: processedBy,
    })
    .select()
    .single();

  if (payoutError) {
    console.error("Error creating affiliate payout:", payoutError);
    return { error: "Kunne ikke opprette utbetaling", data: null };
  }

  // Mark commissions as being processed
  const { error: updateError } = await supabase
    .from("affiliate_clicks")
    .update({
      payout_processed_at: new Date().toISOString(),
    })
    .in("id", unpaidCommissions.map((c) => c.id));

  if (updateError) {
    console.error("Error marking commissions as processed:", updateError);
  }
  return { error: null, data: payout };
}

/**
 * Process affiliate payout via Stripe
 */
export async function processAffiliatePayout(payoutId: string) {
  const supabase = await createClient();

  // Get payout details with stylist information
  const { data: payout, error: payoutError } = await supabase
    .from("affiliate_payouts")
    .select(`
      *,
      stylist:profiles!affiliate_payouts_stylist_id_fkey(
        id,
        full_name,
        email,
        stylist_details(
          stripe_account_id
        )
      )
    `)
    .eq("id", payoutId)
    .single();

  if (payoutError || !payout) {
    return { error: "Kunne ikke finne utbetaling", data: null };
  }

  if (payout.status !== "pending") {
    return { error: "Utbetaling er ikke i pending status", data: null };
  }

  // Check if stylist has Stripe account
  if (!payout.stylist?.stylist_details?.stripe_account_id) {
    return { error: "Stylist har ikke konfigurert Stripe-konto", data: null };
  }

  try {
    // Here you would integrate with Stripe to create the transfer
    // For now, we'll simulate the process

    // Update payout status to processing
    const { data: updatedPayout, error: updateError } = await supabase
      .from("affiliate_payouts")
      .update({
        status: "processing",
        processed_at: new Date().toISOString(),
        // stripe_transfer_id: transfer.id, // Would be set from Stripe response
      })
      .eq("id", payoutId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating payout status:", updateError);
      return { error: "Kunne ikke oppdatere utbetalingsstatus", data: null };
    }

    // TODO: Implement actual Stripe transfer
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const transfer = await stripe.transfers.create({
    //   amount: Math.round(payout.payout_amount * 100), // Convert to øre
    //   currency: 'nok',
    //   destination: payout.stylist.stylist_details.stripe_account_id,
    //   description: `Affiliate commission payout for ${payout.period_start} to ${payout.period_end}`,
    // });

    return { error: null, data: updatedPayout };
  } catch (error) {
    console.error("Error processing affiliate payout:", error);

    // Update payout status to failed
    await supabase
      .from("affiliate_payouts")
      .update({ status: "failed" })
      .eq("id", payoutId);

    return { error: "Kunne ikke behandle utbetaling", data: null };
  }
}

/**
 * Get affiliate payout history for admin
 */
export async function getAffiliatePayouts(options?: {
  status?: Database["public"]["Enums"]["affiliate_payout_status"];
  stylistId?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("affiliate_payouts")
    .select(`
      *,
      stylist:profiles!affiliate_payouts_stylist_id_fkey(
        id,
        full_name,
        email
      ),
      processed_by_user:profiles!affiliate_payouts_processed_by_fkey(
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.stylistId) {
    query = query.eq("stylist_id", options.stylistId);
  }

  if (options?.limit) {
    const offset = options.offset || 0;
    query = query.range(offset, offset + options.limit - 1);
  }

  const { data: payouts, error } = await query;

  if (error) {
    console.error("Error fetching affiliate payouts:", error);
    return { error: "Kunne ikke hente utbetalinger", data: null };
  }

  return { error: null, data: payouts || [] };
}

/**
 * Get affiliate commission analytics
 */
export async function getAffiliateCommissionAnalytics(options?: {
  startDate?: string;
  endDate?: string;
  stylistId?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("affiliate_clicks")
    .select(`
      *,
      affiliate_link:affiliate_links!affiliate_clicks_affiliate_link_id_fkey(
        link_code,
        stylist:profiles!affiliate_links_stylist_id_fkey(
          full_name
        )
      )
    `)
    .eq("converted", true);

  if (options?.startDate) {
    query = query.gte("converted_at", options.startDate);
  }

  if (options?.endDate) {
    query = query.lte("converted_at", options.endDate);
  }

  if (options?.stylistId) {
    query = query.eq("stylist_id", options.stylistId);
  }

  const { data: conversions, error } = await query;

  if (error) {
    console.error("Error fetching commission analytics:", error);
    return { error: "Kunne ikke hente provisjonsanalyse", data: null };
  }

  if (!conversions || conversions.length === 0) {
    return {
      error: null,
      data: {
        totalCommissions: 0,
        totalConversions: 0,
        averageCommission: 0,
        topPerformers: [],
        monthlyBreakdown: [],
      },
    };
  }

  // Calculate analytics
  const totalCommissions = conversions.reduce(
    (sum, c) => sum + c.commission_amount,
    0,
  );
  const totalConversions = conversions.length;
  const averageCommission = totalCommissions / totalConversions;

  // Top performers
  const stylistCommissions = conversions.reduce((acc, c) => {
    const stylistId = c.stylist_id;
    if (!acc[stylistId]) {
      acc[stylistId] = {
        stylist_id: stylistId,
        stylist_name: c.affiliate_link?.stylist?.full_name || "Unknown",
        total_commission: 0,
        conversion_count: 0,
      };
    }
    acc[stylistId].total_commission += c.commission_amount;
    acc[stylistId].conversion_count += 1;
    return acc;
  }, {} as Record<string, {
    stylist_id: string;
    stylist_name: string;
    total_commission: number;
    conversion_count: number;
  }>);

  const topPerformers = Object.values(stylistCommissions)
    .sort((a, b) => b.total_commission - a.total_commission)
    .slice(0, 10);

  // Monthly breakdown
  const monthlyData = conversions.reduce((acc, c) => {
    const month = new Date(c.converted_at!).toISOString().substring(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = { month, commission: 0, conversions: 0 };
    }
    acc[month].commission += c.commission_amount;
    acc[month].conversions += 1;
    return acc;
  }, {} as Record<string, {
    month: string;
    commission: number;
    conversions: number;
  }>);

  const monthlyBreakdown = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    error: null,
    data: {
      totalCommissions,
      totalConversions,
      averageCommission,
      topPerformers,
      monthlyBreakdown,
    },
  };
}

/**
 * Get all affiliate commissions for admin view
 */
export async function getAllAffiliateCommissions() {
  const supabase = await createClient();

  const { data: commissions, error } = await supabase
    .from("affiliate_commissions")
    .select(`
      id,
      booking_id,
      affiliate_id,
      amount,
      status,
      created_at,
      affiliate:profiles!affiliate_commissions_affiliate_id_fkey(
        full_name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all affiliate commissions:", error);
    return { data: null, error: error.message };
  }

  // Flatten the data
  const flattenedData = commissions?.map((commission) => ({
    ...commission,
    stylist_name: commission.affiliate?.full_name || "Unknown",
  }));

  return { data: flattenedData, error: null };
}

/**
 * Get commission metrics for admin dashboard
 */
export async function getCommissionMetrics() {
  const supabase = await createClient();

  try {
    // Get all commissions for calculations
    const { data: commissions } = await supabase
      .from("affiliate_commissions")
      .select("amount, status");

    const totalCommissions = commissions?.reduce((sum, c) =>
      sum + (c.amount || 0), 0) || 0;
    const pendingCommissions = commissions?.filter((c) =>
      c.status === "pending"
    )
      .reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    const paidCommissions = commissions?.filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

    return {
      data: {
        totalCommissions,
        pendingCommissions,
        paidCommissions,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching commission metrics:", error);
    return { data: null, error: "Failed to fetch commission metrics" };
  }
}

/**
 * Track affiliate commission for a booking (called after successful payment)
 */
export async function trackAffiliateCommission(bookingId: string) {
  const supabase = createServiceClient(); // Use service client to bypass RLS

  try {
    // First check if commission already exists for this booking
    // This is a quick check to avoid unnecessary work
    const { data: existingCommission } = await supabase
      .from("affiliate_commissions")
      .select("id, affiliate_id, amount, status")
      .eq("booking_id", bookingId)
      .single();

    if (existingCommission) {
      console.log(`Commission already exists for booking ${bookingId}:`, {
        commissionId: existingCommission.id,
        affiliateId: existingCommission.affiliate_id,
        amount: existingCommission.amount,
        status: existingCommission.status
      });
      return { error: null, data: existingCommission }; // Return existing commission, not an error
    }

    // Get booking details with payment information
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id,
        customer_id,
        total_price,
        payments!inner(
          affiliate_id,
          affiliate_commission,
          affiliate_commission_percentage,
          status
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.log("No booking found or no affiliate info:", bookingId);
      return { error: null, data: null }; // Not an error, just no affiliate to track
    }

    const payment = booking.payments;
    if (!payment?.affiliate_id || !payment?.affiliate_commission) {
      console.log("No affiliate data in payment for booking:", bookingId);
      return { error: null, data: null }; // Not an error, just no affiliate
    }

    // Create commission record with proper error handling for unique constraint
    const { data: commission, error: commissionError } = await supabase
      .from("affiliate_commissions")
      .insert({
        booking_id: bookingId,
        affiliate_id: payment.affiliate_id,
        amount: payment.affiliate_commission,
        commission_percentage: payment.affiliate_commission_percentage || 0.20,
        status: payment.status === "succeeded" ? "pending" : "pending",
      })
      .select()
      .single();

    if (commissionError) {
      // Check if it's a unique constraint violation (duplicate key error)
      if (commissionError.code === '23505') {
        console.log(`Race condition detected - commission already created for booking ${bookingId}`);
        
        // Fetch and return the existing commission
        const { data: existingCommission } = await supabase
          .from("affiliate_commissions")
          .select("*")
          .eq("booking_id", bookingId)
          .single();
        
        return { error: null, data: existingCommission };
      }
      
      console.error("Error creating commission record:", commissionError);
      return { error: "Failed to track commission", data: null };
    }

    // Also update affiliate_clicks to mark as converted and link to booking
    const { error: clickUpdateError } = await supabase
      .from("affiliate_clicks")
      .update({
        converted: true,
        converted_at: new Date().toISOString(),
        booking_id: bookingId,
        commission_amount: payment.affiliate_commission,
      })
      .eq("user_id", booking.customer_id) // User who made the booking
      .eq("stylist_id", payment.affiliate_id) // Stylist who gets the commission
      .is("booking_id", null); // Only update clicks that haven't been converted yet

    if (clickUpdateError) {
      console.error("Error updating affiliate clicks:", clickUpdateError);
      // Don't fail the commission creation for this
    }

    return { error: null, data: commission };
  } catch (error) {
    console.error("Error tracking affiliate commission:", error);
    return { error: "Failed to track commission", data: null };
  }
}
