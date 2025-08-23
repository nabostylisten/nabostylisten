"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isSameDay,
  isWithinInterval,
} from "date-fns";
import { nb } from "date-fns/locale";
import {
  Calendar,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Repeat,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AvailabilitySchedulerSkeleton } from "@/components/availability-scheduler/availability-scheduler-skeleton";
import { RecurringUnavailabilityDialog } from "@/components/availability-scheduler/recurring-unavailability-dialog";
import { AddUnavailabilityDialog } from "@/components/availability-scheduler/add-unavailability-dialog";
import { AddWorkDayDialog } from "@/components/availability-scheduler/add-work-day-dialog";
import { ManageUnavailableDialog } from "@/components/availability-scheduler/manage-unavailable-dialog";
import { EditRecurringSeriesDialog } from "@/components/availability-scheduler/edit-recurring-series-dialog";
import { HelpDialog } from "@/components/availability-scheduler/help-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Database } from "@/types/database.types";
import {
  getAvailabilityRules,
  updateAvailabilityRules,
  getUnavailability,
  addUnavailability,
  removeUnavailability,
  getRecurringUnavailability,
  getRecurringUnavailabilityWithExceptions,
  addRecurringUnavailability,
  removeRecurringUnavailability,
  addRecurringException,
  removeRecurringException,
  getRecurringUnavailabilityById,
  updateRecurringUnavailability,
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

interface AvailabilitySchedulerProps {
  stylistId: string;
}

const DAYS_OF_WEEK: { value: DayOfWeek; label: string; shortLabel: string }[] =
  [
    { value: "monday", label: "Mandag", shortLabel: "Man" },
    { value: "tuesday", label: "Tirsdag", shortLabel: "Tir" },
    { value: "wednesday", label: "Onsdag", shortLabel: "Ons" },
    { value: "thursday", label: "Torsdag", shortLabel: "Tor" },
    { value: "friday", label: "Fredag", shortLabel: "Fre" },
    { value: "saturday", label: "Lørdag", shortLabel: "Lør" },
    { value: "sunday", label: "Søndag", shortLabel: "Søn" },
  ];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: `${i.toString().padStart(2, "0")}:00`,
  label: `${i.toString().padStart(2, "0")}:00`,
}));

export function AvailabilityScheduler({
  stylistId,
}: AvailabilitySchedulerProps) {
  const queryClient = useQueryClient();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [showSettings, setShowSettings] = useState(false);
  const [showAddUnavailable, setShowAddUnavailable] = useState(false);
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [showAddWorkDay, setShowAddWorkDay] = useState(false);
  const [selectedGrayCell, setSelectedGrayCell] = useState<Date | null>(null);
  const [showManageUnavailable, setShowManageUnavailable] = useState(false);
  const [selectedRedCell, setSelectedRedCell] = useState<{
    date: Date;
    hour: number;
  } | null>(null);
  const [showEditSeries, setShowEditSeries] = useState(false);
  const [editingSeries, setEditingSeries] =
    useState<RecurringUnavailability | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Work schedule state
  const [workDays, setWorkDays] = useState<DayOfWeek[]>([]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");

  // Unavailability form state
  const [unavailableStart, setUnavailableStart] = useState<Date>(new Date());
  const [unavailableEnd, setUnavailableEnd] = useState<Date>(new Date());

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

  // Update availability rules mutation
  const updateRulesMutation = useMutation({
    mutationFn: ({
      workDays,
      startTime,
      endTime,
    }: {
      workDays: DayOfWeek[];
      startTime: string;
      endTime: string;
    }) => updateAvailabilityRules(stylistId, workDays, startTime, endTime),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["availability-rules", stylistId],
      });
      toast.success("Arbeidstider oppdatert");
      setShowSettings(false);
    },
    onError: () => toast.error("Kunne ikke oppdatere arbeidstider"),
  });

  // Add unavailability mutation
  const addUnavailabilityMutation = useMutation({
    mutationFn: (data: { start: Date; end: Date; reason?: string }) =>
      addUnavailability(stylistId, data.start, data.end, data.reason),
    onSuccess: () => {
      // Invalidate all availability-related queries to ensure UI updates
      queryClient.invalidateQueries({
        queryKey: ["unavailability", stylistId],
      });
      queryClient.invalidateQueries({
        queryKey: ["recurring-unavailability", stylistId],
      });
      queryClient.invalidateQueries({
        queryKey: ["availability-rules", stylistId],
      });
      toast.success("Utilgjengelighet lagt til");
      setShowAddUnavailable(false);
    },
    onError: () => toast.error("Kunne ikke legge til utilgjengelighet"),
  });

  // Remove unavailability mutation
  const removeUnavailabilityMutation = useMutation({
    mutationFn: (id: string) => removeUnavailability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["unavailability", stylistId],
      });
      toast.success("Utilgjengelighet fjernet");
    },
    onError: () => toast.error("Kunne ikke fjerne utilgjengelighet"),
  });

  // Add recurring unavailability mutation
  const addRecurringMutation = useMutation({
    mutationFn: (data: {
      title: string;
      startTime: string;
      endTime: string;
      rrule: string;
      startDate: Date;
      endDate?: Date;
    }) => addRecurringUnavailability(stylistId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["recurring-unavailability", stylistId],
      });
      toast.success("Gjentakende utilgjengelighet lagt til");
      setShowRecurringDialog(false);
    },
    onError: () =>
      toast.error("Kunne ikke legge til gjentakende utilgjengelighet"),
  });

  // Update recurring unavailability mutation
  const updateRecurringMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        title: string;
        startTime: string;
        endTime: string;
        rrule: string;
        startDate: Date;
        endDate?: Date;
      };
    }) => updateRecurringUnavailability(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["recurring-unavailability", stylistId],
      });
      toast.success("Gjentakende utilgjengelighet oppdatert");
      setShowEditSeries(false);
      setEditingSeries(null);
    },
    onError: () =>
      toast.error("Kunne ikke oppdatere gjentakende utilgjengelighet"),
  });

  // Delete recurring unavailability mutation
  const deleteRecurringMutation = useMutation({
    mutationFn: (id: string) => removeRecurringUnavailability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["recurring-unavailability", stylistId],
      });
      toast.success("Gjentakende utilgjengelighet slettet");
      setShowEditSeries(false);
      setEditingSeries(null);
    },
    onError: () =>
      toast.error("Kunne ikke slette gjentakende utilgjengelighet"),
  });

  // Handle adding work day
  const handleAddWorkDay = useCallback(
    (dayOfWeek: DayOfWeek) => {
      const newWorkDays = [...workDays, dayOfWeek];
      updateRulesMutation.mutate({
        workDays: newWorkDays,
        startTime,
        endTime,
      });
      setShowAddWorkDay(false);
      setSelectedGrayCell(null);
    },
    [workDays, startTime, endTime, updateRulesMutation]
  );

  // Handle removing work day
  const handleRemoveWorkDay = useCallback(
    (dayOfWeek: DayOfWeek) => {
      const newWorkDays = workDays.filter((day) => day !== dayOfWeek);
      updateRulesMutation.mutate({
        workDays: newWorkDays,
        startTime,
        endTime,
      });
      setShowManageUnavailable(false);
      setSelectedRedCell(null);
    },
    [workDays, startTime, endTime, updateRulesMutation]
  );

  // Handle removing unavailability
  const handleRemoveUnavailability = useCallback(() => {
    if (!selectedRedCell || !unavailability?.data) return;

    const slotStart = new Date(selectedRedCell.date);
    slotStart.setHours(selectedRedCell.hour, 0, 0, 0);
    const slotEnd = new Date(selectedRedCell.date);
    slotEnd.setHours(selectedRedCell.hour + 1, 0, 0, 0);

    // Find the specific unavailability entry that overlaps with this time slot
    const unavailabilityToRemove = unavailability.data.find((u) => {
      const unavailStart = new Date(u.start_time);
      const unavailEnd = new Date(u.end_time);
      return slotStart < unavailEnd && slotEnd > unavailStart;
    });

    if (unavailabilityToRemove) {
      removeUnavailabilityMutation.mutate(unavailabilityToRemove.id);
    } else {
      toast.error("Kunne ikke finne utilgjengelighet å fjerne");
    }

    setShowManageUnavailable(false);
    setSelectedRedCell(null);
  }, [selectedRedCell, unavailability, removeUnavailabilityMutation]);

  // Handle canceling a recurring instance
  const handleCancelRecurringInstance = useCallback(
    (seriesId: string, originalStartTime: Date) => {
      addRecurringException(seriesId, originalStartTime)
        .then(() => {
          queryClient.invalidateQueries({
            queryKey: ["recurring-unavailability", stylistId],
          });
          toast.success("Forekomst avlyst");
        })
        .catch(() => {
          toast.error("Kunne ikke avlyse forekomst");
        });
    },
    [stylistId, queryClient]
  );

  // Handle rescheduling a recurring instance
  const handleRescheduleRecurringInstance = useCallback(
    (
      seriesId: string,
      originalStartTime: Date,
      newStartTime: Date,
      newEndTime: Date
    ) => {
      addRecurringException(
        seriesId,
        originalStartTime,
        newStartTime,
        newEndTime
      )
        .then(() => {
          queryClient.invalidateQueries({
            queryKey: ["recurring-unavailability", stylistId],
          });
          toast.success("Forekomst flyttet");
        })
        .catch(() => {
          toast.error("Kunne ikke flytte forekomst");
        });
    },
    [stylistId, queryClient]
  );

  // Handle editing recurring series
  const handleEditRecurringSeries = useCallback(async (seriesId: string) => {
    try {
      const { data: series, error } =
        await getRecurringUnavailabilityById(seriesId);
      if (error || !series) {
        toast.error("Kunne ikke hente seriedata");
        return;
      }
      setEditingSeries(series);
      setShowEditSeries(true);
    } catch (error) {
      toast.error("Kunne ikke hente seriedata");
    }
  }, []);

  // Get recurring info for a specific slot
  const getRecurringInfo = useCallback(
    (date: Date, hour: number) => {
      if (!recurringUnavailability?.data) return null;

      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      for (const recurring of recurringUnavailability.data) {
        // Check if this slot matches a recurring pattern
        const seriesStart = new Date(recurring.series_start_date);
        const seriesEnd = recurring.series_end_date
          ? new Date(recurring.series_end_date)
          : null;

        if (date < seriesStart || (seriesEnd && date > seriesEnd)) continue;

        const rrule = recurring.rrule;
        const dayOfWeek = date.getDay();
        const dayMap = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
        const currentDay = dayMap[dayOfWeek];

        if (rrule.includes("BYDAY=")) {
          const byDayMatch = rrule.match(/BYDAY=([^;]+)/);
          if (byDayMatch) {
            const allowedDays = byDayMatch[1].split(",");
            if (!allowedDays.includes(currentDay)) continue;
          }
        }

        if (rrule.includes("FREQ=WEEKLY")) {
          const [startHour, startMinute] = recurring.start_time
            .split(":")
            .map(Number);
          const [endHour, endMinute] = recurring.end_time
            .split(":")
            .map(Number);

          const recurringStart = new Date(date);
          recurringStart.setHours(startHour, startMinute, 0, 0);
          const recurringEnd = new Date(date);
          recurringEnd.setHours(endHour, endMinute, 0, 0);

          if (slotStart < recurringEnd && slotEnd > recurringStart) {
            return {
              seriesId: recurring.id,
              title: recurring.title,
            };
          }
        }
      }

      return null;
    },
    [recurringUnavailability]
  );

  // Initialize work days and times from fetched data
  useEffect(() => {
    if (availabilityRules?.data) {
      const rules = availabilityRules.data;
      if (rules.length > 0) {
        setWorkDays(rules.map((r) => r.day_of_week));
        setStartTime(rules[0].start_time.slice(0, 5));
        setEndTime(rules[0].end_time.slice(0, 5));
      }
    }
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

  // Get unavailability reason/title for tooltip
  const getUnavailabilityTooltip = useCallback(
    (date: Date, hour: number) => {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      // Check one-off unavailability first
      if (unavailability?.data) {
        const oneOffMatch = unavailability.data.find((u) => {
          const unavailStart = new Date(u.start_time);
          const unavailEnd = new Date(u.end_time);
          return slotStart < unavailEnd && slotEnd > unavailStart;
        });
        if (oneOffMatch) {
          return oneOffMatch.reason || "Utilgjengelig";
        }
      }

      // Check recurring unavailability
      if (recurringUnavailability?.data) {
        const recurringMatches = recurringUnavailability.data
          .map((recurring) => {
            // Check if the current date is within the series date range
            const seriesStart = new Date(recurring.series_start_date);
            const seriesEnd = recurring.series_end_date
              ? new Date(recurring.series_end_date)
              : null;

            if (date < seriesStart || (seriesEnd && date > seriesEnd)) {
              return null;
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
                  return null;
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
                // Exception exists - determine tooltip based on exception type
                if (!exception.new_start_time || !exception.new_end_time) {
                  // This shouldn't show as unavailable, but just in case
                  return null;
                } else {
                  // Exception is rescheduled, check if current slot overlaps with new times
                  const newStart = new Date(exception.new_start_time);
                  const newEnd = new Date(exception.new_end_time);
                  if (slotStart < newEnd && slotEnd > newStart) {
                    return `${recurring.title} (Flyttet til ${newStart.getHours().toString().padStart(2, "0")}:${newStart.getMinutes().toString().padStart(2, "0")})`;
                  }
                  return null;
                }
              } else {
                // No exception, check original times
                if (
                  slotStart < originalRecurringEnd &&
                  slotEnd > originalRecurringStart
                ) {
                  return recurring.title;
                }
                return null;
              }
            }

            return null;
          })
          .filter(Boolean)[0]; // Get first match

        if (recurringMatches) {
          return recurringMatches;
        }
      }

      return "Utilgjengelig";
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
      return workDays.includes(dayMapping[dayName]);
    },
    [workDays]
  );

  // Get all hours for display (always show 24 hours)
  const getAllHours = useCallback(() => {
    return Array.from({ length: 24 }, (_, i) => i);
  }, []);

  // Check if an hour is within work hours
  const isHourInWorkTime = useCallback(
    (hour: number) => {
      const startHour = parseInt(startTime.split(":")[0]);
      const endHour = parseInt(endTime.split(":")[0]);
      return hour >= startHour && hour < endHour;
    },
    [startTime, endTime]
  );

  const handlePreviousWeek = () => setCurrentWeek((prev) => subWeeks(prev, 1));
  const handleNextWeek = () => setCurrentWeek((prev) => addWeeks(prev, 1));
  const handleToday = () => setCurrentWeek(new Date());

  const handleSaveSettings = () => {
    updateRulesMutation.mutate({ workDays, startTime, endTime });
  };

  const handleAddUnavailability = (data: {
    start: Date;
    end: Date;
    reason?: string;
  }) => {
    addUnavailabilityMutation.mutate(data);
  };

  const handleAddRecurring = (data: {
    title: string;
    startTime: string;
    endTime: string;
    rrule: string;
    startDate: Date;
    endDate?: Date;
  }) => {
    addRecurringMutation.mutate(data);
  };

  const handleUpdateRecurring = (
    id: string,
    data: {
      title: string;
      startTime: string;
      endTime: string;
      rrule: string;
      startDate: Date;
      endDate?: Date;
    }
  ) => {
    updateRecurringMutation.mutate({ id, data });
  };

  const handleDeleteRecurring = (id: string) => {
    deleteRecurringMutation.mutate(id);
  };

  if (rulesLoading || unavailabilityLoading) {
    return <AvailabilitySchedulerSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Tilgjengelighet
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRecurringDialog(true)}
              >
                <Repeat className="w-4 h-4 mr-2" />
                Gjentakende
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Innstillinger
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
                    captionLayout="dropdown"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setCurrentWeek(date);
                        setSelectedDate(date);
                      }
                    }}
                    weekStartsOn={1}
                    startMonth={new Date(new Date().getFullYear() - 2, 0)}
                    endMonth={new Date(new Date().getFullYear() + 2, 11)}
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
              {getAllHours().map((hour) => (
                <div key={hour} className="grid grid-cols-8">
                  <div className="p-2 text-xs text-center border border-border/40 dark:border-border/20 bg-muted/50">
                    {`${hour.toString().padStart(2, "0")}:00`}
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    const isWorkDay = isDayWorkDay(day);
                    const isWorkHour = isHourInWorkTime(hour);
                    const isAvailable = isWorkDay && isWorkHour;
                    const isUnavailable = isTimeSlotUnavailable(day, hour);

                    const cellContent = (
                      <div
                        className={cn(
                          "p-2 border border-border/90 dark:border-border/20 min-h-[60px] cursor-pointer transition-colors",
                          !isAvailable && "bg-gray-100",
                          isAvailable &&
                            !isUnavailable &&
                            "bg-green-100 hover:bg-green-300",
                          isUnavailable && "bg-red-100 hover:bg-red-200"
                        )}
                        onClick={() => {
                          if (isAvailable && !isUnavailable) {
                            // Green cell - add unavailability
                            const clickedDate = new Date(day);
                            clickedDate.setHours(hour, 0, 0, 0);
                            setUnavailableStart(clickedDate);
                            const endDate = new Date(clickedDate);
                            endDate.setHours(hour + 1, 0, 0, 0);
                            setUnavailableEnd(endDate);
                            setShowAddUnavailable(true);
                          } else if (!isAvailable && !isWorkDay) {
                            // Gray cell - add work day
                            setSelectedGrayCell(day);
                            setShowAddWorkDay(true);
                          } else if (isUnavailable) {
                            // Red cell - manage unavailability
                            setSelectedRedCell({ date: day, hour });
                            setShowManageUnavailable(true);
                          }
                        }}
                      >
                        {isUnavailable && (
                          <Badge variant="destructive" className="text-xs">
                            Opptatt
                          </Badge>
                        )}
                      </div>
                    );

                    // Wrap red cells with tooltip
                    if (isUnavailable) {
                      return (
                        <TooltipProvider key={dayIndex} delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {cellContent}
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{getUnavailabilityTooltip(day, hour)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    }

                    return <div key={dayIndex}>{cellContent}</div>;
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-100 border-2 border-green-200 rounded" />
              <span className="font-medium">Tilgjengelig</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-100 border-2 border-red-200 rounded" />
              <span className="font-medium">Utilgjengelig</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-100 border-2 border-gray-300 rounded" />
              <span className="font-medium">Ikke arbeidsdag</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings dialog */}
      {showSettings && (
        <Card className="fixed inset-x-4 top-20 z-50 max-w-lg mx-auto shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Arbeidsinnstillinger</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Arbeidsdager</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.value}
                      checked={workDays.includes(day.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setWorkDays([...workDays, day.value]);
                        } else {
                          setWorkDays(workDays.filter((d) => d !== day.value));
                        }
                      }}
                    />
                    <Label htmlFor={day.value} className="cursor-pointer">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time">Starttid</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger id="start-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-60">
                      {HOURS.map((hour) => (
                        <SelectItem key={hour.value} value={hour.value}>
                          {hour.label}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="end-time">Sluttid</Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger id="end-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-60">
                      {HOURS.map((hour) => (
                        <SelectItem key={hour.value} value={hour.value}>
                          {hour.label}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Avbryt
              </Button>
              <Button onClick={handleSaveSettings}>Lagre</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add unavailability dialog */}
      <AddUnavailabilityDialog
        open={showAddUnavailable}
        onOpenChange={setShowAddUnavailable}
        initialStart={unavailableStart}
        initialEnd={unavailableEnd}
        onSubmit={handleAddUnavailability}
      />

      {/* Add work day dialog */}
      <AddWorkDayDialog
        open={showAddWorkDay}
        onOpenChange={setShowAddWorkDay}
        selectedDate={selectedGrayCell}
        onSubmit={handleAddWorkDay}
      />

      {/* Manage unavailable dialog */}
      <ManageUnavailableDialog
        open={showManageUnavailable}
        onOpenChange={setShowManageUnavailable}
        selectedDate={selectedRedCell?.date || null}
        selectedHour={selectedRedCell?.hour || null}
        unavailabilityReason={
          selectedRedCell
            ? getUnavailabilityTooltip(
                selectedRedCell.date,
                selectedRedCell.hour
              ) || undefined
            : undefined
        }
        isRecurring={
          selectedRedCell
            ? !!getRecurringInfo(selectedRedCell.date, selectedRedCell.hour)
            : false
        }
        recurringTitle={
          selectedRedCell
            ? getRecurringInfo(selectedRedCell.date, selectedRedCell.hour)
                ?.title || undefined
            : undefined
        }
        seriesId={
          selectedRedCell
            ? getRecurringInfo(selectedRedCell.date, selectedRedCell.hour)
                ?.seriesId
            : undefined
        }
        onRemoveFromWorkDays={handleRemoveWorkDay}
        onRemoveUnavailability={handleRemoveUnavailability}
        onCancelRecurringInstance={handleCancelRecurringInstance}
        onRescheduleRecurringInstance={handleRescheduleRecurringInstance}
        onEditRecurringSeries={handleEditRecurringSeries}
      />

      {/* Recurring unavailability dialog */}
      <RecurringUnavailabilityDialog
        open={showRecurringDialog}
        onOpenChange={setShowRecurringDialog}
        onSubmit={handleAddRecurring}
      />

      {/* Edit recurring series dialog */}
      <EditRecurringSeriesDialog
        open={showEditSeries}
        onOpenChange={setShowEditSeries}
        series={editingSeries}
        onUpdate={handleUpdateRecurring}
        onDelete={handleDeleteRecurring}
      />

      {/* Help dialog */}
      <HelpDialog open={showHelp} onOpenChange={setShowHelp} />
    </div>
  );
}
