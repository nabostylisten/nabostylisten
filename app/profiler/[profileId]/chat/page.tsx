"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MessageCircle, User, Briefcase, Search } from "lucide-react";
import { ProfileLayout } from "@/components/profile-layout";
import { ChatCard } from "@/components/chat-card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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

  // State to toggle between personal chats (as customer) and stylist chats
  // Default to 'stylist' for stylists, 'personal' for customers
  const [stylistMode, setStylistMode] = useState<"personal" | "stylist">(
    profile?.role === "stylist" ? "stylist" : "personal"
  );

  // Get profileId from params
  useEffect(() => {
    params.then(({ profileId }) => setProfileId(profileId));
  }, [params]);

  // Update stylist mode when profile role changes
  useEffect(() => {
    if (profile?.role) {
      setStylistMode(profile.role === "stylist" ? "stylist" : "personal");
    }
  }, [profile?.role]);

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
              <h1 className="text-3xl font-bold">
                {profile?.role === "stylist"
                  ? stylistMode === "personal"
                    ? "Mine samtaler"
                    : "Kundesamtaler"
                  : "Chat"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {profile?.role === "stylist"
                  ? stylistMode === "personal"
                    ? "Dine egne samtaler som kunde"
                    : "Administrer samtaler med dine kunder"
                  : "Administrer dine samtaler og meldinger"}
              </p>
            </div>
          </div>

          {/* Mode toggle for stylists */}
          {profile?.role === "stylist" && (
            <div className="mb-6">
              <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
                <Button
                  variant={stylistMode === "personal" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setStylistMode("personal")}
                  className="flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Mine samtaler
                </Button>
                <Button
                  variant={stylistMode === "stylist" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setStylistMode("stylist")}
                  className="flex items-center gap-2"
                >
                  <Briefcase className="w-4 h-4" />
                  Kundesamtaler
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-500 mb-4">
              Feil ved lasting av samtaler:{" "}
              {typeof error === "string" ? error : "Ukjent feil"}
            </div>
          )}

          {(() => {
            if (!chats) return null;

            // Filter chats based on stylist mode for empty state check
            let filteredChatsForEmptyCheck = chats;
            if (profile?.role === "stylist") {
              filteredChatsForEmptyCheck = chats.filter((chat) => {
                const booking = chat.bookings;
                const isCustomerInBooking = booking.customer_id === profileId;
                const isStylistInBooking = booking.stylist_id === profileId;
                
                if (stylistMode === "personal") {
                  return isCustomerInBooking;
                } else {
                  return isStylistInBooking;
                }
              });
            }

            if (filteredChatsForEmptyCheck.length === 0) {
              return (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {profile?.role === "stylist"
                      ? stylistMode === "personal" 
                        ? "Ingen samtaler som kunde"
                        : "Ingen kundesamtaler"
                      : "Ingen samtaler ennå"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {profile?.role === "stylist"
                      ? stylistMode === "personal"
                        ? "Du vil se samtaler her når du booker tjenester som kunde."
                        : "Du vil se samtaler her når du har bookinger fra kunder."
                      : "Du vil se samtaler her når du har bookinger med andre brukere."}
                  </p>
                  {(profile?.role === "stylist" && stylistMode === "personal") || profile?.role === "customer" ? (
                    <Button asChild>
                      <Link href="/tjenester" className="flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        Utforsk tjenester
                      </Link>
                    </Button>
                  ) : null}
                </div>
              );
            }

            return null;
          })() || (
            <div className="space-y-3">
              {(() => {
                if (!chats) return null;

                // Filter chats based on stylist mode
                let filteredChats = chats;
                if (profile?.role === "stylist") {
                  filteredChats = chats.filter((chat) => {
                    const booking = chat.bookings;
                    const isCustomerInBooking = booking.customer_id === profileId;
                    const isStylistInBooking = booking.stylist_id === profileId;
                    
                    if (stylistMode === "personal") {
                      // Show chats where stylist is acting as a customer
                      return isCustomerInBooking;
                    } else {
                      // Show chats where stylist is providing services
                      return isStylistInBooking;
                    }
                  });
                }

                // Process chats to add unread counts and sort
                const processedChats = filteredChats.map((chat) => {
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
