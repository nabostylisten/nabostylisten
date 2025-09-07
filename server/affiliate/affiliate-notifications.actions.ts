"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend-utils";
import { AffiliateApplicationApproved } from "@/transactional/emails/affiliate-application-approved";
import { AffiliateApplicationRejected } from "@/transactional/emails/affiliate-application-rejected";
import { AffiliateMonthlyPayout } from "@/transactional/emails/affiliate-monthly-payout";
import { AffiliateApplicationReceivedEmail } from "@/transactional/emails/affiliate-application-received";
import { AffiliateApplicationConfirmation } from "@/transactional/emails/affiliate-application-confirmation";
import { getNabostylistenLogoUrl } from "@/lib/supabase/utils";

/**
 * Send email notification to admins when new affiliate application is received
 */
export async function sendAffiliateApplicationReceivedNotification(
  applicationId: string,
) {
  const supabase = await createClient();

  try {
    // Get application details with stylist information
    const { data: application, error: appError } = await supabase
      .from("affiliate_applications")
      .select(`
        *,
        stylist:profiles!affiliate_applications_stylist_id_fkey(
          full_name,
          email
        )
      `)
      .eq("id", applicationId)
      .single();

    if (appError || !application || !application.stylist) {
      console.error(
        "Error fetching application for admin notification:",
        appError,
      );
      return { error: "Kunne ikke finne søknadsinformasjon", data: null };
    }

    // Get all admin users
    const { data: admins, error: adminError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "admin");

    if (adminError) {
      console.error(
        "Error fetching admin users for affiliate notification:",
        adminError,
      );
      return { error: "Kunne ikke finne administratorer", data: null };
    }

    if (!admins || admins.length === 0) {
      console.log(
        "No admin users found for affiliate application notification",
      );
      return { error: "Ingen administratorer funnet", data: null };
    }

    const logoUrl = getNabostylistenLogoUrl("png");

    // Send email to all admin users
    const emailPromises = [];

    for (const admin of admins) {
      if (admin.email) {
        emailPromises.push(
          sendEmail({
            to: [admin.email],
            subject: `Ny partner-søknad fra ${
              application.stylist.full_name || "ukjent stylist"
            }`,
            react: AffiliateApplicationReceivedEmail({
              logoUrl,
              applicantName: application.stylist.full_name || "Ukjent",
              applicantEmail: application.stylist.email || "Ikke oppgitt",
              applicationId: application.id,
              submittedAt: new Date(application.created_at),
              expectedReferrals: application.expected_referrals || 0,
              socialMediaReach: application.social_media_reach || 0,
              reason: application.reason || "",
              marketingStrategy: application.marketing_strategy || "",
            }),
          }),
        );
      }
    }

    // Wait for all emails to be sent
    const results = await Promise.allSettled(emailPromises);

    let successCount = 0;
    let errorCount = 0;

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        if (result.value?.error) {
          console.error(
            `Failed to send email to admin ${admins[index].email}:`,
            result.value.error,
          );
          errorCount++;
        } else {
          successCount++;
        }
      } else {
        console.error(
          `Failed to send email to admin ${admins[index].email}:`,
          result.reason,
        );
        errorCount++;
      }
    });

    console.log(
      `Sent ${successCount} affiliate application admin notifications. Errors: ${errorCount}`,
    );

    return {
      error: errorCount > 0
        ? `${errorCount} av ${admins.length} e-poster feilet`
        : null,
      data: {
        sent: successCount,
        total: admins.length,
        errors: errorCount,
      },
    };
  } catch (error) {
    console.error(
      "Error in sendAffiliateApplicationReceivedNotification:",
      error,
    );
    return {
      error: "En uventet feil oppstod ved sending av admin-varsel",
      data: null,
    };
  }
}

/**
 * Send email notification when affiliate application is approved
 */
export async function sendAffiliateApplicationApprovedEmail(
  stylistId: string,
  affiliateCode: string,
  reviewNotes?: string,
) {
  const supabase = await createClient();

  try {
    // Get stylist information
    const { data: stylist, error: stylistError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", stylistId)
      .single();

    if (stylistError || !stylist || !stylist.email) {
      console.error("Error fetching stylist for email:", stylistError);
      return { error: "Kunne ikke finne stylist", data: null };
    }

    // Get affiliate code information
    const { data: affiliateLink, error: linkError } = await supabase
      .from("affiliate_links")
      .select("commission_percentage")
      .eq("stylist_id", stylistId)
      .eq("link_code", affiliateCode)
      .single();

    if (linkError || !affiliateLink) {
      console.error("Error fetching affiliate link for email:", linkError);
      return { error: "Kunne ikke finne partnerkode", data: null };
    }

    const commissionPercentage = Math.round(
      (affiliateLink.commission_percentage || 0.2) * 100,
    );
    const dashboardUrl =
      `${process.env.NEXT_PUBLIC_SITE_URL}/profiler/${stylistId}/partner`;

    const logoUrl = getNabostylistenLogoUrl("png");

    // Send email
    const { error } = await sendEmail({
      to: [stylist.email],
      subject: "Din partnersøknad har blitt godkjent!",
      react: AffiliateApplicationApproved({
        logoUrl,
        stylistName: stylist.full_name || "Partner",
        affiliateCode,
        commissionPercentage,
        dashboardUrl,
        reviewNotes,
      }),
    });

    if (error) {
      console.error("Error sending affiliate approval email:", error);
      return { error: "Kunne ikke sende e-post", data: null };
    }

    return { error: null, data: null };
  } catch (error) {
    console.error("Error in sendAffiliateApplicationApprovedEmail:", error);
    return {
      error: "En uventet feil oppstod ved sending av e-post",
      data: null,
    };
  }
}

/**
 * Send email notification when affiliate application is rejected
 */
export async function sendAffiliateApplicationRejectedEmail(
  stylistId: string,
  rejectionReason?: string,
) {
  const supabase = await createClient();

  try {
    // Get stylist information
    const { data: stylist, error: stylistError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", stylistId)
      .single();

    if (stylistError || !stylist || !stylist.email) {
      console.error("Error fetching stylist for email:", stylistError);
      return { error: "Kunne ikke finne stylist", data: null };
    }

    const reapplyUrl =
      `${process.env.NEXT_PUBLIC_SITE_URL}/profiler/${stylistId}/partner/soknad`;

    const logoUrl = getNabostylistenLogoUrl("png");

    // Send email
    const { error } = await sendEmail({
      to: [stylist.email],
      subject: "Svar på din partnersøknad",
      react: AffiliateApplicationRejected({
        logoUrl,
        stylistName: stylist.full_name || "Partner",
        rejectionReason,
        reapplyUrl,
      }),
    });

    if (error) {
      console.error("Error sending affiliate rejection email:", error);
      return { error: "Kunne ikke sende e-post", data: null };
    }

    return { error: null, data: null };
  } catch (error) {
    console.error("Error in sendAffiliateApplicationRejectedEmail:", error);
    return {
      error: "En uventet feil oppstod ved sending av e-post",
      data: null,
    };
  }
}

/**
 * Send monthly payout notification email to affiliate
 */
export async function sendAffiliateMonthlyPayoutEmail(
  payoutId: string,
) {
  const supabase = await createClient();

  try {
    // Get payout information with stylist details
    const { data: payout, error: payoutError } = await supabase
      .from("affiliate_payouts")
      .select(`
        *,
        stylist:profiles!affiliate_payouts_stylist_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq("id", payoutId)
      .single();

    if (payoutError || !payout || !payout.stylist || !payout.stylist.email) {
      console.error("Error fetching payout for email:", payoutError);
      return { error: "Kunne ikke finne utbetalingsinformasjon", data: null };
    }

    const dashboardUrl =
      `${process.env.NEXT_PUBLIC_SITE_URL}/profiler/${payout.stylist.id}/partner/utbetalinger`;

    const logoUrl = getNabostylistenLogoUrl("png");

    // Send email
    const { error } = await sendEmail({
      to: [payout.stylist.email],
      subject: "Din månedlige partnerutbetaling er på vei!",
      react: AffiliateMonthlyPayout({
        logoUrl,
        stylistName: payout.stylist.full_name || "Partner",
        payoutAmount: Number(payout.payout_amount),
        currency: payout.currency || "NOK",
        periodStart: payout.period_start,
        periodEnd: payout.period_end,
        totalBookings: payout.total_bookings || 0,
        totalCommissions: Number(payout.total_commission_earned || 0),
        dashboardUrl,
        payoutDate: payout.created_at,
      }),
    });

    if (error) {
      console.error("Error sending affiliate payout email:", error);
      return { error: "Kunne ikke sende e-post", data: null };
    }

    return { error: null, data: null };
  } catch (error) {
    console.error("Error in sendAffiliateMonthlyPayoutEmail:", error);
    return {
      error: "En uventet feil oppstod ved sending av e-post",
      data: null,
    };
  }
}

/**
 * Send welcome email with affiliate code after approval and code generation
 */
export async function sendAffiliateWelcomeEmail(
  stylistId: string,
  applicationId: string,
  reviewNotes?: string,
) {
  const supabase = await createClient();

  try {
    // Get application and affiliate code information
    const { data: application, error: appError } = await supabase
      .from("affiliate_applications")
      .select(`
        *,
        stylist:profiles!affiliate_applications_stylist_id_fkey(
          full_name,
          email
        )
      `)
      .eq("id", applicationId)
      .single();

    if (appError || !application?.stylist) {
      console.error("Error fetching application for welcome email:", appError);
      return { error: "Kunne ikke finne søknadsinformasjon", data: null };
    }

    // Get the affiliate code
    const { data: affiliateLink, error: linkError } = await supabase
      .from("affiliate_links")
      .select("link_code, commission_percentage")
      .eq("stylist_id", stylistId)
      .eq("is_active", true)
      .single();

    if (linkError || !affiliateLink) {
      console.error(
        "Error fetching affiliate link for welcome email:",
        linkError,
      );
      return { error: "Kunne ikke finne partnerkode", data: null };
    }

    // Send the approval email (which serves as welcome email)
    return await sendAffiliateApplicationApprovedEmail(
      stylistId,
      affiliateLink.link_code,
      reviewNotes,
    );
  } catch (error) {
    console.error("Error in sendAffiliateWelcomeEmail:", error);
    return {
      error: "En uventet feil oppstod ved sending av velkomst-e-post",
      data: null,
    };
  }
}

/**
 * Send confirmation email to stylist when affiliate application is received
 */
export async function sendAffiliateApplicationConfirmationEmail(
  stylistId: string,
  applicationId: string,
) {
  const supabase = await createClient();

  try {
    // Get stylist information
    const { data: stylist, error: stylistError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", stylistId)
      .single();

    if (stylistError || !stylist || !stylist.email) {
      console.error(
        "Error fetching stylist for confirmation email:",
        stylistError,
      );
      return { error: "Kunne ikke finne stylist", data: null };
    }

    // Get application information
    const { data: application, error: appError } = await supabase
      .from("affiliate_applications")
      .select("created_at")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      console.error(
        "Error fetching application for confirmation email:",
        appError,
      );
      return { error: "Kunne ikke finne søknadsinformasjon", data: null };
    }

    const logoUrl = getNabostylistenLogoUrl("png");

    // Send confirmation email
    const { error } = await sendEmail({
      to: [stylist.email],
      subject: "Partnersøknaden din er mottatt - Nabostylisten",
      react: AffiliateApplicationConfirmation({
        logoUrl,
        stylistName: stylist.full_name || "Partner",
        applicationId,
        submittedAt: new Date(application.created_at),
      }),
    });

    if (error) {
      console.error("Error sending affiliate confirmation email:", error);
      return { error: "Kunne ikke sende bekreftelse-e-post", data: null };
    }

    return { error: null, data: null };
  } catch (error) {
    console.error("Error in sendAffiliateApplicationConfirmationEmail:", error);
    return {
      error: "En uventet feil oppstod ved sending av bekreftelse-e-post",
      data: null,
    };
  }
}

/**
 * Batch send monthly payout emails to all affiliates with pending payouts
 */
export async function sendMonthlyPayoutEmails() {
  const supabase = await createClient();

  try {
    // Get all pending payouts
    const { data: payouts, error: payoutsError } = await supabase
      .from("affiliate_payouts")
      .select("id")
      .eq("status", "pending")
      .eq("email_sent", false); // Assuming we add this field to track sent emails

    if (payoutsError) {
      console.error("Error fetching pending payouts:", payoutsError);
      return { error: "Kunne ikke hente ventende utbetalinger", data: null };
    }

    if (!payouts || payouts.length === 0) {
      console.log("No pending payouts to send emails for");
      return {
        error: null,
        data: { sent: 0, message: "Ingen ventende utbetalinger" },
      };
    }

    let sentCount = 0;
    const errors: string[] = [];

    // Send email for each payout
    for (const payout of payouts) {
      const result = await sendAffiliateMonthlyPayoutEmail(payout.id);

      if (result.error) {
        errors.push(`Payout ${payout.id}: ${result.error}`);
      } else {
        sentCount++;

        // Mark email as sent
        await supabase
          .from("affiliate_payouts")
          .update({ email_sent: true })
          .eq("id", payout.id);
      }
    }

    console.log(
      `Sent ${sentCount} affiliate payout emails. Errors: ${errors.length}`,
    );

    return {
      error: errors.length > 0 ? errors.join("; ") : null,
      data: {
        sent: sentCount,
        total: payouts.length,
        errors,
      },
    };
  } catch (error) {
    console.error("Error in sendMonthlyPayoutEmails:", error);
    return {
      error: "En uventet feil oppstod ved sending av utbetalings-e-poster",
      data: null,
    };
  }
}
