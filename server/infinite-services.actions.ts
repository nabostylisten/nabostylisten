"use server";

import { createClient } from "@/lib/supabase/server";
import { getPublicUrl } from "@/lib/supabase/storage";
import { findNearbyServices, debugGeographicData } from "@/lib/supabase/rpc";
import type { ServiceFilters } from "@/types";
import type { ServiceWithRelations } from "@/components/services/service-card";
import type { Database } from "@/types/database.types";

export interface InfiniteServicesResponse {
  services: ServiceWithRelations[];
  nextOffset?: number;
  hasMore: boolean;
  totalCount: number;
}

// Infer the return type from the nearby_services RPC function
type NearbyServiceData =
  Database["public"]["Functions"]["nearby_services"]["Returns"][0];

export async function fetchInfiniteServices(
  filters: ServiceFilters = {},
  limit: number = 12,
  offset: number = 0,
): Promise<InfiniteServicesResponse> {
  const supabase = await createClient();

  // Use geographic search if location coordinates are provided
  if (filters.location?.coordinates) {
    return fetchGeographicServices(supabase, filters, limit, offset);
  }

  // Fallback to traditional database query for non-geographic searches
  return fetchTraditionalServices(supabase, filters, limit, offset);
}

async function fetchGeographicServices(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: ServiceFilters,
  limit: number,
  offset: number,
): Promise<InfiniteServicesResponse> {
  const { location, ...otherFilters } = filters;

  console.log("🔍 Geographic Search Debug:");
  console.log("  - Original filters:", filters);
  console.log("  - Location coordinates:", location?.coordinates);
  console.log("  - Radius:", location?.radius);
  console.log("  - Other filters:", otherFilters);

  if (!location?.coordinates) {
    throw new Error("Geographic search requires coordinates");
  }

  const rpcParams = { ...otherFilters, radiusKm: location.radius };
  console.log("  - RPC parameters:", rpcParams);
  console.log("  - Calling nearby_services with lat:", location.coordinates.lat, "lng:", location.coordinates.lng);

  const { data, error } = await findNearbyServices(
    supabase,
    location.coordinates.lat,
    location.coordinates.lng,
    rpcParams,
  );

  if (error) {
    console.log("  ❌ RPC Error:", error);
    throw new Error(`Failed to fetch nearby services: ${error}`);
  }

  console.log("  ✅ RPC Success - Raw data length:", data?.length || 0);
  console.log("  - First few results:", data?.slice(0, 3));

  if (!data) {
    console.log("  ⚠️ No data returned from RPC");
    return { services: [], hasMore: false, totalCount: 0 };
  }

  // If we got 0 results, run diagnostic to understand why
  if (data.length === 0) {
    console.log("  🔍 Zero results returned - running diagnostics...");
    await debugGeographicData(supabase);
  }

  // Apply pagination to the results
  const totalCount = data.length;
  const paginatedData = data.slice(offset, offset + limit);
  
  console.log("  📄 Pagination:");
  console.log("    - Total count:", totalCount);
  console.log("    - Offset:", offset, "Limit:", limit);
  console.log("    - Paginated data length:", paginatedData.length);

  // Transform RPC results to ServiceWithRelations format
  const services = await Promise.all(
    paginatedData.map((service: NearbyServiceData) =>
      transformNearbyServiceToServiceWithRelations(supabase, service)
    ),
  );

  const hasMore = offset + limit < totalCount;
  const nextOffset = hasMore ? offset + limit : undefined;

  return {
    services,
    nextOffset,
    hasMore,
    totalCount,
  };
}

async function fetchTraditionalServices(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: ServiceFilters,
  limit: number,
  offset: number,
): Promise<InfiniteServicesResponse> {
  const {
    search,
    categories,
    location,
    serviceDestination,
    stylistIds,
    minPrice,
    maxPrice,
    sortBy = "newest",
  } = filters;

  let query = supabase
    .from("services")
    .select(
      `
            *,
            service_service_categories (
                service_categories (
                    id,
                    name,
                    description,
                    parent_category_id
                )
            ),
            media (
                id,
                file_path,
                media_type,
                is_preview_image,
                created_at
            ),
            profiles!inner (
                id,
                full_name,
                stylist_details (
                    bio,
                    can_travel,
                    has_own_place,
                    travel_distance_km
                ),
                addresses (
                    id,
                    city,
                    postal_code,
                    street_address,
                    is_primary
                )
            )
        `,
      { count: "exact" },
    )
    .eq("is_published", true);

  // Apply search filter
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Apply category filter (multiple categories)
  if (categories && categories.length > 0) {
    const { data: serviceIds } = await supabase
      .from("service_service_categories")
      .select("service_id")
      .in("category_id", categories);

    if (serviceIds && serviceIds.length > 0) {
      const ids = serviceIds.map((item) => item.service_id);
      query = query.in("id", ids);
    } else {
      return { services: [], hasMore: false, totalCount: 0 };
    }
  }

  // Apply service destination filter
  if (
    serviceDestination?.atCustomerPlace && !serviceDestination?.atStylistPlace
  ) {
    query = query.eq("at_customer_place", true);
  } else if (
    serviceDestination?.atStylistPlace && !serviceDestination?.atCustomerPlace
  ) {
    query = query.eq("at_stylist_place", true);
  }

  // Apply stylist filter
  if (stylistIds && stylistIds.length > 0) {
    query = query.in("stylist_id", stylistIds);
  }

  // Apply price filters (convert from strings to numbers)
  if (minPrice) {
    query = query.gte("price", parseFloat(minPrice));
  }
  if (maxPrice) {
    query = query.lte("price", parseFloat(maxPrice));
  }

  // Apply location filter (text-based city matching)
  if (location?.address) {
    query = query.eq("profiles.addresses.city", location.address);
  }

  // Apply sorting (without rating and distance for traditional query)
  switch (sortBy) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  // Apply pagination
  const from = offset;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch services: ${error.message}`);
  }

  if (!data) {
    return { services: [], hasMore: false, totalCount: 0 };
  }

  // Add public URLs for media
  const servicesWithUrls: ServiceWithRelations[] = data.map((service) => ({
    ...service,
    media: service.media?.map((media) => ({
      ...media,
      publicUrl: media.file_path.startsWith("http")
        ? media.file_path
        : getPublicUrl(supabase, "service-media", media.file_path),
    })),
  }));

  const totalCount = count || 0;
  const hasMore = offset + limit < totalCount;
  const nextOffset = hasMore ? offset + limit : undefined;

  return {
    services: servicesWithUrls,
    nextOffset,
    hasMore,
    totalCount,
  };
}

async function transformNearbyServiceToServiceWithRelations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  nearbyService: NearbyServiceData,
): Promise<ServiceWithRelations> {
  // Fetch additional service data (categories, media) that RPC doesn't include
  const { data: serviceData } = await supabase
    .from("services")
    .select(`
      service_service_categories (
        service_categories (
          id,
          name,
          description,
          parent_category_id
        )
      ),
      media (
        id,
        file_path,
        media_type,
        is_preview_image,
        created_at
      )
    `)
    .eq("id", nearbyService.service_id)
    .single();

  const mediaWithUrls = serviceData?.media?.map((media) => ({
    ...media,
    publicUrl: media.file_path.startsWith("http")
      ? media.file_path
      : getPublicUrl(supabase, "service-media", media.file_path),
  })) || [];

  // Transform RPC result to match ServiceWithRelations interface
  return {
    id: nearbyService.service_id,
    title: nearbyService.service_title,
    description: nearbyService.service_description,
    price: nearbyService.service_price,
    currency: nearbyService.service_currency,
    duration_minutes: nearbyService.service_duration_minutes,
    at_customer_place: nearbyService.service_at_customer_place,
    at_stylist_place: nearbyService.service_at_stylist_place,
    is_published: nearbyService.service_is_published,
    created_at: nearbyService.service_created_at,
    updated_at: nearbyService.service_created_at, // Not available from RPC
    stylist_id: nearbyService.stylist_id,
    includes: null, // Not available from RPC
    requirements: null, // Not available from RPC
    service_service_categories: serviceData?.service_service_categories || [],
    media: mediaWithUrls,
    profiles: {
      id: nearbyService.stylist_id,
      full_name: nearbyService.stylist_full_name,
      stylist_details: nearbyService.stylist_bio
        ? [{
          bio: nearbyService.stylist_bio,
          can_travel: nearbyService.stylist_can_travel,
          has_own_place: nearbyService.stylist_has_own_place,
          travel_distance_km: null, // Not available from RPC
        }]
        : [],
      addresses: [{
        id: nearbyService.address_id,
        city: nearbyService.address_city,
        postal_code: nearbyService.address_postal_code,
        street_address: nearbyService.address_street_address,
        is_primary: true, // RPC only returns primary addresses
      }],
    },
    // Additional data from geographic search
    distance_meters: nearbyService.distance_meters,
    average_rating: nearbyService.average_rating,
    total_reviews: nearbyService.total_reviews,
  } as ServiceWithRelations;
}
