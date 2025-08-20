"use client"

import { useState, useEffect } from "react"
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
import { DateTimePicker } from "./datetime-picker"

interface AddUnavailabilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStart: Date
  initialEnd: Date
  onSubmit: (data: {
    start: Date
    end: Date
    reason?: string
  }) => void
}

export function AddUnavailabilityDialog({
  open,
  onOpenChange,
  initialStart,
  initialEnd,
  onSubmit,
}: AddUnavailabilityDialogProps) {
  const [start, setStart] = useState(initialStart)
  const [end, setEnd] = useState(initialEnd)
  const [reason, setReason] = useState("")

  useEffect(() => {
    setStart(initialStart)
    setEnd(initialEnd)
  }, [initialStart, initialEnd])

  const handleSubmit = () => {
    onSubmit({
      start,
      end,
      reason: reason.trim() || undefined,
    })
    setReason("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Legg til utilgjengelighet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <DateTimePicker
            label="Fra"
            value={start}
            onChange={setStart}
            id="unavailable-start"
          />

          <DateTimePicker
            label="Til"
            value={end}
            onChange={setEnd}
            id="unavailable-end"
          />

          <div>
            <Label htmlFor="unavailable-reason">Årsak (valgfritt)</Label>
            <Input
              id="unavailable-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="F.eks. Ferie, Lege, Møte"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit}>
            Legg til
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}