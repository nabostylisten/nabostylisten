"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  Clock,
  CreditCard,
  Calendar,
  AlertTriangle,
} from "lucide-react";

interface TrialSessionInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trialSessionPrice?: number;
  trialSessionDurationMinutes?: number;
}

export function TrialSessionInfoDialog({
  open,
  onOpenChange,
  trialSessionPrice,
  trialSessionDurationMinutes,
}: TrialSessionInfoDialogProps) {
  // Format duration
  const formatDuration = (minutes: number) => {
    if (!minutes) return "";
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? "time" : "timer"}`;
    }
    return `${hours}t ${remainingMinutes}min`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Alt om prøvetimer
          </DialogTitle>
          <DialogDescription>
            Lær alt du trenger å vite om prøvetimer og hvordan de fungerer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* What is a trial session */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Hva er en prøvetime?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                En prøvetime er en redusert versjon av hovedtjenesten som
                utføres før den egentlige bookingen. Dette gir deg mulighet til
                å teste stilen, sjekke for allergiske reaksjoner, og sikre at du
                er 100% fornøyd før den store dagen.
              </p>
            </CardContent>
          </Card>

          {/* When to use trial sessions */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Når bør du velge prøvetime?
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span className="text-sm">
                    <strong>Bryllup og store arrangementer:</strong> Test stilen
                    måneder på forhånd
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span className="text-sm">
                    <strong>Første gang hos stylisten:</strong> Bygg tillit og
                    kjemi
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span className="text-sm">
                    <strong>Allergitesting:</strong> Test produkter på forhånd
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span className="text-sm">
                    <strong>Store forandringer:</strong> Test dramatiske
                    fargeendringer
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing and timing */}
          {(trialSessionPrice || trialSessionDurationMinutes) && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  Pris og varighet
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trialSessionPrice && (
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">
                        Prøvetime koster
                      </div>
                      <div className="font-semibold text-lg">
                        {trialSessionPrice} NOK
                      </div>
                    </div>
                  )}
                  {trialSessionDurationMinutes && (
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">
                        Varighet
                      </div>
                      <div className="font-semibold text-lg">
                        {formatDuration(trialSessionDurationMinutes)}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Important rules */}
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Viktige regler
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-sm">
                    <strong>Timing:</strong> Prøvetimen må bookes før
                    hovedbookingen
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm">
                    <strong>Avbestillingsregler:</strong> Samme regler som
                    vanlige bookinger
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm">
                    <strong>Refusjon:</strong> Prøvetimen refunderes ikke ved
                    avbestilling av hovedbooking
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm">
                    <strong>Endringer:</strong> Stylisten kan flytte prøvetimen
                    ved behov. Dette kan avtales i chat etter booking.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Fordeler med prøvetime
              </h3>
              <div className="flex flex-col gap-2">
                <div className="text-sm">
                  <strong>Trygghet:</strong> Test stilen på forhånd
                </div>
                <div className="text-sm">
                  <strong>Perfeksjon:</strong> Juster detaljer før hovedtimen
                </div>
                <div className="text-sm">
                  <strong>Allergitest:</strong> Sjekk for reaksjoner
                </div>
                <div className="text-sm">
                  <strong>Kommunikasjon:</strong> Bygg forhold til stylisten
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
