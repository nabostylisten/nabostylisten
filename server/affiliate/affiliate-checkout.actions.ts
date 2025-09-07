"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  convertAttribution,
  getAffiliateAttribution,
} from "./affiliate-attribution.actions";
import {
  calculateBookingPaymentBreakdown,
  DEFAULT_PLATFORM_CONFIG,
} from "@/schemas/platform-config.schema";
import type { Database } from "@/types/database.types";

type Service = Database["public"]["Tables"]["services"]["Row"];

export interface AffiliateCheckoutInfo {
  hasAffiliateAttribution: boolean;
  affiliateCode?: string;
  stylistName?: string;
  stylistId?: string;
  applicableServices: Service[];
  discountAmount: number;
  commissionAmount: number;
  isAutoApplicable: boolean;
  nonApplicableReason?: string; // Reason why discount cannot be applied
}

/**
 * Check if user has already used an affiliate code for a specific stylist
 * Users can only use affiliate codes once per stylist for their first purchase
 */
async function hasUserAlreadyUsedAffiliateForStylist(
  userId: string,
  stylistId: string,
): Promise<boolean> {
  console.log(`🔍 Checking if user ${userId} has already used affiliate for stylist ${stylistId}`);
  
  // Use service client to bypass RLS for checking affiliate usage history
  // This is necessary because we need to check across all affiliate clicks for the user
  const supabase = createServiceClient();

  const { data: existingConversions, error } = await supabase
    .from("affiliate_clicks")
    .select("id, booking_id, created_at")
    .eq("user_id", userId)
    .eq("stylist_id", stylistId)
    .eq("converted", true); // Only check completed bookings

  if (error) {
    console.error("Error checking affiliate usage history:", error);
    // On error, be conservative and allow the discount (don't block user)
    return false;
  }

  const hasUsedBefore = (existingConversions?.length || 0) > 0;
  
  console.log(`🔍 Affiliate usage check result:`, {
    userId,
    stylistId,
    existingConversions: existingConversions?.map(c => ({
      id: c.id,
      booking_id: c.booking_id,
      created_at: c.created_at
    })),
    hasUsedBefore
  });

  return hasUsedBefore;
}

/**
 * Check if user has affiliate attribution that can be applied to cart
 */
export async function checkAffiliateDiscount(
  cartItems: { serviceId: string; quantity: number }[],
  userId?: string,
  visitorSession?: string,
): Promise<{ error: string | null; data: AffiliateCheckoutInfo | null }> {
  console.log("🔍 SERVER - checkAffiliateDiscount called:", {
    cartItems,
    userId,
    visitorSession,
  });

  const supabase = await createClient();

  // Get affiliate attribution
  console.log("🔍 SERVER - Getting affiliate attribution for userId:", userId);
  const attribution = await getAffiliateAttribution(userId);
  console.log("🔍 SERVER - Affiliate attribution result:", attribution);

  if (!attribution) {
    console.log("🔍 SERVER - No attribution found, returning empty data");
    return {
      error: null,
      data: {
        hasAffiliateAttribution: false,
        applicableServices: [],
        discountAmount: 0,
        commissionAmount: 0,
        isAutoApplicable: false,
      },
    };
  }

  // Get services in cart with stylist information
  const serviceIds = cartItems.map((item) => item.serviceId);
  console.log("🔍 SERVER - Fetching services for IDs:", serviceIds);

  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select(`
      *,
      stylist:profiles!services_stylist_id_fkey(
        id,
        full_name
      )
    `)
    .in("id", serviceIds);

  if (servicesError || !services) {
    console.error("🔍 SERVER - Error fetching services:", servicesError);
    return { error: "Kunne ikke hente tjenester", data: null };
  }

  console.log(
    "🔍 SERVER - Fetched services:",
    services.map((s) => ({
      id: s.id,
      title: s.title,
      stylist_id: s.stylist_id,
      stylist_name: s.stylist?.full_name,
    })),
  );

  // Check which services are from the attributed stylist
  console.log("🔍 SERVER - Comparing stylist_id:", {
    attributionStylistId: attribution.stylist_id,
    servicesStylistIds: services.map((s) => s.stylist_id),
  });

  const applicableServices = services.filter(
    (service) => service.stylist_id === attribution.stylist_id,
  );

  console.log(
    "🔍 SERVER - Applicable services:",
    applicableServices.map((s) => ({
      id: s.id,
      title: s.title,
      stylist_id: s.stylist_id,
    })),
  );

  if (applicableServices.length === 0) {
    console.log(
      "🔍 SERVER - No applicable services found, returning no discount",
    );
    return {
      error: null,
      data: {
        hasAffiliateAttribution: true,
        affiliateCode: attribution.code,
        stylistId: attribution.stylist_id,
        applicableServices: [],
        discountAmount: 0,
        commissionAmount: 0,
        isAutoApplicable: false,
      },
    };
  }

  // Calculate total amount for applicable services
  let totalApplicableAmount = 0;
  applicableServices.forEach((service) => {
    const cartItem = cartItems.find((item) => item.serviceId === service.id);
    if (cartItem) {
      totalApplicableAmount += Number(service.price) * cartItem.quantity;
    }
  });

  // Get affiliate commission percentage
  const { data: affiliateCode } = await supabase
    .from("affiliate_links")
    .select("commission_percentage")
    .eq("link_code", attribution.code)
    .single();

  const commissionPercentage = affiliateCode?.commission_percentage || 0.20;

  // Calculate payment breakdown with affiliate commission as customer discount
  const customerDiscountPercentage =
    DEFAULT_PLATFORM_CONFIG.fees.affiliate.customerDiscountPercentage;
  const breakdown = calculateBookingPaymentBreakdown({
    serviceAmountNOK: totalApplicableAmount,
    hasAffiliate: true,
    affiliateCommissionPercentage: commissionPercentage,
    appliedDiscount: {
      discountPercentage: customerDiscountPercentage * 100, // Convert 0.10 to 10
    },
  });

  console.log("🔍 SERVER - Breakdown calculation:", {
    totalApplicableAmount,
    commissionPercentage,
    customerDiscountPercentage,
    breakdown,
  });

  // Check if user has already used an affiliate code for this stylist (one-time-use policy)
  let isAutoApplicable = true;
  let nonApplicableReason: string | undefined;

  if (userId) {
    const hasAlreadyUsed = await hasUserAlreadyUsedAffiliateForStylist(
      userId,
      attribution.stylist_id
    );

    if (hasAlreadyUsed) {
      isAutoApplicable = false;
      nonApplicableReason = "Du har allerede brukt en partnerkode for denne stylisten tidligere.";
      console.log(`🚫 User ${userId} has already used affiliate code for stylist ${attribution.stylist_id}. Blocking reuse.`);
    }
  }

  const finalResult = {
    error: null,
    data: {
      hasAffiliateAttribution: true,
      affiliateCode: attribution.code,
      stylistName: applicableServices[0]?.stylist?.full_name || undefined,
      stylistId: attribution.stylist_id,
      applicableServices,
      discountAmount: breakdown.discountAmountNOK,
      commissionAmount: breakdown.affiliateCommissionNOK,
      isAutoApplicable,
      nonApplicableReason,
    },
  };

  console.log("🔍 SERVER - Final result:", finalResult);
  return finalResult;
}

/**
 * Apply affiliate discount to booking and record attribution
 */
export async function applyAffiliateDiscount(
  bookingId: string,
  userId?: string,
  visitorSession?: string,
) {
  const supabase = await createClient();

  // Get booking details
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(`
      *,
      booking_services(
        service:services(*)
      )
    `)
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    console.error("Error fetching booking:", bookingError);
    return { error: "Kunne ikke hente booking", data: null };
  }

  // Get affiliate attribution
  const attribution = await getAffiliateAttribution(userId);

  if (!attribution) {
    return { error: "Ingen partner attribution funnet", data: null };
  }

  // Check if any services in the booking are from the attributed stylist
  const applicableServices = booking.booking_services?.filter(
    (bs) => bs.service?.stylist_id === attribution.stylist_id,
  ) || [];

  if (applicableServices.length === 0) {
    return { error: "Ingen tjenester fra partner stylist", data: null };
  }

  // Get affiliate commission percentage
  const { data: affiliateCode } = await supabase
    .from("affiliate_links")
    .select("commission_percentage")
    .eq("link_code", attribution.code)
    .single();

  const commissionPercentage = affiliateCode?.commission_percentage ||
    DEFAULT_PLATFORM_CONFIG.fees.affiliate.defaultCommissionPercentage;

  // Calculate commission amount
  const totalApplicableAmount = Number(booking.total_price);
  const breakdown = calculateBookingPaymentBreakdown({
    serviceAmountNOK: totalApplicableAmount,
    hasAffiliate: true,
    affiliateCommissionPercentage: commissionPercentage,
  });

  // Update booking with affiliate information
  const { data: updatedBooking, error: updateError } = await supabase
    .from("bookings")
    .update({
      discount_applied: breakdown.discountAmountNOK,
      total_price: breakdown.totalAmountNOK, // Updated total after discount
    })
    .eq("id", bookingId)
    .select()
    .single();

  if (updateError) {
    console.error(
      "Error updating booking with affiliate discount:",
      updateError,
    );
    return { error: "Kunne ikke oppdatere booking", data: null };
  }

  // Record attribution conversion
  const { error: conversionError } = await convertAttribution(
    userId,
    bookingId,
    breakdown.affiliateCommissionNOK,
    visitorSession,
  );

  if (conversionError) {
    console.error("Error recording attribution conversion:", conversionError);
    // Don't fail the whole operation, just log the error
  }

  return {
    error: null,
    data: {
      booking: updatedBooking,
      discount: {
        amount: breakdown.discountAmountNOK,
        code: attribution.code,
        stylistCommission: breakdown.affiliateCommissionNOK,
      },
    },
  };
}

/**
 * Validate affiliate code manually entered by customer
 */
export async function validateManualAffiliateCode(
  code: string,
  cartItems: { serviceId: string; quantity: number }[],
): Promise<{ error: string | null; data: AffiliateCheckoutInfo | null }> {
  const supabase = await createClient();

  // Get affiliate code details
  const { data: affiliateCode, error: codeError } = await supabase
    .from("affiliate_links")
    .select(`
      *,
      stylist:profiles!affiliate_links_stylist_id_fkey(
        id,
        full_name
      )
    `)
    .eq("link_code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (codeError || !affiliateCode) {
    return { error: "Ugyldig eller inaktiv partnerkode", data: null };
  }

  // Check if code is expired
  if (
    affiliateCode.expires_at && new Date(affiliateCode.expires_at) < new Date()
  ) {
    return { error: "Partnerkoden er utløpt", data: null };
  }

  // Get services in cart
  const serviceIds = cartItems.map((item) => item.serviceId);
  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("*")
    .in("id", serviceIds);

  if (servicesError || !services) {
    return { error: "Kunne ikke hente tjenester", data: null };
  }

  // Check which services are from this stylist
  const applicableServices = services.filter(
    (service) => service.stylist_id === affiliateCode.stylist_id,
  );

  if (applicableServices.length === 0) {
    return {
      error:
        `Denne partnerkoden kan kun brukes for tjenester fra ${affiliateCode.stylist?.full_name}`,
      data: null,
    };
  }

  // Calculate discount
  let totalApplicableAmount = 0;
  applicableServices.forEach((service) => {
    const cartItem = cartItems.find((item) => item.serviceId === service.id);
    if (cartItem) {
      totalApplicableAmount += Number(service.price) * cartItem.quantity;
    }
  });

  const breakdown = calculateBookingPaymentBreakdown({
    serviceAmountNOK: totalApplicableAmount,
    hasAffiliate: true,
    affiliateCommissionPercentage: affiliateCode.commission_percentage,
  });

  return {
    error: null,
    data: {
      hasAffiliateAttribution: true,
      affiliateCode: code,
      stylistName: affiliateCode.stylist?.full_name || undefined,
      stylistId: affiliateCode.stylist_id,
      applicableServices,
      discountAmount: breakdown.discountAmountNOK,
      commissionAmount: breakdown.affiliateCommissionNOK,
      isAutoApplicable: false, // Manual entry, not auto-applied
    },
  };
}

/**
 * Get affiliate discount summary for a booking (for receipts/emails)
 */
export async function getBookingAffiliateInfo(bookingId: string) {
  const supabase = await createClient();

  const { data: attribution, error } = await supabase
    .from("affiliate_clicks")
    .select(`
      *,
      affiliate_link:affiliate_links!affiliate_clicks_affiliate_link_id_fkey(
        link_code,
        stylist:profiles!affiliate_links_stylist_id_fkey(
          full_name,
          email
        )
      )
    `)
    .eq("booking_id", bookingId)
    .eq("converted", true)
    .single();

  if (error || !attribution) {
    return { error: null, data: null };
  }

  return {
    error: null,
    data: {
      code: attribution.affiliate_link?.link_code,
      stylistName: attribution.affiliate_link?.stylist?.full_name,
      commissionAmount: attribution.commission_amount,
      discountAmount: attribution.commission_amount, // Commission given to customer as discount
    },
  };
}

/**
 * Reverse affiliate commission when booking is cancelled/refunded
 * Called when a booking with affiliate discount is cancelled
 */
export async function reverseAffiliateCommission({
  bookingId,
}: {
  bookingId: string;
}): Promise<{ success: boolean; error?: string }> {
  // Use service client to bypass RLS for commission reversal operations
  // This is necessary because refunds are administrative operations that may
  // need to update commission records across different user contexts
  const supabase = createServiceClient();

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

    if (commission.status === "failed") {
      // Already reversed/failed
      return { success: true };
    }

    // Reverse the commission by setting status to failed
    const { error: updateError } = await supabase
      .from("affiliate_commissions")
      .update({ status: "failed" })
      .eq("id", commission.id);

    if (updateError) {
      console.error("Failed to reverse commission:", updateError);
      return { success: false, error: "Failed to reverse commission" };
    }

    // Also mark the affiliate click as unconverted
    await supabase
      .from("affiliate_clicks")
      .update({
        converted: false,
        converted_at: null,
        booking_id: null,
        commission_amount: 0,
      })
      .eq("booking_id", bookingId);

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
  bookingId: string,
) {
  const supabase = await createClient();

  try {
    const { data: commission, error } = await supabase
      .from("affiliate_commissions")
      .select(`
        *,
        affiliate:profiles!affiliate_commissions_affiliate_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq("booking_id", bookingId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No commission found
        return { success: true, data: null };
      }
      console.error("Error fetching affiliate commission:", error);
      return { success: false, error: "Failed to fetch commission" };
    }

    return { success: true, data: commission };
  } catch (error) {
    console.error("Unexpected error fetching commission:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Get stylist's affiliate commissions with pagination and filtering
 */
export async function getStylistAffiliateCommissions({
  stylistId,
  status,
  limit = 50,
  offset = 0,
}: {
  stylistId: string;
  status?: "pending" | "processing" | "paid" | "failed";
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();

  try {
    let query = supabase
      .from("affiliate_commissions")
      .select(
        `
        *,
        booking:bookings!affiliate_commissions_booking_id_fkey(
          id,
          start_time,
          total_price,
          customer:profiles!bookings_customer_id_fkey(
            full_name,
            email
          )
        )
      `,
        { count: "exact" },
      )
      .eq("affiliate_id", stylistId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: commissions, error, count } = await query;

    if (error) {
      console.error("Error fetching stylist commissions:", error);
      return { success: false, error: "Failed to fetch commissions" };
    }

    return { success: true, data: commissions, count: count || 0 };
  } catch (error) {
    console.error("Unexpected error fetching commissions:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}
