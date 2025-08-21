"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { getUserBookings } from "@/server/booking.actions";
import { BookingCard } from "./booking-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarX, Search } from "lucide-react";

interface MyBookingsListProps {
  userId: string;
  dateRange: 'upcoming' | 'completed' | 'all';
}

export function MyBookingsList({ userId, dateRange }: MyBookingsListProps) {
  const searchParams = useSearchParams();
  
  const filters = {
    search: searchParams.get("search") || undefined,
    status: (searchParams.get("status") as any) || undefined,
    dateRange,
    sortBy: (searchParams.get("sort") as any) || "date_desc",
  };

  const {
    data: bookingsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user-bookings", userId, filters],
    queryFn: () => getUserBookings(userId, filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="flex flex-col sm:flex-row gap-4 text-sm">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-red-500 mb-2">Feil ved lasting av bookinger</div>
          <p className="text-sm text-muted-foreground">
            Prøv å laste siden på nytt
          </p>
        </CardContent>
      </Card>
    );
  }

  const bookings = bookingsResponse?.data || [];
  const hasSearch = filters.search?.trim();

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center py-12">
          {hasSearch ? (
            <div className="space-y-3">
              <Search className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-medium">Ingen treff</h3>
              <p className="text-muted-foreground">
                Vi fant ingen bookinger som matcher søket ditt "{filters.search}".
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <CalendarX className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-medium">
                {dateRange === 'upcoming' 
                  ? 'Ingen kommende bookinger' 
                  : 'Ingen tidligere bookinger'
                }
              </h3>
              <p className="text-muted-foreground">
                {dateRange === 'upcoming' 
                  ? 'Du har ingen bookinger som er planlagt.' 
                  : 'Du har ingen bookinger som er fullført eller avlyst.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
        />
      ))}
    </div>
  );
}