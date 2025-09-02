"use client";

import React from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ImageIcon, TestTube } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

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
    publicUrl?: string;
  }>;
};

interface StylistServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}

export function StylistServiceCard({
  service,
  onEdit,
  onDelete,
}: StylistServiceCardProps) {
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

    // Use publicUrl if available, otherwise generate it
    if (imageToUse.publicUrl) {
      return imageToUse.publicUrl;
    }

    // Fall back to generating the URL (for cases where publicUrl might not be set)
    if (imageToUse.file_path.startsWith("https://images.unsplash.com/")) {
      return imageToUse.file_path;
    }

    const supabase = createClient();
    const { data } = supabase.storage
      .from("service-media")
      .getPublicUrl(imageToUse.file_path);

    return data.publicUrl;
  };

  const previewImageUrl = getPreviewImageUrl(service);

  return (
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
            <CardTitle className="text-xl font-semibold text-foreground mb-4 line-clamp-2">
              {service.title}
            </CardTitle>

            {/* Metadata Grid - Responsive Layout */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {/* Categories */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground block">
                  Kategorier
                </span>
                <div className="flex flex-wrap gap-1">
                  {service.service_service_categories?.length ? (
                    service.service_service_categories.map((relation) => (
                      <Badge
                        key={relation.service_categories.id}
                        variant="secondary"
                        className="text-xs font-medium"
                      >
                        {relation.service_categories.name}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="secondary" className="text-xs font-medium">
                      Ukategorisert
                    </Badge>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground block">
                  Leveringssted
                </span>
                <div className="flex flex-wrap gap-1">
                  {service.at_customer_place && (
                    <Badge variant="outline" className="text-xs">
                      Hos kunde
                    </Badge>
                  )}
                  {service.at_stylist_place && (
                    <Badge variant="outline" className="text-xs">
                      På salong
                    </Badge>
                  )}
                  {!service.at_customer_place && !service.at_stylist_place && (
                    <Badge variant="outline" className="text-xs">
                      Ikke spesifisert
                    </Badge>
                  )}
                </div>
              </div>

              {/* Published Status */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground block">
                  Status
                </span>
                <Badge
                  variant={service.is_published ? "default" : "secondary"}
                  className={
                    service.is_published
                      ? "text-xs bg-green-100 text-green-700 border-green-200 hover:bg-green-200 w-fit"
                      : "text-xs w-fit"
                  }
                >
                  {service.is_published ? "Publisert" : "Ikke publisert"}
                </Badge>
              </div>

              {/* Trial Session Info - Full width when present */}
              {service.has_trial_session && (
                <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2 space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    Prøvetime
                  </span>
                  <div className="flex items-center flex-wrap gap-2">
                    <Badge
                      variant="default"
                      className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200"
                    >
                      <TestTube className="w-3 h-3 mr-1" />
                      Tilgjengelig
                    </Badge>
                    {service.trial_session_price && (
                      <Badge variant="outline" className="text-xs">
                        {service.trial_session_price} kr
                      </Badge>
                    )}
                    {service.trial_session_duration_minutes && (
                      <Badge variant="outline" className="text-xs">
                        {service.trial_session_duration_minutes} min
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1 ml-3 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(service)}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(service)}
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
  );
}
