"use client";

import React from "react";
import { BookingScheduler } from "./booking-scheduler";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TestTube, AlertTriangle } from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { nb } from "date-fns/locale";

interface TrialSessionSchedulerProps {
  stylistId: string;
  trialSessionDurationMinutes: number;
  onTimeSlotSelect: (startTime: Date, endTime: Date) => void;
  selectedStartTime?: Date;
  mainBookingDate?: Date;
}

export function TrialSessionScheduler({
  stylistId,
  trialSessionDurationMinutes,
  onTimeSlotSelect,
  selectedStartTime,
  mainBookingDate,
}: TrialSessionSchedulerProps) {
  // Wrapper function to validate trial session date must be before main booking
  const handleTimeSlotSelect = (startTime: Date, endTime: Date) => {
    if (mainBookingDate && !isBefore(startOfDay(startTime), startOfDay(mainBookingDate))) {
      // Don't allow selection if trial is not before main booking
      return;
    }
    onTimeSlotSelect(startTime, endTime);
  };

  // Custom validator to ensure trial session is before main booking
  const customTimeSlotValidator = (date: Date, hour: number) => {
    if (!mainBookingDate) return true; // If no main booking date, allow all valid slots
    
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    
    // Trial session must be before the main booking date (not on the same day)
    return isBefore(startOfDay(slotStart), startOfDay(mainBookingDate));
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-primary" />
            Velg tidspunkt for prøvetime
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Prøvetimen må være før hovedbookingen. Dette gir deg mulighet til å teste 
            stilen på forhånd og sikre at du er fornøyd før den store dagen.
          </div>
          
          {mainBookingDate && (
            <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">
                  Hovedbooking: {format(mainBookingDate, "EEEE d. MMMM yyyy", { locale: nb })}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reuse the existing BookingScheduler component with custom validation */}
      <BookingScheduler
        stylistId={stylistId}
        serviceDurationMinutes={trialSessionDurationMinutes}
        onTimeSlotSelect={handleTimeSlotSelect}
        selectedStartTime={selectedStartTime}
        customTimeSlotValidator={customTimeSlotValidator}
      />
    </div>
  );
}