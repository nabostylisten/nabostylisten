import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/permissions";
import { getStripeAccountStatus } from "@/server/stripe.actions";
import { StylistStripeOnboarding } from "./stylist-stripe-onboarding";

export default async function StylistStripePage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    // Redirect to auth with return URL
    redirect(`/auth/login?redirect=${encodeURIComponent("/stylist/stripe")}`);
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/auth/login");
  }

  // Check if user is a stylist
  if (profile.role !== "stylist") {
    redirect("/"); // Redirect non-stylists to home page
  }

  // Get stylist details to check for Stripe account
  const { data: stylistDetails, error: stylistError } = await supabase
    .from("stylist_details")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  if (stylistError || !stylistDetails) {
    // If no stylist details exist, this shouldn't happen for approved stylists
    console.error("Stylist details not found for approved stylist:", user.id);
    redirect("/");
  }

  let needsOnboarding = true;
  let stripeAccountStatus = null;

  // Check if stylist already has a Stripe account
  if (stylistDetails.stripe_account_id) {
    try {
      // Get Stripe account status
      const statusResult = await getStripeAccountStatus({
        stripeAccountId: stylistDetails.stripe_account_id,
      });

      if (statusResult.data) {
        stripeAccountStatus = statusResult.data;

        // Check if onboarding is complete
        // Account is considered ready if charges are enabled and details are submitted
        needsOnboarding = !(
          statusResult.data.charges_enabled &&
          statusResult.data.details_submitted &&
          statusResult.data.payouts_enabled
        );
      }
    } catch (error) {
      console.error("Error fetching Stripe account status:", error);
      // If we can't get status, assume onboarding is needed
      needsOnboarding = true;
    }
  }

  return (
    <StylistStripeOnboarding
      userId={user.id}
      userName={profile.full_name || undefined}
      needsOnboarding={needsOnboarding}
      stripeAccountId={stylistDetails.stripe_account_id}
      stripeAccountStatus={stripeAccountStatus}
    />
  );
}
