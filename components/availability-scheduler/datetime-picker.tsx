"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { format } from "date-fns"
import { nb } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
  label: string
  value: Date
  onChange: (date: Date) => void
  id?: string
}

export function DateTimePicker({ label, value, onChange, id }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Preserve the time from the current value
      const newDate = new Date(selectedDate)
      newDate.setHours(value.getHours(), value.getMinutes(), 0, 0)
      onChange(newDate)
      setOpen(false)
    }
  }

  const handleTimeChange = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number)
    const newDate = new Date(value)
    newDate.setHours(hours, minutes, 0, 0)
    onChange(newDate)
  }

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-3 flex-1">
        <Label htmlFor={`${id}-date-picker`} className="px-1">
          {label} - Dato
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id={`${id}-date-picker`}
              className="justify-between font-normal"
            >
              {format(value, "PPP", { locale: nb })}
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={value}
              captionLayout="dropdown"
              onSelect={handleDateSelect}
              weekStartsOn={1}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-3">
        <Label htmlFor={`${id}-time-picker`} className="px-1">
          Tid
        </Label>
        <Input
          type="time"
          id={`${id}-time-picker`}
          value={format(value, "HH:mm")}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  )
}