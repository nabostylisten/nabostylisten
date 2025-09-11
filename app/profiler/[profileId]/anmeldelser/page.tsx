import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileLayout } from "@/components/profile-layout";
import { ReviewsPageContent } from "@/components/reviews/reviews-page-content";

export default async function AnmeldelserPage({
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
    .select("role")
    .eq("id", profileId)
    .single();

  return (
    <ProfileLayout profileId={profileId} userRole={profile?.role}>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-12">
        <div className="max-w-6xl mx-auto w-full">
          <ReviewsPageContent
            userId={profileId}
            userRole={profile?.role === "stylist" ? "stylist" : "customer"}
          />
        </div>
      </div>
    </ProfileLayout>
  );
}
