"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookingNoteForm } from "./booking-note-form";
import { FileText } from "lucide-react";
import type { Database } from "@/types/database.types";
import { ScrollArea } from "../ui/scroll-area";

type BookingNote = Database["public"]["Tables"]["booking_notes"]["Row"] & {
  stylist: {
    id: string;
    full_name: string | null;
  } | null;
};

interface BookingNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  stylistId: string;
  isEditing?: boolean;
  editingNote?: BookingNote;
  onEditComplete?: () => void;
}

export function BookingNoteDialog({
  open,
  onOpenChange,
  bookingId,
  stylistId,
  isEditing = false,
  editingNote,
  onEditComplete,
}: BookingNoteDialogProps) {
  const handleFormSuccess = () => {
    if (isEditing && onEditComplete) {
      onEditComplete();
    }
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    if (isEditing && onEditComplete) {
      onEditComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {isEditing ? "Rediger bookingnotat" : "Nytt bookingnotat"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Oppdater ditt bookingnotat med detaljer og bilder fra tjenesten."
              : "Opprett et nytt bookingnotat for å dokumentere tjenesten og dele viktig informasjon med kunden."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[700px] flex-1">
          <BookingNoteForm
            key={editingNote?.id || "new"} 
            bookingId={bookingId}
            stylistId={stylistId}
            editingNote={editingNote}
            onSuccess={handleFormSuccess}
            onCancel={handleClose}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
