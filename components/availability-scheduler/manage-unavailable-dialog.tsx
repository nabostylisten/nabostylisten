"use client";

import { useState } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { RecurringExceptionDialog } from "./recurring-exception-dialog";

type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

interface ManageUnavailableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  selectedHour: number | null;
  unavailabilityReason?: string;
  isRecurring?: boolean;
  recurringTitle?: string;
  seriesId?: string;
  onRemoveFromWorkDays: (dayOfWeek: DayOfWeek) => void;
  onRemoveUnavailability: () => void;
  onCancelRecurringInstance?: (seriesId: string, originalStartTime: Date) => void;
  onRescheduleRecurringInstance?: (seriesId: string, originalStartTime: Date, newStartTime: Date, newEndTime: Date) => void;
  onEditRecurringSeries?: (seriesId: string) => void;
}

const dayMapping: Record<DayOfWeek, string> = {
  monday: "mandag",
  tuesday: "tirsdag",
  wednesday: "onsdag",
  thursday: "torsdag",
  friday: "fredag",
  saturday: "lørdag",
  sunday: "søndag",
};

const reverseDayMapping: Record<string, DayOfWeek> = {
  mandag: "monday",
  tirsdag: "tuesday",
  onsdag: "wednesday",
  torsdag: "thursday",
  fredag: "friday",
  lørdag: "saturday",
  søndag: "sunday",
};

export function ManageUnavailableDialog({
  open,
  onOpenChange,
  selectedDate,
  selectedHour,
  unavailabilityReason,
  isRecurring = false,
  recurringTitle,
  seriesId,
  onRemoveFromWorkDays,
  onRemoveUnavailability,
  onCancelRecurringInstance,
  onRescheduleRecurringInstance,
  onEditRecurringSeries,
}: ManageUnavailableDialogProps) {
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  if (!selectedDate || selectedHour === null) return null;

  const dayName = format(selectedDate, "EEEE", { locale: nb }).toLowerCase();
  const dayOfWeek = reverseDayMapping[dayName];
  const timeSlot = `${selectedHour.toString().padStart(2, "0")}:00`;

  const handleRemoveFromWorkDays = () => {
    if (dayOfWeek) {
      onRemoveFromWorkDays(dayOfWeek);
    }
  };

  const handleRemoveUnavailability = () => {
    onRemoveUnavailability();
  };

  const handleManageRecurring = () => {
    setShowRecurringDialog(true);
  };

  const handleCancelRecurringInstance = (seriesId: string, originalStartTime: Date) => {
    onCancelRecurringInstance?.(seriesId, originalStartTime);
    setShowRecurringDialog(false);
  };

  const handleRescheduleRecurringInstance = (
    seriesId: string,
    originalStartTime: Date,
    newStartTime: Date,
    newEndTime: Date
  ) => {
    onRescheduleRecurringInstance?.(seriesId, originalStartTime, newStartTime, newEndTime);
    setShowRecurringDialog(false);
  };

  const handleEditRecurringSeries = (seriesId: string) => {
    onEditRecurringSeries?.(seriesId);
    setShowRecurringDialog(false);
  };

  return (
    <>
      <RecurringExceptionDialog
        open={showRecurringDialog}
        onOpenChange={setShowRecurringDialog}
        selectedDate={selectedDate}
        selectedHour={selectedHour}
        recurringTitle={recurringTitle || ""}
        seriesId={seriesId || ""}
        onCancelInstance={handleCancelRecurringInstance}
        onRescheduleInstance={handleRescheduleRecurringInstance}
        onEditSeries={handleEditRecurringSeries}
      />
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Administrer utilgjengelighet</DialogTitle>
          <DialogDescription>
            {format(selectedDate, "PPP", { locale: nb })} kl. {timeSlot}
            {unavailabilityReason && (
              <span className="block font-semibold text-sm text-muted-foreground mt-1">
                Årsak: {unavailabilityReason}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Velg hva du vil gjøre med denne tiden:
          </div>

          <div className="flex flex-col gap-2">
            {isRecurring ? (
              <Button
                variant="outline"
                className="w-full justify-start text-left p-4 h-auto"
                onClick={handleManageRecurring}
              >
                <div className="space-y-1">
                  <div className="font-medium">Administrer gjentakende utilgjengelighet</div>
                  <div className="text-xs text-muted-foreground">
                    Avlys, flytt eller rediger denne gjentakende serien
                  </div>
                </div>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start text-left p-4 h-auto"
                onClick={handleRemoveUnavailability}
              >
                <div className="space-y-1">
                  <div className="font-medium">Gjør tilgjengelig</div>
                  <div className="text-xs text-muted-foreground">
                    Fjern utilgjengeligheiten og gjør tiden bookbar
                  </div>
                </div>
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full justify-start text-left p-4 h-auto"
              onClick={handleRemoveFromWorkDays}
            >
              <div className="space-y-1">
                <div className="font-medium">Fjern som arbeidsdag</div>
                <div className="text-xs text-muted-foreground">
                  Fjern{" "}
                  <span className="font-semibold">
                    hele {dayMapping[dayOfWeek]}
                  </span>{" "}
                  fra dine arbeidsdager
                </div>
              </div>
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
