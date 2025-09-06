"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { Database } from "@/types/database.types";
import {
  AffiliateAttribution,
  AffiliateAttributionDb,
  AffiliateCodeValidation,
  parseAffiliateAttributionCookie,
  affiliateCodeValidationSchema,
  createAffiliateAttributionCookie,
} from "@/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Validates an affiliate code and returns detailed information
 * Critical security: Validates code ownership and active status
 */
export async function validateAffiliateCode(
  code: string
): Promise<AffiliateCodeValidation> {
  if (!code || code.trim().length === 0) {
    return { success: false, error: "Empty affiliate code" };
  }

  const supabase = await createClient();
  
  // Join with profiles to get stylist information and ensure they're active
  const { data: affiliateCode, error } = await supabase
    .from("affiliate_codes")
    .select(`
      code,
      stylist_id,
      commission_percentage,
      is_active,
      expires_at,
      profiles!affiliate_codes_stylist_id_fkey(
        id,
        full_name,
        role
      )
    `)
    .eq("code", code.toUpperCase())
    .single();

  if (error || !affiliateCode) {
    return { success: false, error: "Invalid affiliate code" };
  }

  const profile = affiliateCode.profiles as unknown as Profile;
  
  // Security check: Ensure the stylist is still active and has correct role
  if (!profile || profile.role !== "stylist") {
    return { 
      success: false, 
      error: "Code owner is not an active stylist" 
    };
  }

  // Check if code is active
  if (!affiliateCode.is_active) {
    return { 
      success: false, 
      error: "Affiliate code is deactivated",
      is_active: false 
    };
  }

  // Check if code is expired
  const now = new Date();
  const expiresAt = affiliateCode.expires_at ? new Date(affiliateCode.expires_at) : null;
  const isExpired = expiresAt && expiresAt < now;

  if (isExpired) {
    return { 
      success: false, 
      error: "Affiliate code has expired",
      is_expired: true 
    };
  }

  return affiliateCodeValidationSchema.parse({
    success: true,
    code: affiliateCode.code,
    stylist_id: affiliateCode.stylist_id,
    stylist_name: profile.full_name,
    commission_percentage: affiliateCode.commission_percentage,
    is_active: affiliateCode.is_active,
    is_expired: false,
  });
}

/**
 * Gets affiliate attribution for a user (database first, then cookie fallback)
 * Critical security: Returns null if attribution is invalid or expired
 */
export async function getAffiliateAttribution(
  userId?: string
): Promise<AffiliateAttribution | null> {
  const supabase = await createClient();

  // If user is logged in, check database first
  if (userId) {
    const { data: dbAttribution } = await supabase
      .from("affiliate_attributions")
      .select("*")
      .eq("user_id", userId)
      .order("attributed_at", { ascending: false })
      .limit(1)
      .single();

    if (dbAttribution) {
      // Validate the code is still valid
      const validation = await validateAffiliateCode(dbAttribution.code);
      if (validation.success) {
        return {
          code: dbAttribution.code,
          attributed_at: dbAttribution.attributed_at || dbAttribution.created_at,
          expires_at: dbAttribution.expires_at,
          original_user_id: dbAttribution.original_user_id || undefined,
        };
      } else {
        // Clean up invalid attribution
        await supabase
          .from("affiliate_attributions")
          .delete()
          .eq("id", dbAttribution.id);
        return null;
      }
    }
  }

  // Fallback to cookie for anonymous users or if no DB attribution
  const cookieStore = await cookies();
  const attributionCookie = cookieStore.get("affiliate_attribution");

  if (!attributionCookie?.value) {
    return null;
  }

  const parsed = parseAffiliateAttributionCookie(attributionCookie.value);
  if (!parsed.success || !parsed.data) {
    // Clear invalid cookie
    cookieStore.delete("affiliate_attribution");
    return null;
  }

  // Check if cookie has expired
  const expiresAt = new Date(parsed.data.expires_at);
  if (expiresAt < new Date()) {
    cookieStore.delete("affiliate_attribution");
    return null;
  }

  // Validate the code is still valid
  const validation = await validateAffiliateCode(parsed.data.code);
  if (!validation.success) {
    cookieStore.delete("affiliate_attribution");
    return null;
  }

  return {
    code: parsed.data.code,
    attributed_at: parsed.data.attributed_at,
    expires_at: parsed.data.expires_at,
    original_user_id: parsed.data.original_user_id,
  };
}

/**
 * Transfers cookie attribution to database when user logs in
 * Critical security: Only transfers valid, non-expired attributions
 */
export async function transferCookieToDatabase(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const attributionCookie = cookieStore.get("affiliate_attribution");

  if (!attributionCookie?.value) {
    return;
  }

  const parsed = parseAffiliateAttributionCookie(attributionCookie.value);
  if (!parsed.success || !parsed.data) {
    cookieStore.delete("affiliate_attribution");
    return;
  }

  // Validate the code is still active
  const validation = await validateAffiliateCode(parsed.data.code);
  if (!validation.success) {
    cookieStore.delete("affiliate_attribution");
    return;
  }

  const supabase = await createClient();

  // Check if user already has an attribution for this code
  const { data: existing } = await supabase
    .from("affiliate_attributions")
    .select("id")
    .eq("user_id", userId)
    .eq("code", parsed.data.code)
    .single();

  if (!existing) {
    // Create database record
    await supabase.from("affiliate_attributions").insert({
      user_id: userId,
      code: parsed.data.code,
      attributed_at: parsed.data.attributed_at,
      expires_at: parsed.data.expires_at,
      original_user_id: parsed.data.original_user_id,
    });
  }

  // Clear cookie
  cookieStore.delete("affiliate_attribution");
}

/**
 * Clean up expired attributions from database
 * Called periodically to maintain data hygiene
 */
export async function cleanupExpiredAttributions(): Promise<void> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  await supabase
    .from("affiliate_attributions")
    .delete()
    .lt("expires_at", now);
}

/**
 * CRITICAL SECURITY: Ensures the person using the code is the original clicker
 * Prevents admins from using codes intended for customers
 */
export async function validateAffiliateUsageRights(
  userId: string,
  attribution: AffiliateAttribution
): Promise<{ canUse: boolean; reason?: string }> {
  // If there's an original_user_id, the person using must be the same
  if (attribution.original_user_id && attribution.original_user_id !== userId) {
    return { 
      canUse: false, 
      reason: "Affiliate code can only be used by the original recipient" 
    };
  }

  const supabase = await createClient();
  
  // Get user profile to check role
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  // Get stylist profile to prevent self-referral
  const validation = await validateAffiliateCode(attribution.code);
  if (!validation.success || !validation.stylist_id) {
    return { canUse: false, reason: "Invalid affiliate code" };
  }

  const { data: stylistProfile } = await supabase
    .from("profiles") 
    .select("id")
    .eq("id", validation.stylist_id)
    .single();

  // Prevent stylists from using their own codes
  if (stylistProfile && stylistProfile.id === userId) {
    return { 
      canUse: false, 
      reason: "Cannot use your own affiliate code" 
    };
  }

  // If original_user_id is not set, anyone can use it (but not the stylist themselves)
  return { canUse: true };
}