"use client";

import { useEffect, useRef, useMemo, useCallback } from "react";
import { useInfiniteQuery } from "@/hooks/use-infinite-query";
import type { SupabaseQueryHandler } from "@/hooks/use-infinite-query";
import { ServiceCard, type ServiceWithRelations } from "./service-card";
import { ServicesGridSkeleton } from "./services-grid-skeleton";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/kibo-ui/spinner";
import { createClient } from "@/lib/supabase/client";
import { getPublicUrl } from "@/lib/supabase/storage";
import type { ServiceFilters } from "@/types";

interface InfiniteServicesGridProps {
  filters?: ServiceFilters;
}

export function InfiniteServicesGrid({ filters = {} }: InfiniteServicesGridProps) {
  const supabase = createClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const isUnmountedRef = useRef(false);

  // Create the query handler that applies filters, joins, and sorting
  const createQueryHandler: SupabaseQueryHandler<"services"> = (query) => {
    // Apply filters first, then select
    let modifiedQuery = query.eq("is_published", true);

    // Apply search filter
    if (filters.search) {
      modifiedQuery = modifiedQuery.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    // Apply price filters
    if (filters.minPrice !== undefined) {
      modifiedQuery = modifiedQuery.gte("price", filters.minPrice * 100);
    }
    if (filters.maxPrice !== undefined) {
      modifiedQuery = modifiedQuery.lte("price", filters.maxPrice * 100);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case "price_asc":
        modifiedQuery = modifiedQuery.order("price", { ascending: true });
        break;
      case "price_desc":
        modifiedQuery = modifiedQuery.order("price", { ascending: false });
        break;
      case "newest":
      default:
        modifiedQuery = modifiedQuery.order("created_at", { ascending: false });
        break;
    }

    return modifiedQuery;
  };

  const {
    data: services,
    isLoading,
    isFetching,
    hasMore,
    fetchNextPage,
    error,
    isSuccess,
    count,
  } = useInfiniteQuery<ServiceWithRelations, "services">({
    tableName: "services",
    pageSize: 12,
    columns: `
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
    trailingQuery: createQueryHandler,
  });

  // Apply category filter on client side since it requires a separate query
  const filteredServices = services.filter((service) => {
    if (!filters.categoryId) return true;
    
    return service.service_service_categories?.some(
      (ssc) => ssc.service_categories.id === filters.categoryId
    );
  });

  // Transform services to add public URLs
  const servicesWithUrls = filteredServices.map((service) => ({
    ...service,
    media: service.media?.map((media) => ({
      ...media,
      publicUrl: media.file_path.startsWith('http') 
        ? media.file_path 
        : getPublicUrl(supabase, "service-media", media.file_path),
    })),
  }));

  // More robust hasMore calculation
  const actuallyHasMore = useMemo(() => {
    if (!isSuccess || !count) return hasMore;
    
    // If we have the same number or more services than the total count, we're done
    if (servicesWithUrls.length >= count) return false;
    
    // If the hook says no more, trust it
    if (!hasMore) return false;
    
    return true;
  }, [servicesWithUrls.length, count, hasMore, isSuccess]);

  // Create a stable fetch function with debouncing
  const fetchNextPageStable = useCallback(async () => {
    if (isUnmountedRef.current) return;
    
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    // Minimum 500ms between fetch attempts
    if (timeSinceLastFetch < 500) {
      console.log('Fetch debounced - too soon since last fetch');
      return;
    }
    
    if (!actuallyHasMore || isFetching) {
      console.log('Fetch skipped - no more data or already fetching');
      return;
    }
    
    console.log('Fetching next page...');
    lastFetchTimeRef.current = now;
    
    try {
      await fetchNextPage();
    } catch (error) {
      console.error('Error fetching next page:', error);
    }
  }, [actuallyHasMore, isFetching, fetchNextPage]);
  
  // Debug logging
  console.log('Infinite Query State:', {
    servicesCount: services.length,
    filteredCount: filteredServices.length,
    withUrlsCount: servicesWithUrls.length,
    totalCount: count,
    hasMore,
    actuallyHasMore,
    isFetching,
    isSuccess,
  });

  // Cleanup on unmount
  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
    };
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    console.log('Setting up intersection observer:', { hasMore: actuallyHasMore, isFetching });
    
    if (!actuallyHasMore) {
      console.log('Skipping observer setup - no more data');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        console.log('Observer triggered:', { 
          isIntersecting: entry.isIntersecting, 
          actuallyHasMore, 
          isFetching 
        });
        
        if (entry.isIntersecting) {
          fetchNextPageStable();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // Reduced margin to be less aggressive
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      console.log('Observing sentinel element');
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        console.log('Unobserving sentinel element');
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [actuallyHasMore, fetchNextPageStable]);

  if (isLoading) {
    return <ServicesGridSkeleton count={12} />;
  }

  if (error) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>Kunne ikke laste tjenester. Prøv igjen senere.</p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Prøv igjen
        </Button>
      </div>
    );
  }

  if (isSuccess && servicesWithUrls.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <h3 className="text-lg font-medium mb-2">Ingen tjenester funnet</h3>
        <p>Prøv å justere søkekriteriene dine eller kom tilbake senere.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {servicesWithUrls.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>

      {/* Load more trigger */}
      <div className="flex justify-center py-8">
        {isFetching && (
          <div className="flex items-center gap-2">
            <Spinner variant="circle" className="w-4 h-4" />
            <span>Laster flere tjenester...</span>
          </div>
        )}
        
        {!isFetching && actuallyHasMore && (
          <Button 
            variant="outline" 
            onClick={fetchNextPageStable}
            disabled={isFetching}
          >
            Last flere tjenester
          </Button>
        )}
        
        {!actuallyHasMore && servicesWithUrls.length > 0 && (
          <p className="text-muted-foreground">Du har sett alle tilgjengelige tjenester</p>
        )}
      </div>
      
      {/* Intersection observer sentinel - only render when there's more data */}
      {actuallyHasMore && <div ref={loadMoreRef} style={{ height: '1px' }} />}
    </div>
  );
}