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

  console.log("🗺️ RPC findNearbyServices Debug:");
  console.log("  - Input coordinates: lat =", lat, "lng =", lng);
  console.log("  - Radius (km):", radiusKm);
  console.log("  - Filters:", filters);

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
    sort_by: sortBy
  };

  console.log("  - Final RPC params:", rpcParams);

  const { data, error } = await supabase.rpc('nearby_services', rpcParams);

  if (error) {
    console.log("  ❌ Database RPC Error:", error);
    console.error('Error finding nearby services:', error);
    return { data: null, error: error.message };
  }

  console.log("  ✅ Database RPC Success:");
  console.log("    - Results count:", data?.length || 0);
  if (data && data.length > 0) {
    console.log("    - Sample result structure:", {
      service_id: data[0].service_id,
      distance_meters: data[0].distance_meters,
      address_city: data[0].address_city,
      address_coordinates: `${data[0].address_lat}, ${data[0].address_lng}`
    });
  }

  return { data, error: null };
}

/**
 * Debug function to check address data and geographic setup
 */
export async function debugGeographicData(
  supabase: SupabaseClient<Database>
) {
  console.log("🔧 Geographic Data Debug - Step by Step Analysis:");
  
  // Step 1: Check all profiles by role
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, role, full_name');
    
  const customerCount = allProfiles?.filter(p => p.role === 'customer').length || 0;
  const stylistCount = allProfiles?.filter(p => p.role === 'stylist').length || 0;
  const adminCount = allProfiles?.filter(p => p.role === 'admin').length || 0;
  
  console.log("  📊 Profile Analysis:");
  console.log("    - Total profiles:", allProfiles?.length || 0);
  console.log("    - Customers:", customerCount);
  console.log("    - Stylists:", stylistCount);  
  console.log("    - Admins:", adminCount);
  
  // Step 2: Check addresses
  const { data: totalAddresses } = await supabase
    .from('addresses')
    .select('id, user_id, city, location, is_primary');
    
  const primaryAddresses = totalAddresses?.filter(addr => addr.is_primary) || [];
  const addressesWithLocation = primaryAddresses.filter(addr => addr.location !== null);
  
  console.log("  🏠 Address Analysis:");
  console.log("    - Total addresses:", totalAddresses?.length || 0);
  console.log("    - Primary addresses:", primaryAddresses.length);
  console.log("    - Primary addresses with coordinates:", addressesWithLocation.length);
  
  // Step 3: Check which profiles have primary addresses
  const { data: profilesWithAddresses } = await supabase
    .from('profiles')
    .select(`
      id, 
      role, 
      full_name,
      addresses!inner (id, is_primary, location)
    `)
    .eq('addresses.is_primary', true);
    
  const stylistsWithAddresses = profilesWithAddresses?.filter(p => p.role === 'stylist') || [];
  const stylistsWithLocationAddresses = stylistsWithAddresses.filter(p => 
    p.addresses.some(addr => addr.location !== null)
  );
  
  console.log("  🔗 Profile-Address Connection:");
  console.log("    - Profiles with primary addresses:", profilesWithAddresses?.length || 0);
  console.log("    - STYLISTS with primary addresses:", stylistsWithAddresses.length);
  console.log("    - STYLISTS with primary addresses + coordinates:", stylistsWithLocationAddresses.length);
  
  // Step 4: Check published services
  const { data: publishedServices } = await supabase
    .from('services')
    .select('id, title, stylist_id')
    .eq('is_published', true);
    
  console.log("  🛍️ Service Analysis:");
  console.log("    - Total published services:", publishedServices?.length || 0);
  
  // Step 5: Check the EXACT same join as the nearby_services function
  const { data: servicesWithExactJoin } = await supabase
    .from('services')
    .select(`
      id,
      title,
      stylist_id,
      profiles!inner (
        id,
        role,
        full_name
      )
    `)
    .eq('is_published', true);
    
  console.log("    - Services with valid stylist profiles:", servicesWithExactJoin?.length || 0);
  
  // Step 6: Manually check the join relationship
  if (publishedServices && publishedServices.length > 0 && stylistsWithLocationAddresses.length > 0) {
    console.log("  🔍 Manual Join Analysis:");
    console.log("    - Sample published service stylist_ids:", publishedServices.slice(0, 3).map(s => s.stylist_id));
    console.log("    - Sample stylist IDs with addresses:", stylistsWithLocationAddresses.slice(0, 3).map(s => s.id));
    
    // Check overlap
    const publishedServiceStylistIds = new Set(publishedServices.map(s => s.stylist_id));
    const stylistsWithAddressIds = new Set(stylistsWithLocationAddresses.map(s => s.id));
    
    const overlappingIds = [...publishedServiceStylistIds].filter(id => stylistsWithAddressIds.has(id));
    console.log("    - Overlapping stylist IDs (services + addresses):", overlappingIds.length);
    console.log("    - Sample overlapping IDs:", overlappingIds.slice(0, 3));
  } else {
    console.log("  ⚠️ Cannot perform join analysis - missing published services or stylists with addresses");
  }
  
  return {
    totalProfiles: allProfiles?.length || 0,
    stylistCount,
    totalAddresses: totalAddresses?.length || 0,
    addressesWithLocation: addressesWithLocation.length,
    stylistsWithAddresses: stylistsWithAddresses.length,
    stylistsWithLocationAddresses: stylistsWithLocationAddresses.length,
    publishedServices: publishedServices?.length || 0,
  };
}