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
import { X, ImageIcon, Trash2 } from "lucide-react";

import { useUploadReviewImages } from "@/hooks/use-upload-review-images";
import { upsertReview, deleteReview } from "@/server/review.actions";
import type { DatabaseTables } from "@/types";

const reviewFormSchema = z.object({
  rating: z.number().min(1, "Du må gi en vurdering").max(5),
  comment: z
    .string()
    .max(1000, "Kommentar kan ikke være lengre enn 1000 tegn")
    .optional(),
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;

interface ReviewFormProps {
  bookingId: string;
  stylistName: string;
  serviceTitles: string[];
  existingReview?: DatabaseTables["reviews"]["Row"] | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({
  bookingId,
  stylistName,
  serviceTitles,
  existingReview,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const uploadImagesMutation = useUploadReviewImages();

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
      toast.success(existingReview ? "Anmeldelse oppdatert!" : "Anmeldelse opprettet!");

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

  const handleSubmit = (data: ReviewFormData) => {
    reviewMutation.mutate(data);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const isLoading =
    reviewMutation.isPending || uploadImagesMutation.isUploading || deleteMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Service and stylist info */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            Vurder {stylistName} for tjenesten
          </h3>
          <p className="text-sm text-muted-foreground">
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
              <FormDescription>
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
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Valgfritt: Del dine tanker om tjenesten og stylisten
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image upload */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Bilder
            </label>
            <p className="text-sm text-muted-foreground mt-1">
              Last opp bilder av resultatet (valgfritt)
            </p>
          </div>

          {/* Show uploaded files */}
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <Badge key={index} variant="secondary" className="pr-1">
                  <ImageIcon className="w-3 h-3 mr-1" />
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          {/* Dropzone */}
          <Dropzone
            onDrop={(files) => {
              const imageFiles = files.filter((file) =>
                file.type.startsWith("image/")
              );
              if (imageFiles.length !== files.length) {
                toast.error("Bare bildefiler er tillatt");
              }
              setUploadedFiles((prev) => [...prev, ...imageFiles]);
            }}
            accept={{ "image/*": [] }}
            multiple
            maxFiles={5}
          >
            <DropzoneContent>
              <DropzoneEmptyState>
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Dra og slipp bilder her, eller klikk for å velge
                </p>
                <p className="text-xs text-muted-foreground">
                  Maks 5 bilder, kun bildefiler
                </p>
              </DropzoneEmptyState>
            </DropzoneContent>
          </Dropzone>
        </div>

        {/* Action buttons */}
        <div className="space-y-4 pt-4">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading && <Spinner className="w-4 h-4 mr-2" />}
              {reviewMutation.isPending
                ? existingReview ? "Oppdaterer anmeldelse..." : "Oppretter anmeldelse..."
                : uploadImagesMutation.isUploading
                  ? "Laster opp bilder..."
                  : existingReview ? "Oppdater anmeldelse" : "Publiser anmeldelse"}
            </Button>
          </div>

          {/* Delete button - only show for existing reviews */}
          {existingReview && (
            <div className="border-t pt-4">
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Slett anmeldelse</AlertDialogTitle>
                    <AlertDialogDescription>
                      Er du sikker på at du vil slette denne anmeldelsen? Denne handlingen kan ikke angres.
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
                      {deleteMutation.isPending && <Spinner className="w-4 h-4 mr-2" />}
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
