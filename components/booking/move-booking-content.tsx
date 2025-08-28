"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { MoveBookingScheduler } from "./move-booking-scheduler";
import { RescheduleConfirmationDialog } from "./reschedule-confirmation-dialog";
import { toast } from "sonner";
import type { DatabaseTables } from "@/types";

interface MoveBookingContentProps {
  bookingId: string;
  booking: any; // Complex booking type with relations
  stylistId: string;
  serviceDuration: number;
  serviceTitles: string[];
  currentStartTime: string;
  currentEndTime: string;
}

export function MoveBookingContent({
  bookingId,
  booking,
  stylistId,
  serviceDuration,
  serviceTitles,
  currentStartTime,
  currentEndTime,
}: MoveBookingContentProps) {
  const router = useRouter();
  const [selectedStartTime, setSelectedStartTime] = useState<Date | undefined>();
  const [selectedEndTime, setSelectedEndTime] = useState<Date | undefined>();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const handleTimeSlotSelect = (startTime: Date, endTime: Date) => {
    setSelectedStartTime(startTime);
    setSelectedEndTime(endTime);
  };

  const handleOpenConfirmDialog = () => {
    if (!selectedStartTime || !selectedEndTime) {
      toast.error("Vennligst velg et nytt tidspunkt for bookingen");
      return;
    }
    setIsConfirmDialogOpen(true);
  };

  const currentStart = new Date(currentStartTime);
  const currentEnd = new Date(currentEndTime);

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tilbake til booking
        </Button>
      </div>

      {/* Title Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Flytt booking</CardTitle>
          <CardDescription>
            Velg et nytt tidspunkt for bookingen med {booking.customer?.full_name || "kunden"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Current Booking Info */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Tjenester som skal flyttes:</h3>
              <div className="flex flex-wrap gap-2">
                {serviceTitles.map((title, index) => (
                  <Badge key={index} variant="secondary">
                    {title}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Nåværende tidspunkt:</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{format(currentStart, "EEEE d. MMMM yyyy", { locale: nb })}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>
                    {format(currentStart, "HH:mm")} - {format(currentEnd, "HH:mm")}
                  </span>
                </div>
              </div>

              {selectedStartTime && selectedEndTime && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-green-600">Nytt tidspunkt:</h3>
                  <div className="flex items-center gap-2 text-green-600">
                    <Calendar className="w-4 h-4" />
                    <span>{format(selectedStartTime, "EEEE d. MMMM yyyy", { locale: nb })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {format(selectedStartTime, "HH:mm")} - {format(selectedEndTime, "HH:mm")}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-900">Viktig informasjon:</p>
                <ul className="mt-1 space-y-1 text-amber-700">
                  <li>• Du må informere kunden om endringen via booking-chatten</li>
                  <li>• Kunden vil motta en e-post om endringen</li>
                  <li>• Betalingen vil bli håndtert automatisk basert på det nye tidspunktet</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduler */}
      <MoveBookingScheduler
        stylistId={stylistId}
        serviceDurationMinutes={serviceDuration}
        onTimeSlotSelect={handleTimeSlotSelect}
        selectedStartTime={selectedStartTime}
        currentBookingStart={currentStart}
        currentBookingEnd={currentEnd}
      />

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Avbryt
        </Button>
        <Button 
          onClick={handleOpenConfirmDialog}
          disabled={!selectedStartTime || !selectedEndTime}
        >
          Fortsett til bekreftelse
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <RescheduleConfirmationDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        bookingId={bookingId}
        currentStartTime={currentStart}
        currentEndTime={currentEnd}
        newStartTime={selectedStartTime}
        newEndTime={selectedEndTime}
        customerName={booking.customer?.full_name || "kunden"}
      />
    </div>
  );
}