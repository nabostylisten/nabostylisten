"use client";

import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingNoteCard } from "./booking-note-card";
import { getBookingNotes } from "@/server/booking-note.actions";
import { FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Database } from "@/types/database.types";

type BookingNote = Database["public"]["Tables"]["booking_notes"]["Row"] & {
  stylist: {
    id: string;
    full_name: string | null;
  } | null;
};

interface BookingNoteListProps {
  bookingId: string;
  onEditNote: (note: BookingNote) => void;
}

export function BookingNoteList({ bookingId, onEditNote }: BookingNoteListProps) {
  const {
    data: notesResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["booking-notes", bookingId],
    queryFn: () => getBookingNotes(bookingId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <ScrollArea className="h-[400px]">
        <div className="space-y-4 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3 p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  }

  if (error || notesResponse?.error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Feil ved lasting av notater: {error?.message || notesResponse?.error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const notes = notesResponse?.data || [];

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-muted-foreground">
        <FileText className="w-12 h-12 mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">Ingen notater ennå</h3>
        <p className="text-sm text-center">
          Opprett ditt første bookingnotat for å dokumentere tjenesten og dele informasjon med kunden.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-4 p-4">
        {notes.map((note) => (
          <BookingNoteCard
            key={note.id}
            note={note}
            onEdit={() => onEditNote(note)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}