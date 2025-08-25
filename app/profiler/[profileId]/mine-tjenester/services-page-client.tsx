"use client";

import * as React from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Scissors, ImageIcon, Search, Filter, CreditCard } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ServiceForm } from "@/components/service-form";
import { ServiceCategoryCombobox } from "@/components/service-category-combobox";
import { deleteService, getFilteredStylistServices, getServiceCategories } from "@/server/service.actions";
import { getCurrentUserStripeStatus } from "@/server/stripe.actions";
import { createClient } from "@/lib/supabase/client";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/types/database.types";
import type { ServiceFilters } from "@/types";
import { searchParamsToFilters, filtersToSearchParams } from "@/types";

type Service = Database["public"]["Tables"]["services"]["Row"] & {
  service_service_categories?: Array<{
    service_categories: {
      id: string;
      name: string;
      description?: string | null;
    };
  }>;
  media?: Array<{
    id: string;
    file_path: string;
    media_type: Database["public"]["Enums"]["media_type"];
    is_preview_image: boolean;
    created_at: string;
  }>;
};

interface ServicesPageClientProps {
  profileId: string;
}

export function ServicesPageClient({ profileId }: ServicesPageClientProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Modal state
  const [serviceFormOpen, setServiceFormOpen] = React.useState(false);
  const [serviceFormMode, setServiceFormMode] = React.useState<
    "create" | "edit"
  >("create");
  const [selectedService, setSelectedService] = React.useState<
    Service | undefined
  >();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [serviceToDelete, setServiceToDelete] = React.useState<
    Service | undefined
  >();

  // Check Stripe onboarding status
  const {
    data: stripeStatusResult,
    isLoading: isCheckingStripe,
    error: stripeError,
  } = useQuery({
    queryKey: ["current-user-stripe-status"],
    queryFn: () => getCurrentUserStripeStatus(),
    retry: false,
  });

  const isStripeFullyOnboarded = stripeStatusResult?.data?.isFullyOnboarded ?? false;

  // Redirect to Stripe onboarding if not fully onboarded
  React.useEffect(() => {
    if (!isCheckingStripe && stripeStatusResult && !isStripeFullyOnboarded && !stripeError) {
      router.push("/stylist/stripe");
    }
  }, [isCheckingStripe, stripeStatusResult, isStripeFullyOnboarded, stripeError, router]);
  
  // Filter state from URL
  const filters = React.useMemo(() => {
    const params = Object.fromEntries(searchParams.entries());
    return searchParamsToFilters(params);
  }, [searchParams]);
  
  // Local filter state for immediate updates
  const [search, setSearch] = React.useState(filters.search || "");
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    filters.categories || []
  );
  const [sortBy, setSortBy] = React.useState<ServiceFilters["sortBy"]>(
    filters.sortBy || "newest"
  );
  const [minPrice, setMinPrice] = React.useState(filters.minPrice || "");
  const [maxPrice, setMaxPrice] = React.useState(filters.maxPrice || "");
  const [currentPage, setCurrentPage] = React.useState(filters.page || 1);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["service-categories"],
    queryFn: () => getServiceCategories(),
    select: (data) => data.data || [],
  });
  
  // Fetch filtered services
  const {
    data: servicesResult,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["stylist-services", profileId, filters],
    queryFn: () => getFilteredStylistServices(profileId, { ...filters, page: currentPage }),
    select: (data) => data,
  });
  
  const services = servicesResult?.data || [];
  const totalPages = servicesResult?.totalPages || 0;
  const totalCount = servicesResult?.count || 0;

  // Helper function to get preview image URL
  const getPreviewImageUrl = (service: Service): string | null => {
    if (!service.media || service.media.length === 0) return null;

    // Filter only service images and sort them: preview first, then by creation date
    const serviceImages = service.media
      .filter((media) => media.media_type === "service_image")
      .sort((a, b) => {
        // Preview images first
        if (a.is_preview_image && !b.is_preview_image) return -1;
        if (!a.is_preview_image && b.is_preview_image) return 1;
        // Then by creation date (oldest first as fallback)
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

    if (serviceImages.length === 0) return null;

    // Use the first image from sorted array (preview or oldest)
    const imageToUse = serviceImages[0];

    const supabase = createClient();
    const { data } = supabase.storage
      .from("service-media")
      .getPublicUrl(imageToUse.file_path);

    return data.publicUrl;
  };

  // Delete service mutation
  const deleteMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const result = await deleteService(serviceId);
      if (result.error) {
        throw new Error(
          typeof result.error === "string" ? result.error : result.error.message
        );
      }
    },
    onSuccess: () => {
      toast.success("Tjeneste slettet!");
      setDeleteDialogOpen(false);
      setServiceToDelete(undefined);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["stylist-services"] });
    },
    onError: (error) => {
      toast.error(`Feil ved sletting: ${error.message}`);
    },
  });

  const handleCreateService = () => {
    // Don't allow creating services if not fully onboarded
    if (!isStripeFullyOnboarded) {
      router.push("/stylist/stripe");
      return;
    }
    
    setServiceFormMode("create");
    setSelectedService(undefined);
    setServiceFormOpen(true);
  };

  const handleEditService = (service: Service) => {
    setServiceFormMode("edit");
    setSelectedService(service);
    setServiceFormOpen(true);
  };

  const handleDeleteService = (service: Service) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (serviceToDelete) {
      deleteMutation.mutate(serviceToDelete.id);
    }
  };

  const handleFormSuccess = () => {
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["stylist-services"] });
  };
  
  // Update URL with new filters
  const updateFilters = React.useCallback((newFilters: Partial<ServiceFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    const searchParamsString = filtersToSearchParams(updatedFilters);
    const params = new URLSearchParams();
    Object.entries(searchParamsString).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, value.toString());
      }
    });
    router.push(params.toString() ? `?${params.toString()}` : window.location.pathname);
    setCurrentPage(1);
  }, [filters, router]);
  
  const handleSearch = () => {
    updateFilters({
      search: search.trim() || undefined,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      sortBy: sortBy !== "newest" ? sortBy : undefined,
      minPrice: minPrice.trim() || undefined,
      maxPrice: maxPrice.trim() || undefined,
    });
  };
  
  const handleClearFilters = () => {
    setSearch("");
    setSelectedCategories([]);
    setSortBy("newest");
    setMinPrice("");
    setMaxPrice("");
    // Clear all filters and trigger immediate search
    updateFilters({
      search: undefined,
      categories: undefined,
      sortBy: undefined,
      minPrice: undefined,
      maxPrice: undefined,
    });
  };
  
  const hasActiveFilters = 
    search ||
    selectedCategories.length > 0 ||
    sortBy !== "newest" ||
    minPrice ||
    maxPrice;
    
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateFilters({ page });
  };
  
  // Sync local state with URL params when they change
  React.useEffect(() => {
    setSearch(filters.search || "");
    setSelectedCategories(filters.categories || []);
    setSortBy(filters.sortBy || "newest");
    setMinPrice(filters.minPrice || "");
    setMaxPrice(filters.maxPrice || "");
    setCurrentPage(filters.page || 1);
  }, [filters]);

  const renderPaginationItems = () => {
    const items = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(i);
              }}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Show ellipsis for many pages
      if (currentPage <= 4) {
        // Show 1,2,3,4,5...last
        for (let i = 1; i <= 5; i++) {
          items.push(
            <PaginationItem key={i}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(i);
                }}
                isActive={currentPage === i}
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
        items.push(
          <PaginationItem key="ellipsis">
            <PaginationEllipsis />
          </PaginationItem>
        );
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(totalPages);
              }}
              isActive={currentPage === totalPages}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      } else if (currentPage >= totalPages - 3) {
        // Show first...second-to-last,last-1,last
        items.push(
          <PaginationItem key={1}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(1);
              }}
              isActive={currentPage === 1}
            >
              1
            </PaginationLink>
          </PaginationItem>
        );
        items.push(
          <PaginationItem key="ellipsis">
            <PaginationEllipsis />
          </PaginationItem>
        );
        for (let i = totalPages - 4; i <= totalPages; i++) {
          items.push(
            <PaginationItem key={i}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(i);
                }}
                isActive={currentPage === i}
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      } else {
        // Show first...current-1,current,current+1...last
        items.push(
          <PaginationItem key={1}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(1);
              }}
              isActive={currentPage === 1}
            >
              1
            </PaginationLink>
          </PaginationItem>
        );
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push(
            <PaginationItem key={i}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(i);
                }}
                isActive={currentPage === i}
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(totalPages);
              }}
              isActive={currentPage === totalPages}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  // Show loading state while checking Stripe status
  if (isCheckingStripe) {
    return (
      <>
        <BlurFade delay={0.1} duration={0.5} inView>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Scissors className="w-8 h-8" />
              <div>
                <h1 className="text-3xl font-bold">Mine tjenester</h1>
                <p className="text-muted-foreground mt-1">
                  Administrer dine tjenester og priser
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 animate-pulse" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </BlurFade>

        <BlurFade delay={0.15} duration={0.5} inView>
          <Card className="mb-6">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="md:w-48">
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-32 sm:w-auto" />
              </div>
            </CardContent>
          </Card>
        </BlurFade>

        <BlurFade delay={0.2} duration={0.5} inView>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="flex flex-col">
                <Skeleton className="aspect-[4/3] w-full rounded-t-lg" />
                <CardHeader className="pb-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent className="pt-0">
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </BlurFade>
      </>
    );
  }

  return (
    <>
      <BlurFade delay={0.1} duration={0.5} inView>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Scissors className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">Mine tjenester</h1>
              <p className="text-muted-foreground mt-1">
                Administrer dine tjenester og priser
              </p>
            </div>
          </div>
          <Button
            onClick={handleCreateService}
            className="flex items-center gap-2"
            disabled={isCheckingStripe || !isStripeFullyOnboarded}
          >
            <Plus className="w-4 h-4" />
            Ny tjeneste
          </Button>
        </div>
      </BlurFade>

      {/* Search and Filter Section */}
      <BlurFade delay={0.15} duration={0.5} inView>
        <Card className="mb-6">
          <CardContent className="p-6 space-y-4">
            {/* Search and Sort Row */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk etter tjeneste..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <div className="md:w-48">
                <Select
                  value={sortBy}
                  onValueChange={(value) =>
                    setSortBy(value as ServiceFilters["sortBy"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sorter etter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Nyeste først</SelectItem>
                    <SelectItem value="price_asc">Lavest pris først</SelectItem>
                    <SelectItem value="price_desc">Høyest pris først</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <ServiceCategoryCombobox
                  selectedCategories={selectedCategories}
                  onSelectedCategoriesChange={setSelectedCategories}
                  categories={categoriesData || []}
                  placeholder="Velg kategorier..."
                />
              </div>

              {/* Price Range - Min */}
              <div>
                <Input
                  type="number"
                  placeholder="Fra pris (kr)"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  min="0"
                  step="50"
                />
              </div>

              {/* Price Range - Max */}
              <div>
                <Input
                  type="number"
                  placeholder="Til pris (kr)"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  min="0"
                  step="50"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleSearch}
                className="flex-1 gap-2"
                disabled={isLoading}
              >
                <Search className="w-4 h-4" />
                {isLoading ? "Søker..." : "Søk"}
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="sm:w-auto"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Nullstill filtre
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </BlurFade>

      {/* Results Count and Pagination Info */}
      {!isLoading && (
        <BlurFade delay={0.2} duration={0.5} inView>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {totalCount > 0
                ? `Viser ${((currentPage - 1) * 12) + 1}-${Math.min(currentPage * 12, totalCount)} av ${totalCount} tjenester`
                : "Ingen tjenester funnet"}
            </p>
          </div>
        </BlurFade>
      )}

      {/* Loading State */}
      {isLoading && (
        <BlurFade delay={0.2} duration={0.5} inView>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="flex flex-col">
                <Skeleton className="aspect-[4/3] w-full rounded-t-lg" />
                <CardHeader className="pb-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent className="pt-0">
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </BlurFade>
      )}

      {/* Error State */}
      {error && (
        <BlurFade delay={0.2} duration={0.5} inView>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive mb-4">Feil ved lasting av tjenester</p>
              <Button onClick={() => window.location.reload()}>
                Prøv igjen
              </Button>
            </CardContent>
          </Card>
        </BlurFade>
      )}

      {/* Services Grid */}
      {!isLoading && !error && services && services.length > 0 ? (
        <BlurFade delay={0.2} duration={0.5} inView>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => {
              const previewImageUrl = getPreviewImageUrl(service);

              return (
                <BlurFade key={service.id} delay={index * 0.05} duration={0.5} inView>
                  <Card className="flex flex-col hover:shadow-lg transition-shadow duration-200 h-full">
                    {/* Service Image - Smaller for 3-column layout */}
                    <div className="relative aspect-[4/3] bg-muted rounded-t-lg overflow-hidden">
                      {previewImageUrl ? (
                        <Image
                          src={previewImageUrl}
                          alt={service.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <ImageIcon className="w-12 h-12" />
                        </div>
                      )}
                    </div>

                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl font-semibold text-foreground mb-3 line-clamp-2">
                        {service.title}
                      </CardTitle>
                      <div className="flex flex-col gap-2">
                        <div>
                          <span className="text-xs font-semibold text-muted-foreground mb-1 block">
                            Kategorier
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {service.service_service_categories?.length ? (
                              service.service_service_categories.map(
                                (relation) => (
                                  <Badge
                                    key={relation.service_categories.id}
                                    variant="secondary"
                                    className="text-xs font-medium"
                                  >
                                    {relation.service_categories.name}
                                  </Badge>
                                )
                              )
                            ) : (
                              <Badge
                                variant="secondary"
                                className="text-xs font-medium"
                              >
                                Ukategorisert
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-muted-foreground mb-1 block">
                            Leveringssted
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {service.at_customer_place && (
                              <Badge variant="outline" className="text-xs">
                                Hjemme hos kunde
                              </Badge>
                            )}
                            {service.at_stylist_place && (
                              <Badge variant="outline" className="text-xs">
                                På salong
                              </Badge>
                            )}
                            {!service.at_customer_place &&
                              !service.at_stylist_place && (
                                <Badge variant="outline" className="text-xs">
                                  Ikke spesifisert
                                </Badge>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-3 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditService(service)}
                        className="h-8 w-8 p-0 hover:bg-muted"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteService(service)}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between pt-0 pb-4">
                      {service.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                          {service.description}
                        </p>
                      )}
                      <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted-foreground">
                            Pris
                          </span>
                          <span className="text-lg font-bold text-foreground">
                            {service.price} kr
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted-foreground">
                            Varighet
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {service.duration_minutes} minutter
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </BlurFade>
              );
            })}
          </div>
        </BlurFade>
      ) : (
        !isLoading && !error && (
          <BlurFade delay={0.2} duration={0.5} inView>
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Scissors className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {hasActiveFilters ? "Ingen tjenester funnet" : "Ingen tjenester ennå"}
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {hasActiveFilters
                    ? "Prøv å justere søkekriteriene dine eller fjern noen filtre."
                    : "Du har ikke lagt til noen tjenester ennå. Kom i gang ved å opprette din første tjeneste."}
                </p>
                {hasActiveFilters ? (
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Nullstill filtre
                  </Button>
                ) : (
                  <Button
                    onClick={handleCreateService}
                    className="flex items-center gap-2"
                    disabled={isCheckingStripe || !isStripeFullyOnboarded}
                  >
                    <Plus className="w-4 h-4" />
                    Legg til første tjeneste
                  </Button>
                )}
              </CardContent>
            </Card>
          </BlurFade>
        )
      )}

      {/* Pagination - only show if more than 12 services total */}
      {!isLoading && !error && totalPages > 1 && (
        <BlurFade delay={0.25} duration={0.5} inView>
          <div className="flex justify-center mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) {
                        handlePageChange(currentPage - 1);
                      }
                    }}
                    className={
                      currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
                {renderPaginationItems()}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) {
                        handlePageChange(currentPage + 1);
                      }
                    }}
                    className={
                      currentPage >= totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </BlurFade>
      )}

      {/* Service Form Modal */}
      <ServiceForm
        open={serviceFormOpen}
        onOpenChange={setServiceFormOpen}
        mode={serviceFormMode}
        service={selectedService}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett tjeneste</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette tjenesten{" "}
              <span className="font-bold">{serviceToDelete?.title}</span>? Denne
              handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Sletter..." : "Slett"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
