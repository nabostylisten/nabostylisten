"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingNoteForm } from "./booking-note-form";
import { BookingNoteList } from "./booking-note-list";
import { FileText, List } from "lucide-react";
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
  onEditNote?: (note: BookingNote) => void;
}

export function BookingNoteDialog({
  open,
  onOpenChange,
  bookingId,
  stylistId,
  isEditing = false,
  editingNote,
  onEditComplete,
  onEditNote,
}: BookingNoteDialogProps) {
  const [activeTab, setActiveTab] = useState<string>(
    isEditing ? "form" : "list"
  );

  const handleFormSuccess = () => {
    if (isEditing && onEditComplete) {
      onEditComplete();
    }
    // Switch to list view after successful form submission
    setActiveTab("list");
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset to default tab when closing
    setActiveTab(isEditing ? "form" : "list");
    if (isEditing && onEditComplete) {
      onEditComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {isEditing ? "Rediger bookingnotat" : "Bookingnotater"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Oppdater ditt bookingnotat med detaljer og bilder fra tjenesten."
              : "Administrer bookingnotater for å dokumentere tjenesten og dele viktig informasjon med kunden."}
          </DialogDescription>
        </DialogHeader>

        {isEditing ? (
          // Edit mode - only show the form
          <ScrollArea className="h-[600px] flex-1">
            <div className="pr-4">
              <BookingNoteForm
                bookingId={bookingId}
                stylistId={stylistId}
                editingNote={editingNote}
                onSuccess={handleFormSuccess}
                onCancel={handleClose}
              />
            </div>
          </ScrollArea>
        ) : (
          // Normal mode - show tabs
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="w-4 h-4" />
                Eksisterende notater
              </TabsTrigger>
              <TabsTrigger value="form" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Nytt notat
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="flex-1 overflow-hidden">
              <BookingNoteList
                bookingId={bookingId}
                onEditNote={(note) => {
                  if (onEditNote) {
                    onEditNote(note);
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="form" className="flex-1 overflow-hidden">
              <BookingNoteForm
                bookingId={bookingId}
                stylistId={stylistId}
                onSuccess={handleFormSuccess}
                onCancel={() => setActiveTab("list")}
              />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
