import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { ServiceFilters } from "@/types";

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
  radiusKm: number = 10
) {
  const { data, error } = await supabase.rpc('nearby_addresses', {
    lat,
    long: lng,
    radius_km: radiusKm
  });

  if (error) {
    console.error('Error finding nearby addresses:', error);
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
  filters: Omit<ServiceFilters, 'location' | 'page' | 'limit'> & { radiusKm?: number } = {}
) {
  const {
    search,
    categories,
    serviceDestination,
    stylistIds,
    minPrice,
    maxPrice,
    sortBy = 'distance_asc',
    radiusKm = 10
  } = filters;

  // Convert price strings to øre (Norwegian cents) for database filtering
  const minPriceOre = minPrice ? Math.round(parseFloat(minPrice) * 100) : null;
  const maxPriceOre = maxPrice ? Math.round(parseFloat(maxPrice) * 100) : null;

  const { data, error } = await supabase.rpc('nearby_services', {
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
    sort_by: sortBy
  });

  if (error) {
    console.error('Error finding nearby services:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}