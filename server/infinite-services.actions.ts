"use server";

import { createClient } from "@/lib/supabase/server";
import { getPublicUrl } from "@/lib/supabase/storage";
import {
  findNearbyServices,
  findTraditionalServices,
} from "@/lib/supabase/rpc";
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

// Infer the return type from the traditional_services RPC function
type TraditionalServiceData =
  Database["public"]["Functions"]["traditional_services"]["Returns"][0];

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

  if (!location?.coordinates) {
    throw new Error("Geographic search requires coordinates");
  }

  const rpcParams = { ...otherFilters, radiusKm: location.radius };

  const { data, error } = await findNearbyServices(
    supabase,
    location.coordinates.lat,
    location.coordinates.lng,
    rpcParams,
  );

  if (error) {
    console.error("  ❌ RPC Error:", error);
    throw new Error(`Failed to fetch nearby services: ${error}`);
  }

  if (!data) {
    console.log("  ⚠️ No data returned from RPC");
    return { services: [], hasMore: false, totalCount: 0 };
  }

  // Apply pagination to the results
  const totalCount = data.length;
  const paginatedData = data.slice(offset, offset + limit);

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
  const rpcParams = {
    ...filters,
    limit,
    offset,
  };

  // Use the RPC function with pagination built in
  const { data, error } = await findTraditionalServices(supabase, rpcParams);

  if (error) {
    console.log("  ❌ RPC Error:", error);
    throw new Error(`Failed to fetch traditional services: ${error}`);
  }

  if (!data) {
    console.log("  ⚠️ No data returned from RPC");
    return { services: [], hasMore: false, totalCount: 0 };
  }

  // Transform RPC results to ServiceWithRelations format
  const services = await Promise.all(
    data.map((service: TraditionalServiceData) =>
      transformTraditionalServiceToServiceWithRelations(supabase, service)
    ),
  );

  // Since we're using the RPC function with built-in pagination, we need to determine if there are more results
  // by checking if we got a full page of results
  const hasMore = data.length === limit;
  const nextOffset = hasMore ? offset + limit : undefined;

  // For total count, we would need another query or modify the RPC to return it
  // For now, we'll use a conservative estimate
  const totalCount = hasMore ? offset + limit + 1 : offset + data.length;

  return {
    services,
    nextOffset,
    hasMore,
    totalCount,
  };
}

async function transformTraditionalServiceToServiceWithRelations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  traditionalService: TraditionalServiceData,
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
    .eq("id", traditionalService.service_id)
    .single();

  const mediaWithUrls = serviceData?.media?.map((media) => ({
    ...media,
    publicUrl: media.file_path.startsWith("http")
      ? media.file_path
      : getPublicUrl(supabase, "service-media", media.file_path),
  })) || [];

  // Transform RPC result to match ServiceWithRelations interface
  return {
    id: traditionalService.service_id,
    title: traditionalService.service_title,
    description: traditionalService.service_description,
    price: traditionalService.service_price,
    currency: traditionalService.service_currency,
    duration_minutes: traditionalService.service_duration_minutes,
    at_customer_place: traditionalService.service_at_customer_place,
    at_stylist_place: traditionalService.service_at_stylist_place,
    is_published: traditionalService.service_is_published,
    created_at: traditionalService.service_created_at,
    updated_at: traditionalService.service_created_at, // Not available from RPC
    stylist_id: traditionalService.stylist_id,
    has_trial_session: traditionalService.service_has_trial_session,
    trial_session_price: traditionalService.service_trial_session_price,
    trial_session_duration_minutes:
      traditionalService.service_trial_session_duration_minutes,
    trial_session_description:
      traditionalService.service_trial_session_description,
    includes: null, // Not available from RPC
    requirements: null, // Not available from RPC
    service_service_categories: serviceData?.service_service_categories || [],
    media: mediaWithUrls,
    profiles: {
      id: traditionalService.stylist_id,
      full_name: traditionalService.stylist_full_name,
      stylist_details: traditionalService.stylist_bio
        ? {
          bio: traditionalService.stylist_bio,
          can_travel: traditionalService.stylist_can_travel,
          has_own_place: traditionalService.stylist_has_own_place,
          travel_distance_km: null, // Not available from RPC
        }
        : null,
      addresses: traditionalService.address_id
        ? [{
          id: traditionalService.address_id,
          city: traditionalService.address_city,
          postal_code: traditionalService.address_postal_code,
          street_address: traditionalService.address_street_address,
          is_primary: true, // RPC only returns primary addresses
        }]
        : [],
    },
    // Rating data from traditional search
    average_rating: traditionalService.average_rating,
    total_reviews: traditionalService.total_reviews,
  } as ServiceWithRelations;
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
    has_trial_session: nearbyService.service_has_trial_session,
    trial_session_price: nearbyService.service_trial_session_price,
    trial_session_duration_minutes:
      nearbyService.service_trial_session_duration_minutes,
    trial_session_description: nearbyService.service_trial_session_description,
    includes: null, // Not available from RPC
    requirements: null, // Not available from RPC
    service_service_categories: serviceData?.service_service_categories || [],
    media: mediaWithUrls,
    profiles: {
      id: nearbyService.stylist_id,
      full_name: nearbyService.stylist_full_name,
      stylist_details: nearbyService.stylist_bio
        ? {
          bio: nearbyService.stylist_bio,
          can_travel: nearbyService.stylist_can_travel,
          has_own_place: nearbyService.stylist_has_own_place,
          travel_distance_km: null, // Not available from RPC
        }
        : null,
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
