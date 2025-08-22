"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ReviewDialog } from "./review-dialog";

interface ReviewReminderAlertProps {
  bookingId: string;
  stylistName: string;
  serviceTitles: string[];
  className?: string;
}

export function ReviewReminderAlert({
  bookingId,
  stylistName,
  serviceTitles,
  className,
}: ReviewReminderAlertProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Alert className={className}>
        <Star className="h-4 w-4" />
        <AlertTitle>Vurder din opplevelse</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-3">
            Denne bookingen er fullført. Del din opplevelse med andre ved å
            skrive en anmeldelse av {stylistName}.
          </p>
          <Button
            onClick={() => setIsDialogOpen(true)}
            size="sm"
            className="mt-2"
          >
            Skriv anmeldelse
          </Button>
        </AlertDescription>
      </Alert>

      <ReviewDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        bookingId={bookingId}
        stylistName={stylistName}
        serviceTitles={serviceTitles}
      />
    </>
  );
}
