"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { History, InfoIcon } from "lucide-react";
import { useState } from "react";
import { PreviousBookingsDialog } from "./previous-bookings-dialog";

interface PreviousBookingsAlertProps {
  stylistId: string;
  customerId: string;
  customerName: string;
  currentBookingId: string;
  hasPreviousBookings: boolean;
}

export function PreviousBookingsAlert({
  stylistId,
  customerId,
  customerName,
  currentBookingId,
  hasPreviousBookings,
}: PreviousBookingsAlertProps) {
  const [showDialog, setShowDialog] = useState(false);

  if (!hasPreviousBookings) {
    return null;
  }

  return (
    <>
      <Alert className="mb-4">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Tidligere bookinger tilgjengelig</AlertTitle>
        <AlertDescription>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <span className="text-sm">
              Du har tidligere bookinger med {customerName}. Se detaljer fra
              tidligere bookinger.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDialog(true)}
              className="flex items-center justify-center gap-2 w-full sm:w-auto sm:shrink-0"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Se tidligere bookinger</span>
              <span className="sm:hidden">Se tidligere</span>
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <PreviousBookingsDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        stylistId={stylistId}
        customerId={customerId}
        customerName={customerName}
        currentBookingId={currentBookingId}
      />
    </>
  );
}