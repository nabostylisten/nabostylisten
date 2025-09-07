"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Generate a unique affiliate code for a stylist
 */
function generateAffiliateCode(stylistName: string): string {
  // Remove special characters and spaces, take first part of name
  const cleanName = stylistName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 10);

  // Add random suffix for uniqueness
  const year = new Date().getFullYear();

  return `${cleanName}-${year}`.toUpperCase();
}

/**
 * Create an affiliate code after application approval
 */
export async function createAffiliateCode(
  stylistId: string,
  applicationId: string,
  commissionPercentage?: number,
) {
  const supabase = await createClient();

  // Get stylist information
  const { data: stylist, error: stylistError } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", stylistId)
    .single();

  if (stylistError || !stylist) {
    console.error("Error fetching stylist:", stylistError);
    return { error: "Kunne ikke finne stylist", data: null };
  }

  // Check if an affiliate code already exists for this application
  const { data: existingCodeForApp } = await supabase
    .from("affiliate_links")
    .select("*")
    .eq("application_id", applicationId)
    .single();

  if (existingCodeForApp) {
    // If code exists but is inactive, reactivate it
    if (!existingCodeForApp.is_active) {
      const { data: reactivatedCode, error: reactivateError } = await supabase
        .from("affiliate_links")
        .update({ 
          is_active: true,
          commission_percentage: commissionPercentage || existingCodeForApp.commission_percentage || 0.20
        })
        .eq("id", existingCodeForApp.id)
        .select()
        .single();

      if (reactivateError) {
        console.error("Error reactivating affiliate code:", reactivateError);
        return { error: "Kunne ikke reaktivere eksisterende partnerkode", data: null };
      }

      return { error: null, data: reactivatedCode };
    } else {
      // Code already exists and is active
      return { error: null, data: existingCodeForApp };
    }
  }

  // Check if stylist has any other active affiliate codes (different applications)
  const { data: otherActiveCode } = await supabase
    .from("affiliate_links")
    .select("id, is_active")
    .eq("stylist_id", stylistId)
    .eq("is_active", true)
    .neq("application_id", applicationId)
    .single();

  if (otherActiveCode) {
    return { error: "Stylist har allerede en aktiv partnerkode for en annen søknad", data: null };
  }

  // Generate unique code
  let code = generateAffiliateCode(stylist.full_name || "stylist");
  let attempts = 0;
  const maxAttempts = 5;

  // Ensure code is unique
  while (attempts < maxAttempts) {
    const { data: existingWithCode } = await supabase
      .from("affiliate_links")
      .select("id")
      .eq("link_code", code)
      .single();

    if (!existingWithCode) {
      break; // Code is unique
    }

    // Generate new code with different suffix
    code = generateAffiliateCode(stylist.full_name || "stylist");
    attempts++;
  }

  if (attempts >= maxAttempts) {
    return { error: "Kunne ikke generere unik partnerkode", data: null };
  }

  // Get default commission percentage from platform config if not provided
  const defaultCommissionPercentage = commissionPercentage || 0.20;

  // Create affiliate code
  const { data: affiliateCode, error } = await supabase
    .from("affiliate_links")
    .insert({
      stylist_id: stylistId,
      application_id: applicationId,
      link_code: code,
      commission_percentage: defaultCommissionPercentage,
      is_active: true,
      expires_at: null, // No expiration for now
      click_count: 0,
      conversion_count: 0,
      total_commission_earned: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating affiliate code:", error);
    return { error: "Kunne ikke opprette partnerkode", data: null };
  }

  return { error: null, data: affiliateCode };
}

/**
 * Get affiliate code by code string
 */
export async function getAffiliateCodeByCode(code: string) {
  const supabase = await createClient();

  const { data: affiliateCode, error } = await supabase
    .from("affiliate_links")
    .select(`
      *,
      stylist:profiles!affiliate_links_stylist_id_fkey(
        id,
        full_name,
        email
      )
    `)
    .eq("link_code", code)
    .eq("is_active", true)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching affiliate code:", error);
    return { error: "Kunne ikke hente partnerkode", data: null };
  }

  // Check if code is expired
  if (
    affiliateCode?.expires_at && new Date(affiliateCode.expires_at) < new Date()
  ) {
    return { error: "Partnerkoden er utløpt", data: null };
  }

  return { error: null, data: affiliateCode };
}

/**
 * Get affiliate code by stylist ID
 */
export async function getAffiliateCodeByStylist(stylistId: string) {
  const supabase = await createClient();

  const { data: affiliateCode, error } = await supabase
    .from("affiliate_links")
    .select("*")
    .eq("stylist_id", stylistId)
    .eq("is_active", true)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching affiliate code for stylist:", error);
    return { error: "Kunne ikke hente partnerkode", data: null };
  }

  return { error: null, data: affiliateCode };
}

/**
 * Get all affiliate codes with performance metrics
 */
export async function getAllAffiliateCodes(limit = 50, offset = 0) {
  const supabase = await createClient();

  const { data: affiliateCodes, error } = await supabase
    .from("affiliate_links")
    .select(`
      *,
      stylist:profiles!affiliate_links_stylist_id_fkey(
        id,
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching affiliate codes:", error);
    return { error: "Kunne ikke hente partnerkoder", data: null };
  }

  // Transform data to match admin interface expectations
  const transformedData = affiliateCodes?.map((code) => ({
    id: code.id,
    profile_id: code.stylist_id,
    stylist_name: code.stylist?.full_name || "Unknown",
    code: code.link_code,
    is_active: code.is_active,
    created_at: code.created_at,
    clicks: code.click_count || 0,
    conversions: code.conversion_count || 0,
    commission_earned: code.total_commission_earned || 0,
  }));

  return { error: null, data: transformedData || [] };
}

/**
 * Update affiliate code click count
 */
export async function incrementAffiliateClick(code: string) {
  const supabase = await createClient();

  // First get current click count
  const { data: currentData, error: fetchError } = await supabase
    .from("affiliate_links")
    .select("click_count")
    .eq("link_code", code)
    .single();

  if (fetchError || !currentData) {
    console.error("Error fetching current click count:", fetchError);
    return { error: "Kunne ikke hente klikktelling" };
  }

  // Update with incremented value
  const { error } = await supabase
    .from("affiliate_links")
    .update({
      click_count: (currentData.click_count || 0) + 1,
    })
    .eq("link_code", code);

  if (error) {
    console.error("Error incrementing click count:", error);
    return { error: "Kunne ikke oppdatere klikktelling" };
  }

  return { error: null };
}

/**
 * Update affiliate code conversion metrics
 */
export async function incrementAffiliateConversion(
  code: string,
  commissionAmount: number,
) {
  const supabase = await createClient();

  // First get current metrics
  const { data: currentData, error: fetchError } = await supabase
    .from("affiliate_links")
    .select("conversion_count, total_commission_earned")
    .eq("link_code", code)
    .single();

  if (fetchError || !currentData) {
    console.error("Error fetching current metrics:", fetchError);
    return { error: "Kunne ikke hente konverteringsstatistikk" };
  }

  // Update with incremented values
  const { error } = await supabase
    .from("affiliate_links")
    .update({
      conversion_count: (currentData.conversion_count || 0) + 1,
      total_commission_earned: (currentData.total_commission_earned || 0) +
        commissionAmount,
    })
    .eq("link_code", code);

  if (error) {
    console.error("Error updating conversion metrics:", error);
    return { error: "Kunne ikke oppdatere konverteringsstatistikk" };
  }

  return { error: null };
}

/**
 * Deactivate affiliate code by application ID (when application is rejected)
 */
export async function deactivateAffiliateCodeByApplication(applicationId: string) {
  const supabase = await createClient();

  const { data: affiliateCode, error } = await supabase
    .from("affiliate_links")
    .update({ is_active: false })
    .eq("application_id", applicationId)
    .select()
    .single();

  if (error && error.code !== "PGRST116") { // PGRST116 = no rows found
    console.error("Error deactivating affiliate code by application:", error);
    return { error: "Kunne ikke deaktivere partnerkode", data: null };
  }

  return { error: null, data: affiliateCode };
}

/**
 * Deactivate affiliate code
 */
export async function deactivateAffiliateCode(codeId: string) {
  const supabase = await createClient();

  const { data: affiliateCode, error } = await supabase
    .from("affiliate_links")
    .update({ is_active: false })
    .eq("id", codeId)
    .select()
    .single();

  if (error) {
    console.error("Error deactivating affiliate code:", error);
    return { error: "Kunne ikke deaktivere partnerkode", data: null };
  }

  return { error: null, data: affiliateCode };
}

/**
 * Reactivate affiliate code
 */
export async function reactivateAffiliateCode(codeId: string) {
  const supabase = await createClient();

  const { data: affiliateCode, error } = await supabase
    .from("affiliate_links")
    .update({ is_active: true })
    .eq("id", codeId)
    .select()
    .single();

  if (error) {
    console.error("Error reactivating affiliate code:", error);
    return { error: "Kunne ikke reaktivere partnerkode", data: null };
  }

  return { error: null, data: affiliateCode };
}

/**
 * Update affiliate code expiration
 */
export async function updateAffiliateCodeExpiration(
  codeId: string,
  expiresAt: string | null,
) {
  const supabase = await createClient();

  const { data: affiliateCode, error } = await supabase
    .from("affiliate_links")
    .update({ expires_at: expiresAt })
    .eq("id", codeId)
    .select()
    .single();

  if (error) {
    console.error("Error updating affiliate code expiration:", error);
    return { error: "Kunne ikke oppdatere utløpsdato", data: null };
  }

  return { error: null, data: affiliateCode };
}

/**
 * Generate social media sharing link
 */
export async function generateSharingLink(
  code: string,
  baseUrl = "https://nabostylisten.no",
) {
  return `${baseUrl}?code=${code}`;
}

/**
 * Get affiliate code performance analytics
 */
export async function getAffiliateCodeAnalytics(codeId: string) {
  const supabase = await createClient();

  // Get basic code info and metrics
  const { data: codeData, error: codeError } = await supabase
    .from("affiliate_links")
    .select("*")
    .eq("id", codeId)
    .single();

  if (codeError) {
    console.error("Error fetching affiliate code analytics:", codeError);
    return { error: "Kunne ikke hente analysedata", data: null };
  }

  // Get recent attributions and conversions
  const { data: attributions, error: attributionsError } = await supabase
    .from("affiliate_clicks")
    .select("*")
    .eq("affiliate_link_id", codeId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (attributionsError) {
    console.error("Error fetching attributions:", attributionsError);
  }

  return {
    error: null,
    data: {
      code: codeData,
      attributions: attributions || [],
      conversionRate: codeData.click_count > 0
        ? parseFloat(
          ((codeData.conversion_count / codeData.click_count) * 100).toFixed(1),
        )
        : 0,
    },
  };
}
