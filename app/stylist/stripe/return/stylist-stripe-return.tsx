"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock } from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import {
  StylistOnboardingStepper,
  type OnboardingStep,
} from "@/components/stylist-onboarding-stepper";

interface StylistStripeReturnProps {
  userId: string;
  userName?: string;
}

export function StylistStripeReturn({
  userId,
  userName = "Stylist",
}: StylistStripeReturnProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  // Define onboarding progress steps - Stripe is now completed
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
        status: "completed", // Just completed!
      },
      {
        id: "identity",
        label: "Identitetsverifisering",
        description: "Bekreft identitet",
        status: "current", // Next step
      },
      {
        id: "ready",
        label: "Klar for salg",
        description: "Start med tjenester",
        status: "pending",
      },
    ];
  };

  // Countdown effect to automatically redirect to next step
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      // Redirect to main stripe page which will show identity verification
      router.push("/stylist/stripe");
    }
  }, [countdown, router]);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
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
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">
              Stripe-konto opprettet!
            </CardTitle>
            <CardDescription className="text-lg">
              Gratulerer, {userName}! Din Stripe-konto er nå konfigurert.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Success message */}
            <BlurFade delay={0.15} duration={0.5} inView>
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-medium mb-3 text-green-800 dark:text-green-200">
                  ✅ Stripe-oppsett fullført
                </h3>
                <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                  <p>• Kontoopplysninger bekreftet</p>
                  <p>• Bankinformasjon registrert</p>
                  <p>• Betalingsmottaking aktivert</p>
                  <p>• Utbetalinger konfigurert</p>
                </div>
              </div>
            </BlurFade>

            {/* Next step */}
            <BlurFade delay={0.2} duration={0.5} inView>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-medium mb-2 text-blue-800 dark:text-blue-200">
                  🔍 Neste steg: Identitetsverifisering
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  For å kunne motta betalinger må du nå verifisere identiteten din med et gyldig ID-dokument (førerkort, pass, eller nasjonal ID).
                </p>
              </div>
            </BlurFade>

            {/* Countdown and action */}
            <BlurFade delay={0.25} duration={0.5} inView>
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <p className="text-sm">
                    Fortsetter automatisk til neste steg om {countdown} sekund
                    {countdown !== 1 ? "er" : ""}...
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => router.push("/stylist/stripe")}
                    size="lg"
                    className="flex-1 max-w-sm"
                  >
                    Fortsett til identitetsverifisering
                  </Button>
                  <Button
                    onClick={() => router.push(`/profiler/${userId}`)}
                    variant="outline"
                    size="lg"
                    className="flex-1 max-w-sm"
                  >
                    Gå til min profil
                  </Button>
                </div>
              </div>
            </BlurFade>
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  );
}