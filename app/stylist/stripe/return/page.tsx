import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StripeReturnContent } from "@/components/stripe/stripe-return-content";

export default async function StylistStripeReturnPage() {
  const supabase = await createClient();

  // Fast server-side checks for authentication and authorization
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(
      `/auth/login?redirect=${encodeURIComponent("/stylist/stripe/return")}`
    );
  }

  // Get user profile to check role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/auth/login");
  }

  // Check if user is a stylist
  if (profile.role !== "stylist") {
    redirect("/");
  }

  // Get stylist details to ensure they exist
  const { data: stylistDetails, error: stylistError } = await supabase
    .from("stylist_details")
    .select("profile_id")
    .eq("profile_id", user.id)
    .single();

  if (stylistError || !stylistDetails) {
    console.error("Stylist details not found for approved stylist:", user.id);
    redirect("/");
  }

  // All authorization checks passed, render client component
  // The slow Stripe API calls will happen client-side with proper loading states
  return (
    <div className="px-4 pt-12">
      <StripeReturnContent />
    </div>
  );
}
