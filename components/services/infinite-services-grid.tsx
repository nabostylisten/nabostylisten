"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ServiceCard, type ServiceWithRelations } from "./service-card";
import { ServicesGridSkeleton } from "./services-grid-skeleton";
import { Spinner } from "@/components/ui/kibo-ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { fetchInfiniteServices } from "@/server/infinite-services.actions";
import type { ServiceFilters } from "@/types";

interface InfiniteServicesGridProps {
  filters?: ServiceFilters;
}

// Helper function to calculate grid columns based on window width
// Matches Tailwind CSS breakpoints: sm (640px), md (768px), lg (1024px)
function getColumnsCount(): number {
  if (typeof window === 'undefined') return 3; // SSR fallback
  
  const width = window.innerWidth;
  if (width >= 1024) return 3; // lg and up: 3 columns
  if (width >= 768) return 2;  // md: 2 columns
  return 1; // sm and below: 1 column
}

// Helper function to chunk array into rows based on columns
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

export function InfiniteServicesGrid({ filters = {} }: InfiniteServicesGridProps) {
  const [columnsCount, setColumnsCount] = useState(3); // Default to 3 columns
  const parentRef = useRef<HTMLDivElement>(null);

  // TanStack Query for infinite data fetching
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['infinite-services', filters],
    queryFn: ({ pageParam = 0 }) => 
      fetchInfiniteServices(filters, 12, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
  });

  // Flatten all pages into a single array of services
  const allServices: ServiceWithRelations[] = data 
    ? data.pages.flatMap((page) => page.services)
    : [];
  
  // Group services into rows based on responsive columns
  const serviceRows = chunkArray(allServices, columnsCount);
  
  // Add a loader row if we have more data to fetch
  if (hasNextPage) {
    serviceRows.push([]); // Empty row for loader
  }

  // Update columns count on window resize
  useEffect(() => {
    const updateColumns = () => {
      setColumnsCount(getColumnsCount());
    };

    // Set initial value
    updateColumns();
    
    // Listen to window resize
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Debug log to check column count
  console.log('Current columns:', columnsCount, 'Window width:', typeof window !== 'undefined' ? window.innerWidth : 'SSR');

  // TanStack Virtual for row virtualization
  const rowVirtualizer = useVirtualizer({
    count: serviceRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 480, // Increased height to account for more spacing
    overscan: 2,
  });

  // Effect to trigger fetching next page when we reach the end
  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();

    if (!lastItem) return;

    if (
      lastItem.index >= serviceRows.length - 2 && // Trigger before the last row
      hasNextPage &&
      !isFetchingNextPage
    ) {
      console.log('Fetching next page via virtualizer...');
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    serviceRows.length,
    isFetchingNextPage,
    rowVirtualizer.getVirtualItems(),
  ]);

  if (status === 'pending') {
    return <ServicesGridSkeleton count={12} />;
  }

  if (status === 'error') {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>Kunne ikke laste tjenester: {(error as Error)?.message}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Prøv igjen
        </button>
      </div>
    );
  }

  if (allServices.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <h3 className="text-lg font-medium mb-2">Ingen tjenester funnet</h3>
        <p>Prøv å justere søkekriteriene dine eller kom tilbake senere.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card className="border-2 shadow-lg">
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-muted-foreground">
              {allServices.length > 0 
                ? `${allServices.length} tjenester funnet`
                : 'Søker etter tjenester...'
              }
            </h3>
            <p className="text-sm text-muted-foreground">
              Bla gjennom tjenester nedenfor
            </p>
          </div>
          
          {/* Virtualized scrollable container */}
          <div
            ref={parentRef}
            className="max-h-[70vh] overflow-auto w-full rounded-lg border bg-card"
            style={{
              contain: 'layout style paint',
            }}
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = serviceRows[virtualRow.index];
                const isLoaderRow = !row || row.length === 0;

                return (
                  <div
                    key={virtualRow.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {isLoaderRow ? (
                      <div className="flex justify-center items-center h-full py-12">
                        {hasNextPage ? (
                          <div className="flex items-center gap-2">
                            <Spinner variant="circle" className="w-4 h-4" />
                            <span>Laster flere tjenester...</span>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">
                            Du har sett alle tilgjengelige tjenester
                          </p>
                        )}
                      </div>
                    ) : (
                      <div 
                        className="grid gap-6 p-4 pb-8"
                        style={{
                          gridTemplateColumns: `repeat(${columnsCount}, 1fr)`,
                        }}
                      >
                        {row.map((service) => (
                          <ServiceCard key={service.id} service={service} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Background fetching indicator */}
          {isFetching && !isFetchingNextPage && (
            <div className="text-center py-4 mt-4 border-t">
              <span className="text-sm text-muted-foreground">
                Oppdaterer i bakgrunnen...
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}