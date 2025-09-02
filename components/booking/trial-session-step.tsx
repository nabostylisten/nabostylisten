"use client";

import React, { useState } from "react";
import { format, isBefore, startOfDay } from "date-fns";
import { nb } from "date-fns/locale";
import { 
  TestTube, 
  Calendar as CalendarIcon, 
  Clock, 
  Info,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useBookingStore } from "@/stores/booking.store";
import { TrialSessionInfoDialog } from "@/components/booking/trial-session-info-dialog";

const TRIAL_SESSION_TIME_SLOTS = [
  { time: "09:00", label: "09:00" },
  { time: "10:00", label: "10:00" },
  { time: "11:00", label: "11:00" },
  { time: "12:00", label: "12:00" },
  { time: "13:00", label: "13:00" },
  { time: "14:00", label: "14:00" },
  { time: "15:00", label: "15:00" },
  { time: "16:00", label: "16:00" },
  { time: "17:00", label: "17:00" },
  { time: "18:00", label: "18:00" },
];

interface TrialSessionStepProps {
  trialSessionPrice?: number;
  trialSessionDurationMinutes?: number;
  trialSessionDescription?: string;
  mainBookingDate?: Date;
}

export function TrialSessionStep({
  trialSessionPrice,
  trialSessionDurationMinutes,
  trialSessionDescription,
  mainBookingDate,
}: TrialSessionStepProps) {
  const { bookingData, updateBookingData } = useBookingStore();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    bookingData.trialSessionDate
  );
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    bookingData.trialSessionStartTime
      ? format(bookingData.trialSessionStartTime, "HH:mm")
      : undefined
  );

  const handleWantsTrialSession = (wants: boolean) => {
    updateBookingData({ wantsTrialSession: wants });
    
    if (!wants) {
      // Clear trial session data if not wanted
      updateBookingData({
        trialSessionDate: undefined,
        trialSessionStartTime: undefined,
        trialSessionEndTime: undefined,
      });
      setSelectedDate(undefined);
      setSelectedTime(undefined);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    updateBookingData({ trialSessionDate: date });
    
    // Clear time selection when date changes
    if (selectedTime) {
      setSelectedTime(undefined);
      updateBookingData({
        trialSessionStartTime: undefined,
        trialSessionEndTime: undefined,
      });
    }
  };

  const handleTimeSelect = (time: string) => {
    if (!selectedDate) return;

    const [hours, minutes] = time.split(":").map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + (trialSessionDurationMinutes || 60));

    setSelectedTime(time);
    updateBookingData({
      trialSessionStartTime: startTime,
      trialSessionEndTime: endTime,
    });
  };

  // Determine available dates (today + next 30 days, but before main booking if selected)
  const today = startOfDay(new Date());

  const isDateDisabled = (date: Date) => {
    const dayStart = startOfDay(date);
    if (isBefore(dayStart, today)) return true;
    if (mainBookingDate && !isBefore(dayStart, startOfDay(mainBookingDate))) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Trial Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Vil du ha en prøvetime først?
            <TrialSessionInfoDialog
              trialSessionPrice={trialSessionPrice}
              trialSessionDurationMinutes={trialSessionDurationMinutes}
              trialSessionDescription={trialSessionDescription}
            >
              <Button variant="ghost" size="sm" className="ml-auto">
                <Info className="w-4 h-4" />
              </Button>
            </TrialSessionInfoDialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-2">Hva er en prøvetime?</p>
                <p className="mb-3">{trialSessionDescription}</p>
                
                <div className="flex flex-wrap gap-3 text-xs">
                  {trialSessionPrice && (
                    <Badge variant="outline" className="text-blue-700 dark:text-blue-300">
                      <span className="mr-1">💰</span>
                      {trialSessionPrice} kr
                    </Badge>
                  )}
                  {trialSessionDurationMinutes && (
                    <Badge variant="outline" className="text-blue-700 dark:text-blue-300">
                      <Clock className="w-3 h-3 mr-1" />
                      {trialSessionDurationMinutes} min
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant={bookingData.wantsTrialSession === true ? "default" : "outline"}
              onClick={() => handleWantsTrialSession(true)}
              className="flex-1"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Ja, jeg vil ha prøvetime
            </Button>
            <Button
              variant={bookingData.wantsTrialSession === false ? "default" : "outline"}
              onClick={() => handleWantsTrialSession(false)}
              className="flex-1"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Nei, hopp over
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Date and Time Selection - Only show if wants trial session */}
      {bookingData.wantsTrialSession && (
        <>
          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Velg dato for prøvetime
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mainBookingDate && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Prøvetimen må være før hovedbookingen din den{" "}
                    {format(mainBookingDate, "EEEE d. MMMM", { locale: nb })}.
                  </AlertDescription>
                </Alert>
              )}

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "EEEE d. MMMM yyyy", { locale: nb })
                    ) : (
                      "Velg dato"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={isDateDisabled}
                    locale={nb}
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {/* Time Selection - Only show if date is selected */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Velg klokkeslett
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {TRIAL_SESSION_TIME_SLOTS.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={selectedTime === slot.time ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTimeSelect(slot.time)}
                      className="text-sm"
                    >
                      {slot.label}
                    </Button>
                  ))}
                </div>
                
                {selectedTime && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Prøvetime valgt: {format(selectedDate, "EEEE d. MMMM", { locale: nb })} kl. {selectedTime}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}