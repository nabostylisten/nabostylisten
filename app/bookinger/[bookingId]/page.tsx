import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { BookingDetailsContent } from "@/components/my-bookings/booking-details-content";
import { ProfileLayout } from "@/components/profile-layout";
import { getReviewByBookingId } from "@/server/review.actions";
import { ReviewReminderAlert } from "@/components/reviews/review-reminder-alert";

export default async function BookingDetailsPage({
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

  // Get booking details to verify access
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(
      `
      id,
      customer_id,
      stylist_id,
      status,
      created_at,
      stylist:profiles!bookings_stylist_id_fkey(
        id,
        full_name
      ),
      booking_services(
        services(
          title
        )
      )
    `
    )
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    redirect("/404");
  }

  // Check if user has access to this booking
  const hasAccess =
    booking.customer_id === user.id || // User is the customer
    booking.stylist_id === user.id || // User is the stylist
    userProfile?.role === "admin"; // User is an admin

  if (!hasAccess) {
    notFound();
  }

  // Check if there's already a review for this booking
  const { data: existingReview } = await getReviewByBookingId(bookingId);

  // Determine user role for this specific booking context
  let userRoleForBooking: "customer" | "stylist" = "customer";
  if (booking.stylist_id === user.id) {
    userRoleForBooking = "stylist";
  }

  // Check if we should show review reminder alert
  const isCustomer = booking.customer_id === user.id;
  const shouldShowReviewReminder = 
    booking.status === "completed" && 
    isCustomer && 
    !existingReview;

  // Prepare data for review reminder
  const serviceTitles = booking.booking_services
    ?.map((bs) => bs.services?.title)
    .filter(Boolean) || [];

  return (
    <ProfileLayout profileId={user.id} userRole={userProfile?.role}>
      <div className="flex flex-1 flex-col gap-4 p-4">
        {shouldShowReviewReminder && (
          <ReviewReminderAlert
            bookingId={bookingId}
            stylistName={booking.stylist?.full_name || "Stylisten"}
            serviceTitles={serviceTitles}
          />
        )}
        <BookingDetailsContent
          bookingId={bookingId}
          userId={user.id}
          userRole={userRoleForBooking}
        />
      </div>
    </ProfileLayout>
  );
}
