"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  MoreHorizontal,
  MessageSquare,
  CreditCard,
  Home,
  Building2,
  Settings,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Database } from "@/types/database.types";
import { BookingStatusDialog } from "./booking-status-dialog";

// Type for the booking with all related data
type BookingWithDetails = Database["public"]["Tables"]["bookings"]["Row"] & {
  stylist: {
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

interface BookingCardProps {
  booking: BookingWithDetails;
  userRole?: 'customer' | 'stylist';
}

export function BookingCard({ booking, userRole = 'customer' }: BookingCardProps) {
  const router = useRouter();
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

  const startTime = new Date(booking.start_time);
  const endTime = new Date(booking.end_time);
  const services =
    booking.booking_services?.map((bs) => bs.services).filter(Boolean) || [];
  const hasChat = booking.chats && booking.chats.id;

  // Status styling
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

  const handleViewDetails = () => {
    router.push(
      `/profiler/${booking.customer_id}/mine-bookinger/${booking.id}`
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">
                  {services.length > 0 ? services[0]?.title : "Booking"}
                  {services.length > 1 && ` +${services.length - 1} til`}
                </h3>
                {hasChat && (
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span className="text-sm">
                  {booking.stylist?.full_name || "Ukjent stylist"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(booking.status)}
            </div>
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              {booking.address_id ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Home className="w-3 h-3" />
                    <span className="font-medium">Hjemme hos deg</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span className="font-medium">Hos stylisten</span>
                </div>
              )}
            </div>
          </div>

          {/* Services List (if multiple) */}
          {services.length > 1 && (
            <div className="text-sm">
              <div className="font-medium mb-2">Tjenester:</div>
              <div className="grid gap-1">
                {services.map((service) => {
                  if (!service) return null;
                  return (
                    <div key={service.id} className="flex justify-between">
                      <span>{service.title}</span>
                      <span className="text-muted-foreground">
                        {service.price} {service.currency}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Message to Stylist */}
          {booking.message_to_stylist && (
            <div className="text-sm bg-muted/50 p-3 rounded-lg">
              <div className="font-medium mb-1">Melding til stylist:</div>
              <div className="text-muted-foreground">
                {booking.message_to_stylist}
              </div>
            </div>
          )}

          {/* Discount Applied */}
          {booking.discount_id && booking.discount_applied > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CreditCard className="w-4 h-4" />
              <span>
                Rabatt anvendt: -{booking.discount_applied.toFixed(2)} NOK
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center pt-2 border-t">
            <div className="text-lg font-semibold">
              {booking.total_price.toFixed(2)} NOK
              {booking.discount_applied > 0 && (
                <span className="text-sm text-muted-foreground ml-2 line-through">
                  {(booking.total_price + booking.discount_applied).toFixed(2)}{" "}
                  NOK
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {/* Stylist-specific actions for pending bookings */}
              {userRole === 'stylist' && booking.status === 'pending' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsStatusDialogOpen(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Administrer
                </Button>
              )}
              <Button variant="outline" onClick={handleViewDetails}>
                <MoreHorizontal className="w-4 h-4 mr-2" />
                Se detaljer
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Status Dialog for Stylists */}
      {userRole === 'stylist' && (
        <BookingStatusDialog
          bookingId={booking.id}
          currentStatus={booking.status}
          customerName="Kunde" 
          serviceName={services[0]?.title || "Booking"}
          isOpen={isStatusDialogOpen}
          onOpenChange={setIsStatusDialogOpen}
        />
      )}
    </Card>
  );
}
