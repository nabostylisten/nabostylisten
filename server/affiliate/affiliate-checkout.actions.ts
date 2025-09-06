"use server";

import { createClient } from "@/lib/supabase/server";
import { getAffiliateAttribution, convertAttribution } from "./affiliate-attribution.actions";
import { calculateBookingPaymentBreakdown } from "@/schemas/platform-config.schema";
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
}

/**
 * Check if user has affiliate attribution that can be applied to cart
 */
export async function checkAffiliateDiscount(
  cartItems: { serviceId: string; quantity: number }[],
  userId?: string,
  visitorSession?: string
): Promise<{ error: string | null; data: AffiliateCheckoutInfo | null }> {
  const supabase = await createClient();
  
  // Get affiliate attribution
  const { data: attribution } = await getAffiliateAttribution(userId);
  
  if (!attribution) {
    return {
      error: null,
      data: {
        hasAffiliateAttribution: false,
        applicableServices: [],
        discountAmount: 0,
        commissionAmount: 0,
        isAutoApplicable: false
      }
    };
  }

  // Get services in cart with stylist information
  const serviceIds = cartItems.map(item => item.serviceId);
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
    console.error("Error fetching services:", servicesError);
    return { error: "Kunne ikke hente tjenester", data: null };
  }

  // Check which services are from the attributed stylist
  const applicableServices = services.filter(
    service => service.stylist_id === attribution.stylist_id
  );

  if (applicableServices.length === 0) {
    return {
      error: null,
      data: {
        hasAffiliateAttribution: true,
        affiliateCode: attribution.code,
        stylistId: attribution.stylist_id,
        applicableServices: [],
        discountAmount: 0,
        commissionAmount: 0,
        isAutoApplicable: false
      }
    };
  }

  // Calculate total amount for applicable services
  let totalApplicableAmount = 0;
  applicableServices.forEach(service => {
    const cartItem = cartItems.find(item => item.serviceId === service.id);
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
  const breakdown = calculateBookingPaymentBreakdown({
    serviceAmountNOK: totalApplicableAmount,
    hasAffiliate: true,
    affiliateCommissionPercentage: commissionPercentage
  });

  return {
    error: null,
    data: {
      hasAffiliateAttribution: true,
      affiliateCode: attribution.code,
      stylistName: applicableServices[0]?.stylist?.full_name,
      stylistId: attribution.stylist_id,
      applicableServices,
      discountAmount: breakdown.discountAmountNOK,
      commissionAmount: breakdown.affiliateCommissionNOK,
      isAutoApplicable: true
    }
  };
}

/**
 * Apply affiliate discount to booking and record attribution
 */
export async function applyAffiliateDiscount(
  bookingId: string,
  userId?: string,
  visitorSession?: string
): Promise<{ error: string | null; data: any }> {
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
  const { data: attribution } = await getAffiliateAttribution(userId);
  
  if (!attribution) {
    return { error: "Ingen partner attribution funnet", data: null };
  }

  // Check if any services in the booking are from the attributed stylist
  const applicableServices = booking.booking_services?.filter(
    bs => bs.service?.stylist_id === attribution.stylist_id
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

  const commissionPercentage = affiliateCode?.commission_percentage || 0.20;

  // Calculate commission amount
  const totalApplicableAmount = Number(booking.total_price);
  const breakdown = calculateBookingPaymentBreakdown({
    serviceAmountNOK: totalApplicableAmount,
    hasAffiliate: true,
    affiliateCommissionPercentage: commissionPercentage
  });

  // Update booking with affiliate information
  const { data: updatedBooking, error: updateError } = await supabase
    .from("bookings")
    .update({
      discount_applied: breakdown.discountAmountNOK,
      total_price: breakdown.totalAmountNOK // Updated total after discount
    })
    .eq("id", bookingId)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating booking with affiliate discount:", updateError);
    return { error: "Kunne ikke oppdatere booking", data: null };
  }

  // Record attribution conversion
  const { error: conversionError } = await convertAttribution(
    userId,
    bookingId,
    breakdown.affiliateCommissionNOK,
    visitorSession
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
        stylistCommission: breakdown.affiliateCommissionNOK
      }
    }
  };
}

/**
 * Validate affiliate code manually entered by customer
 */
export async function validateManualAffiliateCode(
  code: string,
  cartItems: { serviceId: string; quantity: number }[]
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
  if (affiliateCode.expires_at && new Date(affiliateCode.expires_at) < new Date()) {
    return { error: "Partnerkoden er utløpt", data: null };
  }

  // Get services in cart
  const serviceIds = cartItems.map(item => item.serviceId);
  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("*")
    .in("id", serviceIds);

  if (servicesError || !services) {
    return { error: "Kunne ikke hente tjenester", data: null };
  }

  // Check which services are from this stylist
  const applicableServices = services.filter(
    service => service.stylist_id === affiliateCode.stylist_id
  );

  if (applicableServices.length === 0) {
    return { 
      error: `Denne partnerkoden kan kun brukes for tjenester fra ${affiliateCode.stylist?.full_name}`,
      data: null 
    };
  }

  // Calculate discount
  let totalApplicableAmount = 0;
  applicableServices.forEach(service => {
    const cartItem = cartItems.find(item => item.serviceId === service.id);
    if (cartItem) {
      totalApplicableAmount += Number(service.price) * cartItem.quantity;
    }
  });

  const breakdown = calculateBookingPaymentBreakdown({
    serviceAmountNOK: totalApplicableAmount,
    hasAffiliate: true,
    affiliateCommissionPercentage: affiliateCode.commission_percentage
  });

  return {
    error: null,
    data: {
      hasAffiliateAttribution: true,
      affiliateCode: code,
      stylistName: affiliateCode.stylist?.full_name,
      stylistId: affiliateCode.stylist_id,
      applicableServices,
      discountAmount: breakdown.discountAmountNOK,
      commissionAmount: breakdown.affiliateCommissionNOK,
      isAutoApplicable: false // Manual entry, not auto-applied
    }
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
      discountAmount: attribution.commission_amount // Commission given to customer as discount
    }
  };
}