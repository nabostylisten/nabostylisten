"use client";

import { useState } from "react";
import { Star, Calendar } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ReviewDialog } from "./review-dialog";

interface ReviewReminderAlertProps {
  bookingId: string;
  stylistName: string;
  serviceTitles: string[];
  bookingDate: string;
  className?: string;
}

export function ReviewReminderAlert({
  bookingId,
  stylistName,
  serviceTitles,
  bookingDate,
  className,
}: ReviewReminderAlertProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const formatBookingDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Ugyldig dato";
      }
      return format(date, "EEEE d. MMMM yyyy", { locale: nb });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Ugyldig dato";
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="mx-auto w-full">
        <Alert className={className}>
          <Star className="h-4 w-4" />
          <AlertTitle>Vurder din opplevelse</AlertTitle>
          <AlertDescription className="mt-2">
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  {formatBookingDate(bookingDate)}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{stylistName}</span>
                  {serviceTitles.length > 0 && (
                    <span>
                      {" • "}
                      {serviceTitles.length === 1
                        ? serviceTitles[0]
                        : `${serviceTitles[0]} +${serviceTitles.length - 1} til`}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm">
                Bookingen er fullført. Del din opplevelse med andre ved å skrive
                en anmeldelse.
              </p>
              <Button onClick={() => setIsDialogOpen(true)} size="sm">
                Skriv anmeldelse
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        <ReviewDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          bookingId={bookingId}
          stylistName={stylistName}
          serviceTitles={serviceTitles}
        />
      </div>
    </div>
  );
}
