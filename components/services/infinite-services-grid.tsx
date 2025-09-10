"use client";

import { useEffect, useRef, useState } from "react";
import { debounce } from "lodash";
import { motion } from "framer-motion";
import { ServiceCard, type ServiceWithRelations } from "./service-card";
import { ServicesGridSkeleton } from "./services-grid-skeleton";
import { Spinner } from "@/components/ui/kibo-ui/spinner";
import { fetchInfiniteServices } from "@/server/infinite-services.actions";
import type { ServiceFilters } from "@/types";

interface InfiniteServicesGridProps {
  filters?: ServiceFilters;
}

const PAGE_COUNT = 12;

export function InfiniteServicesGrid({
  filters = {},
}: InfiniteServicesGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadedServices, setLoadedServices] = useState<ServiceWithRelations[]>([]);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isLast, setIsLast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const handleScroll = () => {
    if (containerRef.current && typeof window !== "undefined") {
      const container = containerRef.current;
      const { bottom } = container.getBoundingClientRect();
      const { innerHeight } = window;
      setIsInView(bottom <= innerHeight + 200); // Trigger 200px before reaching bottom
    }
  };

  useEffect(() => {
    const handleDebouncedScroll = debounce(() => !isLast && handleScroll(), 200);
    window.addEventListener("scroll", handleDebouncedScroll);
    return () => {
      window.removeEventListener("scroll", handleDebouncedScroll);
    };
  }, [isLast]);

  useEffect(() => {
    if (isInView && !isFetching && !isLast) {
      loadMoreServices(offset);
    }
  }, [isInView, offset, isFetching, isLast]);

  const loadMoreServices = async (currentOffset: number) => {
    setIsFetching(true);
    setError(null);

    try {
      const result = await fetchInfiniteServices(filters, PAGE_COUNT, currentOffset);
      
      if (result.services.length < PAGE_COUNT) {
        setIsLast(true);
      }

      // For initial load or when filters change, replace the array completely to preserve sort order
      // For infinite scroll (currentOffset > 0), append new services
      setLoadedServices((prevServices) => {
        if (currentOffset === 0) {
          // Initial load or filter change - replace completely to preserve sort order
          return result.services;
        } else {
          // Infinite scroll - merge new services, avoiding duplicates
          const existingIds = new Set(prevServices.map(service => service.id));
          const newServices = result.services.filter(service => !existingIds.has(service.id));
          return [...prevServices, ...newServices];
        }
      });

      // Increment offset for next load
      setOffset(currentOffset + PAGE_COUNT);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load services");
    }

    setIsFetching(false);
  };

  // Initial load
  useEffect(() => {
    if (!hasInitialLoad) {
      setHasInitialLoad(true);
      loadMoreServices(0).finally(() => setIsLoading(false));
    }
  }, [hasInitialLoad, filters]);

  // Reset when filters change
  useEffect(() => {
    setLoadedServices([]);
    setOffset(0);
    setIsLast(false);
    setError(null);
    setHasInitialLoad(false);
    setIsLoading(true);
  }, [JSON.stringify(filters)]);

  if (isLoading) {
    return <ServicesGridSkeleton count={12} />;
  }

  if (error) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>Kunne ikke laste tjenester: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Prøv igjen
        </button>
      </div>
    );
  }

  if (loadedServices.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <h3 className="text-lg font-medium mb-2">Ingen tjenester funnet</h3>
        <p>Prøv å justere søkekriteriene dine eller kom tilbake senere.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadedServices.map((service, index) => {
          // Calculate delay based on service index, but reset every PAGE_COUNT to avoid overly long delays
          const recalculatedDelay = index >= PAGE_COUNT * 2 
            ? (index - PAGE_COUNT * Math.floor(offset / PAGE_COUNT)) / 15 
            : index / 15;

          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                ease: [0.25, 0.25, 0, 1],
                delay: Math.min(recalculatedDelay, 0.8), // Cap delay at 0.8s
              }}
            >
              <ServiceCard service={service} />
            </motion.div>
          );
        })}
      </div>

      {/* Loading indicator */}
      {isFetching && (
        <div className="flex justify-center items-center py-8">
          <div className="flex items-center gap-2">
            <Spinner variant="circle" className="w-4 h-4" />
            <span>Laster flere tjenester...</span>
          </div>
        </div>
      )}

      {/* End message */}
      {isLast && !isFetching && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Du har sett alle tilgjengelige tjenester
          </p>
        </div>
      )}
    </div>
  );
}
