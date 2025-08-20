"use client"

import { format } from "date-fns"
import { nb } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"

type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

interface AddWorkDayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date | null
  onSubmit: (dayOfWeek: DayOfWeek) => void
}

const dayMapping: Record<string, string> = {
  monday: "mandag",
  tuesday: "tirsdag", 
  wednesday: "onsdag",
  thursday: "torsdag",
  friday: "fredag",
  saturday: "lørdag",
  sunday: "søndag",
}

const reverseDayMapping: Record<string, DayOfWeek> = {
  mandag: "monday",
  tirsdag: "tuesday",
  onsdag: "wednesday", 
  torsdag: "thursday",
  fredag: "friday",
  lørdag: "saturday",
  søndag: "sunday",
}

export function AddWorkDayDialog({
  open,
  onOpenChange,
  selectedDate,
  onSubmit,
}: AddWorkDayDialogProps) {
  if (!selectedDate) return null

  const dayName = format(selectedDate, "EEEE", { locale: nb }).toLowerCase()
  const dayOfWeek = reverseDayMapping[dayName]

  const handleSubmit = () => {
    if (dayOfWeek) {
      onSubmit(dayOfWeek)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Legg til arbeidsdag</DialogTitle>
          <DialogDescription>
            Vil du legge til {dayMapping[dayOfWeek]} som en arbeidsdag?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Dette vil legge til <strong>{dayMapping[dayOfWeek]}</strong> som en arbeidsdag 
            med de samme arbeidstidene som dine andre arbeidsdager.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Valgt dato: {format(selectedDate, "PPP", { locale: nb })}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit}>
            Legg til arbeidsdag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}