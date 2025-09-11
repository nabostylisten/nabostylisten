"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Calendar,
  Clock,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { MoveBookingScheduler } from "./move-booking-scheduler";
import { RescheduleConfirmationDialog } from "./reschedule-confirmation-dialog";
import { toast } from "sonner";

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
  const [selectedStartTime, setSelectedStartTime] = useState<
    Date | undefined
  >();
  const [selectedEndTime, setSelectedEndTime] = useState<Date | undefined>();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [moveBothBookings, setMoveBothBookings] = useState(false);

  // Detect booking type and relationships
  const isTrialSession = booking?.is_trial_session === true;
  const hasTrialSession = booking?.trial_booking != null;
  const mainBooking = isTrialSession ? booking?.main_booking : null;
  const trialBooking = hasTrialSession ? booking?.trial_booking : null;

  // Get constraint dates for trial sessions
  const mainBookingDate = mainBooking ? new Date(mainBooking.start_time) : null;

  const handleTimeSlotSelect = (startTime: Date, endTime: Date) => {
    // Validate trial session constraints
    if (isTrialSession && mainBookingDate) {
      // Trial session must be before main booking
      if (startTime >= mainBookingDate) {
        toast.error("Prøvetimen må være før hovedbookingen");
        return;
      }

      // Check minimum gap (e.g., 24 hours before main booking)
      const hoursBeforeMain =
        (mainBookingDate.getTime() - endTime.getTime()) / (1000 * 60 * 60);
      if (hoursBeforeMain < 24) {
        toast.error("Prøvetimen må være minst 24 timer før hovedbookingen");
        return;
      }
    }

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Button variant="ghost" asChild className="w-full sm:w-auto">
          <Link href={`/bookinger/${bookingId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbake til booking
          </Link>
        </Button>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href={`/bookinger/${bookingId}/chat`}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Åpne chat
          </Link>
        </Button>
      </div>

      {/* Title Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {isTrialSession
              ? "Flytt prøvetime"
              : hasTrialSession
                ? "Flytt hovedbooking"
                : "Flytt booking"}
          </CardTitle>
          <CardDescription>
            {isTrialSession
              ? `Velg et nytt tidspunkt for prøvetimen med ${booking.customer?.full_name || "kunden"}`
              : hasTrialSession
                ? `Velg et nytt tidspunkt for hovedbookingen med ${booking.customer?.full_name || "kunden"}`
                : `Velg et nytt tidspunkt for bookingen med ${booking.customer?.full_name || "kunden"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Current Booking Info */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">
                Tjenester som skal flyttes:
              </h3>
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
              <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30">
                <CardHeader>
                  <CardTitle className="text-lg text-purple-800 dark:text-purple-200">
                    Nåværende tidspunkt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(currentStart, "EEEE d. MMMM yyyy", {
                        locale: nb,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Clock className="w-4 h-4" />
                    <span>
                      {format(currentStart, "HH:mm")} -{" "}
                      {format(currentEnd, "HH:mm")}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {selectedStartTime && selectedEndTime && (
                <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-800 dark:text-green-200">
                      Nytt tidspunkt
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(selectedStartTime, "EEEE d. MMMM yyyy", {
                          locale: nb,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <Clock className="w-4 h-4" />
                      <span>
                        {format(selectedStartTime, "HH:mm")} -{" "}
                        {format(selectedEndTime, "HH:mm")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Warning - Different content based on booking type */}
            {isTrialSession ? (
              <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                    Viktig for prøvetimer:
                  </p>
                  <ul className="mt-1 space-y-1 text-purple-700 dark:text-purple-300">
                    <li>
                      • Prøvetimen må være før hovedbookingen (
                      {format(mainBookingDate!, "d. MMMM yyyy 'kl.' HH:mm", {
                        locale: nb,
                      })}
                      )
                    </li>
                    <li>
                      • Det må være minst 24 timer mellom prøvetime og
                      hovedbooking
                    </li>
                    <li>
                      • Du må informere kunden om endringen via booking-chatten
                    </li>
                    <li>• Kunden vil motta en e-post om endringen</li>
                  </ul>
                </div>
              </div>
            ) : hasTrialSession ? (
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Hovedbooking med prøvetime:
                  </p>
                  <ul className="mt-1 space-y-1 text-blue-700 dark:text-blue-300">
                    <li>
                      • Denne bookingen har en prøvetime{" "}
                      {format(
                        new Date(trialBooking!.start_time),
                        "d. MMMM yyyy 'kl.' HH:mm",
                        { locale: nb }
                      )}
                    </li>
                    <li>• Hovedbookingen må være etter prøvetimen</li>
                    <li>• Vurder å flytte begge bookingene hvis nødvendig</li>
                    <li>
                      • Du må informere kunden om endringen via booking-chatten
                    </li>
                    <li>• Kunden vil motta en e-post om endringen</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    Viktig informasjon:
                  </p>
                  <ul className="mt-1 space-y-1 text-amber-700 dark:text-amber-300">
                    <li>
                      • Du må informere kunden om endringen via booking-chatten
                    </li>
                    <li>• Kunden vil motta en e-post om endringen</li>
                    <li>
                      • Betalingen vil bli håndtert automatisk basert på det nye
                      tidspunktet
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Option to move both bookings (only for main bookings with trial sessions) */}
            {hasTrialSession && !isTrialSession && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="move-both"
                    checked={moveBothBookings}
                    onCheckedChange={(checked) =>
                      setMoveBothBookings(checked as boolean)
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="move-both"
                      className="text-sm font-medium text-blue-900 dark:text-blue-100 cursor-pointer"
                    >
                      Flytt også prøvetimen
                    </Label>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Hvis aktivert, vil prøvetimen automatisk flyttes til samme
                      tid relativt til den nye hovedbookingen (f.eks. hvis
                      prøvetimen var 2 dager før, vil den fortsatt være 2 dager
                      før den nye datoen)
                    </p>
                  </div>
                </div>
              </div>
            )}
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
        isTrialSession={isTrialSession}
        maxDate={
          isTrialSession && mainBookingDate ? mainBookingDate : undefined
        }
        minDate={
          hasTrialSession && !isTrialSession && trialBooking
            ? new Date(trialBooking.start_time)
            : undefined
        }
        trialConstraintHours={24}
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
        moveBothBookings={
          hasTrialSession && !isTrialSession ? moveBothBookings : false
        }
        trialBooking={trialBooking}
      />
    </div>
  );
}
