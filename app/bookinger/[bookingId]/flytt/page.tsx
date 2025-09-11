import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ProfileLayout } from "@/components/profile-layout";
import { MoveBookingContent } from "@/components/booking/move-booking-content";
import { getBookingDetails } from "@/server/booking/crud.actions";
import { BlurFade } from "@/components/magicui/blur-fade";

export default async function MoveBookingPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const supabase = await createClient();

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get user profile with role information
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Get booking details
  const { data: booking, error: bookingError } =
    await getBookingDetails(bookingId);

  if (bookingError || !booking) {
    redirect("/404");
  }

  // Only stylists can access this page for their bookings
  const canReschedule = booking.stylist_id === user.id;

  if (!canReschedule) {
    notFound();
  }

  // Don't allow rescheduling cancelled or completed bookings
  if (booking.status === "cancelled" || booking.status === "completed") {
    redirect(`/bookinger/${bookingId}`);
  }

  // Calculate total service duration from booking services
  const totalDuration = booking.total_duration_minutes || 60;

  const services =
    booking.booking_services?.map((bs) => bs.service).filter(Boolean) || [];
  const serviceTitles = services.map((s) => s?.title || "").filter(Boolean);

  return (
    <ProfileLayout profileId={user.id} userRole={userProfile?.role}>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-12">
        <BlurFade delay={0.15} duration={0.5} inView>
          <MoveBookingContent
            bookingId={bookingId}
            booking={booking}
            stylistId={booking.stylist_id}
            serviceDuration={totalDuration}
            serviceTitles={serviceTitles}
            currentStartTime={booking.start_time}
            currentEndTime={booking.end_time}
          />
        </BlurFade>
      </div>
    </ProfileLayout>
  );
}
