"use server";

import { createClient } from "@/lib/supabase/server";
import {
  affiliateApplicationsInsertSchema,
  affiliateApplicationsUpdateSchema,
} from "@/schemas/database.schema";
import { DEFAULT_PLATFORM_CONFIG } from "@/schemas/platform-config.schema";
import type { Database } from "@/types/database.types";

type AffiliateApplication =
  Database["public"]["Tables"]["affiliate_applications"]["Row"];
type AffiliateApplicationInsert =
  Database["public"]["Tables"]["affiliate_applications"]["Insert"];
type AffiliateApplicationUpdate =
  Database["public"]["Tables"]["affiliate_applications"]["Update"];

export async function createAffiliateApplication(
  data: AffiliateApplicationInsert,
) {
  const supabase = await createClient();

  // Validate data
  const { success, data: validatedData } = affiliateApplicationsInsertSchema
    .safeParse(data);

  if (!success) {
    return { error: "Ugyldig data", data: null };
  }

  // Check if user already has a pending or approved application
  const { data: existingApplication } = await supabase
    .from("affiliate_applications")
    .select("id, status")
    .eq("stylist_id", validatedData.stylist_id)
    .in("status", ["pending", "approved"])
    .single();

  if (existingApplication) {
    return {
      error: existingApplication.status === "pending"
        ? "Du har allerede en søknad under behandling"
        : "Du har allerede en godkjent partnersøknad",
      data: null,
    };
  }

  const { data: application, error } = await supabase
    .from("affiliate_applications")
    .insert(validatedData)
    .select()
    .single();

  if (error) {
    console.error("Error creating affiliate application:", error);
    return { error: "Kunne ikke opprette partnersøknad", data: null };
  }

  // Send notification to administrators
  try {
    const { sendAffiliateApplicationReceivedNotification } = await import("./affiliate-notifications.actions");
    const notificationResult = await sendAffiliateApplicationReceivedNotification(application.id);
    
    if (notificationResult.error) {
      console.error("Failed to send admin notification:", notificationResult.error);
      // Don't fail the application creation, just log the error
    }
  } catch (error) {
    console.error("Error sending admin notification:", error);
    // Don't fail the application creation, just log the error
  }

  return { error: null, data: application };
}

export async function getAffiliateApplicationById(id: string) {
  const supabase = await createClient();

  const { data: application, error } = await supabase
    .from("affiliate_applications")
    .select(`
      *,
      stylist:profiles!affiliate_applications_stylist_id_fkey(
        id,
        full_name,
        email,
        stylist_details(
          bio,
          instagram_profile,
          facebook_profile,
          tiktok_profile
        )
      ),
      reviewed_by:profiles!affiliate_applications_reviewed_by_fkey(
        full_name,
        email
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching affiliate application:", error);
    return { error: "Kunne ikke hente partnersøknad", data: null };
  }

  return { error: null, data: application };
}

export async function getAffiliateApplicationsByStatus(
  status?: "pending" | "approved" | "rejected" | "suspended",
) {
  const supabase = await createClient();

  let query = supabase
    .from("affiliate_applications")
    .select(`
      *,
      stylist:profiles!affiliate_applications_stylist_id_fkey(
        id,
        full_name,
        email,
        stylist_details(
          bio,
          instagram_profile
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data: applications, error } = await query;

  if (error) {
    console.error("Error fetching affiliate applications:", error);
    return { error: "Kunne ikke hente partnersøknader", data: null };
  }

  return { error: null, data: applications || [] };
}

export async function getUserAffiliateApplication(userId: string) {
  const supabase = await createClient();

  const { data: application, error } = await supabase
    .from("affiliate_applications")
    .select("*")
    .eq("stylist_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") { // PGRST116 = no rows found
    console.error("Error fetching user affiliate application:", error);
    return { error: "Kunne ikke hente partnersøknad", data: null };
  }

  return { error: null, data: application };
}

export async function updateAffiliateApplication(
  id: string,
  updates: AffiliateApplicationUpdate,
  reviewerId?: string,
) {
  const supabase = await createClient();

  // Validate updates
  const { success, data: validatedData } = affiliateApplicationsUpdateSchema
    .safeParse(updates);

  if (!success) {
    return {
      error: "Ugyldig data",
      data: null,
    };
  }

  // Add reviewer information if provided
  const updateData = {
    ...validatedData,
    ...(reviewerId && {
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    }),
  };

  const { data: application, error } = await supabase
    .from("affiliate_applications")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating affiliate application:", error);
    return { error: "Kunne ikke oppdatere partnersøknad", data: null };
  }

  return { error: null, data: application };
}

// Simplified approve function for admin tab
export async function approveAffiliateApplication(applicationId: string) {
  const supabase = await createClient();

  // Get current user as reviewer
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "Du må være logget inn for å godkjenne søknader",
      data: null,
    };
  }

  return await approveAffiliateApplicationByAdmin(applicationId, user.id);
}

export async function approveAffiliateApplicationByAdmin(
  applicationId: string,
  reviewerId: string,
  notes?: string,
) {
  const supabase = await createClient();

  // Start a transaction to update application and potentially create affiliate code
  const { data: application, error } = await supabase
    .from("affiliate_applications")
    .update({
      status: "approved",
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
    })
    .eq("id", applicationId)
    .select(`
      *,
      stylist:profiles!affiliate_applications_stylist_id_fkey(
        id,
        full_name,
        email
      )
    `)
    .single();

  if (error) {
    console.error("Error approving affiliate application:", error);
    return { error: "Kunne ikke godkjenne partnersøknad", data: null };
  }

  // Send approval email and create affiliate code
  try {
    // Import affiliate code creation
    const { createAffiliateCode } = await import("./affiliate-codes.actions");
    const { sendAffiliateWelcomeEmail } = await import(
      "./affiliate-notifications.actions"
    );

    // Create affiliate code for approved application
    const codeResult = await createAffiliateCode(
      application.stylist_id,
      applicationId,
      DEFAULT_PLATFORM_CONFIG.fees.affiliate.defaultCommissionPercentage,
    );

    if (codeResult.error) {
      console.error("Failed to create affiliate code:", codeResult.error);
      // Don't fail the approval, just log the error
    } else if (codeResult.data) {
      // Send welcome email with affiliate code
      const emailResult = await sendAffiliateWelcomeEmail(
        application.stylist_id,
        applicationId,
      );

      if (emailResult.error) {
        console.error(
          "Failed to send affiliate welcome email:",
          emailResult.error,
        );
        // Don't fail the approval, just log the error
      }
    }
  } catch (error) {
    console.error("Error in post-approval process:", error);
    // Don't fail the approval for email/code creation issues
  }

  return { error: null, data: application };
}

// Simplified reject function for admin tab
export async function rejectAffiliateApplication(applicationId: string) {
  const supabase = await createClient();

  // Get current user as reviewer
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Du må være logget inn for å avvise søknader", data: null };
  }

  return await rejectAffiliateApplicationByAdmin(
    applicationId,
    user.id,
    "Avvist fra admin panel",
  );
}

export async function rejectAffiliateApplicationByAdmin(
  applicationId: string,
  reviewerId: string,
  notes: string,
) {
  const supabase = await createClient();

  // Get application details before updating
  const { data: application } = await supabase
    .from("affiliate_applications")
    .select("stylist_id")
    .eq("id", applicationId)
    .single();

  const result = await updateAffiliateApplication(
    applicationId,
    {
      status: "rejected",
      review_notes: notes,
    },
    reviewerId,
  );

  // Send rejection email
  if (result.error === null && application?.stylist_id) {
    try {
      const { sendAffiliateApplicationRejectedEmail } = await import(
        "./affiliate-notifications.actions"
      );

      const emailResult = await sendAffiliateApplicationRejectedEmail(
        application.stylist_id,
        notes,
      );

      if (emailResult.error) {
        console.error(
          "Failed to send affiliate rejection email:",
          emailResult.error,
        );
        // Don't fail the rejection, just log the error
      }
    } catch (error) {
      console.error("Error sending rejection email:", error);
      // Don't fail the rejection for email issues
    }
  }

  return result;
}

export async function deleteAffiliateApplication(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("affiliate_applications")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting affiliate application:", error);
    return { error: "Kunne ikke slette partnersøknad" };
  }

  return { error: null };
}

export async function getAllAffiliateApplications() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("affiliate_applications")
    .select(`
      id,
      stylist_id,
      status,
      created_at,
      stylist:profiles!affiliate_applications_stylist_id_fkey(
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all affiliate applications:", error);
    return { data: null, error: error.message };
  }

  // Flatten the profile data for easier use
  const flattenedData = data?.map((app) => ({
    ...app,
    profile_id: app.stylist_id, // Map for compatibility
    full_name: app.stylist?.full_name || "Unknown",
    email: app.stylist?.email || "Unknown",
  }));

  return { data: flattenedData, error: null };
}

export async function getAffiliateMetrics() {
  const supabase = await createClient();

  try {
    // Get active affiliates count
    const { count: activeAffiliates } = await supabase
      .from("affiliate_links")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Get pending applications count
    const { count: pendingApplications } = await supabase
      .from("affiliate_applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Get total revenue from affiliate bookings
    const { data: revenueData } = await supabase
      .from("payments")
      .select("final_amount")
      .not("affiliate_id", "is", null)
      .eq("status", "succeeded");

    const totalRevenue = revenueData?.reduce((sum, payment) =>
      sum + (payment.final_amount || 0), 0) || 0;

    // Get total commissions
    const { data: commissionData } = await supabase
      .from("affiliate_commissions")
      .select("amount");

    const totalCommissions = commissionData?.reduce((sum, commission) =>
      sum + (commission.amount || 0), 0) || 0;

    return {
      data: {
        activeAffiliates: activeAffiliates || 0,
        pendingApplications: pendingApplications || 0,
        totalRevenue,
        totalCommissions,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching affiliate metrics:", error);
    return { data: null, error: "Failed to fetch affiliate metrics" };
  }
}
