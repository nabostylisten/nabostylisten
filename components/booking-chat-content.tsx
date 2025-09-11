"use client";

import { RealtimeChat } from "@/components/realtime-chat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, Calendar, MessageCircle, User } from "lucide-react";
import Link from "next/link";
import { BookingActionsDropdown } from "@/components/my-bookings/booking-actions-dropdown";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  createChatMessage,
  markChatMessagesAsRead,
  getChatMessageImages,
  getPreviousBookingsBetweenUsers,
} from "@/server/chat.actions";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { ChatMessage } from "@/hooks/use-realtime-chat";
import { PreviousBookingsAlert } from "@/components/chat/previous-bookings-alert";
import { Database } from "@/types/database.types";

export type BookingStatus =
  Database["public"]["Tables"]["bookings"]["Row"]["status"];

interface BookingChatContentProps {
  bookingId: string;
  chatId: string;
  currentUserId: string;
  currentUserName: string;
  partnerName: string;
  serviceTitles: string[];
  bookingDate: string;
  bookingStatus: BookingStatus;
  bookingTotalPrice?: number;
  initialMessages: Array<{
    id: string;
    content: string;
    created_at: string;
    sender: {
      id: string;
      full_name: string | null;
    };
  }>;
  messagesError?: string | null;
  // New props for previous bookings functionality
  stylistId?: string;
  customerId?: string;
  isCurrentUserStylist?: boolean;
}

export function BookingChatContent({
  bookingId,
  chatId,
  currentUserId,
  currentUserName,
  partnerName,
  serviceTitles,
  bookingDate,
  bookingStatus,
  bookingTotalPrice = 0,
  initialMessages,
  messagesError,
  stylistId,
  customerId,
  isCurrentUserStylist = false,
}: BookingChatContentProps) {
  const [convertedMessages, setConvertedMessages] = useState<ChatMessage[]>([]);
  const processedMessageIds = useRef<Set<string>>(new Set());

  // Check for previous bookings between stylist and customer (only for stylists)
  const { data: previousBookingsResponse } = useQuery({
    queryKey: ["previous-bookings-check", stylistId, customerId, bookingId],
    queryFn: () =>
      stylistId && customerId
        ? getPreviousBookingsBetweenUsers(stylistId, customerId, bookingId)
        : Promise.resolve({ data: [], error: null }),
    enabled: isCurrentUserStylist && !!stylistId && !!customerId,
  });

  const hasPreviousBookings = (previousBookingsResponse?.data?.length || 0) > 0;

  // Load images for messages and convert to ChatMessage format
  useEffect(() => {
    const loadMessagesWithImages = async () => {
      // Clear processed messages when initial messages change
      processedMessageIds.current.clear();

      console.log("[DEBUG] Loading messages with images");
      console.log("[DEBUG] Current user ID:", currentUserId);
      console.log("[DEBUG] Current user name:", currentUserName);

      const messagesWithImages = await Promise.all(
        initialMessages.map(async (msg) => {
          // Mark initial messages as processed
          processedMessageIds.current.add(msg.id);

          // Fetch images for this message
          const imagesResult = await getChatMessageImages(msg.id);
          const images = imagesResult.error ? [] : imagesResult.data || [];

          const isOwnMessage = msg.sender.id === currentUserId;
          console.log("[DEBUG] Message:", {
            id: msg.id,
            senderId: msg.sender.id,
            senderName: msg.sender.full_name,
            isCurrentUser: isOwnMessage,
            currentUserId,
            currentUserName,
            content: msg.content.substring(0, 50) + "...",
          });

          // IMPORTANT: Use the same username format for both loaded and new messages
          // If the message is from current user, use currentUserName ("Kunde" or "Stylist")
          // Otherwise use the sender's full name
          const userName = isOwnMessage
            ? currentUserName
            : msg.sender.full_name || "Ukjent bruker";

          return {
            id: msg.id,
            content: msg.content,
            createdAt: msg.created_at,
            user: {
              name: userName,
              senderId: msg.sender.id, // Add sender ID for proper comparison
            },
            images: images.length > 0 ? images : undefined,
          };
        })
      );

      setConvertedMessages(messagesWithImages);
    };

    loadMessagesWithImages();
  }, [initialMessages]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "pending":
        return "secondary";
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Bekreftet";
      case "pending":
        return "Avventer";
      case "completed":
        return "Fullført";
      case "cancelled":
        return "Avlyst";
      default:
        return status;
    }
  };

  const queryClient = useQueryClient();

  // Mark messages as read when component mounts
  useEffect(() => {
    const markAsRead = async () => {
      try {
        const result = await markChatMessagesAsRead(chatId);
        if (result.error) {
          console.error("Error marking messages as read:", result.error);
        } else {
          // Invalidate relevant queries to refresh UI
          queryClient.invalidateQueries({
            queryKey: ["unread-messages", currentUserId],
          });
          queryClient.invalidateQueries({ queryKey: ["chats", currentUserId] });
        }
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    markAsRead();
  }, [chatId, queryClient, currentUserId]);

  // Handle message persistence when new messages are sent via realtime chat
  const handleMessage = useCallback(
    async (messages: ChatMessage[]) => {
      // Get the most recent message that might need to be persisted
      const latestMessage = messages[messages.length - 1];

      // Only persist text messages that were sent by the current user and are not already processed
      // Image messages are already persisted during the upload process
      if (
        latestMessage &&
        latestMessage.user.name === currentUserName &&
        !processedMessageIds.current.has(latestMessage.id) &&
        !latestMessage.images // Only handle text messages here, image messages are handled in upload
      ) {
        processedMessageIds.current.add(latestMessage.id);
        try {
          const result = await createChatMessage({
            chatId,
            content: latestMessage.content,
            messageId: latestMessage.id, // Use the client-generated message ID
          });

          if (result.error) {
            toast.error("Feil ved lagring av melding: " + result.error);
          } else {
            // Update the converted messages to include the new message
            setConvertedMessages((prev) => {
              const updated = [...prev];
              // Replace the temporary message with the persisted one if it exists
              const existingIndex = updated.findIndex(
                (msg) => msg.id === latestMessage.id
              );
              if (existingIndex === -1) {
                updated.push(latestMessage);
              }
              return updated;
            });
          }
        } catch (error) {
          console.error("Error saving message:", error);
          toast.error("Feil ved lagring av melding");
        }
      } else if (
        latestMessage &&
        latestMessage.images &&
        latestMessage.user.name === currentUserName &&
        !processedMessageIds.current.has(latestMessage.id)
      ) {
        processedMessageIds.current.add(latestMessage.id);
        // For image messages, just update the UI since they're already persisted
        setConvertedMessages((prev) => {
          const updated = [...prev];
          const existingIndex = updated.findIndex(
            (msg) => msg.id === latestMessage.id
          );
          if (existingIndex === -1) {
            updated.push(latestMessage);
          }
          return updated;
        });
      }
    },
    [chatId, currentUserName, initialMessages]
  );

  // Handle real-time read status changes
  const handleReadStatusChange = useCallback(
    (_data: { chat_id: string; message_id: string; is_read: boolean }) => {
      // Invalidate queries to refresh unread counts in UI
      queryClient.invalidateQueries({
        queryKey: ["unread-messages", currentUserId],
      });
      queryClient.invalidateQueries({ queryKey: ["chats", currentUserId] });
    },
    [queryClient, currentUserId]
  );

  return (
    <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
        <Button variant="ghost" size="sm" asChild className="shrink-0">
          <Link href={`/bookinger/${bookingId}`} className="flex items-center gap-1 sm:gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Tilbake til booking</span>
            <span className="sm:hidden">Tilbake</span>
          </Link>
        </Button>
      </div>

      {/* Booking Info Card */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-3 px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold">Chat</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="truncate">Med {partnerName}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 text-sm">
            <div className="flex items-center gap-1 flex-wrap">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="break-words">
                {new Date(bookingDate).toLocaleDateString("nb-NO", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {serviceTitles.length > 0 && (
              <div className="text-muted-foreground break-words">
                {serviceTitles.join(", ")}
              </div>
            )}

            <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4">
              <Badge variant={getStatusVariant(bookingStatus)}>
                {getStatusLabel(bookingStatus)}
              </Badge>

              {/* Actions dropdown for both customers and stylists */}
              <BookingActionsDropdown
                booking={{
                  id: bookingId,
                  customer_id: customerId || "",
                  stylist_id: stylistId || "",
                  start_time: bookingDate,
                  end_time: bookingDate,
                  total_price: bookingTotalPrice,
                  status: bookingStatus,
                }}
                currentUserId={currentUserId}
                userRole={isCurrentUserStylist ? "stylist" : "customer"}
                serviceName={serviceTitles[0] || "Booking"}
                customerName={
                  isCurrentUserStylist ? partnerName : currentUserName
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error handling */}
      {messagesError && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 mx-3 sm:mx-0">
          <p className="text-red-700 dark:text-red-300 text-sm">
            Feil ved lasting av meldinger: {messagesError}
          </p>
        </div>
      )}

      {/* Previous Bookings Alert (only for stylists) */}
      {isCurrentUserStylist && stylistId && customerId && (
        <div className="px-3 sm:px-0">
          <PreviousBookingsAlert
            stylistId={stylistId}
            customerId={customerId}
            customerName={partnerName}
            currentBookingId={bookingId}
            hasPreviousBookings={hasPreviousBookings}
          />
        </div>
      )}

      {/* Chat Container */}
      <div className="flex-1 bg-white dark:bg-gray-900 rounded-lg border shadow-sm overflow-hidden mx-3 sm:mx-0">
        <RealtimeChat
          roomName={`booking-${bookingId}`}
          username={currentUserName}
          currentUserId={currentUserId}
          chatId={chatId}
          messages={convertedMessages}
          onMessage={handleMessage}
          onReadStatusChange={handleReadStatusChange}
        />
      </div>
    </div>
  );
}
