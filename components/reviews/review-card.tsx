"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";

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
      booking_services?: {
        services?: {
          id: string;
          title: string | null;
        } | null;
      }[] | null;
    } | null;
    media?: {
      id: string;
      file_path: string;
      media_type: string;
    }[] | null;
  };
  viewType: "customer" | "stylist"; // who is viewing the review
};

export function ReviewCard({ review, viewType }: ReviewCardProps) {
  const reviewImages = review.media?.filter((m) => m.media_type === "review_image") || [];
  const displayPerson = viewType === "customer" ? review.stylist : review.customer;
  const services = review.booking?.booking_services?.map((bs) => bs.services?.title).filter(Boolean) || [];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Avatar */}
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {displayPerson?.full_name?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {displayPerson?.full_name || "Ukjent bruker"}
                  </span>
                  {viewType === "customer" && (
                    <Badge variant="outline" className="text-xs">
                      Stylist
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(review.created_at), "d. MMMM yyyy", { locale: nb })}
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1">
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

            {/* Service info */}
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

            {/* Comment */}
            {review.comment && (
              <p className="text-sm leading-relaxed">
                {review.comment}
              </p>
            )}

            {/* Images */}
            {reviewImages.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {reviewImages.slice(0, 4).map((image) => (
                  <div
                    key={image.id}
                    className="relative w-16 h-16 rounded-md overflow-hidden"
                  >
                    <Image
                      src={image.file_path}
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

            {/* Booking link */}
            {review.booking && (
              <div className="pt-2 border-t">
                <Link
                  href={`/bookinger/${review.booking.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  Se booking detaljer
                </Link>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}