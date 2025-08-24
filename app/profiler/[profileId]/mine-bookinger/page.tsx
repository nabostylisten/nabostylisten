import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileLayout } from "@/components/profile-layout";
import { MyBookingsPageContent } from "@/components/my-bookings/my-bookings-page-content";
import { BookingsWithoutReviewsAlerts } from "@/components/reviews/bookings-without-reviews-alerts";
import { BlurFade } from "@/components/magicui/blur-fade";

export default async function MineBookingerPage({
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
      <div className="space-y-6">
        <BlurFade delay={0.1} duration={0.5} inView>
          <MyBookingsPageContent
            userId={profileId}
            userRole={profile?.role === "stylist" ? "stylist" : "customer"}
          />
        </BlurFade>
      </div>
    </ProfileLayout>
  );
}
