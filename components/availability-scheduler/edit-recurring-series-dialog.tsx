"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import type { Database } from "@/types/database.types";

type RecurringUnavailability = Database["public"]["Tables"]["stylist_recurring_unavailability"]["Row"];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: `${i.toString().padStart(2, "0")}:00`,
  label: `${i.toString().padStart(2, "0")}:00`,
}));

interface EditRecurringSeriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  series: RecurringUnavailability | null;
  onUpdate: (id: string, data: {
    title: string;
    startTime: string;
    endTime: string;
    rrule: string;
    startDate: Date;
    endDate?: Date;
  }) => void;
  onDelete: (id: string) => void;
}

export function EditRecurringSeriesDialog({
  open,
  onOpenChange,
  series,
  onUpdate,
  onDelete,
}: EditRecurringSeriesDialogProps) {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");
  const [pattern, setPattern] = useState("FREQ=WEEKLY;BYDAY=MO");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Populate form with series data when dialog opens
  useEffect(() => {
    if (series) {
      setTitle(series.title || "");
      setStartTime(series.start_time.slice(0, 5)); // Remove seconds
      setEndTime(series.end_time.slice(0, 5)); // Remove seconds
      setPattern(series.rrule || "FREQ=WEEKLY;BYDAY=MO");
      setStartDate(new Date(series.series_start_date));
      setEndDate(series.series_end_date ? new Date(series.series_end_date) : undefined);
    }
  }, [series]);

  const handleUpdate = () => {
    if (!series) return;
    
    onUpdate(series.id, {
      title,
      startTime,
      endTime,
      rrule: pattern,
      startDate,
      endDate,
    });
  };

  const handleDelete = () => {
    if (!series) return;
    onDelete(series.id);
  };

  if (!series) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Rediger gjentakende utilgjengelighet</DialogTitle>
          <DialogDescription>
            Gjør endringer i "{series.title}" serien
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Tittel</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="F.eks. Lunsj, Møte"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fra klokkeslett</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
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
              <Label>Til klokkeslett</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
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

          <div>
            <Label>Gjentakelse</Label>
            <Select value={pattern} onValueChange={setPattern}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-48">
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
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start dato</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {format(startDate, "PPP", { locale: nb })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    weekStartsOn={1}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Slutt dato (valgfritt)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {endDate ? format(endDate, "PPP", { locale: nb }) : "Ingen slutt"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    weekStartsOn={1}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Slett serie
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Slett gjentakende utilgjengelighet?</AlertDialogTitle>
                <AlertDialogDescription>
                  Dette vil permanent slette "{title}" serien og alle tilhørende unntak. 
                  Denne handlingen kan ikke angres.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Slett
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button onClick={handleUpdate} disabled={!title.trim()}>
              Lagre endringer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}