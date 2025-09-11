"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import type { Database } from "@/types/database.types";

// Type for the booking data returned by getPreviousBookingsBetweenUsers
type PreviousBookingData = {
  id: string;
  customer_id: string;
  stylist_id: string;
  start_time: string;
  end_time: string;
  status: "pending" | "cancelled" | "confirmed" | "completed";
  total_price: number;
  total_duration_minutes: number;
  message_to_stylist: string | null;
  discount_applied: number;
  customer: {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string;
  } | null;
  stylist: {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string;
    addresses: Array<{
      street_address: string;
      postal_code: string;
      city: string;
      is_primary: boolean;
    }>;
  } | null;
  addresses: {
    street_address: string;
    city: string;
    postal_code: string;
    entry_instructions: string | null;
  } | null;
  discounts: {
    code: string;
    discount_percentage: number | null;
    discount_amount: number | null;
  } | null;
  booking_services: Array<{
    services: {
      id: string;
      title: string;
      description: string | null;
      price: number;
      currency: string;
      duration_minutes: number;
    } | null;
  }>;
  chats: { id: string } | null;
};

interface PreviousBookingCardProps {
  booking: PreviousBookingData;
  onViewChat: (bookingId: string, chatId: string) => void;
}

export function PreviousBookingCard({
  booking,
  onViewChat,
}: PreviousBookingCardProps) {
  const startTime = new Date(booking.start_time);
  const endTime = new Date(booking.end_time);
  const services =
    booking.booking_services?.map((bs) => bs.services).filter(Boolean) || [];
  const hasChat = booking.chats && booking.chats.id;

  // Use the address data directly from the booking if available
  const address = booking.addresses;
  const addressLoading = false; // No loading since data is already available

  // Status styling (same as booking-card.tsx)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-200"
          >
            Venter
          </Badge>
        );
      case "confirmed":
        return (
          <Badge variant="outline" className="text-green-600 border-green-200">
            Bekreftet
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="text-red-600 border-red-200">
            Avlyst
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            Fullført
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <div className="space-y-1 flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base break-words">
                {services.length > 0 ? services[0]?.title : "Booking"}
                {services.length > 1 && ` +${services.length - 1} til`}
              </h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {getStatusBadge(booking.status)}
            </div>
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="break-words">
                {format(startTime, "EEEE d. MMMM yyyy", { locale: nb })}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="break-words">
                {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                <span className="text-muted-foreground ml-1">
                  ({booking.total_duration_minutes} min)
                </span>
              </span>
            </div>
          </div>

          {/* Location */}
          {address && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <div className="text-muted-foreground text-xs">
                  <p>{address.street_address}</p>
                  <p>{address.postal_code} {address.city}</p>
                </div>
              </div>
            </div>
          )}

          {/* Message to Stylist */}
          {booking.message_to_stylist && (
            <div className="text-sm bg-muted/50 p-2 rounded">
              <div className="font-medium mb-1 text-xs sm:text-sm">Melding til stylist:</div>
              <div className="text-muted-foreground text-xs break-words">
                {booking.message_to_stylist}
              </div>
            </div>
          )}

          {/* Discount Applied */}
          {booking.discount_applied > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs sm:text-sm">
                Rabatt: -{booking.discount_applied.toFixed(2)} NOK
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-2 border-t">
            <div className="font-semibold text-sm sm:text-base">
              {booking.total_price.toFixed(2)} NOK
              {booking.discount_applied > 0 && (
                <span className="text-xs sm:text-sm text-muted-foreground ml-2 line-through block sm:inline">
                  {(booking.total_price + booking.discount_applied).toFixed(2)}{" "}
                  NOK
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {hasChat ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewChat(booking.id, booking.chats!.id)}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Se chat</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  className="flex items-center gap-2 opacity-50 w-full sm:w-auto"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Ingen chat</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}