"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface ImageGalleryDialogProps {
  images: Array<{
    id: string;
    file_path: string;
    url: string;
  }>;
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImageGalleryDialog = ({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
}: ImageGalleryDialogProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });

    // Set initial slide
    if (initialIndex > 0) {
      api.scrollTo(initialIndex);
    }
  }, [api, initialIndex]);

  if (images.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full h-[95vh] p-0">
        <div className="flex flex-col h-full">
          {/* Image counter badge */}
          <div className="flex justify-center pt-4">
            <Badge variant="secondary" className="text-sm">
              {current} / {images.length}
            </Badge>
          </div>

          {/* Main carousel */}
          <div className="flex-1 p-4">
            <Carousel
              setApi={setApi}
              className="w-full h-full"
              opts={{
                align: "center",
                loop: true,
              }}
            >
              <CarouselContent className="h-full">
                {images.map((image, index) => (
                  <CarouselItem key={image.id} className="h-full">
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Image
                        src={image.url}
                        alt={`Bilde ${index + 1} av ${images.length}`}
                        fill
                        className="object-contain rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {images.length > 1 && (
                <>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </>
              )}
            </Carousel>
          </div>

          {/* Thumbnail navigation */}
          {images.length > 1 && (
            <div className="flex gap-2 p-4 pt-0 overflow-x-auto justify-center">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => api?.scrollTo(index)}
                  className={`relative w-16 h-16 rounded-md overflow-hidden border-2 transition-colors flex-shrink-0 ${
                    index === current - 1
                      ? "border-primary"
                      : "border-transparent hover:border-border"
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
