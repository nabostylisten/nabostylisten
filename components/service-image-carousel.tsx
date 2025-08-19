"use client";

import * as React from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Spinner } from "@/components/ui/kibo-ui/spinner";
import { Trash2, Star, StarOff, ImageIcon } from "lucide-react";
import {
  getServiceImages,
  deleteServiceImage,
  setServiceImageAsPreview,
} from "@/server/service.actions";
import type { Database } from "@/types/database.types";

type ServiceImage = Database["public"]["Tables"]["media"]["Row"] & {
  publicUrl: string;
};

interface ServiceImageCarouselProps {
  serviceId: string;
  isEditable?: boolean;
  className?: string;
}

export function ServiceImageCarousel({
  serviceId,
  isEditable = false,
  className,
}: ServiceImageCarouselProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [imageToDelete, setImageToDelete] = React.useState<ServiceImage | null>(
    null
  );
  const queryClient = useQueryClient();

  // Fetch service images
  const {
    data: images,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["service-images", serviceId],
    queryFn: async () => {
      const result = await getServiceImages(serviceId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
  });

  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: deleteServiceImage,
    onSuccess: () => {
      toast.success("Bilde slettet!");
      queryClient.invalidateQueries({
        queryKey: ["service-images", serviceId],
      });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(`Feil ved sletting: ${error.message}`);
    },
  });

  // Set preview mutation
  const setPreviewMutation = useMutation({
    mutationFn: setServiceImageAsPreview,
    onSuccess: async () => {
      // Invalidate all related queries
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["service-images", serviceId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["services"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["service", serviceId],
        }),
      ]);

      // Refetch to ensure we have the latest data
      await queryClient.refetchQueries({
        queryKey: ["service-images", serviceId],
      });

      toast.success("Hovedbilde oppdatert!");
    },
    onError: (error: Error) => {
      toast.error(`Feil ved oppdatering: ${error.message}`);
    },
  });

  const confirmDelete = () => {
    if (imageToDelete) {
      deleteMutation.mutate(imageToDelete.id);
    }
  };

  const handleSetPreview = (e: React.MouseEvent, imageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Setting preview for image:", imageId);
    setPreviewMutation.mutate(imageId);
  };

  const handleDeleteClick = (e: React.MouseEvent, image: ServiceImage) => {
    e.preventDefault();
    e.stopPropagation();
    setImageToDelete(image);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="w-6 h-6" />
        <span className="ml-2">Laster bilder...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <span>Feil ved lasting av bilder</span>
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center aspect-[4/5] rounded-lg border-2 border-dashed border-muted bg-muted/20 text-muted-foreground">
        <ImageIcon className="w-12 h-12 mb-2" />
        <span className="text-sm">Ingen bilder lagt til ennå</span>
      </div>
    );
  }

  return (
    <>
      <div className={className}>
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full px-12"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {images.map((image, index) => (
                <CarouselItem
                  key={image.id}
                  className="pl-2 md:pl-4 basis-full md:basis-1/2"
                >
                  <div className="relative group">
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={image.publicUrl}
                        alt={`Tjenestebilde ${index + 1}`}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />

                      {/* Preview badge */}
                      {image.is_preview_image && (
                        <Badge
                          variant="default"
                          className="absolute top-2 left-2 bg-primary text-primary-foreground"
                        >
                          Hovedbilde
                        </Badge>
                      )}

                      {/* Action buttons (only in edit mode) */}
                      {isEditable && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={(e) => handleSetPreview(e, image.id)}
                            disabled={
                              image.is_preview_image ||
                              setPreviewMutation.isPending
                            }
                            className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-black"
                            title={
                              image.is_preview_image
                                ? "Dette er hovedbildet"
                                : "Sett som hovedbilde"
                            }
                          >
                            {image.is_preview_image ? (
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ) : (
                              <StarOff className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={(e) => handleDeleteClick(e, image)}
                            disabled={deleteMutation.isPending}
                            className="h-8 w-8 p-0 bg-white/90 hover:bg-destructive/90 text-black hover:text-white"
                            title="Slett bilde"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {images.length > 2 && (
              <>
                <CarouselPrevious
                  className="absolute top-1/2 left-2 -translate-y-1/2 size-8 rounded-full z-10 bg-white/90 hover:bg-white border shadow-md"
                  type="button"
                />
                <CarouselNext
                  className="absolute top-1/2 right-2 -translate-y-1/2 size-8 rounded-full z-10 bg-white/90 hover:bg-white border shadow-md"
                  type="button"
                />
              </>
            )}
          </Carousel>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett bilde</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette dette bildet? Denne handlingen
              kan ikke angres.
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
