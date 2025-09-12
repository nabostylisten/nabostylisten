"use server";

import { createClient } from "@/lib/supabase/server";
import { checkIdentityVerificationStatus } from "@/server/stripe.actions";

/**
 * Database sync utility for stylist verification status
 * 
 * This utility ensures the database accurately reflects Stripe verification status
 * by using Stripe API as the source of truth and only updating when verified.
 */

/**
 * Sync verification status from Stripe to database for a single stylist
 * 
 * Only updates database when Stripe confirms verification is complete.
 * This prevents premature setting of identity_verification_completed_at.
 * 
 * @param stylistProfileId - Profile ID of the stylist to sync
 * @returns Success/error result with sync details
 */
export async function syncVerificationStatusToDatabase(stylistProfileId: string) {
  const supabase = await createClient();

  try {
    // Get current stylist details from database
    const { data: stylistDetails, error: stylistError } = await supabase
      .from("stylist_details")
      .select("stripe_verification_session_id, identity_verification_completed_at")
      .eq("profile_id", stylistProfileId)
      .single();

    if (stylistError || !stylistDetails) {
      return {
        data: null,
        error: "Stylist details not found",
      };
    }

    // If already marked as complete in database, no sync needed
    if (stylistDetails.identity_verification_completed_at) {
      return {
        data: {
          stylistProfileId,
          alreadySynced: true,
          needsSync: false,
          action: "none",
        },
        error: null,
      };
    }

    // If no verification session, cannot sync
    if (!stylistDetails.stripe_verification_session_id) {
      return {
        data: {
          stylistProfileId,
          alreadySynced: false,
          needsSync: false,
          action: "none",
          reason: "No verification session found",
        },
        error: null,
      };
    }

    // Check current status from Stripe API (source of truth)
    const verificationResult = await checkIdentityVerificationStatus();
    
    if (verificationResult.error || !verificationResult.data) {
      return {
        data: null,
        error: `Failed to check Stripe verification status: ${verificationResult.error}`,
      };
    }

    const { status } = verificationResult.data;

    // Only update database if Stripe confirms verification is complete
    if (status === "verified") {
      const { error: updateError } = await supabase
        .from("stylist_details")
        .update({
          identity_verification_completed_at: new Date().toISOString(),
        })
        .eq("profile_id", stylistProfileId);

      if (updateError) {
        console.error("Failed to sync verification status to database:", updateError);
        return {
          data: null,
          error: "Failed to update database with verification status",
        };
      }

      return {
        data: {
          stylistProfileId,
          alreadySynced: false,
          needsSync: true,
          action: "updated",
          stripeStatus: status,
          syncedAt: new Date().toISOString(),
        },
        error: null,
      };
    }

    // Stripe status is not "verified" - no database update needed
    return {
      data: {
        stylistProfileId,
        alreadySynced: false,
        needsSync: false,
        action: "none",
        stripeStatus: status,
        reason: "Verification not yet completed in Stripe",
      },
      error: null,
    };
  } catch (error) {
    console.error("Error in syncVerificationStatusToDatabase:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Batch sync verification status for multiple stylists
 * 
 * Useful for admin operations or periodic cleanup tasks.
 * 
 * @param stylistProfileIds - Array of profile IDs to sync
 * @returns Results for each stylist sync operation
 */
export async function batchSyncVerificationStatus(stylistProfileIds: string[]) {
  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (const profileId of stylistProfileIds) {
    const result = await syncVerificationStatusToDatabase(profileId);
    results.push({
      profileId,
      ...result,
    });

    if (result.error) {
      errorCount++;
    } else if (result.data?.action === "updated") {
      successCount++;
    }
  }

  return {
    data: {
      totalProcessed: stylistProfileIds.length,
      successCount,
      errorCount,
      results,
    },
    error: null,
  };
}

/**
 * Find stylists who may need verification status sync
 * 
 * Identifies stylists who have verification sessions but no completion timestamp,
 * indicating they might need their status synced from Stripe.
 * 
 * @param limit - Maximum number of records to return
 * @returns List of stylist profile IDs that may need syncing
 */
export async function findStylistsNeedingSync(limit: number = 50) {
  const supabase = await createClient();

  try {
    const { data: stylists, error } = await supabase
      .from("stylist_details")
      .select("profile_id")
      .not("stripe_verification_session_id", "is", null)
      .is("identity_verification_completed_at", null)
      .limit(limit);

    if (error) {
      return {
        data: null,
        error: "Failed to query stylists needing sync",
      };
    }

    return {
      data: {
        profileIds: stylists.map(s => s.profile_id),
        count: stylists.length,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error in findStylistsNeedingSync:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}