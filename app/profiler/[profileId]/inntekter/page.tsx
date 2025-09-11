import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileLayout } from "@/components/profile-layout";
import { StylistRevenueDashboard } from "@/components/revenue/stylist-revenue-dashboard";

export default async function InntekterPage({
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

  return (
    <ProfileLayout profileId={profileId} userRole={profile?.role}>
      <div className="p-4 pt-12">
        <StylistRevenueDashboard
          userId={profileId}
          userName={profile?.full_name || undefined}
        />
      </div>
    </ProfileLayout>
  );
}
