"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";

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
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "ArrowLeft") {
            handlePrevious();
        } else if (event.key === "ArrowRight") {
            handleNext();
        } else if (event.key === "Escape") {
            onOpenChange(false);
        }
    };

    if (images.length === 0) return null;

    const currentImage = images[currentIndex];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-4xl w-full h-[90vh] p-0"
                onKeyDown={handleKeyDown}
            >
                <DialogHeader className="p-4 pb-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-sm font-medium">
                            {currentIndex + 1} / {images.length}
                        </DialogTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 relative flex items-center justify-center p-4">
                    {/* Navigation arrows */}
                    {images.length > 1 && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute left-4 z-10 bg-black/20 hover:bg-black/40 text-white"
                                onClick={handlePrevious}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-4 z-10 bg-black/20 hover:bg-black/40 text-white"
                                onClick={handleNext}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </>
                    )}

                    {/* Main image */}
                    <div className="relative w-full h-full flex items-center justify-center">
                        <Image
                            src={currentImage.url}
                            alt={`Bilde ${currentIndex + 1} av ${images.length}`}
                            fill
                            className="object-contain rounded-lg"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                        />
                    </div>
                </div>

                {/* Thumbnail navigation */}
                {images.length > 1 && (
                    <div className="flex gap-2 p-4 pt-0 overflow-x-auto">
                        {images.map((image, index) => (
                            <button
                                key={image.id}
                                onClick={() => setCurrentIndex(index)}
                                className={`relative w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                                    index === currentIndex
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
            </DialogContent>
        </Dialog>
    );
};