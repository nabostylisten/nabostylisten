"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

type AffiliateAttribution = Database["public"]["Tables"]["affiliate_clicks"]["Row"];
type AffiliateAttributionInsert = Database["public"]["Tables"]["affiliate_clicks"]["Insert"];

const ATTRIBUTION_COOKIE_NAME = "affiliate_attribution";
const ATTRIBUTION_DAYS = 30;

export interface AffiliateAttributionData {
  code: string;
  attributed_at: string;
  expires_at: string;
  stylist_id: string;
}

/**
 * Set affiliate attribution cookie
 */
export async function setAffiliateAttribution(code: string) {
  const cookieStore = await cookies();
  const supabase = await createClient();
  
  // Validate that the code exists and is active
  const { data: affiliateCode, error } = await supabase
    .from("affiliate_links")
    .select("id, stylist_id, is_active, expires_at")
    .eq("link_code", code)
    .single();

  if (error || !affiliateCode || !affiliateCode.is_active) {
    return { error: "Ugyldig eller inaktiv partnerkode", data: null };
  }

  // Check if code is expired
  if (affiliateCode.expires_at && new Date(affiliateCode.expires_at) < new Date()) {
    return { error: "Partnerkoden er utløpt", data: null };
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + (ATTRIBUTION_DAYS * 24 * 60 * 60 * 1000));
  
  const attribution: AffiliateAttributionData = {
    code,
    attributed_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    stylist_id: affiliateCode.stylist_id
  };

  // Set cookie with 30-day expiration
  cookieStore.set({
    name: ATTRIBUTION_COOKIE_NAME,
    value: JSON.stringify(attribution),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ATTRIBUTION_DAYS * 24 * 60 * 60, // 30 days in seconds
    path: "/"
  });

  // Increment click count
  const { error: clickError } = await supabase
    .from("affiliate_links")
    .update({
      click_count: supabase.rpc('increment_by_one', { 
        table_name: 'affiliate_links',
        column_name: 'click_count',
        id: affiliateCode.id
      })
    })
    .eq("id", affiliateCode.id);

  if (clickError) {
    console.error("Error incrementing click count:", clickError);
  }

  return { error: null, data: attribution };
}

/**
 * Get affiliate attribution from cookie or database
 */
export async function getAffiliateAttribution(userId?: string) {
  const cookieStore = await cookies();
  const supabase = await createClient();
  
  // First, try to get attribution from database if user is logged in
  if (userId) {
    const { data: dbAttribution, error } = await supabase
      .from("affiliate_clicks")
      .select(`
        *,
        affiliate_link:affiliate_links!affiliate_clicks_affiliate_link_id_fkey(
          link_code,
          stylist_id,
          is_active,
          expires_at
        )
      `)
      .eq("user_id", userId)
      .eq("converted", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!error && dbAttribution?.affiliate_link) {
      // Check if attribution is still valid (within 30 days)
      const attributedAt = new Date(dbAttribution.created_at);
      const expiresAt = new Date(attributedAt.getTime() + (ATTRIBUTION_DAYS * 24 * 60 * 60 * 1000));
      
      if (new Date() < expiresAt && dbAttribution.affiliate_link.is_active) {
        return {
          error: null,
          data: {
            code: dbAttribution.affiliate_link.link_code,
            attributed_at: dbAttribution.created_at,
            expires_at: expiresAt.toISOString(),
            stylist_id: dbAttribution.affiliate_link.stylist_id,
            attribution_id: dbAttribution.id
          }
        };
      }
    }
  }

  // Fall back to cookie
  const attributionCookie = cookieStore.get(ATTRIBUTION_COOKIE_NAME);
  
  if (!attributionCookie?.value) {
    return { error: null, data: null };
  }

  try {
    const attribution: AffiliateAttributionData = JSON.parse(attributionCookie.value);
    
    // Check if attribution has expired
    if (new Date() > new Date(attribution.expires_at)) {
      // Clean up expired cookie
      cookieStore.delete(ATTRIBUTION_COOKIE_NAME);
      return { error: null, data: null };
    }

    // Validate that the code is still active
    const { data: affiliateCode } = await supabase
      .from("affiliate_links")
      .select("is_active, expires_at")
      .eq("link_code", attribution.code)
      .single();

    if (!affiliateCode?.is_active) {
      cookieStore.delete(ATTRIBUTION_COOKIE_NAME);
      return { error: null, data: null };
    }

    return { error: null, data: attribution };
  } catch (error) {
    console.error("Error parsing attribution cookie:", error);
    cookieStore.delete(ATTRIBUTION_COOKIE_NAME);
    return { error: null, data: null };
  }
}

/**
 * Store attribution in database for logged-in user
 */
export async function storeUserAttribution(userId: string, visitorSession?: string) {
  const supabase = await createClient();
  
  // Get attribution from cookie
  const { data: attribution } = await getAffiliateAttribution();
  
  if (!attribution) {
    return { error: null, data: null };
  }

  // Get affiliate link ID
  const { data: affiliateCode } = await supabase
    .from("affiliate_links")
    .select("id")
    .eq("link_code", attribution.code)
    .single();

  if (!affiliateCode) {
    return { error: "Kunne ikke finne partnerkode", data: null };
  }

  // Check if attribution already exists for this user and code
  const { data: existingAttribution } = await supabase
    .from("affiliate_clicks")
    .select("id")
    .eq("user_id", userId)
    .eq("affiliate_link_id", affiliateCode.id)
    .eq("converted", false)
    .single();

  if (existingAttribution) {
    // Attribution already stored
    return { error: null, data: existingAttribution };
  }

  // Store new attribution
  const { data: newAttribution, error } = await supabase
    .from("affiliate_clicks")
    .insert({
      affiliate_link_id: affiliateCode.id,
      stylist_id: attribution.stylist_id,
      user_id: userId,
      visitor_id: visitorSession,
      converted: false,
      commission_amount: 0,
      created_at: attribution.attributed_at
    })
    .select()
    .single();

  if (error) {
    console.error("Error storing user attribution:", error);
    return { error: "Kunne ikke lagre attribution", data: null };
  }

  // Clean up cookie since it's now stored in database
  const cookieStore = await cookies();
  cookieStore.delete(ATTRIBUTION_COOKIE_NAME);

  return { error: null, data: newAttribution };
}

/**
 * Mark attribution as converted and record commission
 */
export async function convertAttribution(
  userId: string | null,
  bookingId: string,
  commissionAmount: number,
  visitorSession?: string
) {
  const supabase = await createClient();
  
  let attributionId: string | null = null;

  if (userId) {
    // Find attribution by user ID
    const { data: attribution } = await supabase
      .from("affiliate_clicks")
      .select("id, affiliate_link_id")
      .eq("user_id", userId)
      .eq("converted", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (attribution) {
      attributionId = attribution.id;
    }
  } else {
    // Find attribution by visitor session
    const { data: attribution } = await supabase
      .from("affiliate_clicks")
      .select("id, affiliate_link_id")
      .eq("visitor_id", visitorSession)
      .eq("converted", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (attribution) {
      attributionId = attribution.id;
    }
  }

  if (!attributionId) {
    return { error: null, data: null }; // No attribution found
  }

  // Update attribution as converted
  const { data: convertedAttribution, error } = await supabase
    .from("affiliate_clicks")
    .update({
      converted: true,
      converted_at: new Date().toISOString(),
      booking_id: bookingId,
      commission_amount: commissionAmount
    })
    .eq("id", attributionId)
    .select(`
      *,
      affiliate_link:affiliate_links!affiliate_clicks_affiliate_link_id_fkey(*)
    `)
    .single();

  if (error) {
    console.error("Error converting attribution:", error);
    return { error: "Kunne ikke konvertere attribution", data: null };
  }

  // Update affiliate link conversion metrics
  if (convertedAttribution.affiliate_link) {
    const { error: updateError } = await supabase
      .from("affiliate_links")
      .update({
        conversion_count: convertedAttribution.affiliate_link.conversion_count + 1,
        total_commission_earned: 
          convertedAttribution.affiliate_link.total_commission_earned + commissionAmount
      })
      .eq("id", convertedAttribution.affiliate_link_id);

    if (updateError) {
      console.error("Error updating affiliate link metrics:", updateError);
    }
  }

  return { error: null, data: convertedAttribution };
}

/**
 * Reverse attribution conversion (for refunds/cancellations)
 */
export async function reverseAttribution(bookingId: string) {
  const supabase = await createClient();
  
  // Find converted attribution for this booking
  const { data: attribution, error } = await supabase
    .from("affiliate_clicks")
    .select(`
      *,
      affiliate_link:affiliate_links!affiliate_clicks_affiliate_link_id_fkey(*)
    `)
    .eq("booking_id", bookingId)
    .eq("converted", true)
    .single();

  if (error || !attribution) {
    return { error: null, data: null }; // No attribution found
  }

  const commissionAmount = attribution.commission_amount;

  // Reverse the conversion
  const { data: reversedAttribution, error: reverseError } = await supabase
    .from("affiliate_clicks")
    .update({
      converted: false,
      converted_at: null,
      booking_id: null,
      commission_amount: 0
    })
    .eq("id", attribution.id)
    .select()
    .single();

  if (reverseError) {
    console.error("Error reversing attribution:", reverseError);
    return { error: "Kunne ikke reversere attribution", data: null };
  }

  // Update affiliate link metrics
  if (attribution.affiliate_link) {
    const { error: updateError } = await supabase
      .from("affiliate_links")
      .update({
        conversion_count: Math.max(0, attribution.affiliate_link.conversion_count - 1),
        total_commission_earned: 
          Math.max(0, attribution.affiliate_link.total_commission_earned - commissionAmount)
      })
      .eq("id", attribution.affiliate_link_id);

    if (updateError) {
      console.error("Error updating affiliate link metrics after reversal:", updateError);
    }
  }

  return { error: null, data: reversedAttribution };
}

/**
 * Clean up expired attributions (for maintenance)
 */
export async function cleanupExpiredAttributions() {
  const supabase = await createClient();
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - ATTRIBUTION_DAYS);

  const { error } = await supabase
    .from("affiliate_clicks")
    .delete()
    .eq("converted", false)
    .lt("created_at", cutoffDate.toISOString());

  if (error) {
    console.error("Error cleaning up expired attributions:", error);
    return { error: "Kunne ikke rydde opp i utløpte attributions" };
  }

  return { error: null };
}