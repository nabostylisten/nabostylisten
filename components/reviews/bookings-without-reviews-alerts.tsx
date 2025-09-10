"use client";

import { useQuery } from "@tanstack/react-query";
import { getCompletedBookingsWithoutReviews } from "@/server/review.actions";
import { ReviewReminderAlert } from "./review-reminder-alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface BookingsWithoutReviewsAlertsProps {
  userId: string;
  userRole?: "customer" | "stylist" | "admin";
  className?: string;
}

export function BookingsWithoutReviewsAlerts({
  userId,
  userRole = "customer",
  className,
}: BookingsWithoutReviewsAlertsProps) {
  const {
    data: bookings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["completedBookingsWithoutReviews", userId, userRole],
    queryFn: async () => {
      const result = await getCompletedBookingsWithoutReviews(userId, userRole);
      if (result.error) {
        throw new Error(
          typeof result.error === "string" ? result.error : result.error.message
        );
      }
      return result.data || [];
    },
  });

  if (error || !bookings || bookings.length === 0 || isLoading) {
    return null;
  }

  return (
    <div className={cn("max-w-6xl mx-auto w-full", className)}>
      <ScrollArea className="h-48">
        <div className="space-y-4">
          {bookings.map((booking) => {
            const serviceTitles =
              booking.booking_services
                ?.map((bs) => bs.services?.title)
                .filter(Boolean) || [];

            // Since we're always showing bookings where the current user was the customer,
            // we should always show the stylist's name (the person they can review)
            const displayName = booking.stylist?.full_name || "Stylisten";

            return (
              <ReviewReminderAlert
                key={booking.id}
                bookingId={booking.id}
                stylistName={displayName}
                serviceTitles={serviceTitles}
                bookingDate={booking.start_time}
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
