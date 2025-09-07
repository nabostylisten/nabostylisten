"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  MapPin,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { getAddress } from "@/server/addresses.actions";
import type { Database } from "@/types/database.types";

// Type for the booking with all related data (similar to booking-card.tsx)
type BookingWithDetails = Database["public"]["Tables"]["bookings"]["Row"] & {
  stylist: {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string;
  } | null;
  customer: {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string;
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
  booking: BookingWithDetails;
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

  // Fetch address details if booking has an address_id
  const { data: addressData, isLoading: addressLoading } = useQuery({
    queryKey: ["address", booking.address_id],
    queryFn: () => booking.address_id ? getAddress(booking.address_id) : null,
    enabled: !!booking.address_id,
  });

  const address = addressData?.data;

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
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="font-semibold">
                {services.length > 0 ? services[0]?.title : "Booking"}
                {services.length > 1 && ` +${services.length - 1} til`}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(booking.status)}
            </div>
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>
                {format(startTime, "EEEE d. MMMM yyyy", { locale: nb })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>
                {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                <span className="text-muted-foreground ml-1">
                  ({booking.total_duration_minutes} min)
                </span>
              </span>
            </div>
          </div>

          {/* Location */}
          {booking.address_id && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                {addressLoading ? (
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ) : address ? (
                  <div className="text-muted-foreground text-xs">
                    <p>{address.street_address}</p>
                    <p>{address.postal_code} {address.city}</p>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Message to Stylist */}
          {booking.message_to_stylist && (
            <div className="text-sm bg-muted/50 p-2 rounded">
              <div className="font-medium mb-1">Melding til stylist:</div>
              <div className="text-muted-foreground text-xs">
                {booking.message_to_stylist}
              </div>
            </div>
          )}

          {/* Discount Applied */}
          {booking.discount_id && booking.discount_applied > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CreditCard className="w-4 h-4" />
              <span>
                Rabatt: -{booking.discount_applied.toFixed(2)} NOK
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center pt-2 border-t">
            <div className="font-semibold">
              {booking.total_price.toFixed(2)} NOK
              {booking.discount_applied > 0 && (
                <span className="text-sm text-muted-foreground ml-2 line-through">
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
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Se chat
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  className="flex items-center gap-2 opacity-50"
                >
                  <MessageSquare className="w-4 h-4" />
                  Ingen chat
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}