"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { ProfileLayout } from "@/components/profile-layout";
import { ChatCard } from "@/components/chat-card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useChats } from "@/hooks/use-chats";
import { Spinner } from "@/components/ui/kibo-ui/spinner";

interface ChatPageProps {
  params: Promise<{ profileId: string }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [profileId, setProfileId] = useState<string>("");

  // Get profileId from params
  useEffect(() => {
    params.then(({ profileId }) => setProfileId(profileId));
  }, [params]);

  const { chats, isLoading: chatsLoading, error } = useChats(profileId);

  // Non-owners shouldn't be able to access this subpage
  useEffect(() => {
    if (!loading && (!user || user.id !== profileId)) {
      router.push(`/profiler/${profileId}`);
    }
  }, [user, profileId, loading, router]);

  if (loading || chatsLoading || !profileId) {
    return (
      <ProfileLayout profileId={profileId} userRole={profile?.role}>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-8 h-8" />
            </div>
          </div>
        </div>
      </ProfileLayout>
    );
  }

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
              Feil ved lasting av samtaler:{" "}
              {typeof error === "string" ? error : "Ukjent feil"}
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
                  const partner = isCustomer
                    ? booking.stylist
                    : booking.customer;
                  const serviceTitles =
                    booking.booking_services
                      ?.map((bs) => bs.services?.title)
                      .filter(Boolean) || [];

                  // Count unread messages (not sent by current user)
                  const unreadCount =
                    chat.chat_messages?.filter(
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
                  return (
                    new Date(b.chat.updated_at).getTime() -
                    new Date(a.chat.updated_at).getTime()
                  );
                });

                // Separate read and unread chats
                const unreadChats = sortedChats.filter(
                  (item) => item.unreadCount > 0
                );
                const readChats = sortedChats.filter(
                  (item) => item.unreadCount === 0
                );

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
                        <span className="text-sm text-muted-foreground font-medium">
                          Lest
                        </span>
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
