"use client";

import React from "react";
import { BookingScheduler } from "./booking-scheduler";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

interface MoveBookingSchedulerProps {
  stylistId: string;
  serviceDurationMinutes: number;
  onTimeSlotSelect: (startTime: Date, endTime: Date) => void;
  selectedStartTime?: Date;
  currentBookingStart: Date;
  currentBookingEnd: Date;
  isTrialSession?: boolean;
  maxDate?: Date;
  minDate?: Date;
  trialConstraintHours?: number;
}

export function MoveBookingScheduler({
  stylistId,
  serviceDurationMinutes,
  onTimeSlotSelect,
  selectedStartTime,
  currentBookingStart,
  currentBookingEnd,
  isTrialSession,
  maxDate,
  minDate,
  trialConstraintHours,
}: MoveBookingSchedulerProps) {
  // Add visual indication if selecting the same time slot as current
  const handleTimeSlotSelect = (startTime: Date, endTime: Date) => {
    if (startTime.getTime() === currentBookingStart.getTime()) {
      // User selected the same time - show info
      return;
    }
    onTimeSlotSelect(startTime, endTime);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Velg nytt tidspunkt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            {isTrialSession ? (
              <>
                Det opprinnelige tidspunktet vises med lilla bakgrunn. Velg et nytt ledig tidspunkt for prøvetimen.
                <br />
                <strong>Merk:</strong> Tidspunkter etter hovedbookingen er utilgjengelige (vist som grå celler).
              </>
            ) : maxDate || minDate ? (
              <>
                Det opprinnelige tidspunktet vises med lilla bakgrunn. Velg et nytt ledig tidspunkt for bookingen.
                <br />
                <strong>Merk:</strong> Noen tidspunkter kan være begrenset på grunn av prøvetimen.
              </>
            ) : (
              "Det opprinnelige tidspunktet vises med lilla bakgrunn. Velg et nytt ledig tidspunkt for bookingen."
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reuse the existing BookingScheduler component */}
      <BookingScheduler
        stylistId={stylistId}
        serviceDurationMinutes={serviceDurationMinutes}
        onTimeSlotSelect={handleTimeSlotSelect}
        selectedStartTime={selectedStartTime}
        currentBookingStart={currentBookingStart}
        currentBookingEnd={currentBookingEnd}
        customTimeSlotValidator={
          // Create a validator function for trial session constraints
          isTrialSession || maxDate || minDate ? 
            (date: Date, hour: number) => {
              const slotStart = new Date(date);
              slotStart.setHours(hour, 0, 0, 0);
              const slotEnd = new Date(slotStart.getTime() + serviceDurationMinutes * 60 * 1000);
              
              // For trial sessions, cannot be on or after main booking date
              if (isTrialSession && maxDate) {
                if (slotStart >= maxDate) return false;
                
                // Must be at least trialConstraintHours (24h) before main booking
                if (trialConstraintHours) {
                  const hoursBeforeMain = (maxDate.getTime() - slotEnd.getTime()) / (1000 * 60 * 60);
                  if (hoursBeforeMain < trialConstraintHours) return false;
                }
              }
              
              // For main bookings, cannot be before trial booking
              if (minDate && !isTrialSession && slotStart <= minDate) {
                return false;
              }
              
              return true;
            } : undefined
        }
      />
    </div>
  );
}