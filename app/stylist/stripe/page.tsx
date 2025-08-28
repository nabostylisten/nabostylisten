import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/permissions";
import { getStripeAccountStatus } from "@/server/stripe.actions";
import { StylistStripeOnboarding } from "./stylist-stripe-onboarding";
import { StylistIdentityVerification } from "@/components/stylist-identity-verification";

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

  // Get stylist details to check for Stripe account and identity verification
  const { data: stylistDetails, error: stylistError } = await supabase
    .from("stylist_details")
    .select("*, stripe_verification_session_id, identity_verification_completed_at")
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

        // Check if basic Stripe onboarding is complete
        const basicStripeComplete = statusResult.data.charges_enabled &&
          statusResult.data.details_submitted &&
          statusResult.data.payouts_enabled;

        // Account needs onboarding if basic Stripe is not complete
        needsOnboarding = !basicStripeComplete;
      }
    } catch (error) {
      console.error("Error fetching Stripe account status:", error);
      // If we can't get status, assume onboarding is needed
      needsOnboarding = true;
    }
  }

  // Check if basic Stripe onboarding is complete but identity verification is needed
  if (!needsOnboarding && stripeAccountStatus?.payouts_enabled && !stylistDetails.identity_verification_completed_at) {
    // Show identity verification step
    return (
      <StylistIdentityVerification
        userId={user.id}
        hasVerificationSession={!!stylistDetails.stripe_verification_session_id}
      />
    );
  }

  // Determine if completely done (both Stripe and identity verification)
  const isCompletelyDone = !needsOnboarding && !!stylistDetails.identity_verification_completed_at;
  
  // Show regular Stripe onboarding if not complete, or success screen if everything is done
  return (
    <StylistStripeOnboarding
      userId={user.id}
      userName={profile.full_name || undefined}
      needsOnboarding={needsOnboarding}
      stripeAccountId={stylistDetails.stripe_account_id}
      stripeAccountStatus={stripeAccountStatus}
      isCompletelyDone={isCompletelyDone}
    />
  );
}
