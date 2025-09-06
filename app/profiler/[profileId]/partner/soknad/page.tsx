import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileLayout } from "@/components/profile-layout";
import { AffiliateApplicationClient } from "@/components/affiliate/affiliate-application-client";

interface Props {
  params: Promise<{
    profileId: string;
  }>;
}

export default async function AffiliateApplicationPage({ params }: Props) {
  const { profileId } = await params;
  const supabase = await createClient();

  // Check if user is authenticated and accessing their own profile
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== profileId) {
    redirect("/auth/login");
  }

  // Get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", profileId)
    .single();

  if (!profile || profile.role !== "stylist") {
    redirect("/profiler/" + profileId);
  }

  return (
    <ProfileLayout profileId={profileId} userRole={profile.role}>
      <AffiliateApplicationClient profileId={profileId} />
    </ProfileLayout>
  );
}
