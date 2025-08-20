"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, Calendar, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Hvordan booke en time
          </DialogTitle>
          <DialogDescription>
            Følg disse enkle trinnene for å booke din avtale med stylisten.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Slik booker du:</h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Finn ledig tid</h4>
                  <p className="text-sm text-muted-foreground">
                    Grønne felt viser når stylisten er tilgjengelig. Grå felt
                    viser når stylisten ikke jobber.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Velg starttidspunkt</h4>
                  <p className="text-sm text-muted-foreground">
                    Klikk på et grønt felt for å velge starttidspunkt. Valgt tid
                    vil bli markert i blått.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Sjekk varighet</h4>
                  <p className="text-sm text-muted-foreground">
                    Systemet sjekker automatisk at stylisten har nok tid
                    tilgjengelig for alle tjenestene dine.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Fargeforklaring:</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 border-2 border-green-200 rounded" />
                <div>
                  <p className="font-medium text-sm">Tilgjengelig</p>
                  <p className="text-xs text-muted-foreground">Kan bookes</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-100 border-2 border-gray-300 rounded" />
                <div>
                  <p className="font-medium text-sm">Ikke tilgjengelig</p>
                  <p className="text-xs text-muted-foreground">
                    Stylisten jobber ikke
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 border-2 border-blue-300 rounded animate-pulse" />
                <div>
                  <p className="font-medium text-sm">Valgt tid</p>
                  <p className="text-xs text-muted-foreground">Din booking</p>
                </div>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-4 h-4" />
                Viktig å vite
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                <li>
                  • Tjenester som varer over 60 minutter rundes opp til nærmeste
                  hele time
                </li>
                <li>
                  • Du kan bare booke hvis stylisten har nok ledig tid for alle
                  tjenestene
                </li>
                <li>
                  • Tiden vises som start- og sluttidspunkt for hele behandlingen
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="w-4 h-4" />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                <li>• Bruk navigasjonsknappene for å gå til forskjellige uker</li>
                <li>• Klikk "I dag" for å gå tilbake til denne uken</li>
                <li>• Bruk kalenderen for å hoppe til en spesifikk dato</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
