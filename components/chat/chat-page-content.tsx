"use client";

import { useEffect, useState } from "react";
import { MessageCircle, User, Briefcase, Search } from "lucide-react";
import { ChatCard } from "@/components/chat-card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useChats } from "@/hooks/use-chats";
import { ChatCardSkeletonList } from "@/components/ui/chat-card-skeleton";
import { BlurFade } from "@/components/magicui/blur-fade";

interface ChatPageContentProps {
  profileId: string;
  userRole?: "customer" | "stylist";
}

export function ChatPageContent({ profileId, userRole }: ChatPageContentProps) {
  // State to toggle between personal chats (as customer) and stylist chats
  // Default to 'stylist' for stylists, 'personal' for customers
  const [stylistMode, setStylistMode] = useState<"personal" | "stylist">(
    userRole === "stylist" ? "stylist" : "personal"
  );

  // Update stylist mode when user role changes
  useEffect(() => {
    if (userRole) {
      setStylistMode(userRole === "stylist" ? "stylist" : "personal");
    }
  }, [userRole]);

  const { chats, isLoading: chatsLoading, error } = useChats(profileId);

  return (
    <div className="flex flex-1 flex-col gap-4 p-3 sm:p-4">
      <div className="max-w-4xl mx-auto w-full">
        <BlurFade delay={0.1} duration={0.5} inView>
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8" />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold">
                {userRole === "stylist"
                  ? stylistMode === "personal"
                    ? "Mine samtaler"
                    : "Kundesamtaler"
                  : "Chat"}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                {userRole === "stylist"
                  ? stylistMode === "personal"
                    ? "Dine egne samtaler som kunde"
                    : "Administrer samtaler med dine kunder"
                  : "Administrer dine samtaler og meldinger"}
              </p>
            </div>
          </div>
        </BlurFade>

        {/* Mode toggle for stylists */}
        {userRole === "stylist" && (
          <BlurFade delay={0.15} duration={0.5} inView>
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-1 sm:gap-2 p-1 bg-muted rounded-lg w-full max-w-fit overflow-hidden">
                <Button
                  variant={stylistMode === "personal" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setStylistMode("personal")}
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-initial"
                >
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Mine samtaler</span>
                  <span className="sm:hidden">Mine</span>
                </Button>
                <Button
                  variant={stylistMode === "stylist" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setStylistMode("stylist")}
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-initial"
                >
                  <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Kundesamtaler</span>
                  <span className="sm:hidden">Kunder</span>
                </Button>
              </div>
            </div>
          </BlurFade>
        )}

        {error && (
          <BlurFade delay={0.1} duration={0.5} inView>
            <div className="text-red-500 dark:text-red-400 mb-4">
              Feil ved lasting av samtaler:{" "}
              {typeof error === "string" ? error : "Ukjent feil"}
            </div>
          </BlurFade>
        )}

        {/* Show skeleton while loading chats */}
        {chatsLoading ? (
          <BlurFade delay={0.2} duration={0.5} inView>
            <ChatCardSkeletonList count={3} />
          </BlurFade>
        ) : (
          (() => {
            if (!chats) return null;

            // Filter chats based on stylist mode for empty state check
            let filteredChatsForEmptyCheck = chats;
            if (userRole === "stylist") {
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
                <BlurFade delay={0.2} duration={0.5} inView>
                  <div className="text-center py-8 sm:py-12 px-4">
                    <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-base sm:text-lg font-medium mb-2">
                      {userRole === "stylist"
                        ? stylistMode === "personal"
                          ? "Ingen samtaler som kunde"
                          : "Ingen kundesamtaler"
                        : "Ingen samtaler ennå"}
                    </h3>
                    <p className="text-muted-foreground mb-6 text-sm sm:text-base max-w-md mx-auto">
                      {userRole === "stylist"
                        ? stylistMode === "personal"
                          ? "Du vil se samtaler her når du booker tjenester som kunde."
                          : "Du vil se samtaler her når du har bookinger fra kunder."
                        : "Du vil se samtaler her når du har bookinger med andre brukere."}
                    </p>
                    {(userRole === "stylist" && stylistMode === "personal") ||
                    userRole === "customer" ? (
                      <Button asChild className="w-full sm:w-auto">
                        <Link
                          href="/tjenester"
                          className="flex items-center justify-center gap-2"
                        >
                          <Search className="w-4 h-4" />
                          Utforsk tjenester
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </BlurFade>
              );
            }

            return null;
          })() || (
            <BlurFade delay={0.2} duration={0.5} inView>
              <div className="space-y-3">
                {(() => {
                  if (!chats) return null;

                  // Filter chats based on stylist mode
                  let filteredChats = chats;
                  if (userRole === "stylist") {
                    filteredChats = chats.filter((chat) => {
                      const booking = chat.bookings;
                      const isCustomerInBooking =
                        booking.customer_id === profileId;
                      const isStylistInBooking =
                        booking.stylist_id === profileId;

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
                      {unreadChats.map((item, index) => (
                        <BlurFade
                          key={item.chat.id}
                          delay={0.1 + index * 0.1}
                          duration={0.5}
                          inView
                        >
                          <ChatCard
                            chatId={item.chat.id}
                            bookingId={item.booking.id}
                            partnerName={
                              item.partner?.full_name || "Ukjent bruker"
                            }
                            serviceTitles={item.serviceTitles}
                            bookingDate={item.booking.start_time}
                            bookingStatus={item.booking.status}
                            lastMessageTime={item.chat.updated_at}
                            currentUserId={profileId}
                            isCustomer={item.isCustomer}
                            unreadCount={item.unreadCount}
                          />
                        </BlurFade>
                      ))}

                      {unreadChats.length > 0 && readChats.length > 0 && (
                        <BlurFade delay={0.15} duration={0.5} inView>
                          <div className="flex items-center gap-4 my-4">
                            <Separator className="flex-1" />
                            <span className="text-sm text-muted-foreground font-medium">
                              Lest
                            </span>
                            <Separator className="flex-1" />
                          </div>
                        </BlurFade>
                      )}

                      {readChats.map((item, index) => (
                        <BlurFade
                          key={item.chat.id}
                          delay={0.1 + index * 0.1}
                          duration={0.5}
                          inView
                        >
                          <ChatCard
                            chatId={item.chat.id}
                            bookingId={item.booking.id}
                            partnerName={
                              item.partner?.full_name || "Ukjent bruker"
                            }
                            serviceTitles={item.serviceTitles}
                            bookingDate={item.booking.start_time}
                            bookingStatus={item.booking.status}
                            lastMessageTime={item.chat.updated_at}
                            currentUserId={profileId}
                            isCustomer={item.isCustomer}
                            unreadCount={0}
                          />
                        </BlurFade>
                      ))}
                    </>
                  );
                })()}
              </div>
            </BlurFade>
          )
        )}
      </div>
    </div>
  );
}
