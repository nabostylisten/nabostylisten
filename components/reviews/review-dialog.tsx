"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReviewForm } from "./review-form";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  stylistName: string;
  serviceTitles: string[];
}

export function ReviewDialog({
  open,
  onOpenChange,
  bookingId,
  stylistName,
  serviceTitles,
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
          <DialogTitle>Legg til anmeldelse</DialogTitle>
          <DialogDescription>
            Del din opplevelse med andre brukere ved å skrive en anmeldelse
          </DialogDescription>
        </DialogHeader>
        <ReviewForm
          bookingId={bookingId}
          stylistName={stylistName}
          serviceTitles={serviceTitles}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}