"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  getAllAddressesForMap,
  getUserCountsByRole,
  type MapAddress,
} from "@/server/admin/map.actions";
import { toast } from "sonner";

// Query keys
const ADMIN_MAP_KEYS = {
  addresses: ["admin", "map", "addresses"] as const,
  stats: ["admin", "map", "stats"] as const,
};

// Transform server data for frontend consumption
const transformAddressData = (addresses: MapAddress[]) => {
  // Prepare GeoJSON data for Mapbox
  const geojsonData = {
    type: "FeatureCollection" as const,
    features: addresses.map((address) => ({
      type: "Feature" as const,
      properties: {
        id: address.id,
        user_id: address.user_id,
        user_role: address.user_role,
        user_name: address.user_name || "Ukjent bruker",
        user_email: address.user_email || "",
        street_address: address.street_address,
        city: address.city,
        postal_code: address.postal_code,
        nickname: address.nickname,
        is_primary: address.is_primary,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [address.longitude, address.latitude],
      },
    })),
  };

  return {
    addresses,
    geojsonData,
  };
};

// Fetch addresses for map
const fetchAddresses = async () => {
  const result = await getAllAddressesForMap();

  if (result.error) {
    toast.error("Kunne ikke laste adresser");
    throw new Error(result.error);
  }

  return result.data || [];
};

// Fetch user counts by role
const fetchUserCounts = async () => {
  const result = await getUserCountsByRole();

  if (result.error) {
    toast.error("Kunne ikke laste brukerstatistikk");
    throw new Error(result.error);
  }

  return result.data || { total: 0, customers: 0, stylists: 0, admins: 0 };
};

export interface AdminMapStats {
  total: number;
  customers: number;
  stylists: number;
  admins: number;
}

export interface AdminMapGeoJSON {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: {
      id: string;
      user_id: string;
      user_role: string;
      user_name: string;
      user_email: string;
      street_address: string;
      city: string;
      postal_code: string;
      nickname: string | null;
      is_primary: boolean;
    };
    geometry: {
      type: "Point";
      coordinates: [number, number];
    };
  }>;
}

export function useAdminMap() {
  const [mapLoaded, setMapLoaded] = useState(false);

  // Fetch addresses using TanStack Query
  const {
    data: addresses = [],
    isLoading: addressesLoading,
    error: addressesError,
    refetch: refetchAddresses,
  } = useQuery({
    queryKey: ADMIN_MAP_KEYS.addresses,
    queryFn: fetchAddresses,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch user counts using TanStack Query
  const {
    data: stats = { total: 0, customers: 0, stylists: 0, admins: 0 },
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ADMIN_MAP_KEYS.stats,
    queryFn: fetchUserCounts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Transform data using useMemo for performance
  const transformedData = useMemo(() => {
    if (!addresses || addresses.length === 0) {
      return {
        addresses: [],
        geojsonData: {
          type: "FeatureCollection" as const,
          features: [],
        },
      };
    }

    return transformAddressData(addresses);
  }, [addresses]);

  // Combine loading and error states
  const isLoading = addressesLoading || statsLoading;
  const error = addressesError || statsError;
  const refetch = () => {
    refetchAddresses();
    refetchStats();
  };

  // Map state management
  const [mapRef, setMapRef] = useState<mapboxgl.Map | null>(null);

  // Error handling
  if (error) {
    console.error("Error loading addresses:", error);
  }

  return {
    // Data
    addresses: transformedData.addresses,
    stats,
    geojsonData: transformedData.geojsonData,

    // Loading states
    isLoading,
    isError: !!error,
    error,

    // Map state
    mapLoaded,
    setMapLoaded,
    mapRef,
    setMapRef,

    // Actions
    refetch,
  };
}
