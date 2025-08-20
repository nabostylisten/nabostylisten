"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Filter } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ServiceFilters } from "@/types";

interface ServiceSearchFormProps {
  categories?: Array<{
    id: string;
    name: string;
    service_count: number;
  }>;
}

export function ServiceSearchForm({ categories = [] }: ServiceSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );
  const [sortBy, setSortBy] = useState<ServiceFilters["sortBy"]>(
    (searchParams.get("sort") as ServiceFilters["sortBy"]) || "newest"
  );

  const handleSearch = () => {
    startTransition(() => {
      const params = new URLSearchParams();

      if (search.trim()) params.set("search", search.trim());
      if (location.trim()) params.set("location", location.trim());
      if (selectedCategory && selectedCategory !== "all")
        params.set("category", selectedCategory);
      if (sortBy !== "newest" && sortBy) params.set("sort", sortBy);

      const queryString = params.toString();
      router.push(queryString ? `/tjenester?${queryString}` : "/tjenester");
    });
  };

  const handleClearFilters = () => {
    startTransition(() => {
      setSearch("");
      setLocation("");
      setSelectedCategory("all");
      setSortBy("newest");
      router.push("/tjenester");
    });
  };

  const hasActiveFilters =
    search ||
    location ||
    (selectedCategory && selectedCategory !== "all") ||
    sortBy !== "newest";

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Search and Location Row */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk etter tjeneste eller stylist..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hvor? (f.eks Oslo, Bergen)"
              className="pl-10"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle kategorier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle kategorier</SelectItem>
                {categories
                  .filter((cat) => cat.service_count > 0)
                  .map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name} ({category.service_count})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select
              value={sortBy}
              onValueChange={(value) =>
                setSortBy(value as ServiceFilters["sortBy"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sorter etter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Nyeste først</SelectItem>
                <SelectItem value="price_asc">Lavest pris først</SelectItem>
                <SelectItem value="price_desc">Høyest pris først</SelectItem>
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
              Nullstill
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              Aktive filtre:
              {search && <span className="ml-1 font-medium">"{search}"</span>}
              {location && (
                <span className="ml-1 font-medium">i {location}</span>
              )}
              {selectedCategory &&
                selectedCategory !== "all" &&
                categories.find((c) => c.id === selectedCategory) && (
                  <span className="ml-1 font-medium">
                    - {categories.find((c) => c.id === selectedCategory)?.name}
                  </span>
                )}
              {sortBy !== "newest" && (
                <span className="ml-1 font-medium">
                  -{" "}
                  {sortBy === "price_asc"
                    ? "Lavest pris"
                    : sortBy === "price_desc"
                      ? "Høyest pris"
                      : sortBy}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
