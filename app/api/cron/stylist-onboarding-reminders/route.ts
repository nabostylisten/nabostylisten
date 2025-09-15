import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/resend-utils";
import { StylistOnboardingReminderEmail } from "@/transactional/emails/stylist-onboarding-reminder";
import { getNabostylistenLogoUrl } from "@/lib/supabase/utils";

export async function POST() {
  try {
    // Verify cron secret
    const authHeader = (await headers()).get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔄 Starting stylist onboarding reminders cron job");

    const supabase = await createServiceClient();
    const now = new Date();
    const currentTime = now.toISOString();

    // Get stylists who need onboarding reminders
    // 1. Approved applications (approved stylists)
    // 2. Without completed identity verification
    // 3. Within the reminder timeframe (3-30 days since approval)
    const { data: incompleteOnboardings, error: fetchError } = await supabase
      .from("applications")
      .select(`
        id,
        full_name,
        email,
        user_id,
        created_at,
        profiles!inner(
          id,
          role,
          email,
          stylist_details(
            profile_id,
            stripe_account_id,
            identity_verification_completed_at,
            created_at
          )
        )
      `)
      .eq("status", "approved")
      .not("user_id", "is", null) // Must have a user account
      .eq("profiles.role", "stylist"); // Must be a stylist

    if (fetchError) {
      console.error("❌ Error fetching incomplete onboardings:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch onboardings" },
        { status: 500 },
      );
    }

    if (!incompleteOnboardings || incompleteOnboardings.length === 0) {
      console.log("✅ No stylists need onboarding reminders");
      return NextResponse.json({
        success: true,
        message: "No reminders needed",
        processed: 0,
      });
    }

    let remindersSent = 0;
    let remindersSkipped = 0;

    for (const application of incompleteOnboardings) {
      try {
        // Skip if no user_id or stylist_details
        if (
          !application.user_id || !application.profiles?.stylist_details
        ) {
          console.log(
            `⏭️  Skipping ${application.email} - no user or stylist details`,
          );
          remindersSkipped++;
          continue;
        }

        const stylistDetail = application.profiles.stylist_details;

        // Skip if identity verification is already completed
        if (stylistDetail.identity_verification_completed_at) {
          console.log(
            `⏭️  Skipping ${application.email} - identity verification completed`,
          );
          remindersSkipped++;
          continue;
        }

        // Calculate days since approval (using created_at since applications don't have updated_at)
        const approvalDate = new Date(application.created_at);
        const daysSinceApproval = Math.floor(
          (now.getTime() - approvalDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Skip if too early (less than 3 days) or too late (more than 30 days)
        if (daysSinceApproval < 3 || daysSinceApproval > 30) {
          console.log(
            `⏭️  Skipping ${application.email} - ${daysSinceApproval} days since approval (outside 3-30 day window)`,
          );
          remindersSkipped++;
          continue;
        }

        // Determine next step and reminder type
        const hasStripeAccount = !!stylistDetail.stripe_account_id;
        const nextStep = hasStripeAccount
          ? "identity_verification"
          : "stripe_setup";

        let reminderType: "gentle" | "urgent" | "final";
        if (daysSinceApproval >= 21) {
          reminderType = "final";
        } else if (daysSinceApproval >= 14) {
          reminderType = "urgent";
        } else {
          reminderType = "gentle";
        }

        // Only send reminders at specific intervals to avoid spam
        // Day 3, 7, 14, 21, 28 (gentle -> urgent -> final pattern)
        const shouldSendToday = [3, 7, 14, 21, 28].includes(daysSinceApproval);

        if (!shouldSendToday) {
          console.log(
            `⏭️  Skipping ${application.email} - not a reminder day (${daysSinceApproval} days)`,
          );
          remindersSkipped++;
          continue;
        }

        // Send reminder email
        console.log(
          `📧 Sending ${reminderType} reminder to ${application.email} (${daysSinceApproval} days, next: ${nextStep})`,
        );

        const { error: emailError } = await sendEmail({
          to: [application.email],
          subject: reminderType === "final"
            ? "Siste påminnelse: Fullfør din stylist-onboarding"
            : reminderType === "urgent"
            ? "Viktig: Fullfør din stylist-onboarding"
            : "Fullfør din stylist-onboarding hos Nabostylisten",
          react: StylistOnboardingReminderEmail({
            logoUrl: getNabostylistenLogoUrl("png"),
            stylistName: application.full_name,
            daysSinceApproval,
            nextStep,
            reminderType,
          }),
        });

        if (emailError) {
          console.error(
            `❌ Failed to send reminder to ${application.email}:`,
            emailError,
          );
          continue;
        }

        remindersSent++;
        console.log(`✅ Sent ${reminderType} reminder to ${application.email}`);

        // Add a small delay to avoid overwhelming the email service
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `❌ Error processing reminder for ${application.email}:`,
          error,
        );
        continue;
      }
    }

    console.log(
      `✅ Stylist onboarding reminders completed: ${remindersSent} sent, ${remindersSkipped} skipped`,
    );

    return NextResponse.json({
      success: true,
      message: "Onboarding reminders processed",
      remindersSent,
      remindersSkipped,
      totalProcessed: incompleteOnboardings.length,
      timestamp: currentTime,
    });
  } catch (error) {
    console.error("❌ Error in stylist onboarding reminders cron:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
