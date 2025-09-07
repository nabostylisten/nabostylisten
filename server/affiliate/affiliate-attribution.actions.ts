"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { cookies } from "next/headers";
import {
  AffiliateAttribution,
  AffiliateCodeValidation,
  affiliateCodeValidationSchema,
  parseAffiliateAttributionCookie,
} from "@/types";

/**
 * Validates an affiliate code and returns detailed information
 * Critical security: Validates code ownership and active status
 */
export async function validateAffiliateCode(
  code: string,
): Promise<AffiliateCodeValidation> {
  if (!code || code.trim().length === 0) {
    return { success: false, error: "Empty affiliate code" };
  }

  // Use service client to bypass RLS for affiliate code validation
  // This is safe because we're only reading affiliate link data for validation
  const supabase = createServiceClient();

  // Join with profiles to get stylist information and ensure they're active
  const { data: affiliateLink, error } = await supabase
    .from("affiliate_links")
    .select(`
      id,
      link_code,
      stylist_id,
      commission_percentage,
      is_active,
      expires_at,
      profiles!affiliate_links_stylist_id_fkey(
        id,
        full_name,
        role
      )
    `)
    .eq("link_code", code.toUpperCase())
    .single();

  if (error || !affiliateLink) {
    console.error(error);
    return { success: false, error: "Invalid affiliate code" };
  }

  const profile = affiliateLink.profiles;

  // Security check: Ensure the stylist is still active and has correct role
  if (!profile || profile.role !== "stylist") {
    return {
      success: false,
      error: "Code owner is not an active stylist",
    };
  }

  // Check if code is active
  if (!affiliateLink.is_active) {
    return {
      success: false,
      error: "Affiliate code is deactivated",
      is_active: false,
    };
  }

  // Check if code is expired
  const now = new Date();
  const expiresAt = affiliateLink.expires_at
    ? new Date(affiliateLink.expires_at)
    : null;
  const isExpired = expiresAt && expiresAt < now;

  if (isExpired) {
    return {
      success: false,
      error: "Affiliate code has expired",
      is_expired: true,
    };
  }

  return affiliateCodeValidationSchema.parse({
    success: true,
    code: affiliateLink.link_code,
    stylist_id: affiliateLink.stylist_id,
    stylist_name: profile.full_name,
    commission_percentage: affiliateLink.commission_percentage,
    is_active: affiliateLink.is_active,
    is_expired: false,
  });
}

/**
 * Gets affiliate attribution for a user (database first, then cookie fallback)
 * Critical security: Returns null if attribution is invalid or expired
 */
export async function getAffiliateAttribution(
  userId?: string,
): Promise<AffiliateAttribution | null> {
  console.log("🔍 ATTRIBUTION - getAffiliateAttribution called with userId:", userId);
  
  // If user is logged in, check database first
  if (userId) {
    console.log("🔍 ATTRIBUTION - User logged in, checking database first");
    
    // Use service client to bypass RLS for reading affiliate_clicks
    // This is safe because we're only reading attribution data for the specific user
    const supabase = createServiceClient();
    
    // Join affiliate_clicks with affiliate_links to get the code
    console.log("🔍 ATTRIBUTION - Querying affiliate_clicks for user with service client:", userId);
    const { data: dbAttribution, error: dbError } = await supabase
      .from("affiliate_clicks")
      .select(`
        *,
        affiliate_links!inner(
          id,
          link_code,
          is_active,
          expires_at
        )
      `)
      .eq("user_id", userId)
      .eq("converted", false) // Only get unconverted attributions
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    console.log("🔍 ATTRIBUTION - Database query result:", { dbAttribution, dbError });

    if (dbAttribution && dbAttribution.affiliate_links) {
      const affiliateLink = Array.isArray(dbAttribution.affiliate_links)
        ? dbAttribution.affiliate_links[0]
        : dbAttribution.affiliate_links;

      console.log("🔍 ATTRIBUTION - Found dbAttribution:", {
        id: dbAttribution.id,
        stylist_id: dbAttribution.stylist_id,
        affiliate_link_id: dbAttribution.affiliate_link_id,
        link_code: affiliateLink.link_code,
        created_at: dbAttribution.created_at
      });

      // Validate the code is still valid
      const validation = await validateAffiliateCode(affiliateLink.link_code);
      console.log("🔍 ATTRIBUTION - Code validation result:", validation);
      
      if (validation.success) {
        // Calculate expiration (30 days from creation)
        const createdAt = new Date(dbAttribution.created_at);
        const expiresAt = new Date(
          createdAt.getTime() + 30 * 24 * 60 * 60 * 1000,
        );

        // Check if the attribution has expired
        if (expiresAt < new Date()) {
          // Clean up expired attribution
          await supabase
            .from("affiliate_clicks")
            .delete()
            .eq("id", dbAttribution.id);
          return null;
        }

        const result = {
          code: affiliateLink.link_code,
          attributed_at: dbAttribution.created_at,
          expires_at: expiresAt.toISOString(),
          original_user_id: undefined,
          stylist_id: dbAttribution.stylist_id, // Add this critical field!
        };
        console.log("🔍 ATTRIBUTION - Returning database attribution:", result);
        return result;
      } else {
        // Clean up invalid attribution
        await supabase
          .from("affiliate_clicks")
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
    console.log("📪 getAffiliateAttribution: No attribution cookie found");
    return null;
  }

  console.log("🍪 getAffiliateAttribution: Found cookie, parsing...");
  const parsed = parseAffiliateAttributionCookie(attributionCookie.value);
  if (!parsed.success || !parsed.data) {
    // Clear invalid cookie
    console.log(
      "❌ getAffiliateAttribution: Cookie parsing failed, deleting cookie:",
      parsed,
    );
    cookieStore.delete("affiliate_attribution");
    return null;
  }

  console.log("✅ getAffiliateAttribution: Cookie parsed successfully:", {
    code: parsed.data.code,
    attributed_at: parsed.data.attributed_at,
    expires_at: parsed.data.expires_at,
  });

  // Check if cookie has expired
  const expiresAt = new Date(parsed.data.expires_at);
  if (expiresAt < new Date()) {
    console.log(
      "❌ getAffiliateAttribution: Cookie expired, deleting cookie. Expires:",
      expiresAt,
      "Now:",
      new Date(),
    );
    cookieStore.delete("affiliate_attribution");
    return null;
  }

  console.log(
    "✅ getAffiliateAttribution: Cookie not expired, validating code...",
  );

  // Validate the code is still valid
  const validation = await validateAffiliateCode(parsed.data.code);
  if (!validation.success) {
    console.log(
      "❌ getAffiliateAttribution: Code validation failed, deleting cookie:",
      validation,
    );
    cookieStore.delete("affiliate_attribution");
    return null;
  }

  console.log(
    "✅ getAffiliateAttribution: Code validation passed, returning attribution",
  );

  // For cookie attribution, we need to get the stylist_id from the code validation
  return {
    code: parsed.data.code,
    attributed_at: parsed.data.attributed_at,
    expires_at: parsed.data.expires_at,
    original_user_id: parsed.data.original_user_id,
    stylist_id: validation.stylist_id!, // Get from validation result
  };
}

/**
 * Transfers cookie attribution to database when user logs in
 * Critical security: Only transfers valid, non-expired attributions
 * Returns boolean indicating if cookie should be deleted
 */
export async function transferCookieToDatabase(
  userId: string,
): Promise<{ success: boolean; shouldDeleteCookie: boolean }> {
  console.log(`🔄 Starting cookie transfer for user: ${userId}`);

  const cookieStore = await cookies();
  const attributionCookie = cookieStore.get("affiliate_attribution");

  if (!attributionCookie?.value) {
    console.log("⚠️  No affiliate attribution cookie found");
    return { success: true, shouldDeleteCookie: false };
  }

  console.log(`📝 Found cookie value: ${attributionCookie.value}`);

  const parsed = parseAffiliateAttributionCookie(attributionCookie.value);

  if (!parsed.success || !parsed.data) {
    console.log("❌ Failed to parse cookie data:", parsed);
    return { success: false, shouldDeleteCookie: true };
  }

  console.log(`✅ Parsed cookie data:`, {
    code: parsed.data.code,
    attributed_at: parsed.data.attributed_at,
    expires_at: parsed.data.expires_at,
  });

  // Validate the code is still active
  const validation = await validateAffiliateCode(parsed.data.code);

  if (!validation.success || !validation.stylist_id) {
    console.log("❌ Code validation failed:", validation);
    return { success: false, shouldDeleteCookie: true };
  }

  console.log(
    `✅ Code validation passed for stylist: ${validation.stylist_id}`,
  );

  // Use service client to bypass any potential RLS issues during cookie transfer
  // This is safe because we've already validated the user and the code above
  const supabase = createServiceClient();

  // Get the affiliate_link_id from the link_code
  const { data: affiliateLink, error: linkError } = await supabase
    .from("affiliate_links")
    .select("id")
    .eq("link_code", parsed.data.code.toUpperCase())
    .single();

  if (linkError || !affiliateLink) {
    console.log("❌ Failed to find affiliate link:", linkError);
    return { success: false, shouldDeleteCookie: true };
  }

  console.log(`✅ Found affiliate link: ${affiliateLink.id}`);

  // Check if user already has an attribution for this affiliate link
  const { data: existing, error: existingError } = await supabase
    .from("affiliate_clicks")
    .select("id")
    .eq("user_id", userId)
    .eq("affiliate_link_id", affiliateLink.id)
    .eq("converted", false)
    .single();

  if (existingError && existingError.code !== "PGRST116") { // PGRST116 = no rows found
    console.log("❌ Error checking existing attribution:", existingError);
    return { success: false, shouldDeleteCookie: false };
  }

  if (existing) {
    console.log(`ℹ️  Attribution already exists: ${existing.id}`);
    return { success: true, shouldDeleteCookie: true };
  }

  console.log("📝 Creating new affiliate click record...");

  const insertData = {
    affiliate_link_id: affiliateLink.id,
    stylist_id: validation.stylist_id,
    user_id: userId,
    visitor_id: parsed.data.visitor_session || null,
    converted: false,
    // Technical tracking data can be added here if needed
  };

  console.log("📤 Insert data:", insertData);

  const { data: insertResult, error: insertError } = await supabase
    .from("affiliate_clicks")
    .insert(insertData)
    .select("id")
    .single();

  if (insertError) {
    console.log("❌ Insert failed:", insertError);
    return { success: false, shouldDeleteCookie: false }; // Don't delete cookie if insert failed
  }

  console.log(
    `✅ Successfully created affiliate click record: ${insertResult?.id}`,
  );
  return { success: true, shouldDeleteCookie: true };
}

/**
 * Clean up expired attributions from database
 * Called periodically to maintain data hygiene
 * Removes clicks older than 30 days that haven't converted
 */
export async function cleanupExpiredAttributions(): Promise<void> {
  const supabase = await createClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Delete unconverted clicks older than 30 days
  await supabase
    .from("affiliate_clicks")
    .delete()
    .eq("converted", false)
    .lt("created_at", thirtyDaysAgo.toISOString());
}

/**
 * CRITICAL SECURITY: Ensures the person using the code is the original clicker
 * Prevents admins from using codes intended for customers
 */
export async function validateAffiliateUsageRights(
  userId: string,
  attribution: AffiliateAttribution,
): Promise<{ canUse: boolean; reason?: string }> {
  // If there's an original_user_id, the person using must be the same
  if (attribution.original_user_id && attribution.original_user_id !== userId) {
    return {
      canUse: false,
      reason: "Affiliate code can only be used by the original recipient",
    };
  }

  const supabase = await createClient();

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
      reason: "Cannot use your own affiliate code",
    };
  }

  // If original_user_id is not set, anyone can use it (but not the stylist themselves)
  return { canUse: true };
}

/**
 * Convert attribution to a successful booking (mark as converted)
 * Called when a booking with affiliate discount is completed
 */
export async function convertAttribution(
  userId?: string,
  bookingId?: string,
  commissionAmount?: number,
  visitorSession?: string,
): Promise<{ error: string | null }> {
  if (!userId && !visitorSession) {
    return { error: "No user or visitor session provided" };
  }

  const supabase = await createClient();

  try {
    // Update the affiliate click to mark as converted
    const updateData = {
      converted: true,
      converted_at: new Date().toISOString(),
      ...(bookingId && { booking_id: bookingId }),
      ...(commissionAmount && { commission_amount: commissionAmount }),
    };

    let query = supabase
      .from("affiliate_clicks")
      .update(updateData)
      .eq("converted", false);

    if (userId) {
      query = query.eq("user_id", userId);
    } else if (visitorSession) {
      query = query.eq("visitor_id", visitorSession);
    }

    const { error } = await query;

    if (error) {
      console.error("Error converting attribution:", error);
      return { error: "Failed to convert attribution" };
    }

    return { error: null };
  } catch (error) {
    console.error("Unexpected error converting attribution:", error);
    return { error: "Unexpected error occurred" };
  }
}
