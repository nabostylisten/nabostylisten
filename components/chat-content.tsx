"use client";

import { RealtimeChat } from "@/components/realtime-chat";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ArrowLeft, MessageCircle, User } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  createChatMessage,
  markChatMessagesAsRead,
  getChatMessageImages,
} from "@/server/chat.actions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ChatMessage } from "@/hooks/use-realtime-chat";

interface ChatContentProps {
  chatId: string;
  customerId: string;
  stylistId: string;
  currentUserId: string;
  currentUserName: string;
  partnerName: string;
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

export function ChatContent({
  chatId,
  currentUserId,
  currentUserName,
  partnerName,
  initialMessages,
  messagesError,
}: ChatContentProps) {
  const [convertedMessages, setConvertedMessages] = useState<ChatMessage[]>([]);
  const processedMessageIds = useRef<Set<string>>(new Set());

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

          // Use consistent username format for both loaded and new messages
          const userName = isOwnMessage
            ? currentUserName
            : msg.sender.full_name || "Ukjent bruker";

          return {
            id: msg.id,
            content: msg.content,
            createdAt: msg.created_at,
            user: {
              name: userName,
              senderId: msg.sender.id,
            },
            images: images.length > 0 ? images : undefined,
          };
        })
      );

      setConvertedMessages(messagesWithImages);
    };

    loadMessagesWithImages();
  }, [initialMessages]);

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
    [chatId, currentUserName]
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
          <Link
            href={`/profiler/${currentUserId}/chat`}
            className="flex items-center gap-1 sm:gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Tilbake til samtaler</span>
            <span className="sm:hidden">Tilbake</span>
          </Link>
        </Button>
      </div>

      {/* Chat Info Card */}
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
      </Card>

      {/* Error handling */}
      {messagesError && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 mx-3 sm:mx-0">
          <p className="text-red-700 dark:text-red-300 text-sm">
            Feil ved lasting av meldinger: {messagesError}
          </p>
        </div>
      )}

      {/* Chat Container */}
      <div className="flex-1 bg-white dark:bg-gray-900 rounded-lg border shadow-sm overflow-hidden">
        <RealtimeChat
          roomName={`chat-${chatId}`}
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
