import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileLayout } from "@/components/profile-layout";
import { PartnerDashboardClient } from "@/components/affiliate/partner-dashboard-client";

export default async function PartnerDashboardPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const supabase = await createClient();

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Non-owners shouldn't be able to access this subpage
  if (!user || user.id !== profileId) {
    redirect(`/profiler/${profileId}`);
  }

  // Fetch profile data to get user role and name
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", profileId)
    .single();

  // Only stylists can access partner dashboard
  if (!profile || profile.role !== "stylist") {
    redirect(`/profiler/${profileId}`);
  }

  return (
    <ProfileLayout profileId={profileId} userRole={profile.role}>
      <div className="pt-12">
        <PartnerDashboardClient
          profileId={profileId}
          fullName={profile.full_name || ""}
        />
      </div>
    </ProfileLayout>
  );
}
