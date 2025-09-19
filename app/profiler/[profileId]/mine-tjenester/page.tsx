import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileLayout } from "@/components/profile-layout";
import { ServicesPageClient } from "./services-page-client";

export default async function MineTjenesterPage({
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

  // Fetch profile data to get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  // Only stylists can access this page
  if (!profile || profile.role !== "stylist") {
    redirect(`/profiler/${profileId}`);
  }

  return (
    <ProfileLayout profileId={profileId} userRole={profile.role}>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-12">
        <div className="max-w-6xl mx-auto w-full">
          <ServicesPageClient profileId={profileId} />
        </div>
      </div>
    </ProfileLayout>
  );
}
