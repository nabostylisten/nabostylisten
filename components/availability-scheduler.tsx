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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { AvailabilitySchedulerSkeleton } from "@/components/skeletons/availability-scheduler-skeleton";
import type { Database } from "@/types/database.types";
import {
  getAvailabilityRules,
  updateAvailabilityRules,
  getUnavailability,
  addUnavailability,
  removeUnavailability,
  getRecurringUnavailability,
  addRecurringUnavailability,
  removeRecurringUnavailability,
} from "@/server/availability.actions";

type DayOfWeek = Database["public"]["Enums"]["day_of_week"];
type AvailabilityRule =
  Database["public"]["Tables"]["stylist_availability_rules"]["Row"];
type Unavailability =
  Database["public"]["Tables"]["stylist_unavailability"]["Row"];
type RecurringUnavailability =
  Database["public"]["Tables"]["stylist_recurring_unavailability"]["Row"];

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

  // Work schedule state
  const [workDays, setWorkDays] = useState<DayOfWeek[]>([]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");

  // Unavailability form state
  const [unavailableStart, setUnavailableStart] = useState<Date>(new Date());
  const [unavailableEnd, setUnavailableEnd] = useState<Date>(new Date());
  const [unavailableReason, setUnavailableReason] = useState("");

  // Recurring unavailability state
  const [recurringTitle, setRecurringTitle] = useState("");
  const [recurringStartTime, setRecurringStartTime] = useState("10:00");
  const [recurringEndTime, setRecurringEndTime] = useState("12:00");
  const [recurringPattern, setRecurringPattern] = useState(
    "FREQ=WEEKLY;BYDAY=MO"
  );
  const [recurringStartDate, setRecurringStartDate] = useState<Date>(
    new Date()
  );
  const [recurringEndDate, setRecurringEndDate] = useState<Date | undefined>();

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

  // Fetch recurring unavailability
  const { data: recurringUnavailability } = useQuery({
    queryKey: ["recurring-unavailability", stylistId],
    queryFn: () => getRecurringUnavailability(stylistId),
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
      queryClient.invalidateQueries({
        queryKey: ["unavailability", stylistId],
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
      if (!unavailability?.data) return false;

      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      return unavailability.data.some((u) => {
        const unavailStart = new Date(u.start_time);
        const unavailEnd = new Date(u.end_time);
        return slotStart < unavailEnd && slotEnd > unavailStart;
      });
    },
    [unavailability]
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

  // Get work hours for display
  const getWorkHours = useCallback(() => {
    const startHour = parseInt(startTime.split(":")[0]);
    const endHour = parseInt(endTime.split(":")[0]);
    return Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  }, [startTime, endTime]);

  const handlePreviousWeek = () => setCurrentWeek((prev) => subWeeks(prev, 1));
  const handleNextWeek = () => setCurrentWeek((prev) => addWeeks(prev, 1));
  const handleToday = () => setCurrentWeek(new Date());

  const handleSaveSettings = () => {
    updateRulesMutation.mutate({ workDays, startTime, endTime });
  };

  const handleAddUnavailability = () => {
    addUnavailabilityMutation.mutate({
      start: unavailableStart,
      end: unavailableEnd,
      reason: unavailableReason || undefined,
    });
  };

  const handleAddRecurring = () => {
    addRecurringMutation.mutate({
      title: recurringTitle,
      startTime: recurringStartTime,
      endTime: recurringEndTime,
      rrule: recurringPattern,
      startDate: recurringStartDate,
      endDate: recurringEndDate,
    });
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
              <h3 className="text-lg font-semibold">
                Uke {format(currentWeek, "w, yyyy")}
              </h3>
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
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Weekly calendar view */}
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-8 bg-muted">
              <div className="p-2 border-r">
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
              {getWorkHours().map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-t">
                  <div className="p-2 text-xs text-center border-r bg-muted/50">
                    {`${hour.toString().padStart(2, "0")}:00`}
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    const isWorkDay = isDayWorkDay(day);
                    const isUnavailable = isTimeSlotUnavailable(day, hour);

                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          "p-2 border-r last:border-r-0 min-h-[60px] cursor-pointer transition-colors",
                          !isWorkDay && "bg-gray-50",
                          isWorkDay &&
                            !isUnavailable &&
                            "bg-green-50 hover:bg-green-100",
                          isUnavailable && "bg-red-50 hover:bg-red-100"
                        )}
                        onClick={() => {
                          if (isWorkDay && !isUnavailable) {
                            const clickedDate = new Date(day);
                            clickedDate.setHours(hour, 0, 0, 0);
                            setUnavailableStart(clickedDate);
                            const endDate = new Date(clickedDate);
                            endDate.setHours(hour + 1, 0, 0, 0);
                            setUnavailableEnd(endDate);
                            setShowAddUnavailable(true);
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
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border rounded" />
              <span>Tilgjengelig</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-50 border rounded" />
              <span>Utilgjengelig</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-50 border rounded" />
              <span>Ikke arbeidsdag</span>
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
                    {HOURS.map((hour) => (
                      <SelectItem key={hour.value} value={hour.value}>
                        {hour.label}
                      </SelectItem>
                    ))}
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
                    {HOURS.map((hour) => (
                      <SelectItem key={hour.value} value={hour.value}>
                        {hour.label}
                      </SelectItem>
                    ))}
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
      {showAddUnavailable && (
        <Card className="fixed inset-x-4 top-20 z-50 max-w-lg mx-auto shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Legg til utilgjengelighet</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddUnavailable(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Fra</Label>
              <div className="mt-1">
                <Input
                  type="datetime-local"
                  value={format(unavailableStart, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) =>
                    setUnavailableStart(new Date(e.target.value))
                  }
                />
              </div>
            </div>

            <div>
              <Label>Til</Label>
              <div className="mt-1">
                <Input
                  type="datetime-local"
                  value={format(unavailableEnd, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => setUnavailableEnd(new Date(e.target.value))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reason">Årsak (valgfritt)</Label>
              <Input
                id="reason"
                value={unavailableReason}
                onChange={(e) => setUnavailableReason(e.target.value)}
                placeholder="F.eks. Ferie, Sykdom, Personlig"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddUnavailable(false)}
              >
                Avbryt
              </Button>
              <Button onClick={handleAddUnavailability}>Legg til</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recurring unavailability dialog */}
      {showRecurringDialog && (
        <Card className="fixed inset-x-4 top-20 z-50 max-w-lg mx-auto shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Gjentakende utilgjengelighet</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowRecurringDialog(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="recurring-title">Tittel</Label>
              <Input
                id="recurring-title"
                value={recurringTitle}
                onChange={(e) => setRecurringTitle(e.target.value)}
                placeholder="F.eks. Lunsj, Møte"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fra klokkeslett</Label>
                <Select
                  value={recurringStartTime}
                  onValueChange={setRecurringStartTime}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((hour) => (
                      <SelectItem key={hour.value} value={hour.value}>
                        {hour.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Til klokkeslett</Label>
                <Select
                  value={recurringEndTime}
                  onValueChange={setRecurringEndTime}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((hour) => (
                      <SelectItem key={hour.value} value={hour.value}>
                        {hour.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Gjentakelse</Label>
              <Select
                value={recurringPattern}
                onValueChange={setRecurringPattern}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREQ=DAILY">Hver dag</SelectItem>
                  <SelectItem value="FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR">
                    Hver ukedag
                  </SelectItem>
                  <SelectItem value="FREQ=WEEKLY;BYDAY=MO">
                    Hver mandag
                  </SelectItem>
                  <SelectItem value="FREQ=WEEKLY;BYDAY=TU">
                    Hver tirsdag
                  </SelectItem>
                  <SelectItem value="FREQ=WEEKLY;BYDAY=WE">
                    Hver onsdag
                  </SelectItem>
                  <SelectItem value="FREQ=WEEKLY;BYDAY=TH">
                    Hver torsdag
                  </SelectItem>
                  <SelectItem value="FREQ=WEEKLY;BYDAY=FR">
                    Hver fredag
                  </SelectItem>
                  <SelectItem value="FREQ=WEEKLY;INTERVAL=2">
                    Annenhver uke
                  </SelectItem>
                  <SelectItem value="FREQ=MONTHLY">Hver måned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start dato</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {format(recurringStartDate, "PPP", { locale: nb })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={recurringStartDate}
                      onSelect={(date) => date && setRecurringStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Slutt dato (valgfritt)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {recurringEndDate
                        ? format(recurringEndDate, "PPP", { locale: nb })
                        : "Ingen slutt"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={recurringEndDate}
                      onSelect={setRecurringEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRecurringDialog(false)}
              >
                Avbryt
              </Button>
              <Button onClick={handleAddRecurring}>Legg til</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
