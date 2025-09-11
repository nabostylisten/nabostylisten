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
import { DateTimePicker } from "./datetime-picker";

interface RecurringExceptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  selectedHour: number | null;
  recurringTitle: string;
  seriesId: string;
  onCancelInstance: (seriesId: string, originalStartTime: Date) => void;
  onRescheduleInstance: (
    seriesId: string,
    originalStartTime: Date,
    newStartTime: Date,
    newEndTime: Date
  ) => void;
  onEditSeries: (seriesId: string) => void;
}

export function RecurringExceptionDialog({
  open,
  onOpenChange,
  selectedDate,
  selectedHour,
  recurringTitle,
  seriesId,
  onCancelInstance,
  onRescheduleInstance,
  onEditSeries,
}: RecurringExceptionDialogProps) {
  const [showReschedule, setShowReschedule] = useState(false);
  const [newStartTime, setNewStartTime] = useState<Date>(new Date());
  const [newEndTime, setNewEndTime] = useState<Date>(new Date());

  if (!selectedDate || selectedHour === null) return null;

  const originalStartTime = new Date(selectedDate);
  originalStartTime.setHours(selectedHour, 0, 0, 0);
  const originalEndTime = new Date(selectedDate);
  originalEndTime.setHours(selectedHour + 1, 0, 0, 0);

  // Initialize reschedule times when switching to reschedule mode
  const handleShowReschedule = () => {
    setNewStartTime(originalStartTime);
    setNewEndTime(originalEndTime);
    setShowReschedule(true);
  };

  const handleCancelInstance = () => {
    onCancelInstance(seriesId, originalStartTime);
    onOpenChange(false);
  };

  const handleRescheduleSubmit = () => {
    onRescheduleInstance(seriesId, originalStartTime, newStartTime, newEndTime);
    onOpenChange(false);
    setShowReschedule(false);
  };

  const handleEditSeries = () => {
    onEditSeries(seriesId);
    onOpenChange(false);
  };

  if (showReschedule) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Flytt denne forekomsten
            </DialogTitle>
            <DialogDescription className="text-sm break-words">
              Flytt "{recurringTitle}" for{" "}
              {format(selectedDate, "PPP", { locale: nb })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <DateTimePicker
              label="Ny starttid"
              value={newStartTime}
              onChange={setNewStartTime}
              id="reschedule-start"
            />

            <DateTimePicker
              label="Ny sluttid"
              value={newEndTime}
              onChange={setNewEndTime}
              id="reschedule-end"
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowReschedule(false)} className="w-full sm:w-auto">
              Tilbake
            </Button>
            <Button onClick={handleRescheduleSubmit} className="w-full sm:w-auto">
              Flytt forekomst
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            Administrer gjentakende utilgjengelighet
          </DialogTitle>
          <DialogDescription className="text-sm break-words">
            <span className="font-semibold">{recurringTitle}</span> -{" "}
            {format(selectedDate, "PPP", { locale: nb })} kl.{" "}
            {selectedHour.toString().padStart(2, "0")}:00
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Velg hva du vil gjøre med denne gjentakende utilgjengeligheiten:
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full justify-start text-left p-3 sm:p-4 h-auto"
              onClick={handleCancelInstance}
            >
              <div className="space-y-1">
                <div className="font-medium text-sm sm:text-base">Avlys kun denne forekomsten</div>
                <div className="text-xs text-muted-foreground">
                  Gjør denne tiden tilgjengelig, men behold den gjentakende
                  serien
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-left p-3 sm:p-4 h-auto"
              onClick={handleShowReschedule}
            >
              <div className="space-y-1">
                <div className="font-medium text-sm sm:text-base">Flytt kun denne forekomsten</div>
                <div className="text-xs text-muted-foreground">
                  Flytt denne forekomsten til en annen tid
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-left p-3 sm:p-4 h-auto"
              onClick={handleEditSeries}
            >
              <div className="space-y-1">
                <div className="font-medium text-sm sm:text-base">Rediger hele serien</div>
                <div className="text-xs text-muted-foreground">
                  Endre eller slett den gjentakende utilgjengeligheiten
                </div>
              </div>
            </Button>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Avbryt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
