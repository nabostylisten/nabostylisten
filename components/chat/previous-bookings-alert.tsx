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
        <AlertDescription className="flex items-center justify-between">
          <span>
            Du har tidligere bookinger med {customerName}. Se innsikt og
            læring fra tidligere samtaler.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDialog(true)}
            className="flex items-center gap-2 ml-4"
          >
            <History className="w-4 h-4" />
            Se tidligere bookinger
          </Button>
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