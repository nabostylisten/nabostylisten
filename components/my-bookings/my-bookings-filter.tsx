"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BookingFilters } from "@/types";

export function MyBookingsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState<BookingFilters["sortBy"]>(
    (searchParams.get("sort") as BookingFilters["sortBy"]) || "date_desc"
  );

  const handleSearch = () => {
    startTransition(() => {
      const params = new URLSearchParams();

      if (search.trim()) params.set("search", search.trim());
      if (sortBy !== "date_desc" && sortBy) params.set("sort", sortBy);

      const queryString = params.toString();
      router.push(queryString ? `?${queryString}` : window.location.pathname);
    });
  };

  const handleClearFilters = () => {
    startTransition(() => {
      setSearch("");
      setSortBy("date_desc");
      router.push(window.location.pathname);
    });
  };


  const hasActiveFilters =
    search ||
    sortBy !== "date_desc";


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