import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ProfileLayout } from "@/components/profile-layout";
import { getChatByBookingId, getChatMessages } from "@/server/chat.actions";
import { getReviewByBookingId } from "@/server/review.actions";
import { BookingChatContent } from "@/components/booking-chat-content";
import { ReviewReminderAlert } from "@/components/reviews/review-reminder-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { MessageCircle, User } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BlurFade } from "@/components/magicui/blur-fade";

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

  // Determine user role for this specific booking context and partner info
  const isCustomer = booking.customer_id === user.id;

  const isStylist = booking.stylist_id === user.id;
  const partner = isCustomer ? booking.stylist : booking.customer;
  const serviceTitles =
    booking.booking_services?.map((bs) => bs.services?.title).filter(Boolean) ||
    [];

  if (chatError || !chat) {
    return (
      <ProfileLayout profileId={user.id} userRole={userProfile?.role}>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="max-w-4xl mx-auto w-full">
            {/* Header */}
            <BlurFade delay={0.1} duration={0.5} inView>
              <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/bookinger/${bookingId}`}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Tilbake til booking
                  </Link>
                </Button>
              </div>
            </BlurFade>

            {/* Booking Info Card */}
            <BlurFade delay={0.15} duration={0.5} inView>
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-6 h-6" />
                    <div className="flex-1">
                      <h1 className="text-xl font-semibold">Chat</h1>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <User className="w-4 h-4" />
                        <span>Med {partner?.full_name || "Ukjent bruker"}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {new Date(booking.start_time).toLocaleDateString(
                          "nb-NO",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>

                    {serviceTitles.length > 0 && (
                      <div className="text-muted-foreground">
                        {serviceTitles.join(", ")}
                      </div>
                    )}

                    <Badge variant="outline">{booking.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            </BlurFade>

            {/* Error Card */}
            <BlurFade delay={0.2} duration={0.5} inView>
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-6 h-6 text-red-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-red-900 mb-2">
                        Kan ikke laste chat
                      </h3>
                      <p className="text-red-700 mb-4">
                        Det oppstod en feil ved lasting av chatten for denne
                        bookingen.
                      </p>
                      <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-800 font-mono">
                          {chatError || "Chat ikke funnet"}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button asChild>
                          <Link href={`/bookinger/${bookingId}`}>
                            Tilbake til booking
                          </Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href="/bookinger">Se alle bookinger</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </BlurFade>
          </div>
        </div>
      </ProfileLayout>
    );
  }

  // Get existing messages for this chat
  const { data: messages, error: messagesError } = await getChatMessages(
    chat.id
  );

  // Check if there's already a review for this booking
  const { data: existingReview } = await getReviewByBookingId(bookingId);

  // Check if we should show review reminder alert
  const shouldShowReviewReminder =
    booking.status === "completed" && isCustomer && !existingReview;

  return (
    <ProfileLayout profileId={user.id} userRole={userProfile?.role}>
      <div className="flex flex-1 flex-col gap-4 p-4">
        {shouldShowReviewReminder && (
          <BlurFade delay={0.1} duration={0.5} inView>
            <ReviewReminderAlert
              bookingId={bookingId}
              stylistName={partner?.full_name || "Stylisten"}
              serviceTitles={serviceTitles}
              bookingDate={booking.start_time}
            />
          </BlurFade>
        )}
        <BlurFade delay={0.15} duration={0.5} inView>
          <BookingChatContent
            bookingId={bookingId}
            chatId={chat.id}
            currentUserId={user.id}
            currentUserName={
              userProfile?.role === "customer" ? "Kunde" : "Stylist"
            }
            partnerName={partner?.full_name || "Ukjent bruker"}
            serviceTitles={serviceTitles}
            bookingDate={booking.start_time}
            bookingStatus={booking.status}
            bookingTotalPrice={booking.total_price}
            initialMessages={messages || []}
            messagesError={messagesError}
            stylistId={booking.stylist_id}
            customerId={booking.customer_id}
            isCurrentUserStylist={isStylist}
          />
        </BlurFade>
      </div>
    </ProfileLayout>
  );
}
