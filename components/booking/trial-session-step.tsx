"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TrialSessionScheduler } from "./trial-session-scheduler";
import { TestTube, CheckCircle, XCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useBookingStore } from "@/stores/booking.store";
import { TrialSessionInfoDialog } from "./trial-session-info-dialog";
import { useState } from "react";

interface TrialSessionStepProps {
  trialSessionPrice?: number;
  trialSessionDurationMinutes?: number;
  trialSessionDescription?: string;
  mainBookingDate?: Date;
}

export function TrialSessionStep({
  trialSessionPrice,
  trialSessionDurationMinutes,
  trialSessionDescription,
  mainBookingDate,
}: TrialSessionStepProps) {
  const { bookingData, updateBookingData, stylistId } = useBookingStore();
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  const handleWantsTrialSession = (wants: boolean) => {
    updateBookingData({ 
      wantsTrialSession: wants,
      // Clear trial session data if user doesn't want it
      ...(wants ? {} : {
        trialSessionDate: undefined,
        trialSessionStartTime: undefined,
        trialSessionEndTime: undefined,
      })
    });
  };

  const handleTrialTimeSlotSelect = (startTime: Date, endTime: Date) => {
    updateBookingData({
      trialSessionDate: startTime,
      trialSessionStartTime: startTime,
      trialSessionEndTime: endTime,
    });
  };

  // Format duration
  const formatDuration = (minutes: number) => {
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
    <div className="space-y-6">
      {/* Trial Session Introduction */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5 text-primary" />
              Vil du ha en prøvetime?
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowInfoDialog(true)}
            >
              <Info className="w-4 h-4 mr-2" />
              Les mer
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground">
            {trialSessionDescription || 
              "En prøvetime lar deg teste stilen på forhånd. Dette er spesielt nyttig for bryllup og andre viktige arrangementer."}
          </div>

          {trialSessionPrice && trialSessionDurationMinutes && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Pris</div>
                <div className="font-semibold text-lg">
                  {trialSessionPrice} NOK
                </div>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Varighet</div>
                <div className="font-semibold text-lg">
                  {formatDuration(trialSessionDurationMinutes)}
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Choice buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              variant={bookingData.wantsTrialSession === true ? "default" : "outline"}
              onClick={() => handleWantsTrialSession(true)}
              className="flex items-center gap-2 min-w-32"
            >
              <CheckCircle className="w-4 h-4" />
              Ja, jeg vil ha prøvetime
            </Button>
            <Button
              variant={bookingData.wantsTrialSession === false ? "default" : "outline"}
              onClick={() => handleWantsTrialSession(false)}
              className="flex items-center gap-2 min-w-32"
            >
              <XCircle className="w-4 h-4" />
              Nei takk
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Show scheduler if user wants trial session */}
      {bookingData.wantsTrialSession === true && (
        <div className="space-y-4">
          {/* Selected trial time display */}
          {bookingData.trialSessionStartTime && bookingData.trialSessionEndTime && (
            <Card>
              <CardContent className="pt-6">
                <div className="bg-green-50 dark:bg-green-950/50 rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">
                      Valgt prøvetime:{" "}
                      {format(bookingData.trialSessionStartTime, "EEEE d. MMMM, HH:mm", {
                        locale: nb,
                      })}{" "}
                      - {format(bookingData.trialSessionEndTime, "HH:mm")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trial session scheduler */}
          {stylistId && trialSessionDurationMinutes && (
            <TrialSessionScheduler
              stylistId={stylistId}
              trialSessionDurationMinutes={trialSessionDurationMinutes}
              onTimeSlotSelect={handleTrialTimeSlotSelect}
              selectedStartTime={bookingData.trialSessionStartTime}
              mainBookingDate={mainBookingDate}
            />
          )}
        </div>
      )}

      {/* Info dialog */}
      <TrialSessionInfoDialog 
        open={showInfoDialog} 
        onOpenChange={setShowInfoDialog}
        trialSessionPrice={trialSessionPrice}
        trialSessionDurationMinutes={trialSessionDurationMinutes}
      />
    </div>
  );
}