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
  CreditCard,
  ChevronRight,
  Star,
  Edit,
  TestTube,
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
import {
  BookingPricingDisplay,
  DiscountInfoDisplay,
} from "@/lib/booking-pricing-display";

// Infer the booking type from the server action return type
type GetUserBookingsResult = Awaited<ReturnType<typeof getUserBookings>>;
type BookingWithDetails = NonNullable<GetUserBookingsResult["data"]>[number];

interface BookingCardProps {
  booking: BookingWithDetails;
  userRole?: "customer" | "stylist";
  currentUserId: string;
}

export function BookingCard({
  booking,
  userRole = "customer",
  currentUserId,
}: BookingCardProps) {
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  const startTime = new Date(booking.start_time);
  const endTime = new Date(booking.end_time);
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
    queryFn: () => (booking.address_id ? getAddress(booking.address_id) : null),
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
            className="text-yellow-600 border-yellow-200 dark:text-yellow-400 dark:border-yellow-800"
          >
            Venter
          </Badge>
        );
      case "confirmed":
        return (
          <Badge
            variant="outline"
            className="text-green-600 border-green-200 dark:text-green-400 dark:border-green-800"
          >
            Bekreftet
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            variant="outline"
            className="text-red-600 border-red-200 dark:text-red-400 dark:border-red-800"
          >
            Avlyst
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800"
          >
            Fullført
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-lg break-words">
                  {services.length > 0 ? services[0]?.title : "Booking"}
                  {services.length > 1 && ` +${services.length - 1} til`}
                </h3>
                {hasChat && (
                  <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate">
                  {booking.stylist?.full_name || "Ukjent stylist"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
              {booking.is_trial_session && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 text-purple-600 bg-purple-50/30 border-purple-200 dark:text-purple-400 dark:bg-purple-900/30 dark:border-purple-800"
                >
                  <TestTube className="w-4 h-4" />
                  <span className="hidden xs:inline">Prøvetime</span>
                  <span className="xs:hidden">Prøve</span>
                </Badge>
              )}
              {!booking.is_trial_session && booking.trial_booking_id && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 text-blue-600 bg-blue-50/30 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800"
                >
                  <TestTube className="w-4 h-4" />
                  <span className="hidden xs:inline">Har prøvetime</span>
                  <span className="xs:hidden">Prøve</span>
                </Badge>
              )}
              {getStatusBadge(booking.status)}
            </div>
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>
                {(() => {
                  try {
                    return format(startTime, "EEEE d. MMMM yyyy", {
                      locale: nb,
                    });
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

          {/* Trial Session Info */}
          {booking.trial_booking &&
            Array.isArray(booking.trial_booking) &&
            booking.trial_booking.length > 0 && (
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 text-sm text-purple-800 font-medium mb-1">
                  <Star className="w-4 h-4" />
                  <span>Prøveseksjon planlagt</span>
                </div>
                <div className="text-sm text-purple-700">
                  {(() => {
                    try {
                      return format(
                        new Date(booking.trial_booking[0].start_time),
                        "EEEE d. MMMM yyyy 'kl.' HH:mm",
                        { locale: nb }
                      );
                    } catch (error) {
                      return "Ugyldig dato";
                    }
                  })()}
                </div>
                <Link
                  href={`/bookinger/${booking.trial_booking[0].id}`}
                  className="text-xs text-purple-600 hover:text-purple-800 underline mt-1 inline-block"
                >
                  Se prøveseksjon detaljer
                </Link>
              </div>
            )}

          {/* Main Booking Link for Trial Sessions */}
          {booking.is_trial_session &&
            booking.main_booking &&
            Array.isArray(booking.main_booking) &&
            booking.main_booking.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-sm text-blue-800 font-medium mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Hovedseksjon planlagt</span>
                </div>
                <div className="text-sm text-blue-700">
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
                  className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
                >
                  Se hovedseksjon detaljer
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
                    <p>
                      {address.postal_code} {address.city}
                    </p>
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

          {/* Discount Applied */}
          {booking.discount && booking.discount_applied > 0 && (
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
              <DiscountInfoDisplay
                booking={{
                  total_price: booking.total_price,
                  discount_applied: booking.discount_applied,
                  is_trial_session: booking.is_trial_session,
                }}
                payment={
                  Array.isArray(booking.payments)
                    ? booking.payments[0]
                    : booking.payments
                }
                discount={booking.discount}
              />
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-2 border-t">
            <div className="text-lg font-semibold">
              <BookingPricingDisplay
                booking={{
                  total_price: booking.total_price,
                  discount_applied: booking.discount_applied,
                  is_trial_session: booking.is_trial_session,
                }}
                payment={
                  Array.isArray(booking.payments)
                    ? booking.payments[0]
                    : booking.payments
                }
                discount={booking.discount}
                options={{ showDiscountCode: false }}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {/* Review button for completed bookings (customers only) */}
              {userRole === "customer" && booking.status === "completed" && (
                <Button
                  variant={existingReview ? "outline" : "default"}
                  size="sm"
                  onClick={() => setIsReviewDialogOpen(true)}
                  className="w-full sm:w-auto"
                >
                  {existingReview ? (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      <span className="hidden xs:inline">Endre anmeldelse</span>
                      <span className="xs:hidden">Endre</span>
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 mr-2" />
                      <span className="hidden xs:inline">Gi anmeldelse</span>
                      <span className="xs:hidden">Anmeld</span>
                    </>
                  )}
                </Button>
              )}
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Actions dropdown for both customers and stylists */}
                <BookingActionsDropdown
                  booking={booking}
                  currentUserId={currentUserId}
                  userRole={userRole}
                  serviceName={services[0]?.title || "Booking"}
                  customerName={booking.customer?.full_name || "Kunde"}
                  onStatusDialogOpen={() => setIsStatusDialogOpen(true)}
                />
                <Link
                  href={`/bookinger/${booking.id}`}
                  className={cn(
                    buttonVariants({
                      variant: "outline",
                      size: "sm",
                    }),
                    "flex items-center gap-2 flex-1 sm:flex-initial justify-center"
                  )}
                >
                  <span className="hidden xs:inline">Se detaljer</span>
                  <span className="xs:hidden">Detaljer</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Status Dialog for Stylists */}
      {userRole === "stylist" && (
        <BookingStatusDialog
          bookingId={booking.id}
          currentStatus={booking.status}
          customerName={booking.customer?.full_name || "Kunde"}
          serviceName={services[0]?.title || "Booking"}
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
