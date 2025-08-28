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
import { Calendar, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { rescheduleBooking } from "@/server/booking.actions";
import { createUnavailability } from "@/server/availability.actions";

interface RescheduleConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  currentStartTime: Date;
  currentEndTime: Date;
  newStartTime?: Date;
  newEndTime?: Date;
  customerName: string;
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
}: RescheduleConfirmationDialogProps) {
  const router = useRouter();
  const [availabilityOption, setAvailabilityOption] = useState<"available" | "unavailable">("available");
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
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // If user wants to make old slot unavailable, create unavailability
      if (availabilityOption === "unavailable") {
        await createUnavailability({
          start_time: currentStartTime.toISOString(),
          end_time: currentEndTime.toISOString(),
          reason: "Flyttet booking",
        });
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
    
    if (!rescheduleReason.trim()) {
      toast.error("Vennligst oppgi en grunn for flyttingen");
      return;
    }

    rescheduleBookingMutation.mutate();
  };

  if (!newStartTime || !newEndTime) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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
          {/* Time Change Summary */}
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div>
              <Label className="text-muted-foreground">Fra:</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {format(currentStartTime, "EEEE d. MMMM yyyy", { locale: nb })}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {format(currentStartTime, "HH:mm")} - {format(currentEndTime, "HH:mm")}
                </span>
              </div>
            </div>
            
            <div className="border-t pt-3">
              <Label className="text-green-600">Til:</Label>
              <div className="flex items-center gap-2 mt-1 text-green-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {format(newStartTime, "EEEE d. MMMM yyyy", { locale: nb })}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-green-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {format(newStartTime, "HH:mm")} - {format(newEndTime, "HH:mm")}
                </span>
              </div>
            </div>
          </div>

          {/* Reason for Rescheduling */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Grunn for flytting (vises for kunden)
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
              onValueChange={(value) => setAvailabilityOption(value as "available" | "unavailable")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="available" id="available" />
                <Label htmlFor="available" className="font-normal cursor-pointer">
                  Gjør tidspunktet tilgjengelig for andre bookinger
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unavailable" id="unavailable" />
                <Label htmlFor="unavailable" className="font-normal cursor-pointer">
                  Hold tidspunktet utilgjengelig
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Customer Informed Checkbox */}
          <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <Checkbox
              id="informed"
              checked={hasInformedCustomer}
              onCheckedChange={(checked) => setHasInformedCustomer(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="informed"
                className="text-sm font-medium text-amber-900 cursor-pointer"
              >
                Jeg har informert {customerName} om denne endringen
              </Label>
              <p className="text-xs text-amber-700">
                Bekreft at du har snakket med kunden om flyttingen via booking-chatten eller telefon
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
            disabled={!hasInformedCustomer || !rescheduleReason.trim() || rescheduleBookingMutation.isPending}
          >
            {rescheduleBookingMutation.isPending ? "Flytter booking..." : "Flytt booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}