"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Combobox,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxInput,
  ComboboxList,
  ComboboxEmpty,
  ComboboxItem,
} from "@/components/ui/kibo-ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import type { BookingFilters } from "@/types";
import {
  getUserBookingServices,
  getUserBookingStylists,
} from "@/server/booking/crud.actions";

interface MyBookingsFilterProps {
  userId: string;
  userRole?: "customer" | "stylist";
}

export function MyBookingsFilter({
  userId,
  userRole = "customer",
}: MyBookingsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    searchParams.get("services")?.split(",").filter(Boolean) || []
  );
  const [selectedStylistIds, setSelectedStylistIds] = useState<string[]>(
    searchParams.get("stylists")?.split(",").filter(Boolean) || []
  );
  const [sortBy, setSortBy] = useState<BookingFilters["sortBy"]>(
    (searchParams.get("sort") as BookingFilters["sortBy"]) || "date_desc"
  );

  // Fetch available services for this user
  const { data: services = [] } = useQuery({
    queryKey: ["user-booking-services", userId, userRole],
    queryFn: async () => {
      const result = await getUserBookingServices(userId, userRole);
      return result.data || [];
    },
  });

  // Fetch available stylists/customers for this user
  const { data: stylists = [] } = useQuery({
    queryKey: ["user-booking-stylists", userId, userRole],
    queryFn: async () => {
      const result = await getUserBookingStylists(userId, userRole);
      return result.data || [];
    },
  });

  const handleSearch = () => {
    startTransition(() => {
      const params = new URLSearchParams();

      if (selectedServiceIds.length > 0)
        params.set("services", selectedServiceIds.join(","));
      if (selectedStylistIds.length > 0)
        params.set("stylists", selectedStylistIds.join(","));
      if (sortBy !== "date_desc" && sortBy) params.set("sort", sortBy);

      const queryString = params.toString();
      router.push(queryString ? `?${queryString}` : window.location.pathname);
    });
  };

  const handleClearFilters = () => {
    startTransition(() => {
      setSelectedServiceIds([]);
      setSelectedStylistIds([]);
      setSortBy("date_desc");
      router.push(window.location.pathname);
    });
  };

  const hasActiveFilters =
    selectedServiceIds.length > 0 ||
    selectedStylistIds.length > 0 ||
    sortBy !== "date_desc";

  // Transform services for combobox
  const serviceComboboxData = services.map((service) => ({
    value: service.id,
    label: service.title,
  }));

  // Transform stylists for combobox
  const stylistComboboxData = stylists.map((stylist) => ({
    value: stylist.id,
    label: stylist.full_name || stylist.email || "Unavngitt",
  }));

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Sort Row */}
        <div className="flex justify-end"></div>

        {/* Services and Stylists Filter Row */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Services Combobox */}
          <Combobox data={serviceComboboxData} type="tjenester">
            <ComboboxTrigger className="w-full flex-1">
              <span className="flex w-full items-center justify-between gap-2">
                {selectedServiceIds.length > 0
                  ? `${selectedServiceIds.length} tjenester valgt`
                  : "Velg tjenester..."}
              </span>
            </ComboboxTrigger>
            <ComboboxContent className="w-full">
              <ComboboxInput />
              <ComboboxList>
                <ComboboxEmpty />
                {serviceComboboxData.map((service) => (
                  <ComboboxItem
                    key={service.value}
                    value={service.value}
                    onSelect={(value) => {
                      setSelectedServiceIds((prev) =>
                        prev.includes(value)
                          ? prev.filter((id) => id !== value)
                          : [...prev, value]
                      );
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedServiceIds.includes(service.value)}
                        onCheckedChange={() => {}}
                      />
                      <span>{service.label}</span>
                    </div>
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>

          {/* Stylists Combobox */}

          <Combobox
            data={stylistComboboxData}
            type={userRole === "customer" ? "stylister" : "kunder"}
          >
            <ComboboxTrigger className="w-full flex-1">
              <span className="flex w-full items-center justify-between gap-2">
                {selectedStylistIds.length > 0
                  ? `${selectedStylistIds.length} ${userRole === "customer" ? "stylister" : "kunder"} valgt`
                  : `Velg ${userRole === "customer" ? "stylister" : "kunder"}...`}
              </span>
            </ComboboxTrigger>
            <ComboboxContent className="w-full">
              <ComboboxInput />
              <ComboboxList>
                <ComboboxEmpty />
                {stylistComboboxData.map((stylist) => (
                  <ComboboxItem
                    key={stylist.value}
                    value={stylist.value}
                    onSelect={(value) => {
                      setSelectedStylistIds((prev) =>
                        prev.includes(value)
                          ? prev.filter((id) => id !== value)
                          : [...prev, value]
                      );
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedStylistIds.includes(stylist.value)}
                        onCheckedChange={() => {}}
                      />
                      <span>{stylist.label}</span>
                    </div>
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>

          <div className="w-full flex-1">
            <Select
              value={sortBy}
              onValueChange={(value) =>
                setSortBy(value as BookingFilters["sortBy"])
              }
            >
              <SelectTrigger className="w-full">
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
