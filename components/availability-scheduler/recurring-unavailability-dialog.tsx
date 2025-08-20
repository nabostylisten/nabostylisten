"use client"

import { useState } from "react"
import { format } from "date-fns"
import { nb } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { ScrollArea } from "@/components/ui/scroll-area"

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: `${i.toString().padStart(2, "0")}:00`,
  label: `${i.toString().padStart(2, "0")}:00`,
}))

interface RecurringUnavailabilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    title: string
    startTime: string
    endTime: string
    rrule: string
    startDate: Date
    endDate?: Date
  }) => void
}

export function RecurringUnavailabilityDialog({
  open,
  onOpenChange,
  onSubmit,
}: RecurringUnavailabilityDialogProps) {
  const [title, setTitle] = useState("")
  const [startTime, setStartTime] = useState("10:00")
  const [endTime, setEndTime] = useState("12:00")
  const [pattern, setPattern] = useState("FREQ=WEEKLY;BYDAY=MO")
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>()

  const handleSubmit = () => {
    onSubmit({
      title,
      startTime,
      endTime,
      rrule: pattern,
      startDate,
      endDate,
    })
    // Reset form
    setTitle("")
    setStartTime("10:00")
    setEndTime("12:00")
    setPattern("FREQ=WEEKLY;BYDAY=MO")
    setStartDate(new Date())
    setEndDate(undefined)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gjentakende utilgjengelighet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="recurring-title">Tittel</Label>
            <Input
              id="recurring-title"
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            Legg til
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}