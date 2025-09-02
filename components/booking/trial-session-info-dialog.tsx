"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TestTube,
  HelpCircle,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Euro,
  Lightbulb,
  Shield,
  Users,
} from "lucide-react";

interface TrialSessionInfoDialogProps {
  children?: React.ReactNode;
  trialSessionPrice?: number;
  trialSessionDurationMinutes?: number;
  trialSessionDescription?: string;
}

export function TrialSessionInfoDialog({
  children,
  trialSessionPrice,
  trialSessionDurationMinutes,
  trialSessionDescription,
}: TrialSessionInfoDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <HelpCircle className="w-4 h-4 mr-2" />
            Hva er en prøvetime?
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Alt du trenger å vite om prøvetimer
          </DialogTitle>
          <DialogDescription>
            En komplett guide til hvordan prøvetimer fungerer på Nabostylisten
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* What is a trial session */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="w-5 h-5" />
                Hva er en prøvetime?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {trialSessionDescription || 
                "En prøvetime er en kortere sesjon der du kan teste ut stylisten og tjenesten før du committer til en full behandling. Dette gir både deg og stylisten mulighet til å bli kjent og sikre at dere passer godt sammen."}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {trialSessionPrice && (
                  <Badge variant="secondary">
                    <Euro className="w-3 h-3 mr-1" />
                    {trialSessionPrice} kr
                  </Badge>
                )}
                {trialSessionDurationMinutes && (
                  <Badge variant="secondary">
                    <Clock className="w-3 h-3 mr-1" />
                    {trialSessionDurationMinutes} minutter
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Fordeler med prøvetime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 mt-1 text-blue-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm">Bli kjent med stylisten</h4>
                    <p className="text-xs text-muted-foreground">
                      Test kjemien og kommunikasjonen før hovedbehandlingen
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TestTube className="w-4 h-4 mt-1 text-purple-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm">Test produkter og teknikker</h4>
                    <p className="text-xs text-muted-foreground">
                      Prøv ut produkter og se hvordan din hud/hår reagerer
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-4 h-4 mt-1 text-yellow-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm">Diskuter forventninger</h4>
                    <p className="text-xs text-muted-foreground">
                      Avklar ønsker og forventninger i rolige omgivelser
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 mt-1 text-green-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm">Trygghet og tillit</h4>
                    <p className="text-xs text-muted-foreground">
                      Bygg tillit før du investerer i en lengre behandling
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How it works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5" />
                Hvordan fungerer det?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Book prøvetimen</h4>
                    <p className="text-xs text-muted-foreground">
                      Velg en dato som passer deg - prøvetimen må være før hovedbookingen
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Møt stylisten</h4>
                    <p className="text-xs text-muted-foreground">
                      Dra på prøvetimen og bli kjent med stylisten og deres arbeidsmåte
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Hovedbehandling</h4>
                    <p className="text-xs text-muted-foreground">
                      Hvis alt gikk bra, møt opp til hovedbehandlingen med trygghet
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timing and cancellation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5" />
                Viktig å vite
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Prøvetimen må gjennomføres før hovedbookingen din</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Du betaler for prøvetimen separat fra hovedbehandlingen</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Samme avbestillingsregler gjelder som for vanlige bookinger</span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 mt-0.5 text-red-600 flex-shrink-0" />
                  <span>Du er ikke forpliktet til å gjennomføre hovedbehandlingen etter prøvetimen</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HelpCircle className="w-5 h-5" />
                Ofte stilte spørsmål
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-1">Kan jeg avbestille prøvetimen?</h4>
                <p className="text-xs text-muted-foreground">
                  Ja, samme avbestillingsregler gjelder som for vanlige bookinger. 
                  Avbestill minst 24 timer i forveien for full refusjon.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Hva hvis jeg ikke liker prøvetimen?</h4>
                <p className="text-xs text-muted-foreground">
                  Du kan avbestille hovedbookingen etter prøvetimen hvis du ikke er fornøyd. 
                  Vanlige avbestillingsregler gjelder.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Må jeg ha prøvetime?</h4>
                <p className="text-xs text-muted-foreground">
                  Nei, prøvetimer er helt valgfritt. Du kan hoppe direkte til hovedbehandlingen 
                  hvis du foretrekker det.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}