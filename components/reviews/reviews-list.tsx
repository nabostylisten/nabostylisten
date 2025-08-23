"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedState } from "@mantine/hooks";
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
import {
  getStylistReviews,
  getCustomerReviews,
  getReviewers,
} from "@/server/review.actions";
import {
  Search,
  Star,
  Filter,
  X,
  Users,
  Check,
  ChevronsUpDown,
  ChevronRight,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ReviewFilters } from "@/types";

interface ReviewsListProps {
  userId: string;
  viewType: "customer" | "stylist"; // customer viewing their own reviews, stylist viewing reviews about them
  showFilters?: boolean;
}

export function ReviewsList({
  userId,
  viewType,
  showFilters = true,
}: ReviewsListProps) {
  const limit = 6;

  // Local filter state
  const [filters, setFilters] = useState<ReviewFilters>({
    search: "",
    rating: undefined,
    reviewerIds: [],
    sortBy: "newest",
    page: 1,
    limit,
  });

  // Debounced search state
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useDebouncedState("", 250);

  // Popover state
  const [reviewerPopoverOpen, setReviewerPopoverOpen] = useState(false);

  // Update filters when debounced search changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: debouncedSearch || undefined,
      page: 1,
    }));
  }, [debouncedSearch]);

  const updateFilters = (newFilters: Partial<ReviewFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  // Query with proper filters
  const { data, isLoading, error } = useQuery({
    queryKey: ["reviews", userId, viewType, filters],
    queryFn: async () => {
      if (viewType === "stylist") {
        return await getStylistReviews(userId, filters);
      } else {
        return await getCustomerReviews(userId, filters);
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Query reviewers for combobox
  const { data: reviewers } = useQuery({
    queryKey: ["reviewers", userId, viewType],
    queryFn: async () => {
      const result = await getReviewers(userId, viewType);
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setDebouncedSearch(value);
  };

  const handleRatingFilterChange = (value: string) => {
    const rating = value === "all" ? undefined : parseInt(value);
    updateFilters({ rating, page: 1 });
  };

  const handleSortChange = (value: string) => {
    updateFilters({ sortBy: value as ReviewFilters["sortBy"], page: 1 });
  };

  const handleReviewerToggle = (reviewerId: string) => {
    const currentIds = filters.reviewerIds || [];
    const newIds = currentIds.includes(reviewerId)
      ? currentIds.filter((id) => id !== reviewerId)
      : [...currentIds, reviewerId];

    updateFilters({
      reviewerIds: newIds.length > 0 ? newIds : undefined,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setFilters({
      search: "",
      rating: undefined,
      reviewerIds: [],
      sortBy: "newest",
      page: 1,
      limit,
    });
  };

  const hasActiveFilters =
    (filters.search && filters.search.length > 0) ||
    filters.rating ||
    (filters.reviewerIds && filters.reviewerIds.length > 0) ||
    (filters.sortBy && filters.sortBy !== "newest");

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Kunne ikke laste anmeldelser. Prøv igjen senere.
        </p>
      </div>
    );
  }

  const isEmpty = !data?.data || data.data.length === 0;

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">
            {viewType === "stylist"
              ? "Mine anmeldelser"
              : "Anmeldelser jeg har skrevet"}
          </h2>

          {data?.total ? (
            <Badge variant="secondary">{data.total} totalt</Badge>
          ) : null}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={`Søk i ${viewType === "stylist" ? "anmeldelser..." : "mine anmeldelser..."}`}
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Rating filter */}
            <Select
              value={filters.rating?.toString() || "all"}
              onValueChange={handleRatingFilterChange}
            >
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

            {/* Reviewer Filter */}
            <Popover
              open={reviewerPopoverOpen}
              onOpenChange={setReviewerPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={reviewerPopoverOpen}
                  className="w-full sm:w-48 justify-between"
                >
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    {filters.reviewerIds && filters.reviewerIds.length > 0
                      ? `${filters.reviewerIds.length} valgt`
                      : viewType === "stylist"
                        ? "Velg kunder..."
                        : "Velg stylister..."}
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder={`Søk ${viewType === "stylist" ? "kunder" : "stylister"}...`}
                  />
                  <CommandList>
                    {!reviewers || reviewers.length === 0 ? (
                      <CommandEmpty>
                        Ingen {viewType === "stylist" ? "kunder" : "stylister"}{" "}
                        funnet.
                      </CommandEmpty>
                    ) : (
                      <>
                        <CommandEmpty>
                          Ingen{" "}
                          {viewType === "stylist" ? "kunder" : "stylister"}{" "}
                          funnet.
                        </CommandEmpty>
                        <CommandGroup>
                          <ScrollArea className="h-40">
                            {reviewers.map((reviewer) => {
                              const isSelected =
                                filters.reviewerIds?.includes(reviewer.value) ||
                                false;
                              return (
                                <CommandItem
                                  key={reviewer.value}
                                  value={reviewer.value}
                                  onSelect={() =>
                                    handleReviewerToggle(reviewer.value)
                                  }
                                >
                                  {isSelected ? (
                                    <Check className={cn("mr-2 h-4 w-4")} />
                                  ) : (
                                    <ChevronRight className="mr-2 h-4 w-4" />
                                  )}
                                  {reviewer.label}
                                </CommandItem>
                              );
                            })}
                          </ScrollArea>
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              updateFilters({ reviewerIds: [], page: 1 });
                              setReviewerPopoverOpen(false);
                            }}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Fjern alle valgte
                          </CommandItem>
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Sort */}
            <Select
              value={filters.sortBy || "newest"}
              onValueChange={handleSortChange}
            >
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

          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Aktive filtre:
              </span>
              {filters.search && filters.search.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Søk: {filters.search}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleSearchChange("")}
                  />
                </Badge>
              )}
              {filters.rating && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {filters.rating} stjerner
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() =>
                      updateFilters({ rating: undefined, page: 1 })
                    }
                  />
                </Badge>
              )}
              {filters.reviewerIds && filters.reviewerIds.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {filters.reviewerIds.length === 1
                    ? reviewers?.find(
                        (r) => r.value === filters.reviewerIds?.[0]
                      )?.label || "Valgt person"
                    : `${filters.reviewerIds.length} ${viewType === "stylist" ? "kunder" : "stylister"}`}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilters({ reviewerIds: [], page: 1 })}
                  />
                </Badge>
              )}
              {filters.sortBy && filters.sortBy !== "newest" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {filters.sortBy === "oldest"
                    ? "Eldste først"
                    : filters.sortBy === "highest"
                      ? "Høyest vurdering"
                      : filters.sortBy === "lowest"
                        ? "Lavest vurdering"
                        : filters.sortBy}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilters({ sortBy: "newest", page: 1 })}
                  />
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                disabled={false}
              >
                <X className="w-4 h-4 mr-2" />
                Nullstill alle
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Reviews, Loading, or Empty State */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="text-center py-12">
          <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {hasActiveFilters
              ? "Ingen anmeldelser funnet"
              : "Ingen anmeldelser ennå"}
          </h3>
          <p className="text-muted-foreground">
            {hasActiveFilters
              ? "Prøv å justere filtrene dine for å se flere resultater."
              : viewType === "stylist"
                ? "Du har ikke mottatt noen anmeldelser ennå."
                : "Du har ikke skrevet noen anmeldelser ennå."}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="mt-4"
            >
              <X className="w-4 h-4 mr-2" />
              Nullstill filtre
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {data.data.map((review) => (
            <ReviewCard key={review.id} review={review} viewType={viewType} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !isEmpty && data.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              {(filters.page || 1) > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange((filters.page || 1) - 1);
                    }}
                  />
                </PaginationItem>
              )}

              {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show current page, first page, last page, and pages around current
                  const current = filters.page || 1;
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
                          isActive={page === (filters.page || 1)}
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

              {(filters.page || 1) < data.totalPages && (
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange((filters.page || 1) + 1);
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
