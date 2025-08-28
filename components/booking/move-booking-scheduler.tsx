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
}

export function MoveBookingScheduler({
  stylistId,
  serviceDurationMinutes,
  onTimeSlotSelect,
  selectedStartTime,
  currentBookingStart,
  currentBookingEnd,
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
            Det opprinnelige tidspunktet vises med lilla bakgrunn. Velg et nytt ledig tidspunkt for bookingen.
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
      />
    </div>
  );
}