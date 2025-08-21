"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Filter, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface BookingFilters {
  search?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  sortBy?: 'date_asc' | 'date_desc' | 'newest' | 'price_asc' | 'price_desc';
}

export function MyBookingsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedStatus, setSelectedStatus] = useState(
    searchParams.get("status") as BookingFilters["status"] || undefined
  );
  const [sortBy, setSortBy] = useState<BookingFilters["sortBy"]>(
    (searchParams.get("sort") as BookingFilters["sortBy"]) || "date_desc"
  );

  const handleSearch = () => {
    startTransition(() => {
      const params = new URLSearchParams();

      if (search.trim()) params.set("search", search.trim());
      if (selectedStatus) params.set("status", selectedStatus);
      if (sortBy !== "date_desc" && sortBy) params.set("sort", sortBy);

      const queryString = params.toString();
      router.push(queryString ? `?${queryString}` : window.location.pathname);
    });
  };

  const handleClearFilters = () => {
    startTransition(() => {
      setSearch("");
      setSelectedStatus(undefined);
      setSortBy("date_desc");
      router.push(window.location.pathname);
    });
  };

  const handleRemoveStatus = () => {
    setSelectedStatus(undefined);
    const params = new URLSearchParams(searchParams);
    params.delete("status");
    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : window.location.pathname);
  };

  const hasActiveFilters =
    search ||
    selectedStatus ||
    sortBy !== "date_desc";

  const statusLabels = {
    pending: "Venter",
    confirmed: "Bekreftet", 
    cancelled: "Avlyst",
    completed: "Fullført"
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Search and Sort Row */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk i bookinger, tjenester eller stylister..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex-1">
            <Select
              value={selectedStatus || "all"}
              onValueChange={(value) => setSelectedStatus(value === "all" ? undefined : value as BookingFilters["status"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle statuser" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statuser</SelectItem>
                <SelectItem value="pending">Venter</SelectItem>
                <SelectItem value="confirmed">Bekreftet</SelectItem>
                <SelectItem value="cancelled">Avlyst</SelectItem>
                <SelectItem value="completed">Fullført</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div className="flex-1">
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as BookingFilters["sortBy"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sorter etter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Nyeste dato først</SelectItem>
                <SelectItem value="date_asc">Eldste dato først</SelectItem>
                <SelectItem value="newest">Nyest opprettet</SelectItem>
                <SelectItem value="price_desc">Høyest pris først</SelectItem>
                <SelectItem value="price_asc">Lavest pris først</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedStatus) && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">
              Aktive filtre:
            </span>
            {selectedStatus && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1"
              >
                Status: {statusLabels[selectedStatus]}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={handleRemoveStatus}
                />
              </Badge>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleSearch}
            className="flex-1 gap-2"
            disabled={isPending}
          >
            <Search className="w-4 h-4" />
            {isPending ? "Søker..." : "Søk"}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={isPending}
              className="sm:w-auto"
            >
              <Filter className="w-4 h-4 mr-2" />
              Nullstill filtre
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}