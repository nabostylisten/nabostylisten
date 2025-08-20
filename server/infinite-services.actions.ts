"use server";

import { createClient } from "@/lib/supabase/server";
import { getPublicUrl } from "@/lib/supabase/storage";
import type { ServiceFilters } from "@/types";
import type { ServiceWithRelations } from "@/components/services/service-card";

export interface InfiniteServicesResponse {
  services: ServiceWithRelations[];
  nextOffset?: number;
  hasMore: boolean;
  totalCount: number;
}

export async function fetchInfiniteServices(
  filters: ServiceFilters = {},
  limit: number = 12,
  offset: number = 0
): Promise<InfiniteServicesResponse> {
  const supabase = await createClient();

  const {
    search,
    categoryId,
    location,
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
      { count: "exact" }
    )
    .eq("is_published", true);

  // Apply search filter - focus only on service title and categories
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Apply category filter
  if (categoryId) {
    // Get service IDs that belong to this category
    const { data: serviceIds } = await supabase
      .from("service_service_categories")
      .select("service_id")
      .eq("category_id", categoryId);

    if (serviceIds && serviceIds.length > 0) {
      const ids = serviceIds.map((item) => item.service_id);
      query = query.in("id", ids);
    } else {
      // No services in this category, return empty result
      return {
        services: [],
        hasMore: false,
        totalCount: 0,
      };
    }
  }

  // Apply stylist filter
  if (stylistIds && stylistIds.length > 0) {
    query = query.in("stylist_id", stylistIds);
  }

  // Apply price filters
  if (minPrice !== undefined) {
    query = query.gte("price", minPrice * 100); // Convert to øre
  }
  if (maxPrice !== undefined) {
    query = query.lte("price", maxPrice * 100); // Convert to øre
  }

  // Apply location filter (if provided, filter by city)
  if (location) {
    query = query.eq("profiles.addresses.city", location);
  }

  // Apply sorting
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
    return {
      services: [],
      hasMore: false,
      totalCount: 0,
    };
  }

  // Add public URLs for media
  const servicesWithUrls: ServiceWithRelations[] = data.map((service) => ({
    ...service,
    media: service.media?.map((media) => ({
      ...media,
      // Use file_path as URL if it's already a full URL (Unsplash), otherwise use Supabase storage
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