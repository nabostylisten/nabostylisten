import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

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