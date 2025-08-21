import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { BookingDetailsContent } from "@/components/my-bookings/booking-details-content";

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
      created_at
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

  // Determine user role for this specific booking context
  let userRoleForBooking: "customer" | "stylist" = "customer";
  if (booking.stylist_id === user.id) {
    userRoleForBooking = "stylist";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <BookingDetailsContent
          bookingId={bookingId}
          userId={user.id}
          userRole={userRoleForBooking}
        />
      </div>
    </div>
  );
}
