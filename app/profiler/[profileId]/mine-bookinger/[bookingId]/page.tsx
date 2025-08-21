import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileLayout } from "@/components/profile-layout";
import { BookingDetailsContent } from "@/components/my-bookings/booking-details-content";

export default async function BookingDetailsPage({
  params,
}: {
  params: Promise<{ profileId: string; bookingId: string }>;
}) {
  const { profileId, bookingId } = await params;
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
      <BookingDetailsContent bookingId={bookingId} userId={profileId} />
    </ProfileLayout>
  );
}
