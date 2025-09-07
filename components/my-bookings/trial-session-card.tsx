"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  MessageSquare,
  ChevronRight,
  Star,
  Edit,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getReviewByBookingId } from "@/server/review.actions";
import { getAddress } from "@/server/addresses.actions";
import type { getUserBookings } from "@/server/booking/crud.actions";
import { BookingStatusDialog } from "./booking-status-dialog";
import { BookingActionsDropdown } from "./booking-actions-dropdown";
import { ReviewDialog } from "@/components/reviews/review-dialog";
import { cn } from "@/lib/utils";
import { BookingPricingDisplay } from "@/lib/booking-pricing-display";

// Infer the booking type from the server action return type
type GetUserBookingsResult = Awaited<ReturnType<typeof getUserBookings>>;
type TrialSessionWithDetails = NonNullable<
  GetUserBookingsResult["data"]
>[number];

interface TrialSessionCardProps {
  booking: TrialSessionWithDetails;
  userRole?: "customer" | "stylist";
  currentUserId: string;
}

export function TrialSessionCard({
  booking,
  userRole = "customer",
  currentUserId,
}: TrialSessionCardProps) {
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  // Safe date parsing with error handling
  const startTime = (() => {
    try {
      return new Date(booking.start_time);
    } catch {
      return new Date(); // fallback to current date
    }
  })();
  const endTime = (() => {
    try {
      return new Date(booking.end_time);
    } catch {
      return new Date(); // fallback to current date
    }
  })();
  const services =
    booking.booking_services?.map((bs) => bs.service).filter(Boolean) || [];
  const hasChat = booking.chats && booking.chats.id;

  // Check if there's an existing review for this booking
  const { data: reviewResponse } = useQuery({
    queryKey: ["review", booking.id],
    queryFn: () => getReviewByBookingId(booking.id),
    enabled: booking.status === "completed" && userRole === "customer",
  });

  // Fetch address details if booking has an address_id
  const { data: addressData, isLoading: addressLoading } = useQuery({
    queryKey: ["address", booking.address_id],
    queryFn: () => booking.address_id ? getAddress(booking.address_id) : null,
    enabled: !!booking.address_id,
  });

  const existingReview = reviewResponse?.data;
  const address = addressData?.data;

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

  return (
    <Card className="hover:shadow-md transition-shadow border-purple-200 bg-purple-50/30 dark:border-purple-800 dark:bg-purple-900/30">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-lg text-purple-800 dark:text-purple-200">
                  Prøvetime:{" "}
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
              <Badge
                variant="outline"
                className="text-purple-600 border-purple-200 dark:text-purple-400 dark:border-purple-800"
              >
                Prøvetime
              </Badge>
              {getStatusBadge(booking.status)}
            </div>
          </div>

          {/* Trial Session Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>
                {(() => {
                  try {
                    return format(startTime, "EEEE d. MMMM yyyy", { locale: nb });
                  } catch (error) {
                    return "Ugyldig dato";
                  }
                })()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>
                {(() => {
                  try {
                    return `${format(startTime, "HH:mm")} - ${format(endTime, "HH:mm")}`;
                  } catch (error) {
                    return "Ugyldig tid";
                  }
                })()}
                <span className="text-muted-foreground ml-1">
                  ({booking.total_duration_minutes} min)
                </span>
              </span>
            </div>
          </div>

          {/* Main Booking Link */}
          {booking.main_booking && Array.isArray(booking.main_booking) && booking.main_booking.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800">
              <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
                <Calendar className="w-4 h-4" />
                <span>Hovedseksjon planlagt</span>
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                {(() => {
                  try {
                    return format(
                      new Date(booking.main_booking[0].start_time),
                      "EEEE d. MMMM yyyy 'kl.' HH:mm",
                      { locale: nb }
                    );
                  } catch (error) {
                    return "Ugyldig dato";
                  }
                })()}
              </div>
              <Link
                href={`/bookinger/${booking.main_booking[0].id}`}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline mt-1 inline-flex items-center gap-1"
              >
                Se hovedseksjon detaljer
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

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

          {/* Discount Applied - Not applicable for trial sessions */}

          {/* Footer */}
          <div className="flex justify-between items-center pt-2 border-t">
            <div className="text-lg font-semibold">
              <BookingPricingDisplay
                booking={{
                  total_price: booking.total_price,
                  discount_applied: booking.discount_applied || 0,
                  is_trial_session: true,
                }}
                payment={Array.isArray(booking.payments) ? booking.payments[0] : booking.payments}
                discount={booking.discount}
                options={{ showDiscountCode: false, isTrialSession: true }}
              />
            </div>
            <div className="flex gap-2">
              {/* Actions dropdown for both customers and stylists */}
              <BookingActionsDropdown
                booking={{
                  id: booking.id,
                  customer_id: booking.customer_id,
                  stylist_id: booking.stylist_id,
                  start_time: booking.start_time,
                  total_price: booking.total_price,
                  status: booking.status,
                }}
                currentUserId={currentUserId}
                userRole={userRole}
                serviceName={services[0]?.title || "Prøveseksjon"}
                onStatusDialogOpen={() => setIsStatusDialogOpen(true)}
              />
              {/* Review button for completed bookings (customers only) */}
              {userRole === "customer" && booking.status === "completed" && (
                <Button
                  variant={existingReview ? "outline" : "default"}
                  size="sm"
                  onClick={() => setIsReviewDialogOpen(true)}
                >
                  {existingReview ? (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Endre anmeldelse
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 mr-2" />
                      Gi anmeldelse
                    </>
                  )}
                </Button>
              )}
              <Link
                href={`/bookinger/${booking.id}`}
                className={cn(
                  buttonVariants({
                    variant: "outline",
                    size: "sm",
                  }),
                  "flex items-center gap-2"
                )}
              >
                Se detaljer
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Status Dialog for Stylists */}
      {userRole === "stylist" && (
        <BookingStatusDialog
          bookingId={booking.id}
          currentStatus={booking.status}
          customerName="Kunde"
          serviceName={services[0]?.title || "Prøveseksjon"}
          isOpen={isStatusDialogOpen}
          onOpenChange={setIsStatusDialogOpen}
        />
      )}

      {/* Review Dialog for Customers */}
      {userRole === "customer" && booking.status === "completed" && (
        <ReviewDialog
          open={isReviewDialogOpen}
          onOpenChange={setIsReviewDialogOpen}
          bookingId={booking.id}
          stylistName={booking.stylist?.full_name || "Stylisten"}
          serviceTitles={services.map((s) => s?.title || "Tjeneste")}
          existingReview={existingReview}
        />
      )}
    </Card>
  );
}
