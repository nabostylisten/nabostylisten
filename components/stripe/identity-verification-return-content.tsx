"use client";

import { useQuery } from "@tanstack/react-query";
import { checkIdentityVerificationStatus } from "@/server/stripe.actions";
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
  XCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "../ui/kibo-ui/spinner";

function IdentityVerificationReturnSkeleton() {
  return (
    <div className="container max-w-2xl mx-auto py-12">
      <BlurFade delay={0.1} duration={0.5} inView>
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </Alert>
            <div className="flex justify-center">
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  );
}

export function IdentityVerificationReturnContent() {
  const {
    data: verificationData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["identity-verification-status"],
    queryFn: checkIdentityVerificationStatus,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const { profile, loading: isLoadingProfile } = useAuth();

  if (isLoading) {
    return <IdentityVerificationReturnSkeleton />;
  }

  // Handle errors
  if (error || verificationData?.error || !verificationData?.data) {
    const errorMessage =
      error?.message ||
      verificationData?.error ||
      "Kunne ikke laste verifiseringsstatus";

    return (
      <div className="container max-w-2xl mx-auto py-12">
        <BlurFade delay={0.1} duration={0.5} inView>
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-2xl">Noe gikk galt</CardTitle>
              <CardDescription>
                Vi kunne ikke laste verifiseringsstatusen din
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Feil ved lasting</AlertTitle>
                <AlertDescription>
                  {errorMessage}. Vennligst prøv igjen eller kontakt support.
                </AlertDescription>
              </Alert>

              <div className="text-center">
                <Button onClick={() => window.location.reload()}>
                  Prøv igjen
                </Button>
              </div>
            </CardContent>
          </Card>
        </BlurFade>
      </div>
    );
  }

  const { status, hasSession, completedAt } = verificationData.data;

  // Determine content based on status
  const getStatusContent = () => {
    if (!hasSession) {
      return {
        icon: <XCircle className="h-12 w-12 text-red-500" />,
        title: "Ingen verifisering funnet",
        description: "Vi fant ingen identitetsverifisering for kontoen din",
        alertType: "error" as const,
        alertTitle: "Ingen verifiseringssesjon",
        alertMessage: "Vennligst start identitetsverifiseringen på nytt.",
      };
    }

    if (completedAt) {
      return {
        icon: <CheckCircle className="h-12 w-12 text-green-500" />,
        title: "Identitet verifisert!",
        description: "Din identitet er bekreftet og du kan nå motta betalinger",
        alertType: "success" as const,
        alertTitle: "Verifiseringen er fullført",
        alertMessage:
          "Du kan nå opprette tjenester og motta betalinger fra kunder.",
      };
    }

    switch (status) {
      case "verified":
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-500" />,
          title: "Verifisering fullført!",
          description: "Din identitet er bekreftet",
          alertType: "success" as const,
          alertTitle: "Identitet verifisert",
          alertMessage:
            "Verifiseringen din er fullført. Du kan nå motta betalinger.",
        };

      case "processing":
        return {
          icon: <Clock className="h-12 w-12 text-blue-500" />,
          title: "Verifisering behandles",
          description: "Vi behandler identitetsdokumentet ditt",
          alertType: "info" as const,
          alertTitle: "Behandling pågår",
          alertMessage:
            "Dette tar vanligvis 1-3 minutter. Du vil motta en e-post når verifiseringen er ferdig.",
        };

      case "requires_input":
        return {
          icon: <AlertTriangle className="h-12 w-12 text-amber-500" />,
          title: "Mer informasjon kreves",
          description:
            "Vi trenger tilleggsinformasjon for å fullføre verifiseringen",
          alertType: "warning" as const,
          alertTitle: "Handling kreves",
          alertMessage:
            "Vennligst start en ny verifiseringssesjon eller kontakt support for hjelp.",
        };

      default:
        return {
          icon: <AlertTriangle className="h-12 w-12 text-amber-500" />,
          title: "Verifiseringsstatus ukjent",
          description: "Vi kunne ikke fastslå statusen for verifiseringen din",
          alertType: "warning" as const,
          alertTitle: "Ukjent status",
          alertMessage:
            "Vennligst kontakt support for å avklare statusen på verifiseringen din.",
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <div className="container max-w-2xl mx-auto py-12">
      <BlurFade delay={0.1} duration={0.5} inView>
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">{statusContent.icon}</div>
            <CardTitle className="text-2xl">{statusContent.title}</CardTitle>
            <CardDescription>{statusContent.description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert
              variant={
                statusContent.alertType === "error" ? "destructive" : "default"
              }
            >
              <AlertTitle>{statusContent.alertTitle}</AlertTitle>
              <AlertDescription>{statusContent.alertMessage}</AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {completedAt || status === "verified" ? (
                <>
                  <Button asChild disabled={isLoadingProfile}>
                    <Link href={`/profiler/${profile?.id}/profil`}>
                      Gå til profil
                      {isLoadingProfile ? (
                        <Spinner className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Link>
                  </Button>
                  <Button variant="outline" asChild disabled={isLoadingProfile}>
                    <Link href={`/profiler/${profile?.id}/mine-tjenester`}>
                      Opprett tjenester
                      {isLoadingProfile ? (
                        <Spinner className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Link>
                  </Button>
                </>
              ) : status === "requires_input" || !hasSession ? (
                <Button asChild>
                  <Link href="/stylist/stripe">Prøv igjen</Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/stylist/stripe">Tilbake til oversikt</Link>
                </Button>
              )}
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Har du spørsmål?{" "}
              <a
                href="mailto:kontakt@nabostylisten.no"
                className="text-primary hover:underline"
              >
                Kontakt oss
              </a>
            </div>
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  );
}
