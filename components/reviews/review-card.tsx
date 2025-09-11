"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Star, ChevronRight, Edit } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPublicUrl } from "@/lib/supabase/storage";
import { ReviewDialog } from "./review-dialog";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

type ReviewCardProps = {
  review: {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    customer?: {
      id: string;
      full_name: string | null;
    } | null;
    stylist?: {
      id: string;
      full_name: string | null;
    } | null;
    booking?: {
      id: string;
      start_time: string;
      booking_services?:
        | {
            services?: {
              id: string;
              title: string | null;
            } | null;
          }[]
        | null;
    } | null;
    media?:
      | {
          id: string;
          file_path: string;
          media_type: string;
        }[]
      | null;
  };
  viewType: "customer" | "stylist"; // who is viewing the review
};

export function ReviewCard({ review, viewType }: ReviewCardProps) {
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const reviewImages =
    review.media?.filter((m) => m.media_type === "review_image") || [];
  const displayPerson =
    viewType === "customer" ? review.stylist : review.customer;
  const services =
    review.booking?.booking_services
      ?.map((bs) => bs.services?.title)
      .filter(Boolean) || [];

  const supabase = createClient();

  const getImageUrl = (filePath: string) => {
    return getPublicUrl(supabase, "review-media", filePath);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-6">
        {isMobile ? (
          /* Mobile Layout: Optimized vertical flow */
          <div className="space-y-3">
            {/* Mobile Header: Avatar, name, and rating in one row */}
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                <AvatarFallback className="text-xs">
                  {displayPerson?.full_name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm break-words leading-tight">
                        {displayPerson?.full_name || "Ukjent bruker"}
                      </span>
                      {viewType === "customer" && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          Stylist
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(review.created_at), "d. MMM yyyy", {
                        locale: nb,
                      })}
                    </div>
                  </div>
                  
                  {/* Mobile Rating - Compact */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Services */}
            {services.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {services.slice(0, 3).map((service, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {service}
                  </Badge>
                ))}
                {services.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{services.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Mobile Comment */}
            {review.comment && (
              <div className="bg-muted/30 rounded-lg p-2 border-l-2 border-muted">
                <p className="text-xs leading-relaxed break-words text-muted-foreground">
                  {review.comment}
                </p>
              </div>
            )}

            {/* Mobile Images */}
            {reviewImages.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {reviewImages.slice(0, 3).map((image) => (
                  <div
                    key={image.id}
                    className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0"
                  >
                    <Image
                      src={getImageUrl(image.file_path)}
                      alt="Anmeldelse bilde"
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ))}
                {reviewImages.length > 3 && (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground font-medium">
                      +{reviewImages.length - 3}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Actions */}
            <div className="flex gap-2 pt-2">
              {viewType === "customer" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReviewDialogOpen(true)}
                  className="flex-1 justify-center"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Rediger
                </Button>
              )}
              {review.booking && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="flex-1 justify-center"
                >
                  <Link href={`/bookinger/${review.booking.id}`}>
                    Booking
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Desktop Layout: Traditional side-by-side */
          <div className="flex gap-4">
            {/* Desktop Avatar */}
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {displayPerson?.full_name?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              {/* Desktop Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-base break-words">
                      {displayPerson?.full_name || "Ukjent bruker"}
                    </span>
                    {viewType === "customer" && (
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        Stylist
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(review.created_at), "d. MMMM yyyy", {
                      locale: nb,
                    })}
                  </div>
                </div>

                {/* Desktop Rating */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Desktop Services */}
              {services.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {services.slice(0, 2).map((service, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                  {services.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{services.length - 2}
                    </Badge>
                  )}
                </div>
              )}

              {/* Desktop Comment */}
              {review.comment && (
                <p className="text-sm leading-relaxed break-words">{review.comment}</p>
              )}

              {/* Desktop Images */}
              {reviewImages.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {reviewImages.slice(0, 4).map((image) => (
                    <div
                      key={image.id}
                      className="relative w-16 h-16 rounded-md overflow-hidden"
                    >
                      <Image
                        src={getImageUrl(image.file_path)}
                        alt="Anmeldelse bilde"
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  ))}
                  {reviewImages.length > 4 && (
                    <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        +{reviewImages.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Desktop Actions */}
              <div className="flex justify-end items-center gap-2 pt-2 border-t">
                {viewType === "customer" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsReviewDialogOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Rediger anmeldelse
                  </Button>
                )}
                {review.booking && (
                  <Link
                    href={`/bookinger/${review.booking.id}`}
                    className={cn(
                      buttonVariants({
                        variant: "outline",
                        size: "sm",
                      }),
                      "flex items-center gap-2"
                    )}
                  >
                    Til booking
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Review Dialog for editing/deleting own reviews */}
      {viewType === "customer" && review.booking && (
        <ReviewDialog
          open={isReviewDialogOpen}
          onOpenChange={setIsReviewDialogOpen}
          bookingId={review.booking.id}
          stylistName={displayPerson?.full_name || "Stylisten"}
          serviceTitles={services.filter((s): s is string => Boolean(s))}
          existingReview={{
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            customer_id: review.customer?.id || "",
            stylist_id: review.stylist?.id || "",
            booking_id: review.booking.id,
            created_at: review.created_at,
            media: review.media || undefined,
          }}
        />
      )}
    </Card>
  );
}
