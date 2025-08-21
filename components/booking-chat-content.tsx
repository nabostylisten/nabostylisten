"use client";

import { RealtimeChat, type ChatMessage } from "@/components/realtime-chat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, Calendar, MessageCircle, User } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect } from "react";
import { createChatMessage, markChatMessagesAsRead } from "@/server/chat.actions";
import { toast } from "sonner";

interface BookingChatContentProps {
  bookingId: string;
  chatId: string;
  currentUserId: string;
  currentUserName: string;
  partnerName: string;
  serviceTitles: string[];
  bookingDate: string;
  bookingStatus: string;
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
  initialMessages,
  messagesError,
}: BookingChatContentProps) {
  // Convert database messages to ChatMessage format
  const convertedMessages: ChatMessage[] = initialMessages.map((msg) => ({
    id: msg.id,
    content: msg.content,
    createdAt: msg.created_at,
    user: {
      name: msg.sender.full_name || "Ukjent bruker",
    },
  }));

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

  // Mark messages as read when component mounts
  useEffect(() => {
    const markAsRead = async () => {
      try {
        await markChatMessagesAsRead(chatId);
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    markAsRead();
  }, [chatId]);

  // Handle message persistence when new messages are sent via realtime chat
  const handleMessage = useCallback(
    async (messages: ChatMessage[]) => {
      // Get the most recent message that might need to be persisted
      const latestMessage = messages[messages.length - 1];
      
      // Only persist messages that were sent by the current user and are not already in the database
      if (
        latestMessage &&
        latestMessage.user.name === currentUserName &&
        !initialMessages.some((msg) => msg.id === latestMessage.id)
      ) {
        try {
          const result = await createChatMessage({
            chatId,
            content: latestMessage.content,
          });

          if (result.error) {
            toast.error("Feil ved lagring av melding: " + result.error);
          }
        } catch (error) {
          console.error("Error saving message:", error);
          toast.error("Feil ved lagring av melding");
        }
      }
    },
    [chatId, currentUserName, initialMessages]
  );

  return (
    <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/bookinger/${bookingId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbake til booking
          </Link>
        </Button>
      </div>

      {/* Booking Info Card */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Chat</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <User className="w-4 h-4" />
                <span>Med {partnerName}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>
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
              <div className="text-muted-foreground">
                {serviceTitles.join(", ")}
              </div>
            )}
            
            <Badge variant={getStatusVariant(bookingStatus)}>
              {getStatusLabel(bookingStatus)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Error handling */}
      {messagesError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 text-sm">
            Feil ved lasting av meldinger: {messagesError}
          </p>
        </div>
      )}

      {/* Chat Container */}
      <div className="flex-1 bg-white rounded-lg border shadow-sm overflow-hidden">
        <RealtimeChat
          roomName={`booking-${bookingId}`}
          username={currentUserName}
          messages={convertedMessages}
          onMessage={handleMessage}
        />
      </div>
    </div>
  );
}