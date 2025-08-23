"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar, MessageCircle, Loader2, History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getChatMessages } from "@/server/chat.actions";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { ChatMessageItem } from "@/components/chat-message";
import type { ChatMessage } from "@/hooks/use-realtime-chat";
import { useEffect, useState } from "react";
import { Card } from "../ui/card";

interface ChatHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  chatId: string;
  customerName: string;
  stylistName: string;
  bookingDate: string;
  serviceTitles: string[];
}

export function ChatHistorySheet({
  open,
  onOpenChange,
  chatId,
  customerName,
  stylistName,
  bookingDate,
  serviceTitles,
}: ChatHistorySheetProps) {
  const [convertedMessages, setConvertedMessages] = useState<ChatMessage[]>([]);

  const { data: messagesResponse, isLoading } = useQuery({
    queryKey: ["chat-history", chatId],
    queryFn: () => getChatMessages(chatId),
    enabled: open && !!chatId,
  });

  // Convert messages to ChatMessage format
  useEffect(() => {
    if (messagesResponse?.data) {
      const converted = messagesResponse.data.map((msg) => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.created_at,
        user: {
          name: msg.sender.full_name || "Ukjent bruker",
        },
        // Note: We're not loading images for history view to keep it simple
        // Could be enhanced later if needed
      }));
      setConvertedMessages(converted);
    }
  }, [messagesResponse?.data]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl flex flex-col h-full">
        <SheetHeader className="space-y-4 pb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-xl font-semibold">
                Chathistorie
              </SheetTitle>
              <SheetDescription className="text-base mt-1">
                Tidligere samtale mellom {stylistName} og {customerName}
              </SheetDescription>
            </div>
          </div>

          {/* Booking Details Card */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>
                {format(
                  new Date(bookingDate),
                  "EEEE d. MMMM yyyy 'kl.' HH:mm",
                  {
                    locale: nb,
                  }
                )}
              </span>
            </div>

            {serviceTitles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {serviceTitles.map((title, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {title}
                  </Badge>
                ))}
              </div>
            )}
          </Card>

          <Separator />
        </SheetHeader>

        {/* Chat Container with same styling as RealtimeChat */}
        <Card className="flex-1 antialiased p-2 mx-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-muted-foreground h-full">
              <div className="p-3 bg-muted/30 rounded-full mb-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <h3 className="font-medium mb-2">Laster chathistorie</h3>
              <p className="text-sm text-center">
                Henter tidligere meldinger...
              </p>
            </div>
          ) : messagesResponse?.error ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 h-full">
              <div className="p-3 bg-red-50 rounded-full mb-4">
                <MessageCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-medium text-red-900 mb-2">
                Kan ikke laste meldinger
              </h3>
              <p className="text-sm text-red-700 text-center max-w-sm">
                {messagesResponse.error}
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full w-full">
              {/* Messages Container - Same styling as RealtimeChat */}
              <div className="flex-1 p-4">
                {convertedMessages.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground">
                    Ingen meldinger i denne chatten.
                  </div>
                ) : (
                  <>
                    {/* Message Count Header */}
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full text-xs text-muted-foreground font-medium">
                        <History className="w-3 h-3" />
                        {convertedMessages.length} melding
                        {convertedMessages.length !== 1 ? "er" : ""} fra
                        tidligere
                      </div>
                    </div>

                    {/* Messages with same spacing as RealtimeChat */}
                    <ScrollArea className="h-[520px] mt-4 w-full rounded-md">
                      <div className="space-y-1">
                        {convertedMessages.map((message, index) => {
                          const prevMessage =
                            index > 0 ? convertedMessages[index - 1] : null;
                          const showHeader =
                            !prevMessage ||
                            prevMessage.user.name !== message.user.name;

                          return (
                            <ChatMessageItem
                              key={message.id}
                              message={message}
                              isOwnMessage={message.user.name === stylistName}
                              showHeader={showHeader}
                            />
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </>
                )}
              </div>

              {/* Bottom border to match RealtimeChat style */}
              <div className="border-t border-border p-4">
                <div className="text-center text-xs text-muted-foreground">
                  Dette er en tidligere samtale og kan ikke redigeres
                </div>
              </div>
            </div>
          )}
        </Card>
      </SheetContent>
    </Sheet>
  );
}
