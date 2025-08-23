"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AddressInput } from "@/components/ui/address-input";
import { ServiceCategoryCombobox } from "@/components/service-category-combobox";
import { Search, Filter, HelpCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ServiceFilterHelpDialog } from "./service-filter-help-dialog";
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
import { X, Users, DollarSign, MapPin } from "lucide-react";
import type { ServiceFilters } from "@/types";

interface ServiceFilterFormProps {
  categories?: Array<{
    id: string;
    name: string;
    description?: string | null;
    parent_category_id?: string | null;
    service_count?: number;
  }>;
  stylists?: Array<{
    id: string;
    full_name: string | null;
  }>;
  userAddresses?: Array<{
    id: string;
    nickname: string | null;
    street_address: string;
    city: string;
    postal_code: string;
    country: string;
    is_primary: boolean;
  }>;
  mode?: "redirect" | "update"; // redirect to /tjenester or update current URL
}

export function ServiceFilterForm({
  categories = [],
  stylists = [],
  userAddresses = [],
  mode = "update",
}: ServiceFilterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Enhanced state management for new filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [location, setLocation] = useState({
    address: searchParams.get("location") || "",
    coordinates:
      searchParams.get("locationLat") && searchParams.get("locationLng")
        ? {
            lat: parseFloat(searchParams.get("locationLat")!),
            lng: parseFloat(searchParams.get("locationLng")!),
          }
        : undefined,
    radius: searchParams.get("locationRadius")
      ? parseFloat(searchParams.get("locationRadius")!)
      : 10,
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get("categories")
      ? searchParams.get("categories")!.split(",")
      : []
  );

  const [selectedStylists, setSelectedStylists] = useState<string[]>(
    searchParams.get("stylists") ? searchParams.get("stylists")!.split(",") : []
  );

  const [serviceDestination, setServiceDestination] = useState({
    atCustomerPlace: searchParams.get("atCustomerPlace") === "true",
    atStylistPlace: searchParams.get("atStylistPlace") === "true",
  });

  const [sortBy, setSortBy] = useState<ServiceFilters["sortBy"]>(
    (searchParams.get("sort") as ServiceFilters["sortBy"]) || "newest"
  );

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");

  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);

  const handleSearch = () => {
    startTransition(() => {
      const params = new URLSearchParams();

      if (search.trim()) params.set("search", search.trim());

      // Enhanced location parameters
      if (location.address.trim()) {
        params.set("location", location.address.trim());
        if (location.coordinates) {
          params.set("locationLat", location.coordinates.lat.toString());
          params.set("locationLng", location.coordinates.lng.toString());
        }
        if (location.radius !== 10) {
          params.set("locationRadius", location.radius.toString());
        }
      }

      // Multiple categories
      if (selectedCategories.length > 0) {
        params.set("categories", selectedCategories.join(","));
      }

      // Service destination preferences
      if (serviceDestination.atCustomerPlace) {
        params.set("atCustomerPlace", "true");
      }
      if (serviceDestination.atStylistPlace) {
        params.set("atStylistPlace", "true");
      }

      if (selectedStylists.length > 0)
        params.set("stylists", selectedStylists.join(","));
      if (minPrice.trim()) params.set("minPrice", minPrice.trim());
      if (maxPrice.trim()) params.set("maxPrice", maxPrice.trim());
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
      setLocation({ address: "", coordinates: undefined, radius: 10 });
      setSelectedCategories([]);
      setSelectedStylists([]);
      setServiceDestination({ atCustomerPlace: false, atStylistPlace: false });
      setMinPrice("");
      setMaxPrice("");
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
    location.address ||
    selectedCategories.length > 0 ||
    selectedStylists.length > 0 ||
    serviceDestination.atCustomerPlace ||
    serviceDestination.atStylistPlace ||
    minPrice ||
    maxPrice ||
    sortBy !== "newest";

  const getFormattedServiceDestination = () => {
    if (
      serviceDestination.atCustomerPlace &&
      !serviceDestination.atStylistPlace
    ) {
      return "Hjemme";
    }
    if (
      serviceDestination.atCustomerPlace &&
      serviceDestination.atStylistPlace
    ) {
      return "Begge";
    }
    if (
      serviceDestination.atStylistPlace &&
      !serviceDestination.atCustomerPlace
    ) {
      return "Hos stylist";
    }
    return "Begge";
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Search and Location Row */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk etter tjeneste..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="flex gap-2">
            <AddressInput
              value={location.address}
              onChange={(address) =>
                setLocation((prev) => ({ ...prev, address }))
              }
              onSelect={(suggestion) => {
                if (suggestion.center) {
                  setLocation((prev) => ({
                    ...prev,
                    address: suggestion.place_name,
                    coordinates: {
                      lat: suggestion.center[1],
                      lng: suggestion.center[0],
                    },
                  }));
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Søk lokasjon..."
            />
            {location.coordinates && (
              <div className="flex items-center gap-2 min-w-0">
                <Input
                  type="number"
                  value={location.radius}
                  onChange={(e) =>
                    setLocation((prev) => ({
                      ...prev,
                      radius: parseFloat(e.target.value) || 10,
                    }))
                  }
                  min="1"
                  max="50"
                  className="w-16"
                  placeholder="10"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  km
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsHelpDialogOpen(true)}
              className="h-8 w-8 p-0"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="sr-only">Åpne hjelp</span>
            </Button>
          </div>
        </div>

        {/* Filters Rows - Split into multiple rows for better responsiveness */}
        <div className="space-y-4">
          {/* First row: Categories and Service Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Filter */}
            <div>
              <ServiceCategoryCombobox
                selectedCategories={selectedCategories}
                onSelectedCategoriesChange={setSelectedCategories}
                categories={categories}
                placeholder="Velg kategorier..."
              />
            </div>

            {/* Service Destination Filter */}
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    {!serviceDestination.atCustomerPlace &&
                    !serviceDestination.atStylistPlace
                      ? "Hvor?"
                      : getFormattedServiceDestination()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">
                      Hvor skal tjenesten utføres?
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="atCustomerPlace"
                          checked={serviceDestination.atCustomerPlace}
                          onCheckedChange={(checked) =>
                            setServiceDestination((prev) => ({
                              ...prev,
                              atCustomerPlace: !!checked,
                            }))
                          }
                        />
                        <label
                          htmlFor="atCustomerPlace"
                          className="text-sm cursor-pointer"
                        >
                          Hjemme hos meg
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="atStylistPlace"
                          checked={serviceDestination.atStylistPlace}
                          onCheckedChange={(checked) =>
                            setServiceDestination((prev) => ({
                              ...prev,
                              atStylistPlace: !!checked,
                            }))
                          }
                        />
                        <label
                          htmlFor="atStylistPlace"
                          className="text-sm cursor-pointer"
                        >
                          Hos stylist
                        </label>
                      </div>
                    </div>
                    {(serviceDestination.atCustomerPlace ||
                      serviceDestination.atStylistPlace) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setServiceDestination({
                            atCustomerPlace: false,
                            atStylistPlace: false,
                          })
                        }
                        className="w-full mt-2"
                      >
                        Fjern filter
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Second row: Stylists and Price Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Stylists Filter */}
            <div>
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

            {/* Price Range Filter */}
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    {!minPrice && !maxPrice
                      ? "Prisområde..."
                      : `${minPrice ? `${minPrice} kr` : "0"} - ${maxPrice ? `${maxPrice} kr` : "∞"}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Prisområde</h4>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">
                          Fra (kr)
                        </label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          min="0"
                          step="50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">
                          Til (kr)
                        </label>
                        <Input
                          type="number"
                          placeholder="5000"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          min="0"
                          step="50"
                        />
                      </div>
                    </div>
                    {(minPrice || maxPrice) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMinPrice("");
                          setMaxPrice("");
                        }}
                        className="w-full mt-2"
                      >
                        Fjern prisfilter
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Third row: Sorting */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="sm:col-span-1">
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
                  <SelectItem value="rating_desc">
                    Høyest vurdering først
                  </SelectItem>
                  <SelectItem value="rating_asc">
                    Lavest vurdering først
                  </SelectItem>
                  {location.coordinates && (
                    <SelectItem value="distance_asc">Nærmest først</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Selected Filters Display */}
        {(selectedCategories.length > 0 ||
          selectedStylists.length > 0 ||
          location.coordinates ||
          serviceDestination.atCustomerPlace ||
          serviceDestination.atStylistPlace ||
          minPrice ||
          maxPrice) && (
          <div className="space-y-2">
            {/* Selected Categories */}
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">
                  Valgte kategorier:
                </span>
                {selectedCategories.map((categoryId) => {
                  const category = categories.find((c) => c.id === categoryId);
                  return (
                    <Badge
                      key={categoryId}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {category?.name || "Ukjent"}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() =>
                          setSelectedCategories(
                            selectedCategories.filter((id) => id !== categoryId)
                          )
                        }
                      />
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Location Filter */}
            {location.coordinates && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Lokasjon:</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  {location.address} ({location.radius}km)
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() =>
                      setLocation({
                        address: "",
                        coordinates: undefined,
                        radius: 10,
                      })
                    }
                  />
                </Badge>
              </div>
            )}

            {/* Service Destination Filter */}
            {(serviceDestination.atCustomerPlace ||
              serviceDestination.atStylistPlace) && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Utføres:</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  {getFormattedServiceDestination()}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() =>
                      setServiceDestination({
                        atCustomerPlace: false,
                        atStylistPlace: false,
                      })
                    }
                  />
                </Badge>
              </div>
            )}

            {/* Selected Stylists */}
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

            {/* Price Range Filter */}
            {(minPrice || maxPrice) && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">
                  Prisområde:
                </span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  {minPrice ? `${minPrice} kr` : "0"} -{" "}
                  {maxPrice ? `${maxPrice} kr` : "∞"}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => {
                      setMinPrice("");
                      setMaxPrice("");
                    }}
                  />
                </Badge>
              </div>
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

        {/* Help Dialog */}
        <ServiceFilterHelpDialog
          open={isHelpDialogOpen}
          onOpenChange={setIsHelpDialogOpen}
        />
      </CardContent>
    </Card>
  );
}
