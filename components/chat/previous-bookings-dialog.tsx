"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, History, CalendarDays } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPreviousBookingsBetweenUsers } from "@/server/chat.actions";
import { PreviousBookingCard } from "./previous-booking-card";
import { ChatHistorySheet } from "./chat-history-sheet";
import { useState } from "react";

interface PreviousBookingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stylistId: string;
  customerId: string;
  customerName: string;
  currentBookingId: string;
}

interface SelectedChatHistory {
  bookingId: string;
  chatId: string;
  bookingDate: string;
  serviceTitles: string[];
}

export function PreviousBookingsDialog({
  open,
  onOpenChange,
  stylistId,
  customerId,
  customerName,
  currentBookingId,
}: PreviousBookingsDialogProps) {
  const [selectedChatHistory, setSelectedChatHistory] = useState<SelectedChatHistory | null>(null);

  const { data: bookingsResponse, isLoading } = useQuery({
    queryKey: ["previous-bookings", stylistId, customerId, currentBookingId],
    queryFn: () => getPreviousBookingsBetweenUsers(stylistId, customerId, currentBookingId),
    enabled: open,
  });

  const handleViewChat = (bookingId: string, chatId: string) => {
    const booking = bookingsResponse?.data?.find(b => b.id === bookingId);
    if (booking) {
      const serviceTitles = booking.booking_services
        ?.map(bs => bs.services?.title)
        .filter(Boolean) || [];
      
      setSelectedChatHistory({
        bookingId,
        chatId,
        bookingDate: booking.start_time,
        serviceTitles,
      });
    }
  };

  const previousBookings = bookingsResponse?.data || [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Tidligere bookinger med {customerName}
            </DialogTitle>
            <DialogDescription>
              Her kan du se innsikt og læring fra tidligere bookinger og samtaler.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Laster tidligere bookinger...</span>
              </div>
            ) : bookingsResponse?.error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">
                  Feil ved lasting av bookinger: {bookingsResponse.error}
                </p>
              </div>
            ) : previousBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Ingen tidligere bookinger funnet med denne kunden.</p>
              </div>
            ) : (
              <ScrollArea className="h-[60vh]">
                <div className="space-y-4 pr-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    {previousBookings.length} tidligere booking{previousBookings.length !== 1 ? 'er' : ''} funnet
                  </div>
                  {previousBookings.map((booking) => (
                    <PreviousBookingCard
                      key={booking.id}
                      booking={booking}
                      onViewChat={handleViewChat}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat History Sheet */}
      {selectedChatHistory && (
        <ChatHistorySheet
          open={!!selectedChatHistory}
          onOpenChange={() => setSelectedChatHistory(null)}
          bookingId={selectedChatHistory.bookingId}
          chatId={selectedChatHistory.chatId}
          customerName={customerName}
          stylistName="Du" // Since this is always viewed by the stylist
          bookingDate={selectedChatHistory.bookingDate}
          serviceTitles={selectedChatHistory.serviceTitles}
        />
      )}
    </>
  );
}