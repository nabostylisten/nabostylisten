"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AddressInput } from "@/components/ui/address-input";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Users } from "lucide-react";
import type { ServiceFilters } from "@/types";

interface ServiceFilterFormProps {
  categories?: Array<{
    id: string;
    name: string;
    service_count: number;
  }>;
  stylists?: Array<{
    id: string;
    full_name: string | null;
  }>;
  mode?: "redirect" | "update"; // redirect to /tjenester or update current URL
}

export function ServiceFilterForm({
  categories = [],
  stylists = [],
  mode = "update",
}: ServiceFilterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );
  const [selectedStylists, setSelectedStylists] = useState<string[]>(
    searchParams.get("stylists") ? searchParams.get("stylists")!.split(",") : []
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
      if (selectedStylists.length > 0)
        params.set("stylists", selectedStylists.join(","));
      if (sortBy !== "newest" && sortBy) params.set("sort", sortBy);

      const queryString = params.toString();

      if (mode === "redirect") {
        router.push(queryString ? `/tjenester?${queryString}` : "/tjenester");
      } else {
        router.push(queryString ? `?${queryString}` : "/tjenester");
      }
    });
  };

  const handleClearFilters = () => {
    startTransition(() => {
      setSearch("");
      setLocation("");
      setSelectedCategory("all");
      setSelectedStylists([]);
      setSortBy("newest");

      if (mode === "redirect") {
        router.push("/tjenester");
      } else {
        router.push("/tjenester");
      }
    });
  };

  const hasActiveFilters =
    search ||
    location ||
    (selectedCategory && selectedCategory !== "all") ||
    selectedStylists.length > 0 ||
    sortBy !== "newest";

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Search and Location Row */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk etter tjeneste eller kategori..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="flex-1">
            <AddressInput
              value={location}
              onChange={setLocation}
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Users className="mr-2 h-4 w-4" />
                  {selectedStylists.length === 0
                    ? "Velg stylister..."
                    : `${selectedStylists.length} stylist${selectedStylists.length > 1 ? "er" : ""} valgt`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">
                    Filtrer etter stylister
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {stylists
                      .filter((stylist) => stylist.full_name)
                      .map((stylist) => {
                        const isSelected = selectedStylists.includes(
                          stylist.id
                        );
                        return (
                          <div
                            key={stylist.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={stylist.id}
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedStylists([
                                    ...selectedStylists,
                                    stylist.id,
                                  ]);
                                } else {
                                  setSelectedStylists(
                                    selectedStylists.filter(
                                      (id) => id !== stylist.id
                                    )
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={stylist.id}
                              className="text-sm cursor-pointer"
                            >
                              {stylist.full_name}
                            </label>
                          </div>
                        );
                      })}
                  </div>
                  {selectedStylists.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedStylists([])}
                      className="w-full mt-2"
                    >
                      Fjern alle
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
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

        {/* Selected Stylists Display */}
        {selectedStylists.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">
              Valgte stylister:
            </span>
            {selectedStylists.map((stylistId) => {
              const stylist = stylists.find((s) => s.id === stylistId);
              return (
                <Badge
                  key={stylistId}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {stylist?.full_name || "Ukjent"}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() =>
                      setSelectedStylists(
                        selectedStylists.filter((id) => id !== stylistId)
                      )
                    }
                  />
                </Badge>
              );
            })}
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
          {mode === "update" && hasActiveFilters && (
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
              {selectedStylists.length > 0 && (
                <span className="ml-1 font-medium">
                  - {selectedStylists.length} stylist
                  {selectedStylists.length > 1 ? "er" : ""}
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
