"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReviewForm } from "./review-form";
import type { DatabaseTables } from "@/types";

type ReviewWithMedia = DatabaseTables["reviews"]["Row"] & {
  media?: Array<{
    id: string;
    file_path: string;
    media_type: string;
  }>;
};

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  stylistName: string;
  serviceTitles: string[];
  existingReview?: ReviewWithMedia | null;
}

export function ReviewDialog({
  open,
  onOpenChange,
  bookingId,
  stylistName,
  serviceTitles,
  existingReview,
}: ReviewDialogProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[500px] overflow-y-scroll max-h-screen">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl break-words">
            {existingReview ? "Rediger anmeldelse" : "Legg til anmeldelse"}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base break-words">
            {existingReview 
              ? "Oppdater din anmeldelse og del din opplevelse"
              : "Del din opplevelse med andre brukere ved å skrive en anmeldelse"
            }
          </DialogDescription>
        </DialogHeader>
        <ReviewForm
          bookingId={bookingId}
          stylistName={stylistName}
          serviceTitles={serviceTitles}
          existingReview={existingReview}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}