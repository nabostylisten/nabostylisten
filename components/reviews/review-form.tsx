"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/kibo-ui/spinner";
import { Rating, RatingButton } from "@/components/ui/kibo-ui/rating";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/kibo-ui/dropzone";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { X, ImageIcon, Trash2, Upload as UploadIcon } from "lucide-react";
import Image from "next/image";

import { useUploadReviewImages } from "@/hooks/use-upload-review-images";
import { upsertReview, deleteReview, deleteReviewImage } from "@/server/review.actions";
import { createClient } from "@/lib/supabase/client";
import { getPublicUrl } from "@/lib/supabase/storage";
import type { DatabaseTables } from "@/types";

const reviewFormSchema = z.object({
  rating: z.number().min(1, "Du må gi en vurdering").max(5),
  comment: z
    .string()
    .max(1000, "Kommentar kan ikke være lengre enn 1000 tegn")
    .optional(),
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;

type ReviewWithMedia = DatabaseTables["reviews"]["Row"] & {
  media?: Array<{
    id: string;
    file_path: string;
    media_type: string;
  }>;
};

type ReviewImageWithPublicUrl = {
  id: string;
  file_path: string;
  media_type: string;
  publicUrl: string;
};

interface ReviewFormProps {
  bookingId: string;
  stylistName: string;
  serviceTitles: string[];
  existingReview?: ReviewWithMedia | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Helper function to truncate filename
const truncateFilename = (filename: string, maxLength: number = 25): string => {
  if (filename.length <= maxLength) return filename;
  
  const extension = filename.split('.').pop() || '';
  const nameWithoutExt = filename.slice(0, filename.lastIndexOf('.'));
  const truncatedName = nameWithoutExt.slice(0, maxLength - extension.length - 4); // -4 for "..." + "."
  
  return `${truncatedName}...${extension}`;
};

// Custom dropzone content with truncated filenames
const TruncatedDropzoneContent = ({ files }: { files: File[] }) => {
  const maxLabelItems = 3;
  
  // Show default empty state when no files
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="my-2 w-full break-words text-wrap font-medium text-sm">
          Dra og slipp bilder her, eller klikk for å velge
        </p>
        <p className="w-full text-wrap break-words text-muted-foreground text-xs">
          Maks 5 bilder, kun bildefiler
        </p>
      </div>
    );
  }
  
  // Show files when they exist
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <UploadIcon size={16} />
      </div>
      <p className="my-2 w-full break-words text-wrap font-medium text-sm">
        {files.length > maxLabelItems
          ? `${new Intl.ListFormat("nb-NO").format(
              files.slice(0, maxLabelItems).map((file) => truncateFilename(file.name))
            )} og ${files.length - maxLabelItems} flere`
          : new Intl.ListFormat("nb-NO").format(files.map((file) => truncateFilename(file.name)))}
      </p>
      <p className="w-full text-wrap break-words text-muted-foreground text-xs">
        Dra og slipp eller klikk for å erstatte
      </p>
    </div>
  );
};

export function ReviewForm({
  bookingId,
  stylistName,
  serviceTitles,
  existingReview,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);
  const [fileProcessing, setFileProcessing] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [existingImages, setExistingImages] = React.useState<ReviewImageWithPublicUrl[]>([]);
  const queryClient = useQueryClient();
  const uploadImagesMutation = useUploadReviewImages();
  
  // Update existing images when existingReview changes and generate public URLs
  React.useEffect(() => {
    const supabase = createClient();
    const images = existingReview?.media?.filter((m) => m.media_type === "review_image") || [];
    
    // Generate public URLs for existing images
    const imagesWithPublicUrls = images.map(image => ({
      ...image,
      publicUrl: getPublicUrl(supabase, "review-media", image.file_path)
    }));
    
    setExistingImages(imagesWithPublicUrls);
  }, [existingReview]);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: existingReview?.rating || 0,
      comment: existingReview?.comment || "",
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const reviewData: DatabaseTables["reviews"]["Insert"] = {
        booking_id: bookingId,
        rating: data.rating,
        comment: data.comment || null,
        customer_id: "", // Will be set by the server action
        stylist_id: "", // Will be set by the server action
      };

      const result = await upsertReview(reviewData);
      if (result.error) {
        throw new Error(
          typeof result.error === "string" ? result.error : result.error.message
        );
      }
      return result.data;
    },
    onSuccess: async (data) => {
      toast.success(
        existingReview ? "Anmeldelse oppdatert!" : "Anmeldelse opprettet!"
      );

      // Upload images if any were selected
      if (uploadedFiles.length > 0 && data?.id) {
        try {
          toast.info(`Laster opp ${uploadedFiles.length} bilde(r)...`);
          await uploadImagesMutation.mutateAsync({
            reviewId: data.id,
            files: uploadedFiles,
          });
        } catch (error) {
          console.error("Failed to upload images:", error);
          toast.error("Anmeldelse opprettet, men kunne ikke laste opp bilder");
        }
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["review", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({
        queryKey: ["completedBookingsWithoutReviews"],
      });

      form.reset();
      setUploadedFiles([]);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(
        `Feil ved ${existingReview ? "oppdatering" : "opprettelse"} av anmeldelse: ${error.message}`
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!existingReview?.id) {
        throw new Error("Ingen anmeldelse å slette");
      }

      const result = await deleteReview(existingReview.id);
      if (result.error) {
        throw new Error(
          typeof result.error === "string" ? result.error : result.error.message
        );
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Anmeldelse slettet!");

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["review", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({
        queryKey: ["completedBookingsWithoutReviews"],
      });

      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Feil ved sletting av anmeldelse: ${error.message}`);
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: deleteReviewImage,
    onSuccess: (data) => {
      if (data.data?.id) {
        // Remove the image from local state
        setExistingImages(prev => prev.filter(img => img.id !== data.data.id));
        toast.success("Bilde slettet!");
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["review", bookingId] });
      }
    },
    onError: (error) => {
      toast.error(`Feil ved sletting av bilde: ${error.message}`);
    },
  });

  const handleDeleteImage = (imageId: string) => {
    deleteImageMutation.mutate(imageId);
  };

  const handleSubmit = (data: ReviewFormData) => {
    reviewMutation.mutate(data);
  };

  const handleDrop = async (files: File[]) => {
    setFileProcessing(true);
    try {
      const processedFiles: File[] = [];
      for (const file of files) {
        if (file.type.startsWith("image/")) {
          processedFiles.push(file);
        }
      }
      if (processedFiles.length > 0) {
        setUploadedFiles((prev) => [...prev, ...processedFiles]);
        toast.success(`${processedFiles.length} bilde(r) klar for opplasting`);
      }
      if (processedFiles.length !== files.length) {
        toast.error("Bare bildefiler er tillatt");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Feil ved behandling av filer";
      toast.error("En feil oppstod ved behandling av filer", {
        description: message,
      });
    } finally {
      setFileProcessing(false);
    }
  };

  const isLoading =
    reviewMutation.isPending ||
    uploadImagesMutation.isUploading ||
    deleteMutation.isPending ||
    deleteImageMutation.isPending ||
    fileProcessing;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Service and stylist info */}
        <div className="space-y-2">
          <h3 className="text-base sm:text-lg font-semibold break-words">
            Vurder {stylistName} for tjenesten
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground break-words">
            {serviceTitles.length > 0
              ? serviceTitles.length === 1
                ? serviceTitles[0]
                : `${serviceTitles[0]} +${serviceTitles.length - 1} til`
              : "Tjeneste"}
          </p>
        </div>

        {/* Rating */}
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vurdering *</FormLabel>
              <FormControl>
                <Rating
                  value={field.value}
                  onValueChange={field.onChange}
                  className="text-yellow-500"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <RatingButton key={star} />
                  ))}
                </Rating>
              </FormControl>
              <FormDescription className="break-words">
                Klikk på stjernene for å gi en vurdering fra 1 til 5
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Comment */}
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kommentar</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Fortell om din opplevelse..."
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormDescription className="break-words">
                Valgfritt: Del dine tanker om tjenesten og stylisten
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 break-words">
                Eksisterende bilder
              </label>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                Bilder du har lastet opp tidligere
              </p>
            </div>
            
            <div className="aspect-video bg-muted rounded-xl relative overflow-hidden">
              {existingImages.length === 1 ? (
                <div className="aspect-video relative group">
                  <Image
                    src={existingImages[0].publicUrl}
                    alt={`Anmeldelse bilde`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(existingImages[0].id)}
                    disabled={isLoading}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Carousel
                  className="w-full h-full"
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                >
                  <CarouselContent>
                    {existingImages.map((image) => (
                      <CarouselItem key={image.id}>
                        <div className="aspect-video relative group">
                          <Image
                            src={image.publicUrl}
                            alt={`Anmeldelse bilde`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(image.id)}
                            disabled={isLoading}
                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious 
                    type="button"
                    className="left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border-0 shadow-md" 
                  />
                  <CarouselNext 
                    type="button"
                    className="right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border-0 shadow-md" 
                  />
                </Carousel>
              )}
            </div>
          </div>
        )}

        {/* New Image upload */}
        <div className="space-y-4">
          <div>
            <label className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 break-words">
              {existingImages.length > 0 ? "Last opp flere bilder" : "Bilder"}
            </label>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
              Last opp bilder av resultatet (valgfritt)
            </p>
          </div>
          
          <Dropzone
            accept={{ "image/*": [] }}
            maxFiles={5}
            maxSize={1024 * 1024 * 10} // 10MB
            minSize={1024} // 1KB
            onDrop={handleDrop}
            onError={(error) => {
              toast.error(`Feil ved opplasting: ${error.message}`);
            }}
            src={uploadedFiles}
            disabled={isLoading}
          >
            <DropzoneEmptyState>
              {fileProcessing ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  </div>
                  <p className="my-2 w-full break-words text-wrap font-medium text-sm">
                    Behandler bilder...
                  </p>
                  <p className="w-full break-words text-wrap text-muted-foreground text-xs">
                    Komprimerer og validerer filer
                  </p>
                </div>
              ) : null}
            </DropzoneEmptyState>
            <TruncatedDropzoneContent files={uploadedFiles} />
          </Dropzone>
          
          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs sm:text-sm font-medium break-words">
                {uploadedFiles.length} bilde(r) klar for opplasting:
              </p>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-muted px-2 py-1 rounded-md text-xs sm:text-sm min-w-0"
                  >
                    <span className="break-words min-w-0 flex-1">
                      {truncateFilename(file.name, 20)}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {(file.size / 1024 / 1024).toFixed(1)}MB
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newFiles = [...uploadedFiles];
                        newFiles.splice(index, 1);
                        setUploadedFiles(newFiles);
                        toast.success("Bilde fjernet");
                      }}
                      className="text-muted-foreground hover:text-destructive ml-1"
                      disabled={isLoading}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:flex-1">
              {isLoading && <Spinner className="w-4 h-4 mr-2" />}
              <span className="break-words">
                {reviewMutation.isPending
                  ? existingReview
                    ? "Oppdaterer anmeldelse..."
                    : "Oppretter anmeldelse..."
                  : uploadImagesMutation.isUploading
                    ? "Laster opp bilder..."
                    : existingReview
                      ? "Oppdater anmeldelse"
                      : "Publiser anmeldelse"}
              </span>
            </Button>
          </div>

          {/* Delete button - only show for existing reviews */}
          {existingReview && (
            <div className="border-t pt-4">
              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Slett anmeldelse
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-[425px]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="break-words">Slett anmeldelse</AlertDialogTitle>
                    <AlertDialogDescription className="break-words">
                      Er du sikker på at du vil slette denne anmeldelsen? Denne
                      handlingen kan ikke angres.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteMutation.isPending}>
                      Avbryt
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        deleteMutation.mutate();
                        setIsDeleteDialogOpen(false);
                      }}
                      disabled={deleteMutation.isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleteMutation.isPending && (
                        <Spinner className="w-4 h-4 mr-2" />
                      )}
                      Slett anmeldelse
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </form>
    </Form>
  );
}
