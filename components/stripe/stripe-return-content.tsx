"use client";

import { useQuery } from "@tanstack/react-query";
import { getCurrentUserStripeStatus } from "@/server/stripe.actions";
import { BlurFade } from "@/components/magicui/blur-fade";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  XCircle,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  StylistOnboardingStepper,
  type OnboardingStep,
} from "@/components/stylist-onboarding-stepper";

// Status skeleton that matches the main layout
function StripeReturnSkeleton() {
  return (
    <div className="container max-w-4xl mx-auto py-12">
      <BlurFade delay={0.1} duration={0.5} inView>
        {/* Progress Indicator Skeleton */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <Skeleton className="h-8 w-8 rounded-full mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              {/* Status details skeleton */}
              <Card className="bg-muted/30">
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-3 w-48" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Status alert skeleton */}
              <Alert>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </Alert>
            </div>

            {/* Navigation buttons skeleton */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-40" />
            </div>

            {/* Contact info skeleton */}
            <div className="text-center">
              <Skeleton className="h-3 w-48 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  );
}

// Helper function to get onboarding steps based on current status
function getOnboardingSteps(
  basicStripeComplete: boolean,
  identityVerificationComplete: boolean,
  isFullyOnboarded: boolean
): OnboardingStep[] {
  return [
    {
      id: "application",
      label: "Søknad godkjent",
      description: "Din søknad er godkjent",
      status: "completed", // They're here, so application is approved
    },
    {
      id: "stripe-setup",
      label: "Stripe-oppsett",
      description: "Grunnleggende informasjon",
      status: basicStripeComplete ? "completed" : "current",
    },
    {
      id: "identity",
      label: "Identitetsverifisering",
      description: "Bekreft identitet",
      status: identityVerificationComplete
        ? "completed"
        : basicStripeComplete
          ? "current"
          : "pending",
    },
    {
      id: "ready",
      label: "Klar for salg",
      description: "Start med tjenester",
      status: isFullyOnboarded ? "completed" : "pending",
    },
  ];
}

export function StripeReturnContent() {
  const {
    data: stripeData,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["stripe-return-status"],
    queryFn: getCurrentUserStripeStatus,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  if (isLoading) {
    return <StripeReturnSkeleton />;
  }

  // Handle query errors or server errors
  if (queryError || stripeData?.error || !stripeData?.data) {
    const errorMessage =
      queryError?.message ||
      stripeData?.error ||
      "Kunne ikke laste Stripe-status";

    return (
      <div className="container max-w-4xl mx-auto py-12">
        <BlurFade delay={0.1} duration={0.5} inView>
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-2xl">Noe gikk galt</CardTitle>
              <CardDescription>
                Vi kunne ikke laste Stripe-kontoinformasjonen din
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Feil ved lasting av data</AlertTitle>
                <AlertDescription>
                  {errorMessage}. Vennligst prøv igjen eller kontakt support.
                </AlertDescription>
              </Alert>

              <div className="text-xs text-muted-foreground text-center">
                Hvis problemet vedvarer, vennligst kontakt oss på{" "}
                <a
                  href="mailto:kontakt@nabostylisten.no"
                  className="text-primary hover:underline"
                >
                  kontakt@nabostylisten.no
                </a>
              </div>
            </CardContent>
          </Card>
        </BlurFade>
      </div>
    );
  }

  const {
    stripeAccountId,
    status: stripeAccountStatus,
    isFullyOnboarded,
    profile,
    verificationStatus,
  } = stripeData.data;

  // Use comprehensive verification status from the centralized utility
  // This ensures we get accurate status from Stripe API as source of truth
  const basicStripeComplete = verificationStatus?.stripeAccountStatus
    ? verificationStatus.stripeAccountStatus.charges_enabled &&
      verificationStatus.stripeAccountStatus.details_submitted &&
      verificationStatus.stripeAccountStatus.payouts_enabled
    : false;

  const identityVerificationComplete = verificationStatus?.identityVerificationComplete ?? false;

  // Determine status and messaging
  const getStatusContent = () => {
    if (!stripeAccountId) {
      return {
        icon: <XCircle className="h-12 w-12 text-red-500" />,
        title: "Noe gikk galt",
        description: "Vi kunne ikke finne din Stripe-konto",
        alertType: "error" as const,
        alertTitle: "Ingen Stripe-konto funnet",
        alertMessage:
          "Det ser ut som du ikke har en Stripe-konto. Vennligst kontakt support for hjelp.",
        redirectToIdentityVerification: false,
      };
    }

    if (!stripeAccountStatus) {
      return {
        icon: <XCircle className="h-12 w-12 text-red-500" />,
        title: "Noe gikk galt",
        description: "Vi kunne ikke bekrefte statusen på Stripe-kontoen din",
        alertType: "error" as const,
        alertTitle: "Feil med Stripe-integrasjon",
        alertMessage:
          "Kunne ikke hente kontostatus. Vennligst kontakt support for hjelp.",
        redirectToIdentityVerification: false,
      };
    }

    // If everything is complete (both Stripe and identity verification)
    if (isFullyOnboarded) {
      return {
        icon: <CheckCircle className="h-12 w-12 text-green-500" />,
        title: "Alt er klart!",
        description: "Du kan nå opprette tjenester og motta betalinger",
        alertType: "success" as const,
        alertTitle: "Onboarding fullført",
        alertMessage:
          "Du kan nå motta betalinger fra kunder. Begynn å opprette tjenester for å komme i gang.",
        redirectToIdentityVerification: false,
      };
    }

    // If basic Stripe is complete but identity verification is needed
    if (basicStripeComplete && !identityVerificationComplete) {
      return {
        icon: <AlertTriangle className="h-12 w-12 text-amber-500" />,
        title: "Stripe-konto opprettet!",
        description: "Neste steg: Identitetsverifisering",
        alertType: "next-step" as const,
        alertTitle: "Identitetsverifisering kreves",
        alertMessage:
          "Din Stripe-konto er opprettet og aktivert. For å kunne opprette tjenester må du nå verifisere identiteten din.",
        redirectToIdentityVerification: true,
      };
    }

    // Basic Stripe onboarding still in progress
    return {
      icon: <AlertTriangle className="h-12 w-12 text-amber-500" />,
      title: "Velkommen tilbake!",
      description: "Du har fullført Stripe-konfigurasjonen",
      alertType: "pending" as const,
      alertTitle: "Kontoverifisering pågår",
      alertMessage:
        "Du vil motta en e-post når kontoen din er klar til bruk. Inntil da kan du begynne å sette opp tjenestene dine.",
      redirectToIdentityVerification: false,
    };
  };

  const statusContent = getStatusContent();

  // Get onboarding steps for the stepper
  const onboardingSteps = getOnboardingSteps(
    basicStripeComplete,
    identityVerificationComplete,
    isFullyOnboarded
  );

  return (
    <div className="container max-w-4xl mx-auto py-12">
      <BlurFade delay={0.1} duration={0.5} inView>
        {/* Progress Indicator */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <StylistOnboardingStepper
              steps={onboardingSteps}
              variant="horizontal"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">{statusContent.icon}</div>
            <CardTitle className="text-2xl">{statusContent.title}</CardTitle>
            <CardDescription>{statusContent.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              {/* Status details */}
              {stripeAccountStatus && (
                <Card className="bg-muted/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Kontostatus</CardTitle>
                    <CardDescription className="text-xs">
                      Konto-ID: {stripeAccountId}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Detaljer innsendt</span>
                      <div
                        className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full",
                          stripeAccountStatus.details_submitted
                            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        )}
                      >
                        {stripeAccountStatus.details_submitted ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Belastninger aktivert</span>
                      <div
                        className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full",
                          stripeAccountStatus.charges_enabled
                            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        )}
                      >
                        {stripeAccountStatus.charges_enabled ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Utbetalinger aktivert</span>
                      <div
                        className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full",
                          stripeAccountStatus.payouts_enabled
                            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        )}
                      >
                        {stripeAccountStatus.payouts_enabled ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>

                    {/* Show identity verification status if basic Stripe is complete */}
                    {basicStripeComplete && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Identitetsverifisering</span>
                        <div
                          className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-full",
                            identityVerificationComplete
                              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                          )}
                        >
                          {identityVerificationComplete ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Status alert */}
              <Alert
                variant={
                  statusContent.alertType === "error"
                    ? "destructive"
                    : "default"
                }
              >
                <AlertTitle>{statusContent.alertTitle}</AlertTitle>
                <AlertDescription>
                  {statusContent.alertMessage}
                </AlertDescription>
              </Alert>
            </div>

            {/* Navigation buttons - only show if not error */}
            {statusContent.alertType !== "error" && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {statusContent.redirectToIdentityVerification ? (
                  <>
                    <Button asChild>
                      <Link href="/stylist/stripe">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Start identitetsverifisering
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild>
                      <Link href={`/profiler/${profile.id}/profil`}>
                        Gå til profil
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/profiler/${profile.id}/mine-tjenester`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Opprett tjenester
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Contact info */}
            <div className="text-xs text-muted-foreground text-center">
              {statusContent.alertType === "error" ? (
                <>
                  Hvis problemet vedvarer, vennligst kontakt oss på{" "}
                  <a
                    href="mailto:kontakt@nabostylisten.no"
                    className="text-primary hover:underline"
                  >
                    kontakt@nabostylisten.no
                  </a>
                </>
              ) : (
                <>
                  Har du spørsmål?{" "}
                  <a
                    href="mailto:kontakt@nabostylisten.no"
                    className="text-primary hover:underline"
                  >
                    Kontakt oss
                  </a>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  );
}
