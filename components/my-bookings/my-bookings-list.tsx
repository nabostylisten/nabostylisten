"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { getUserBookings } from "@/server/booking.actions";
import { BookingCard } from "./booking-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarX, Search } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useState, useEffect } from "react";
import { searchParamsToBookingFilters } from "@/types";

interface MyBookingsListProps {
  userId: string;
  dateRange: "upcoming" | "completed" | "all";
}

export function MyBookingsList({ userId, dateRange }: MyBookingsListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const filters = searchParamsToBookingFilters(
    {
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      sort: searchParams.get("sort") || undefined,
    },
    dateRange,
    currentPage,
    4
  );

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.status, dateRange, filters.sortBy]);

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
  const total = bookingsResponse?.total || 0;
  const totalPages = bookingsResponse?.totalPages || 0;
  const hasSearch = filters.search?.trim();

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPaginationItems = () => {
    const items = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(i);
              }}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Show ellipsis for many pages
      if (currentPage <= 4) {
        // Show 1,2,3,4,5...last
        for (let i = 1; i <= 5; i++) {
          items.push(
            <PaginationItem key={i}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(i);
                }}
                isActive={currentPage === i}
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
        items.push(
          <PaginationItem key="ellipsis">
            <PaginationEllipsis />
          </PaginationItem>
        );
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(totalPages);
              }}
              isActive={currentPage === totalPages}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      } else if (currentPage >= totalPages - 3) {
        // Show first...second-to-last,last-1,last
        items.push(
          <PaginationItem key={1}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(1);
              }}
              isActive={currentPage === 1}
            >
              1
            </PaginationLink>
          </PaginationItem>
        );
        items.push(
          <PaginationItem key="ellipsis">
            <PaginationEllipsis />
          </PaginationItem>
        );
        for (let i = totalPages - 4; i <= totalPages; i++) {
          items.push(
            <PaginationItem key={i}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(i);
                }}
                isActive={currentPage === i}
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      } else {
        // Show first...current-1,current,current+1...last
        items.push(
          <PaginationItem key={1}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(1);
              }}
              isActive={currentPage === 1}
            >
              1
            </PaginationLink>
          </PaginationItem>
        );
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push(
            <PaginationItem key={i}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(i);
                }}
                isActive={currentPage === i}
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(totalPages);
              }}
              isActive={currentPage === totalPages}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center py-12">
          {hasSearch ? (
            <div className="space-y-3">
              <Search className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-medium">Ingen treff</h3>
              <p className="text-muted-foreground">
                Vi fant ingen bookinger som matcher søket ditt "{filters.search}
                ".
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <CalendarX className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-medium">
                {dateRange === "upcoming"
                  ? "Ingen kommende bookinger"
                  : "Ingen tidligere bookinger"}
              </h3>
              <p className="text-muted-foreground">
                {dateRange === "upcoming"
                  ? "Du har ingen bookinger som er planlagt."
                  : "Du har ingen bookinger som er fullført eller avlyst."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </div>

      {/* Pagination - only show if more than 4 bookings total */}
      {total > 4 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) {
                      handlePageChange(currentPage - 1);
                    }
                  }}
                  className={
                    currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) {
                      handlePageChange(currentPage + 1);
                    }
                  }}
                  className={
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
