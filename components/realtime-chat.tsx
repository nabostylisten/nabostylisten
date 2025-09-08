"use client";

import { cn } from "@/lib/utils";
import { ChatMessageItem } from "@/components/chat-message";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { type ChatMessage, useRealtimeChat } from "@/hooks/use-realtime-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Image as ImageIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { UploadImagesDialog } from "@/components/chat/upload-images-dialog";

interface RealtimeChatProps {
  roomName: string;
  username: string;
  currentUserId: string; // Required for proper message ownership comparison
  chatId?: string;
  onMessage?: (messages: ChatMessage[]) => void;
  messages?: ChatMessage[];
  onReadStatusChange?: (data: {
    chat_id: string;
    message_id: string;
    is_read: boolean;
  }) => void;
}

/**
 * Realtime chat component
 * @param roomName - The name of the room to join. Each room is a unique chat.
 * @param username - The username of the user
 * @param onMessage - The callback function to handle the messages. Useful if you want to store the messages in a database.
 * @param messages - The messages to display in the chat. Useful if you want to display messages from a database.
 * @returns The chat component
 */
export const RealtimeChat = ({
  roomName,
  username,
  chatId,
  onMessage,
  messages: initialMessages = [],
  onReadStatusChange,
  currentUserId,
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll();

  const {
    messages: realtimeMessages,
    sendMessage,
    isConnected,
  } = useRealtimeChat({
    roomName,
    username,
    userId: currentUserId,
    onReadStatusChange,
  });
  const [newMessage, setNewMessage] = useState("");

  // Merge realtime messages with initial messages
  const allMessages = useMemo(() => {
    const mergedMessages = [...initialMessages, ...realtimeMessages];
    // Remove duplicates based on message id
    const uniqueMessages = mergedMessages.filter(
      (message, index, self) =>
        index === self.findIndex((m) => m.id === message.id)
    );
    // Sort by creation date
    const sortedMessages = uniqueMessages.sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );

    return sortedMessages;
  }, [initialMessages, realtimeMessages]);

  useEffect(() => {
    if (onMessage) {
      onMessage(allMessages);
    }
  }, [allMessages, onMessage]);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    scrollToBottom();
  }, [allMessages, scrollToBottom]);

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !isConnected) return;

      sendMessage(newMessage);
      setNewMessage("");
    },
    [newMessage, isConnected, sendMessage]
  );

  const handleImageUpload = useCallback(
    (
      uploadedImages: Array<{ id: string; file_path: string; url: string }>,
      messageId: string
    ) => {
      if (!isConnected || !uploadedImages.length) return;

      // Create an image message with the uploaded images
      const imageMessage: ChatMessage = {
        id: messageId,
        content: "", // No text content for image-only messages
        user: {
          name: username,
          senderId: currentUserId,
        },
        createdAt: new Date().toISOString(),
        images: uploadedImages,
      };

      // Add the message to the realtime messages and let the parent handle persistence
      if (onMessage) {
        const updatedMessages = [...allMessages, imageMessage];
        onMessage(updatedMessages);
      }
    },
    [isConnected, username, currentUserId, allMessages, onMessage]
  );

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground antialiased">
      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground">
            Ingen meldinger enda. Start samtalen!
          </div>
        ) : null}
        <div className="space-y-1">
          {allMessages.map((message, index) => {
            const prevMessage = index > 0 ? allMessages[index - 1] : null;
            const showHeader =
              !prevMessage || prevMessage.user.name !== message.user.name;

            // Determine if message is from current user using senderId
            const isOwnMessage = message.user.senderId === currentUserId;
            
            // Debug logging
            console.log("[DEBUG] Message display:", {
              messageId: message.id,
              messageUserName: message.user.name,
              messageSenderId: message.user.senderId,
              currentUsername: username,
              currentUserId,
              isOwnMessage,
              content: message.content?.substring(0, 30) + "..."
            });

            return (
              <div
                key={message.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-300"
              >
                <ChatMessageItem
                  message={message}
                  isOwnMessage={isOwnMessage}
                  showHeader={showHeader}
                />
              </div>
            );
          })}
        </div>
      </div>

      <form
        onSubmit={handleSendMessage}
        className="flex w-full gap-2 border-t border-border p-4"
      >
        {/* Image upload button */}
        {chatId && (
          <UploadImagesDialog
            chatId={chatId}
            onUploadComplete={handleImageUpload}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="aspect-square rounded-full"
              disabled={!isConnected}
            >
              <ImageIcon className="size-4" />
            </Button>
          </UploadImagesDialog>
        )}

        <Input
          className={cn(
            "rounded-full bg-background text-sm transition-all duration-300",
            isConnected && newMessage.trim()
              ? "w-[calc(100%-72px)]"
              : chatId
                ? "w-[calc(100%-36px)]"
                : "w-full"
          )}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Skriv en melding..."
          disabled={!isConnected}
        />
        {isConnected && newMessage.trim() && (
          <Button
            className="aspect-square rounded-full animate-in fade-in slide-in-from-right-4 duration-300"
            type="submit"
            disabled={!isConnected}
          >
            <Send className="size-4" />
          </Button>
        )}
      </form>
    </div>
  );
};
