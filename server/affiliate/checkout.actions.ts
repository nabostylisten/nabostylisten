"use server";

import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database.types";
import {
  AffiliateDiscount,
  AffiliateCommission,
  affiliateDiscountSchema,
} from "@/types";
import { 
  getAffiliateAttribution, 
  validateAffiliateCode,
  validateAffiliateUsageRights 
} from "./attribution.actions";

type Service = Database["public"]["Tables"]["services"]["Row"];
type Booking = Database["public"]["Tables"]["bookings"]["Row"];

interface CartService {
  id: string;
  stylist_id?: string; // Optional since we'll fetch from DB
  price?: number; // Optional since we'll fetch from DB
}

interface Cart {
  services: CartService[];
  userId?: string;
}

/**
 * CRITICAL: Check if user can apply affiliate discount to their cart
 * Handles all security validations and business rules
 */
export async function checkAffiliateDiscount({
  cart,
  userId,
}: {
  cart: Cart;
  userId?: string;
}): Promise<AffiliateDiscount | null> {
  if (!userId || cart.services.length === 0) {
    return null; // Must be logged in and have services in cart
  }

  const supabase = await createClient();

  // Get user's affiliate attribution
  const attribution = await getAffiliateAttribution(userId);
  if (!attribution) {
    return null;
  }

  // Validate the code is still active and get stylist info
  const validation = await validateAffiliateCode(attribution.code);
  if (!validation.success || !validation.stylist_id || !validation.stylist_name) {
    return null;
  }

  // CRITICAL: Validate user has rights to use this code
  const usageRights = await validateAffiliateUsageRights(userId, attribution);
  if (!usageRights.canUse) {
    console.warn(`Affiliate code usage blocked for user ${userId}: ${usageRights.reason}`);
    return null;
  }

  // Fetch service details from database
  const serviceIds = cart.services.map(s => s.id);
  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("id, stylist_id, price, title")
    .in("id", serviceIds);

  if (servicesError || !services) {
    console.error("Error fetching services:", servicesError);
    return null;
  }

  // Find services that belong to the affiliate code owner
  const applicableServices = services.filter(
    (service) => service.stylist_id === validation.stylist_id
  );

  if (applicableServices.length === 0) {
    return null; // No applicable services in cart
  }

  // Calculate total discount amount (commission as customer discount)
  const totalServiceAmount = applicableServices.reduce(
    (sum, service) => sum + (service.price || 0), 
    0
  );
  
  const commissionRate = validation.commission_percentage || 0;
  const discountAmount = Math.round(totalServiceAmount * (commissionRate / 100));

  const discount: AffiliateDiscount = {
    code: attribution.code,
    stylist_id: validation.stylist_id,
    stylist_name: validation.stylist_name,
    applicable_service_ids: applicableServices.map(s => s.id),
    discount_amount: discountAmount,
    commission_percentage: commissionRate,
    attribution,
  };

  // Validate the discount object
  return affiliateDiscountSchema.parse(discount);
}

/**
 * Apply affiliate discount to a booking and create commission record
 * Called after successful payment processing
 */
export async function applyAffiliateDiscount({
  bookingId,
  affiliateDiscount,
  userId,
}: {
  bookingId: string;
  affiliateDiscount: AffiliateDiscount;
  userId: string;
}): Promise<{ success: boolean; error?: string; commissionId?: string }> {
  const supabase = await createClient();

  try {
    // Verify booking exists and belongs to user
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, customer_id, total_amount")
      .eq("id", bookingId)
      .eq("customer_id", userId)
      .single();

    if (bookingError || !booking) {
      return { success: false, error: "Booking not found or access denied" };
    }

    // Final validation: Re-check affiliate code is still valid
    const validation = await validateAffiliateCode(affiliateDiscount.code);
    if (!validation.success) {
      return { success: false, error: "Affiliate code is no longer valid" };
    }

    // Calculate commission amount (same as discount amount)
    const commissionAmount = affiliateDiscount.discount_amount;

    // Create commission record
    const { data: commission, error: commissionError } = await supabase
      .from("affiliate_commissions")
      .insert({
        booking_id: bookingId,
        stylist_id: affiliateDiscount.stylist_id,
        affiliate_code: affiliateDiscount.code,
        commission_amount: commissionAmount,
        commission_percentage: affiliateDiscount.commission_percentage,
        status: "pending",
        attributed_user_id: affiliateDiscount.attribution.original_user_id,
      })
      .select("id")
      .single();

    if (commissionError) {
      console.error("Failed to create commission record:", commissionError);
      return { success: false, error: "Failed to process affiliate commission" };
    }

    // Update affiliate attribution with conversion
    await supabase
      .from("affiliate_attributions")
      .update({ converted_booking_id: bookingId })
      .eq("user_id", userId)
      .eq("code", affiliateDiscount.code);

    return { success: true, commissionId: commission.id };
  } catch (error) {
    console.error("Error applying affiliate discount:", error);
    return { success: false, error: "Failed to apply affiliate discount" };
  }
}

/**
 * Reverse affiliate commission when booking is cancelled/refunded
 * Critical for handling refund scenarios
 */
export async function reverseAffiliateCommission({
  bookingId,
}: {
  bookingId: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // Find and reverse the commission
    const { data: commission, error: findError } = await supabase
      .from("affiliate_commissions")
      .select("id, status")
      .eq("booking_id", bookingId)
      .single();

    if (findError || !commission) {
      // No commission found - this is okay, not all bookings have affiliates
      return { success: true };
    }

    if (commission.status === "reversed") {
      // Already reversed
      return { success: true };
    }

    // Reverse the commission
    const { error: updateError } = await supabase
      .from("affiliate_commissions")
      .update({ 
        status: "reversed", 
        reversed_at: new Date().toISOString() 
      })
      .eq("id", commission.id);

    if (updateError) {
      console.error("Failed to reverse commission:", updateError);
      return { success: false, error: "Failed to reverse commission" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error reversing affiliate commission:", error);
    return { success: false, error: "Failed to reverse commission" };
  }
}

/**
 * Get affiliate commission by booking ID
 * Useful for displaying commission info and handling refunds
 */
export async function getAffiliateCommissionByBooking(
  bookingId: string
): Promise<AffiliateCommission | null> {
  const supabase = await createClient();

  const { data: commission } = await supabase
    .from("affiliate_commissions")
    .select("*")
    .eq("booking_id", bookingId)
    .single();

  if (!commission) {
    return null;
  }

  return {
    id: commission.id,
    booking_id: commission.booking_id,
    stylist_id: commission.stylist_id,
    affiliate_code: commission.affiliate_code,
    commission_amount: commission.commission_amount,
    commission_percentage: commission.commission_percentage,
    status: commission.status as "pending" | "paid" | "reversed",
    attributed_user_id: commission.attributed_user_id || undefined,
    created_at: commission.created_at,
    paid_at: commission.paid_at || undefined,
    reversed_at: commission.reversed_at || undefined,
  };
}

/**
 * Calculate commission amount for a service price
 */
export function calculateCommission(
  servicePrice: number, 
  commissionRate: number
): number {
  return Math.round(servicePrice * (commissionRate / 100));
}

/**
 * Get all affiliate commissions for a stylist (for their dashboard)
 */
export async function getStylistAffiliateCommissions({
  stylistId,
  status,
  limit = 20,
  offset = 0,
}: {
  stylistId: string;
  status?: "pending" | "paid" | "reversed";
  limit?: number;
  offset?: number;
}): Promise<AffiliateCommission[]> {
  const supabase = await createClient();

  let query = supabase
    .from("affiliate_commissions")
    .select("*")
    .eq("stylist_id", stylistId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data: commissions } = await query;

  if (!commissions) {
    return [];
  }

  return commissions.map((commission) => ({
    id: commission.id,
    booking_id: commission.booking_id,
    stylist_id: commission.stylist_id,
    affiliate_code: commission.affiliate_code,
    commission_amount: commission.commission_amount,
    commission_percentage: commission.commission_percentage,
    status: commission.status as "pending" | "paid" | "reversed",
    attributed_user_id: commission.attributed_user_id || undefined,
    created_at: commission.created_at,
    paid_at: commission.paid_at || undefined,
    reversed_at: commission.reversed_at || undefined,
  }));
}