"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { createIdentityVerificationForCurrentUser } from "@/server/stripe.actions";
import { BlurFade } from "@/components/magicui/blur-fade";
import { 
  StylistOnboardingStepper, 
  type OnboardingStep 
} from "@/components/stylist-onboarding-stepper";

interface StylistIdentityVerificationProps {
  userId: string;
  hasVerificationSession: boolean;
}

export function StylistIdentityVerification({
  userId,
  hasVerificationSession
}: StylistIdentityVerificationProps) {
  const [isCreating, setIsCreating] = useState(false);

  // Define onboarding progress for identity verification step
  const getOnboardingSteps = (): OnboardingStep[] => {
    return [
      {
        id: "application",
        label: "Søknad godkjent",
        description: "Din søknad er godkjent",
        status: "completed",
      },
      {
        id: "stripe-setup",
        label: "Stripe-oppsett",
        description: "Grunnleggende informasjon",
        status: "completed",
      },
      {
        id: "identity",
        label: "Identitetsverifisering",
        description: "Bekreft identitet",
        status: "current",
      },
      {
        id: "ready",
        label: "Klar for salg",
        description: "Start med tjenester",
        status: "pending",
      },
    ];
  };

  const handleStartVerification = async () => {
    setIsCreating(true);

    try {
      const result = await createIdentityVerificationForCurrentUser();

      if (result.data?.verificationUrl) {
        // Redirect to Stripe's hosted verification page
        window.location.href = result.data.verificationUrl;
      } else {
        toast.error(result.error || "Kunne ikke starte identitetsverifisering");
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Error starting verification:", error);
      toast.error("En uventet feil oppstod");
      setIsCreating(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-12">
      <BlurFade delay={0.1} duration={0.5} inView>
        {/* Progress Indicator */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <StylistOnboardingStepper 
              steps={getOnboardingSteps()} 
              variant="horizontal"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Identitetsverifisering påkrevd</CardTitle>
            <CardDescription>
              For å motta betalinger må du verifisere identiteten din med Stripe
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Sikker verifisering</AlertTitle>
              <AlertDescription>
                Du vil bli omdirigert til Stripes sikre verifiseringsside hvor du kan laste opp
                et gyldig identitetsdokument (førerkort, pass, eller nasjonal ID).
              </AlertDescription>
            </Alert>

            {hasVerificationSession ? (
              <Alert>
                <AlertTitle>Verifisering startet</AlertTitle>
                <AlertDescription>
                  Du har allerede startet identitetsverifisering. Hvis du ikke fullførte prosessen
                  eller dokumentene ble avvist, kan du prøve igjen med en ny verifisering.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="text-center">
              <Button
                onClick={handleStartVerification}
                disabled={isCreating}
                className="w-full sm:w-auto"
              >
                {isCreating ? (
                  "Starter verifisering..."
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {hasVerificationSession ? "Prøv identitetsverifisering igjen" : "Start identitetsverifisering"}
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Ved å fortsette godtar du at Stripe behandler identitetsinformasjonen din
              i henhold til deres{" "}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                personvernerklæring
              </a>
            </div>
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  );
}