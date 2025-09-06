"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { rescheduleBooking } from "@/server/booking.actions";
import { addUnavailability } from "@/server/availability.actions";
import { DatabaseTables } from "@/types";

interface RescheduleConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  currentStartTime: Date;
  currentEndTime: Date;
  newStartTime?: Date;
  newEndTime?: Date;
  customerName: string;
  moveBothBookings?: boolean;
  trialBooking?: DatabaseTables["bookings"]["Row"];
}

export function RescheduleConfirmationDialog({
  open,
  onOpenChange,
  bookingId,
  currentStartTime,
  currentEndTime,
  newStartTime,
  newEndTime,
  customerName,
  moveBothBookings = false,
  trialBooking,
}: RescheduleConfirmationDialogProps) {
  const router = useRouter();
  const [availabilityOption, setAvailabilityOption] = useState<
    "available" | "unavailable"
  >("available");
  const [hasInformedCustomer, setHasInformedCustomer] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState("");

  const rescheduleBookingMutation = useMutation({
    mutationFn: async () => {
      if (!newStartTime || !newEndTime) {
        throw new Error("Nytt tidspunkt er ikke valgt");
      }

      // Call server action to reschedule the booking
      const result = await rescheduleBooking({
        bookingId,
        newStartTime: newStartTime.toISOString(),
        newEndTime: newEndTime.toISOString(),
        rescheduleReason,
        moveBothBookings,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // If user wants to make old slot unavailable, create unavailability
      if (availabilityOption === "unavailable" && result.data?.stylist_id) {
        await addUnavailability(
          result.data.stylist_id,
          currentStartTime,
          currentEndTime,
          "Flyttet booking"
        );
      }

      return result.data;
    },
    onSuccess: () => {
      toast.success("Booking flyttet vellykket!");
      router.push(`/bookinger/${bookingId}`);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Feil ved flytting av booking: ${error.message}`);
    },
  });

  const handleConfirm = () => {
    if (!hasInformedCustomer) {
      toast.error("Du må bekrefte at du har informert kunden");
      return;
    }

    rescheduleBookingMutation.mutate();
  };

  if (!newStartTime || !newEndTime) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Bekreft flytting av booking
          </DialogTitle>
          <DialogDescription>
            Du er i ferd med å flytte bookingen med {customerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Move Both Bookings Indicator */}
          {moveBothBookings && trialBooking && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="font-semibold">
                  Begge bookingene vil bli flyttet
                </span>
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p>
                  Prøvetimen vil automatisk flyttes for å beholde samme
                  tidsforskjell som før.
                </p>
                <p className="mt-1 flex gap-2 items-center">
                  <strong>Prøvetime:</strong>{" "}
                  {format(
                    new Date(trialBooking.start_time),
                    "EEEE d. MMMM yyyy 'kl.' HH:mm",
                    { locale: nb }
                  )}
                  <ArrowRight className="w-4 h-4" />{" "}
                  <em>Beregnes automatisk</em>
                </p>
              </div>
            </div>
          )}

          {/* Time Change Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-purple-800 dark:text-purple-200">
                  Fra
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    {format(currentStartTime, "EEEE d. MMMM yyyy", {
                      locale: nb,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    {format(currentStartTime, "HH:mm")} -{" "}
                    {format(currentEndTime, "HH:mm")}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-green-800 dark:text-green-200">
                  Til
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {format(newStartTime, "EEEE d. MMMM yyyy", { locale: nb })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {format(newStartTime, "HH:mm")} -{" "}
                    {format(newEndTime, "HH:mm")}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reason for Rescheduling */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Grunn for flytting (valgfritt - vises for kunden)
            </Label>
            <Textarea
              id="reason"
              placeholder="F.eks. Sykdom, annen viktig avtale, etc."
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Availability Options */}
          <div className="space-y-3">
            <Label>Hva skal gjøres med det gamle tidspunktet?</Label>
            <RadioGroup
              value={availabilityOption}
              onValueChange={(value) =>
                setAvailabilityOption(value as "available" | "unavailable")
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="available" id="available" />
                <Label
                  htmlFor="available"
                  className="font-normal cursor-pointer"
                >
                  Gjør tidspunktet tilgjengelig for andre bookinger
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unavailable" id="unavailable" />
                <Label
                  htmlFor="unavailable"
                  className="font-normal cursor-pointer"
                >
                  Hold tidspunktet utilgjengelig
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Customer Informed Checkbox */}
          <div className="flex items-start space-x-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <Checkbox
              id="informed"
              checked={hasInformedCustomer}
              onCheckedChange={(checked) =>
                setHasInformedCustomer(checked as boolean)
              }
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="informed"
                className="text-sm font-medium text-amber-900 dark:text-amber-100 cursor-pointer"
              >
                Jeg har informert {customerName} om denne endringen
              </Label>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Bekreft at du har snakket med kunden om flyttingen via
                booking-chatten eller telefon
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={rescheduleBookingMutation.isPending}
          >
            Avbryt
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              !hasInformedCustomer || rescheduleBookingMutation.isPending
            }
          >
            {rescheduleBookingMutation.isPending
              ? "Flytter booking..."
              : "Flytt booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
