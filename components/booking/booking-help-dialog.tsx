"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "lucide-react";

interface BookingHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingHelpDialog({
  open,
  onOpenChange,
}: BookingHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Hvordan booke en time
          </DialogTitle>
          <DialogDescription>
            Følg disse enkle trinnene for å booke din avtale med stylisten.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* How to book steps */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Slik booker du:</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-primary/10 text-primary border border-primary rounded-full flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-medium mb-1">Finn ledig tid</h4>
                  <p className="text-sm text-muted-foreground">
                    Grønne felt viser når stylisten er tilgjengelig. Grå felt viser når stylisten ikke jobber.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 bg-primary/10 text-primary border border-primary rounded-full flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-medium mb-1">Velg starttidspunkt</h4>
                  <p className="text-sm text-muted-foreground">
                    Klikk på et grønt felt for å velge starttidspunkt. Valgt tid vil bli markert i blått.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 bg-primary/10 text-primary border border-primary rounded-full flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-medium mb-1">Sjekk varighet</h4>
                  <p className="text-sm text-muted-foreground">
                    Systemet sjekker automatisk at stylisten har nok tid tilgjengelig for alle tjenestene dine.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Color legend */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Fargeforklaring:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 border-2 border-green-200 rounded shrink-0" />
                <div>
                  <p className="font-medium text-sm">Tilgjengelig</p>
                  <p className="text-xs text-muted-foreground">Kan bookes</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-100 border-2 border-gray-300 rounded shrink-0" />
                <div>
                  <p className="font-medium text-sm">Ikke tilgjengelig</p>
                  <p className="text-xs text-muted-foreground">Stylisten jobber ikke</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 border-2 border-blue-300 rounded animate-pulse shrink-0" />
                <div>
                  <p className="font-medium text-sm">Valgt tid</p>
                  <p className="text-xs text-muted-foreground">Din booking</p>
                </div>
              </div>
            </div>
          </div>

          {/* Important info and tips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-medium mb-3">Viktig å vite</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Tjenester over 60 min rundes opp til hele timer</li>
                <li>• Du kan bare booke hvis stylisten har nok ledig tid</li>
                <li>• Tiden vises som start- og sluttidspunkt</li>
              </ul>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-medium mb-3">Tips</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Bruk pilene for å navigere mellom uker</li>
                <li>• Klikk "I dag" for å gå tilbake til denne uken</li>
                <li>• Bruk kalenderen for å hoppe til en dato</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
