import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ProfileLayout } from "@/components/profile-layout";
import { getChatByBookingId, getChatMessages } from "@/server/chat.actions";
import { getReviewByBookingId } from "@/server/review.actions";
import { BookingChatContent } from "@/components/booking-chat-content";
import { ReviewReminderAlert } from "@/components/reviews/review-reminder-alert";

export default async function BookingChatPage({
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
      start_time,
      customer:profiles!customer_id (
        id,
        full_name
      ),
      stylist:profiles!stylist_id (
        id,
        full_name
      ),
      booking_services (
        services (
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

  // Get or create chat for this booking
  const { data: chat, error: chatError } = await getChatByBookingId(bookingId);

  if (chatError || !chat) {
    return (
      <ProfileLayout profileId={user.id} userRole={userProfile?.role}>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="text-center py-12">
            <p className="text-red-500">
              Feil ved lasting av chat: {chatError || "Chat ikke funnet"}
            </p>
          </div>
        </div>
      </ProfileLayout>
    );
  }

  // Get existing messages for this chat
  const { data: messages, error: messagesError } = await getChatMessages(chat.id);

  // Check if there's already a review for this booking
  const { data: existingReview } = await getReviewByBookingId(bookingId);

  // Determine user role for this specific booking context and partner info
  const isCustomer = booking.customer_id === user.id;
  const partner = isCustomer ? booking.stylist : booking.customer;
  const serviceTitles = booking.booking_services
    ?.map((bs) => bs.services?.title)
    .filter(Boolean) || [];

  // Check if we should show review reminder alert
  const shouldShowReviewReminder = 
    booking.status === "completed" && 
    isCustomer && 
    !existingReview;

  return (
    <ProfileLayout profileId={user.id} userRole={userProfile?.role}>
      <div className="flex flex-1 flex-col gap-4 p-4">
        {shouldShowReviewReminder && (
          <ReviewReminderAlert
            bookingId={bookingId}
            stylistName={partner?.full_name || "Stylisten"}
            serviceTitles={serviceTitles}
          />
        )}
        <BookingChatContent
          bookingId={bookingId}
          chatId={chat.id}
          currentUserId={user.id}
          currentUserName={userProfile?.role === "customer" ? "Kunde" : "Stylist"}
          partnerName={partner?.full_name || "Ukjent bruker"}
          serviceTitles={serviceTitles}
          bookingDate={booking.start_time}
          bookingStatus={booking.status}
          initialMessages={messages || []}
          messagesError={messagesError}
        />
      </div>
    </ProfileLayout>
  );
}