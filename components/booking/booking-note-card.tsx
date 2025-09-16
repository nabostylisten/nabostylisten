"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  User,
  ArrowRight,
  Tag,
  FileText,
} from "lucide-react";
import { BookingNoteImageCarousel } from "./booking-note-image-carousel";
import { deleteBookingNote } from "@/server/booking-note.actions";
import type { Database } from "@/types/database.types";

type BookingNote = Database["public"]["Tables"]["booking_notes"]["Row"] & {
  stylist: {
    id: string;
    full_name: string | null;
  } | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  service_notes: "Tjenestenotater",
  customer_preferences: "Kundepreferanser",
  issues: "Problemer/bekymringer",
  results: "Resultater",
  follow_up: "Oppfølging nødvendig",
  other: "Annet",
};

const CATEGORY_COLORS: Record<string, string> = {
  service_notes: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-800",
  customer_preferences: "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-200 dark:border-purple-800",
  issues: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-200 dark:border-red-800",
  results: "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-200 dark:border-green-800",
  follow_up: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800",
  other: "bg-gray-50 text-gray-800 border-gray-200 dark:bg-gray-950/30 dark:text-gray-200 dark:border-gray-800",
};

interface BookingNoteCardProps {
  note: BookingNote;
  onEdit?: () => void;
  readOnly?: boolean;
}

export function BookingNoteCard({ note, onEdit, readOnly = false }: BookingNoteCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteBookingNote(note.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["booking-notes", note.booking_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["booking-details", note.booking_id],
      });
      toast.success("Bookingnotat slettet!");
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Feil ved sletting: " + error.message);
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const categoryColor = CATEGORY_COLORS[note.category] || CATEGORY_COLORS.other;

  return (
    <>
      <Card className="w-full hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={categoryColor}>
                {CATEGORY_LABELS[note.category] || "Ukjent"}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {readOnly ? (
                  <>
                    <FileText className="w-3 h-3" />
                    <span className="text-xs">Notat fra stylist</span>
                  </>
                ) : note.customer_visible ? (
                  <>
                    <Eye className="w-3 h-3" />
                    <span className="text-xs">Synlig for kunde</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3" />
                    <span className="text-xs">Kun intern</span>
                  </>
                )}
              </div>
            </div>
            {!readOnly && (
              <div className="flex items-center gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Note Content */}
          <div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {note.content}
            </p>
          </div>

          {/* Images */}
          <BookingNoteImageCarousel noteId={note.id} />

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {note.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Duration Information */}
          {note.duration_minutes && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Varighet:</span>
              <span className="font-medium">
                {note.duration_minutes >= 60
                  ? `${Math.floor(note.duration_minutes / 60)} timer ${note.duration_minutes % 60 === 0 ? "" : `${note.duration_minutes % 60} min`}`.trim()
                  : `${note.duration_minutes} minutter`}
              </span>
            </div>
          )}

          {/* Next Appointment Suggestion */}
          {note.next_appointment_suggestion && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  Forslag til neste avtale:
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {note.next_appointment_suggestion}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="w-3 h-3" />
              <span>{note.stylist?.full_name || "Ukjent stylist"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              <span>
                {format(new Date(note.created_at), "dd.MM.yyyy 'kl.' HH:mm", {
                  locale: nb,
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett bookingnotat</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette dette bookingnotatet? Denne
              handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Sletter..." : "Slett"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
