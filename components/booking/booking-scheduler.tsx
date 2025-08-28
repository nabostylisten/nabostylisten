"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isSameDay,
} from "date-fns";
import { nb } from "date-fns/locale";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { BookingSchedulerSkeleton } from "@/components/booking/booking-scheduler-skeleton";
import { BookingHelpDialog } from "@/components/booking/booking-help-dialog";
import type { Database } from "@/types/database.types";
import {
  getAvailabilityRules,
  getUnavailability,
  getRecurringUnavailabilityWithExceptions,
} from "@/server/availability.actions";

type DayOfWeek = Database["public"]["Enums"]["day_of_week"];
type AvailabilityRule =
  Database["public"]["Tables"]["stylist_availability_rules"]["Row"];
type Unavailability =
  Database["public"]["Tables"]["stylist_unavailability"]["Row"];
type RecurringUnavailability =
  Database["public"]["Tables"]["stylist_recurring_unavailability"]["Row"];
type RecurringException =
  Database["public"]["Tables"]["recurring_unavailability_exceptions"]["Row"];
type RecurringUnavailabilityWithExceptions = RecurringUnavailability & {
  exceptions: RecurringException[];
};

interface BookingSchedulerProps {
  stylistId: string;
  serviceDurationMinutes: number;
  onTimeSlotSelect: (startTime: Date, endTime: Date) => void;
  selectedStartTime?: Date;
  currentBookingStart?: Date;
  currentBookingEnd?: Date;
}

export function BookingScheduler({
  stylistId,
  serviceDurationMinutes,
  onTimeSlotSelect,
  selectedStartTime,
  currentBookingStart,
  currentBookingEnd,
}: BookingSchedulerProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [showHelp, setShowHelp] = useState(false);

  // Calculate required duration slots (round up to nearest hour)
  const requiredHours = Math.ceil(serviceDurationMinutes / 60);

  // Fetch availability rules
  const { data: availabilityRules, isLoading: rulesLoading } = useQuery({
    queryKey: ["availability-rules", stylistId],
    queryFn: () => getAvailabilityRules(stylistId),
  });

  // Fetch unavailability
  const { data: unavailability, isLoading: unavailabilityLoading } = useQuery({
    queryKey: ["unavailability", stylistId],
    queryFn: () => getUnavailability(stylistId),
  });

  // Fetch recurring unavailability with exceptions
  const { data: recurringUnavailability } = useQuery({
    queryKey: ["recurring-unavailability", stylistId],
    queryFn: () => getRecurringUnavailabilityWithExceptions(stylistId),
  });

  // Extract work schedule from availability rules
  const workSchedule = useMemo(() => {
    if (!availabilityRules?.data || availabilityRules.data.length === 0) {
      return { workDays: [], startTime: "08:00", endTime: "18:00" };
    }

    const rules = availabilityRules.data;
    return {
      workDays: rules.map((r) => r.day_of_week),
      startTime: rules[0].start_time.slice(0, 5),
      endTime: rules[0].end_time.slice(0, 5),
    };
  }, [availabilityRules]);

  // Calculate week days
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentWeek]);

  // Check if a specific time slot is unavailable
  const isTimeSlotUnavailable = useCallback(
    (date: Date, hour: number) => {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      // Check one-off unavailability
      if (unavailability?.data) {
        const hasOneOffUnavailability = unavailability.data.some((u) => {
          const unavailStart = new Date(u.start_time);
          const unavailEnd = new Date(u.end_time);
          return slotStart < unavailEnd && slotEnd > unavailStart;
        });
        if (hasOneOffUnavailability) return true;
      }

      // Check recurring unavailability
      if (recurringUnavailability?.data) {
        const hasRecurringUnavailability = recurringUnavailability.data.some(
          (recurring) => {
            // Check if the current date is within the series date range
            const seriesStart = new Date(recurring.series_start_date);
            const seriesEnd = recurring.series_end_date
              ? new Date(recurring.series_end_date)
              : null;

            if (date < seriesStart || (seriesEnd && date > seriesEnd)) {
              return false;
            }

            // Parse the RRULE to check if this date matches
            const rrule = recurring.rrule;
            const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

            // Convert to RRULE day format (SU, MO, TU, etc.)
            const dayMap = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
            const currentDay = dayMap[dayOfWeek];

            // Check if this day matches the RRULE
            if (rrule.includes("BYDAY=")) {
              const byDayMatch = rrule.match(/BYDAY=([^;]+)/);
              if (byDayMatch) {
                const allowedDays = byDayMatch[1].split(",");
                if (!allowedDays.includes(currentDay)) {
                  return false;
                }
              }
            }

            // Check if FREQ=WEEKLY matches (basic weekly check)
            if (rrule.includes("FREQ=WEEKLY")) {
              // Calculate the original recurring time for this date
              const [startHour, startMinute] = recurring.start_time
                .split(":")
                .map(Number);
              const [endHour, endMinute] = recurring.end_time
                .split(":")
                .map(Number);

              const originalRecurringStart = new Date(date);
              originalRecurringStart.setHours(startHour, startMinute, 0, 0);
              const originalRecurringEnd = new Date(date);
              originalRecurringEnd.setHours(endHour, endMinute, 0, 0);

              // Check for exceptions to this specific instance
              const exception = recurring.exceptions?.find((ex) => {
                const originalStart = new Date(ex.original_start_time);
                return (
                  originalStart.getFullYear() === date.getFullYear() &&
                  originalStart.getMonth() === date.getMonth() &&
                  originalStart.getDate() === date.getDate() &&
                  originalStart.getHours() === startHour &&
                  originalStart.getMinutes() === startMinute
                );
              });

              if (exception) {
                // If exception exists, check the exception behavior
                if (!exception.new_start_time || !exception.new_end_time) {
                  // Exception is canceled (null new times), so this slot is not unavailable
                  return false;
                } else {
                  // Exception is rescheduled, check new times
                  const newStart = new Date(exception.new_start_time);
                  const newEnd = new Date(exception.new_end_time);
                  return slotStart < newEnd && slotEnd > newStart;
                }
              } else {
                // No exception, use original recurring times
                return (
                  slotStart < originalRecurringEnd &&
                  slotEnd > originalRecurringStart
                );
              }
            }

            return false;
          }
        );
        if (hasRecurringUnavailability) return true;
      }

      return false;
    },
    [unavailability, recurringUnavailability]
  );

  // Check if a day has work hours
  const isDayWorkDay = useCallback(
    (date: Date) => {
      const dayName = format(date, "EEEE", { locale: nb }).toLowerCase();
      const dayMapping: Record<string, DayOfWeek> = {
        mandag: "monday",
        tirsdag: "tuesday",
        onsdag: "wednesday",
        torsdag: "thursday",
        fredag: "friday",
        lørdag: "saturday",
        søndag: "sunday",
      };
      return workSchedule.workDays.includes(dayMapping[dayName]);
    },
    [workSchedule.workDays]
  );

  // Check if an hour is within work hours
  const isHourInWorkTime = useCallback(
    (hour: number) => {
      const startHour = parseInt(workSchedule.startTime.split(":")[0]);
      const endHour = parseInt(workSchedule.endTime.split(":")[0]);
      return hour >= startHour && hour < endHour;
    },
    [workSchedule.startTime, workSchedule.endTime]
  );

  // Check if a time slot can be selected (has enough consecutive availability)
  const canSelectTimeSlot = useCallback(
    (date: Date, hour: number) => {
      // Check if we have enough consecutive hours available
      for (let i = 0; i < requiredHours; i++) {
        const checkHour = hour + i;

        // Check if this hour is within work time
        if (!isHourInWorkTime(checkHour)) {
          return false;
        }

        // Check if this hour is unavailable
        if (isTimeSlotUnavailable(date, checkHour)) {
          return false;
        }
      }

      return true;
    },
    [requiredHours, isHourInWorkTime, isTimeSlotUnavailable]
  );

  // Check if a time slot is part of the current selection
  const isSlotSelected = useCallback(
    (date: Date, hour: number) => {
      if (!selectedStartTime) return false;

      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);

      const selectionEnd = new Date(selectedStartTime);
      selectionEnd.setTime(
        selectedStartTime.getTime() + requiredHours * 60 * 60 * 1000
      );

      return (
        isSameDay(date, selectedStartTime) &&
        slotStart >= selectedStartTime &&
        slotStart < selectionEnd
      );
    },
    [selectedStartTime, requiredHours]
  );

  // Check if a time slot is part of the current booking (for move booking)
  const isSlotCurrentBooking = useCallback(
    (date: Date, hour: number) => {
      if (!currentBookingStart || !currentBookingEnd) return false;

      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      return (
        isSameDay(date, currentBookingStart) &&
        slotStart >= currentBookingStart &&
        slotStart < currentBookingEnd
      );
    },
    [currentBookingStart, currentBookingEnd]
  );

  // Get all hours for display (work hours only)
  const getDisplayHours = useCallback(() => {
    const startHour = parseInt(workSchedule.startTime.split(":")[0]);
    const endHour = parseInt(workSchedule.endTime.split(":")[0]);
    return Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  }, [workSchedule.startTime, workSchedule.endTime]);

  const handlePreviousWeek = () => setCurrentWeek((prev) => subWeeks(prev, 1));
  const handleNextWeek = () => setCurrentWeek((prev) => addWeeks(prev, 1));
  const handleToday = () => setCurrentWeek(new Date());

  const handleTimeSlotClick = (date: Date, hour: number) => {
    if (!isDayWorkDay(date) || !isHourInWorkTime(hour)) return;
    if (!canSelectTimeSlot(date, hour)) return;

    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setTime(startTime.getTime() + requiredHours * 60 * 60 * 1000);

    onTimeSlotSelect(startTime, endTime);
  };

  if (rulesLoading || unavailabilityLoading) {
    return <BookingSchedulerSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Velg tidspunkt
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHelp(true)}
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Hjelp
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Service duration info */}
          <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-3 text-sm">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Clock className="w-4 h-4" />
              <span className="font-medium">
                Totalt tidsforbruk: {Math.floor(serviceDurationMinutes / 60)}t{" "}
                {serviceDurationMinutes % 60}min
                {requiredHours > 1 && ` (krever ${requiredHours} timer på rad)`}
              </span>
            </div>
          </div>

          {/* Week navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousWeek}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={handleToday}>
                I dag
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <h3 className="text-lg font-semibold">
                  Uke {format(currentWeek, "w, yyyy")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {format(currentWeek, "MMMM yyyy", { locale: nb })}
                </p>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    Velg dato
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setCurrentWeek(date);
                        setSelectedDate(date);
                      }
                    }}
                    weekStartsOn={1}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Weekly calendar view */}
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-8 bg-muted">
              <div className="p-2 border-r pt-4">
                <Clock className="w-4 h-4 mx-auto" />
              </div>
              {weekDays.map((day, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-2 text-center border-r last:border-r-0",
                    isSameDay(day, new Date()) && "bg-primary/10 font-semibold"
                  )}
                >
                  <div className="text-xs text-muted-foreground">
                    {format(day, "EEE", { locale: nb })}
                  </div>
                  <div className="text-sm">{format(day, "d")}</div>
                </div>
              ))}
            </div>

            {/* Hour slots */}
            <div className="max-h-[600px] overflow-y-auto">
              {getDisplayHours().map((hour) => (
                <div key={hour} className="grid grid-cols-8">
                  <div className="p-2 text-xs text-center border border-border/40 dark:border-border/20 bg-muted/50">
                    {`${hour.toString().padStart(2, "0")}:00`}
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    const isWorkDay = isDayWorkDay(day);
                    const isWorkHour = isHourInWorkTime(hour);
                    const isAvailable = isWorkDay && isWorkHour;
                    const isUnavailable = isTimeSlotUnavailable(day, hour);
                    const canSelect = canSelectTimeSlot(day, hour);
                    const isSelected = isSlotSelected(day, hour);
                    const isCurrentBooking = isSlotCurrentBooking(day, hour);

                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          "p-2 border border-border/90 dark:border-border/20 min-h-[60px] cursor-pointer transition-colors",
                          !isAvailable && "bg-gray-100 cursor-not-allowed",
                          isAvailable &&
                            !isUnavailable &&
                            canSelect &&
                            !isCurrentBooking &&
                            "bg-green-100 hover:bg-green-200",
                          isAvailable &&
                            !isUnavailable &&
                            !canSelect &&
                            !isCurrentBooking &&
                            "bg-yellow-100 cursor-not-allowed",
                          isUnavailable &&
                            !isCurrentBooking &&
                            "bg-gray-200 cursor-not-allowed",
                          isCurrentBooking &&
                            "bg-purple-200 border-purple-500 cursor-not-allowed",
                          isSelected &&
                            "bg-blue-200 animate-pulse border-blue-400"
                        )}
                        onClick={() => {
                          if (
                            isAvailable &&
                            !isUnavailable &&
                            canSelect &&
                            !isCurrentBooking
                          ) {
                            handleTimeSlotClick(day, hour);
                          }
                        }}
                      >
                        {isSelected && (
                          <div className="text-xs font-medium text-blue-700">
                            Valgt
                          </div>
                        )}
                        {isCurrentBooking && (
                          <div className="text-xs font-medium text-purple-700">
                            Nåværende
                          </div>
                        )}
                        {isAvailable &&
                          !isUnavailable &&
                          !canSelect &&
                          !isCurrentBooking && (
                            <div className="text-xs text-yellow-700">
                              For kort tid
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-100 border-2 border-green-200 rounded" />
              <span className="font-medium">Kan bookes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-yellow-100 border-2 border-yellow-200 rounded" />
              <span className="font-medium">For kort tid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-100 border-2 border-gray-300 rounded" />
              <span className="font-medium">Ikke tilgjengelig</span>
            </div>
            {currentBookingStart && currentBookingEnd && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-purple-100 border-2 border-purple-300 rounded" />
                <span className="font-medium">Nåværende booking</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-200 border-2 border-blue-300 rounded" />
              <span className="font-medium">Valgt tid</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help dialog */}
      <BookingHelpDialog open={showHelp} onOpenChange={setShowHelp} />
    </div>
  );
}
