"use client";

import { useQuery } from "@tanstack/react-query";
import { getCompletedBookingsWithoutReviews } from "@/server/review.actions";
import { ReviewReminderAlert } from "./review-reminder-alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface BookingsWithoutReviewsAlertsProps {
  customerId: string;
  className?: string;
}

export function BookingsWithoutReviewsAlerts({
  customerId,
  className,
}: BookingsWithoutReviewsAlertsProps) {
  const {
    data: bookings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["completedBookingsWithoutReviews", customerId],
    queryFn: async () => {
      const result = await getCompletedBookingsWithoutReviews(customerId);
      if (result.error) {
        throw new Error(
          typeof result.error === "string" ? result.error : result.error.message
        );
      }
      return result.data || [];
    },
  });

  if (isLoading) {
    return (
      <div className={className}>
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error || !bookings || bookings.length === 0) {
    return null;
  }

  return (
    <div className={cn("max-w-6xl mx-auto w-full", className)}>
      <div className="space-y-4">
        {bookings.map((booking) => {
          const serviceTitles =
            booking.booking_services
              ?.map((bs) => bs.services?.title)
              .filter(Boolean) || [];

          return (
            <ReviewReminderAlert
              key={booking.id}
              bookingId={booking.id}
              stylistName={booking.stylist?.full_name || "Stylisten"}
              serviceTitles={serviceTitles}
              bookingDate={booking.start_time}
            />
          );
        })}
      </div>
    </div>
  );
}
