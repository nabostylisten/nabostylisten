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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Shield,
  AlertCircle,
} from "lucide-react";
import {
  createAccountOnboardingLink,
  GetStripeAccountStatusResult,
} from "@/server/stripe.actions";
import { toast } from "sonner";
import { BlurFade } from "@/components/magicui/blur-fade";

interface StylistStripeOnboardingProps {
  userId: string;
  userName?: string;
  needsOnboarding: boolean;
  stripeAccountId?: string | null;
  stripeAccountStatus?: GetStripeAccountStatusResult["data"] | null;
  isCompletelyDone?: boolean;
}

export function StylistStripeOnboarding({
  userId,
  userName = "Stylist",
  needsOnboarding,
  stripeAccountId,
  stripeAccountStatus,
  isCompletelyDone = false,
}: StylistStripeOnboardingProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Countdown effect for completed onboarding (both Stripe and identity verification)
  useEffect(() => {
    if (isCompletelyDone && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (isCompletelyDone && countdown === 0) {
      router.push(`/profiler/${userId}`);
    }
  }, [isCompletelyDone, countdown, router, userId]);

  const handleCreateOnboardingLink = async () => {
    if (!stripeAccountId) {
      toast.error("Ingen Stripe-konto funnet. Kontakt support.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createAccountOnboardingLink({
        stripeAccountId,
      });

      if (result.error) {
        toast.error(`Kunne ikke opprette onboarding-lenke: ${result.error}`);
        return;
      }

      if (result.data?.url) {
        // Redirect to Stripe onboarding
        window.location.href = result.data.url;
      } else {
        toast.error("Ingen onboarding-lenke mottatt. Kontakt support.");
      }
    } catch (error) {
      console.error("Error creating onboarding link:", error);
      toast.error("En feil oppstod. Prøv igjen eller kontakt support.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle completed states
  if (isCompletelyDone) {
    // Show completion message with countdown (only when EVERYTHING is complete)
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <BlurFade delay={0.1} duration={0.5} inView>
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Onboarding fullført!</CardTitle>
              <CardDescription className="text-lg">
                Gratulerer, {userName}! Du har fullført all nødvendig
                informasjon.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 font-medium">
                  Du har nå tilgang til alle stylistfunksjonene på plattformen
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Du kan nå:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Opprette og publisere tjenester</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Motta betaling for oppdrag</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Chatte med kunder</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Se detaljerte inntektsrapporter</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <p className="text-sm">
                  Omdirigerer til din profil om {countdown} sekund
                  {countdown !== 1 ? "er" : ""}...
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => router.push('/mine-tjenester')}
                  className="flex-1"
                  size="lg"
                >
                  Opprett min første tjeneste
                </Button>
                <Button
                  onClick={() => router.push(`/profiler/${userId}`)}
                  variant="outline"
                  className="flex-1"
                >
                  Gå til min profil
                </Button>
              </div>
            </CardContent>
          </Card>
        </BlurFade>
      </div>
    );
  }

  // If basic Stripe is done but identity verification is needed, redirect to identity verification
  if (!needsOnboarding) {
    // This means basic Stripe onboarding is complete but identity verification is still needed
    // The parent component should handle this case, but just in case, redirect
    router.push("/stylist/stripe");
    return null;
  }

  // Show onboarding needed UI
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <BlurFade delay={0.1} duration={0.5} inView>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CreditCard className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              Fullfør din stylist-onboarding
            </CardTitle>
            <CardDescription className="text-lg">
              Hei {userName}! For å begynne å selge tjenester trenger vi noe
              informasjon fra deg.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Current Status */}
            {stripeAccountStatus && (
              <BlurFade delay={0.15} duration={0.5} inView>
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-3">Nåværende status:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      {stripeAccountStatus.details_submitted ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-sm">Informasjon innsendt</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {stripeAccountStatus.charges_enabled ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-sm">Kan motta betaling</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {stripeAccountStatus.payouts_enabled ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-sm">Utbetalinger aktivert</span>
                    </div>
                  </div>
                </div>
              </BlurFade>
            )}

            {/* Requirements */}
            <BlurFade delay={0.2} duration={0.5} inView>
              <div className="space-y-4">
                <h3 className="font-medium">Hva trenger vi?</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <h4 className="font-medium text-sm">Personinfo</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Navn, adresse og fødselsdato
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg text-center">
                    <CreditCard className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <h4 className="font-medium text-sm">Bankinfo</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Kontonummer for utbetalinger
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg text-center">
                    <Shield className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <h4 className="font-medium text-sm">Verifisering</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Identitetsbekreftelse og skatteinfo
                    </p>
                  </div>
                </div>
              </div>
            </BlurFade>

            {/* Time estimate and security */}
            <BlurFade delay={0.25} duration={0.5} inView>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium text-sm">
                    Estimert tid: 3 minutter
                  </span>
                </div>
                <p className="text-blue-700 text-sm">
                  All informasjon behandles sikkert i henhold til GDPR og norsk
                  personvernlovgivning.
                </p>
              </div>
            </BlurFade>

            {/* CTA */}
            <BlurFade delay={0.3} duration={0.5} inView>
              <div className="text-center space-y-4">
                <Button
                  onClick={handleCreateOnboardingLink}
                  disabled={isLoading || !stripeAccountId}
                  size="lg"
                  className="w-full md:w-auto"
                >
                  {isLoading ? "Oppretter lenke..." : "Start onboarding"}
                </Button>

                <p className="text-xs text-muted-foreground">
                  Du vil bli omdirigert til en sikker side hvor du kan fylle ut
                  informasjonen
                </p>
              </div>
            </BlurFade>
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  );
}
