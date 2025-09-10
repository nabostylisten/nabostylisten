import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { ServiceFilters } from "@/types";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Find nearby addresses within a given radius
 * @param supabase - The Supabase client instance
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @param radiusKm - Search radius in kilometers (default: 10)
 * @returns Array of nearby addresses with distance
 */
export async function findNearbyAddresses(
  supabase: SupabaseClient<Database>,
  lat: number,
  lng: number,
  radiusKm: number = 10,
) {
  const { data, error } = await supabase.rpc("nearby_addresses", {
    lat,
    long: lng,
    radius_km: radiusKm,
  });

  if (error) {
    console.error("Error finding nearby addresses:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Find nearby services within a given radius with comprehensive filtering
 * @param supabase - The Supabase client instance
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @param filters - Service filtering options
 * @returns Array of nearby services with distance and ratings
 */
export async function findNearbyServices(
  supabase: SupabaseClient<Database>,
  lat: number,
  lng: number,
  filters: Omit<ServiceFilters, "location" | "page" | "limit"> & {
    radiusKm?: number;
  } = {},
) {
  // Use service client to bypass RLS for complex rating calculations
  const serviceClient = createServiceClient();
  const {
    search,
    categories,
    serviceDestination,
    stylistIds,
    minPrice,
    maxPrice,
    sortBy = "distance_asc",
    radiusKm = 10,
  } = filters;

  // Convert price strings to øre (Norwegian cents) for database filtering
  const minPriceOre = minPrice ? Math.round(parseFloat(minPrice) * 100) : null;
  const maxPriceOre = maxPrice ? Math.round(parseFloat(maxPrice) * 100) : null;

  const rpcParams = {
    lat,
    long: lng,
    radius_km: radiusKm,
    search_term: search || undefined,
    category_ids: categories || undefined,
    min_price_ore: minPriceOre || undefined,
    max_price_ore: maxPriceOre || undefined,
    at_customer_place: serviceDestination?.atCustomerPlace || undefined,
    at_stylist_place: serviceDestination?.atStylistPlace || undefined,
    stylist_ids: stylistIds || undefined,
    sort_by: sortBy,
  };

  console.log("🌍 findNearbyServices RPC params:", JSON.stringify(rpcParams, null, 2));

  const { data, error } = await serviceClient.rpc("nearby_services", rpcParams);

  if (error) {
    console.error("Error finding nearby services:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Find traditional services (non-geographical) with comprehensive filtering
 * @param supabase - The Supabase client instance
 * @param filters - Service filtering options
 * @param limit - Number of results to return (default: 12)
 * @param offset - Number of results to skip (default: 0)
 * @returns Array of services with ratings
 */
export async function findTraditionalServices(
  supabase: SupabaseClient<Database>,
  filters: Omit<ServiceFilters, "location" | "page"> & {
    limit?: number;
    offset?: number;
  } = {},
) {
  // Use service client to bypass RLS for complex rating calculations
  const serviceClient = createServiceClient();
  const {
    search,
    categories,
    serviceDestination,
    stylistIds,
    minPrice,
    maxPrice,
    sortBy = "newest",
    limit = 12,
    offset = 0,
  } = filters;

  // Convert price strings to øre (Norwegian cents) for database filtering
  const minPriceOre = minPrice ? Math.round(parseFloat(minPrice) * 100) : null;
  const maxPriceOre = maxPrice ? Math.round(parseFloat(maxPrice) * 100) : null;

  const rpcParams = {
    search_term: search || undefined,
    category_ids: categories || undefined,
    min_price_ore: minPriceOre || undefined,
    max_price_ore: maxPriceOre || undefined,
    at_customer_place: serviceDestination?.atCustomerPlace || undefined,
    at_stylist_place: serviceDestination?.atStylistPlace || undefined,
    stylist_ids: stylistIds || undefined,
    city_filter: undefined, // We'll handle location filtering separately if needed
    sort_by: sortBy,
    limit_count: limit,
    offset_count: offset,
  };

  console.log("🔍 findTraditionalServices RPC params:", JSON.stringify(rpcParams, null, 2));

  const { data, error } = await serviceClient.rpc("traditional_services", rpcParams);

  if (error) {
    console.error("Error finding traditional services:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
