"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  Shield,
  TrendingUp,
} from "lucide-react";
import {
  getCurrentUserStripeStatus,
  createAccountOnboardingLink,
  createExpressDashboardLink,
} from "@/server/stripe.actions";
import { toast } from "sonner";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Skeleton } from "@/components/ui/skeleton";

interface StylistRevenueDashboardProps {
  userId: string;
  userName?: string;
}

export function StylistRevenueDashboard({
  userId,
  userName = "Stylist",
}: StylistRevenueDashboardProps) {
  const [isCreatingOnboardingLink, setIsCreatingOnboardingLink] =
    useState(false);
  const [isCreatingDashboardLink, setIsCreatingDashboardLink] = useState(false);

  // Fetch Stripe account status
  const {
    data: stripeStatus,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["stripe-status", userId],
    queryFn: async () => {
      const result = await getCurrentUserStripeStatus();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    retry: false,
  });

  const handleCreateOnboardingLink = async () => {
    if (!stripeStatus?.stripeAccountId) {
      toast.error("Ingen Stripe-konto funnet. Kontakt support.");
      return;
    }

    setIsCreatingOnboardingLink(true);

    try {
      const result = await createAccountOnboardingLink({
        stripeAccountId: stripeStatus.stripeAccountId,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data?.url) {
        // Redirect to Stripe onboarding
        window.location.href = result.data.url;
      } else {
        toast.error("Ingen onboarding-lenke mottatt. Kontakt support.");
      }
    } catch (error) {
      toast.error("En feil oppstod. Prøv igjen eller kontakt support.");
    } finally {
      setIsCreatingOnboardingLink(false);
    }
  };

  const handleAccessExpressDashboard = async () => {
    if (!stripeStatus?.stripeAccountId) {
      toast.error("Ingen Stripe-konto funnet.");
      return;
    }

    setIsCreatingDashboardLink(true);

    try {
      const result = await createExpressDashboardLink({
        stripeAccountId: stripeStatus.stripeAccountId,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data?.url) {
        // Open Express Dashboard in new tab
        window.open(result.data.url, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Ingen dashboard-lenke mottatt. Kontakt support.");
      }
    } catch (error) {
      toast.error("En feil oppstod. Prøv igjen eller kontakt support.");
    } finally {
      setIsCreatingDashboardLink(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <BlurFade duration={0.5} inView>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-8 h-8 flex-shrink-0" />
                <div className="space-y-2 flex-1 min-w-0">
                  <Skeleton className="h-8 w-full max-w-48" />
                  <Skeleton className="h-4 w-full max-w-80" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16 sm:col-span-2 lg:col-span-1" />
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <Skeleton className="h-6 w-full max-w-48" />
                <Skeleton className="h-20 w-full" />
              </div>
              <div className="text-center">
                <Skeleton className="h-10 w-40 mx-auto" />
              </div>
            </CardContent>
          </Card>
        </BlurFade>
      </div>
    );
  }

  // Error state
  if (error || !stripeStatus) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <BlurFade duration={0.5} inView>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                <div>
                  <CardTitle className="text-2xl text-red-800 dark:text-red-200">
                    Kunne ikke laste inntektsinformasjon
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Det oppstod en feil ved henting av Stripe-kontoinformasjon.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800 mb-4">
                <p className="text-red-800 dark:text-red-200 text-sm">
                  Det oppstod en feil ved henting av kontoinformasjon.
                </p>
              </div>
              <Button onClick={() => refetch()} variant="outline">
                Prøv igjen
              </Button>
            </CardContent>
          </Card>
        </BlurFade>
      </div>
    );
  }

  const needsOnboarding = !stripeStatus.isFullyOnboarded;

  // Show onboarding flow if not fully onboarded
  if (needsOnboarding) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <BlurFade duration={0.5} inView>
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <CreditCard className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">
                Fullfør din stylist-onboarding
              </CardTitle>
              <CardDescription className="text-lg">
                Hei {userName}! Du må fullføre onboardingen før du kan se
                inntektsinformasjon.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Current Status */}
              {stripeStatus.status && (
                <BlurFade delay={0.15} duration={0.5} inView>
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-medium mb-3">Nåværende status:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2">
                        {stripeStatus.status.details_submitted ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        )}
                        <span className="text-sm">Informasjon innsendt</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {stripeStatus.status.charges_enabled ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        )}
                        <span className="text-sm">Kan motta betaling</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {stripeStatus.status.payouts_enabled ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
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
                      <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                      <h4 className="font-medium text-sm">Personinfo</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Navn, adresse og fødselsdato
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg text-center">
                      <CreditCard className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                      <h4 className="font-medium text-sm">Bankinfo</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Kontonummer for utbetalinger
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg text-center">
                      <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
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
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium text-sm">
                      Estimert tid: 3 minutter
                    </span>
                  </div>
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    All informasjon behandles sikkert i henhold til GDPR og
                    norsk personvernlovgivning.
                  </p>
                </div>
              </BlurFade>

              {/* CTA */}
              <BlurFade delay={0.3} duration={0.5} inView>
                <div className="text-center space-y-4">
                  <Button
                    onClick={handleCreateOnboardingLink}
                    disabled={
                      isCreatingOnboardingLink || !stripeStatus.stripeAccountId
                    }
                    size="lg"
                    className="w-full md:w-auto"
                  >
                    {isCreatingOnboardingLink
                      ? "Oppretter lenke..."
                      : "Start onboarding"}
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Du vil bli omdirigert til en sikker side hvor du kan fylle
                    ut informasjonen
                  </p>
                </div>
              </BlurFade>
            </CardContent>
          </Card>
        </BlurFade>
      </div>
    );
  }

  // Show Express Dashboard access for fully onboarded stylists
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <BlurFade duration={0.5} inView>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div>
                <CardTitle className="text-2xl">
                  Inntekter og statistikk
                </CardTitle>
                <CardDescription className="text-lg">
                  Oversikt over din inntjening og utbetalinger
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Status confirmation */}
            <BlurFade delay={0.1} duration={0.5} inView>
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    Din konto er fullstendig verifisert
                  </span>
                </div>
                <p className="text-green-800 dark:text-green-200 text-sm">
                  Du har tilgang til alle stylistfunksjonene og kan motta
                  betalinger.
                </p>
              </div>
            </BlurFade>

            {/* Express Dashboard access */}
            <BlurFade delay={0.15} duration={0.5} inView>
              <div className="space-y-4">
                <h3 className="font-medium text-lg">
                  Stripe Express Dashboard
                </h3>

                <div className="p-6 border-2 border-dashed border-muted rounded-lg">
                  <div className="text-center space-y-4">
                    <BarChart3 className="w-12 h-12 text-primary mx-auto" />
                    <div>
                      <h4 className="font-medium text-lg mb-2">
                        Se detaljerte inntektsrapporter
                      </h4>
                      <p className="text-muted-foreground text-sm mb-4">
                        Få tilgang til Stripe Express Dashboard hvor du kan se:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Transaksjonshistorikk</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Inntektsstatistikk over tid</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Saldo og utbetalinger</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Betalingsdetaljer og refusjoner</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Button
                    onClick={handleAccessExpressDashboard}
                    disabled={isCreatingDashboardLink}
                    size="lg"
                    className="gap-2"
                  >
                    {isCreatingDashboardLink ? (
                      "Åpner dashboard..."
                    ) : (
                      <>
                        Åpne Stripe Dashboard
                        <ExternalLink className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Åpnes i ny fane med sikker innlogging
                  </p>
                </div>
              </div>
            </BlurFade>

            <Separator />

            {/* Additional info */}
            <BlurFade delay={0.2} duration={0.5} inView>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-sm mb-2">
                  Informasjon om inntekter
                </h4>
                <p className="text-muted-foreground text-sm">
                  Alle betalinger behandles sikkert gjennom Stripe. Du mottar
                  utbetalinger direkte til din registrerte bankkonto. Dashboard
                  viser real-time data om dine inntekter, utbetalinger og
                  transaksjoner.
                </p>
              </div>
            </BlurFade>
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  );
}
