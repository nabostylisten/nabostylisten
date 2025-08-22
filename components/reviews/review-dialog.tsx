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

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  stylistName: string;
  serviceTitles: string[];
  existingReview?: DatabaseTables["reviews"]["Row"] | null;
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingReview ? "Rediger anmeldelse" : "Legg til anmeldelse"}
          </DialogTitle>
          <DialogDescription>
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