import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { ProfileLayout } from "@/components/profile-layout";
import { getChatsByProfileId } from "@/server/chat.actions";
import { ChatCard } from "@/components/chat-card";
import { Separator } from "@/components/ui/separator";

export default async function ChatPage({
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

  // Get chats for this profile
  const { data: chats, error } = await getChatsByProfileId(profileId);

  return (
    <ProfileLayout profileId={profileId} userRole={profile?.role}>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-6">
            <MessageCircle className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">Chat</h1>
              <p className="text-muted-foreground mt-1">
                Administrer dine samtaler og meldinger
              </p>
            </div>
          </div>

          {error && (
            <div className="text-red-500 mb-4">
              Feil ved lasting av samtaler: {error}
            </div>
          )}

          {chats && chats.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Ingen samtaler ennå</h3>
              <p className="text-muted-foreground">
                Du vil se samtaler her når du har bookinger med andre brukere.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(() => {
                if (!chats) return null;

                // Process chats to add unread counts and sort
                const processedChats = chats.map((chat) => {
                  const booking = chat.bookings;
                  const isCustomer = booking.customer_id === profileId;
                  const partner = isCustomer ? booking.stylist : booking.customer;
                  const serviceTitles =
                    booking.booking_services
                      ?.map((bs) => bs.services?.title)
                      .filter(Boolean) || [];

                  // Count unread messages (not sent by current user)
                  const unreadCount = chat.chat_messages?.filter(
                    (msg) => !msg.is_read && msg.sender_id !== profileId
                  ).length || 0;

                  return {
                    chat,
                    booking,
                    isCustomer,
                    partner,
                    serviceTitles,
                    unreadCount,
                  };
                });

                // Sort: unread chats first, then by last updated time
                const sortedChats = processedChats.sort((a, b) => {
                  if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
                  if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
                  return new Date(b.chat.updated_at).getTime() - new Date(a.chat.updated_at).getTime();
                });

                // Separate read and unread chats
                const unreadChats = sortedChats.filter(item => item.unreadCount > 0);
                const readChats = sortedChats.filter(item => item.unreadCount === 0);

                return (
                  <>
                    {unreadChats.map((item) => (
                      <ChatCard
                        key={item.chat.id}
                        chatId={item.chat.id}
                        bookingId={item.booking.id}
                        partnerName={item.partner?.full_name || "Ukjent bruker"}
                        serviceTitles={item.serviceTitles}
                        bookingDate={item.booking.start_time}
                        bookingStatus={item.booking.status}
                        lastMessageTime={item.chat.updated_at}
                        currentUserId={profileId}
                        isCustomer={item.isCustomer}
                        unreadCount={item.unreadCount}
                      />
                    ))}
                    
                    {unreadChats.length > 0 && readChats.length > 0 && (
                      <div className="flex items-center gap-4 my-4">
                        <Separator className="flex-1" />
                        <span className="text-sm text-muted-foreground font-medium">Lest</span>
                        <Separator className="flex-1" />
                      </div>
                    )}
                    
                    {readChats.map((item) => (
                      <ChatCard
                        key={item.chat.id}
                        chatId={item.chat.id}
                        bookingId={item.booking.id}
                        partnerName={item.partner?.full_name || "Ukjent bruker"}
                        serviceTitles={item.serviceTitles}
                        bookingDate={item.booking.start_time}
                        bookingStatus={item.booking.status}
                        lastMessageTime={item.chat.updated_at}
                        currentUserId={profileId}
                        isCustomer={item.isCustomer}
                        unreadCount={0}
                      />
                    ))}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </ProfileLayout>
  );
}
