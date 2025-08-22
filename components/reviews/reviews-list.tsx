"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ReviewCard } from "./review-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getStylistReviews, getCustomerReviews } from "@/server/review.actions";
import { Search, Star, Filter } from "lucide-react";

interface ReviewsListProps {
  userId: string;
  viewType: "customer" | "stylist"; // customer viewing their own reviews, stylist viewing reviews about them
  showFilters?: boolean;
}

export function ReviewsList({ 
  userId, 
  viewType, 
  showFilters = true 
}: ReviewsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 6;

  const { data, isLoading, error } = useQuery({
    queryKey: ["reviews", userId, viewType, currentPage, searchTerm, ratingFilter, sortBy],
    queryFn: async () => {
      if (viewType === "stylist") {
        return await getStylistReviews(userId, { page: currentPage, limit });
      } else {
        return await getCustomerReviews(userId, { page: currentPage, limit });
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleRatingFilterChange = (value: string) => {
    setRatingFilter(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  // Filter and sort results on client side for better UX
  let filteredReviews = data?.data || [];

  if (searchTerm) {
    filteredReviews = filteredReviews.filter((review) =>
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (viewType === "customer" ? review.stylist?.full_name : review.customer?.full_name)
        ?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (ratingFilter !== "all") {
    const targetRating = parseInt(ratingFilter);
    filteredReviews = filteredReviews.filter((review) => review.rating === targetRating);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Kunne ikke laste anmeldelser. Prøv igjen senere.
        </p>
      </div>
    );
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <div className="text-center py-12">
        <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Ingen anmeldelser ennå</h3>
        <p className="text-muted-foreground">
          {viewType === "stylist"
            ? "Du har ikke mottatt noen anmeldelser ennå."
            : "Du har ikke skrevet noen anmeldelser ennå."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">
            {viewType === "stylist" ? "Mine anmeldelser" : "Anmeldelser jeg har skrevet"}
          </h2>
          <Badge variant="secondary">
            {data.total} total
          </Badge>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={`Søk i ${viewType === "stylist" ? "anmeldelser..." : "mine anmeldelser..."}`}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Rating filter */}
          <Select value={ratingFilter} onValueChange={handleRatingFilterChange}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Alle vurderinger" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle vurderinger</SelectItem>
              <SelectItem value="5">5 stjerner</SelectItem>
              <SelectItem value="4">4 stjerner</SelectItem>
              <SelectItem value="3">3 stjerner</SelectItem>
              <SelectItem value="2">2 stjerner</SelectItem>
              <SelectItem value="1">1 stjerne</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sorter etter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Nyeste først</SelectItem>
              <SelectItem value="oldest">Eldste først</SelectItem>
              <SelectItem value="highest">Høyest vurdering</SelectItem>
              <SelectItem value="lowest">Lavest vurdering</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Reviews */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            viewType={viewType}
          />
        ))}
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              {data.currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(data.currentPage - 1);
                    }}
                  />
                </PaginationItem>
              )}

              {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show current page, first page, last page, and pages around current
                  const current = data.currentPage;
                  return (
                    page === 1 ||
                    page === data.totalPages ||
                    (page >= current - 1 && page <= current + 1)
                  );
                })
                .map((page, index, array) => {
                  // Add ellipsis if there's a gap
                  const prevPage = array[index - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;

                  return (
                    <div key={page} className="flex items-center">
                      {showEllipsis && (
                        <PaginationItem>
                          <span className="px-3 py-2">...</span>
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          isActive={page === data.currentPage}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    </div>
                  );
                })}

              {data.currentPage < data.totalPages && (
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(data.currentPage + 1);
                    }}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}