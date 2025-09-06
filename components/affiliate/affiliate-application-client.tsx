"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BlurFade } from "@/components/magicui/blur-fade";
import { AffiliateApplicationForm } from "@/components/affiliate/affiliate-application-form";
import { getUserAffiliateApplication } from "@/server/affiliate/affiliate-applications.actions";
import { Button } from "@/components/ui/button";

interface AffiliateApplicationClientProps {
  profileId: string;
}

export function AffiliateApplicationClient({
  profileId,
}: AffiliateApplicationClientProps) {
  // Fetch affiliate application
  const {
    data: application,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["affiliate-application", profileId],
    queryFn: async () => {
      const result = await getUserAffiliateApplication(profileId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    retry: 1,
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-48 mx-auto mb-4"></div>
              <div className="h-4 bg-muted rounded w-96 mx-auto mb-8"></div>
            </div>
            <div className="bg-muted rounded-lg h-96 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">
            Kunne ikke laste søknadsinformasjon
          </h1>
          <p className="text-muted-foreground mb-4">
            Det oppstod en feil ved lasting av søknadsinformasjonen. Prøv igjen
            senere.
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Prøv igjen
          </Button>
        </div>
      </div>
    );
  }

  // User already has an application
  if (application) {
    const statusMessages = {
      pending:
        "Din partnersøknad er under behandling. Vi kommer tilbake til deg snart!",
      approved:
        "Din partnersøknad er allerede godkjent! Gå til partner-dashboardet ditt.",
      rejected:
        "Din partnersøknad ble dessverre avvist. Du kan sende inn en ny søknad om 30 dager.",
      suspended:
        "Ditt partnerskap er midlertidig suspendert. Ta kontakt med support for mer informasjon.",
    };

    return (
      <div className="container mx-auto px-4 py-8">
        <BlurFade delay={0.1} duration={0.5} inView>
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Søknad om å bli partner
              </h1>
              <p className="text-muted-foreground">
                Du har allerede sendt inn en partnersøknad
              </p>
            </div>

            <div className="bg-muted/50 border rounded-lg p-6 text-center">
              <h2 className="text-lg font-semibold mb-2">
                Status:{" "}
                {application.status === "pending"
                  ? "Under behandling"
                  : application.status === "approved"
                    ? "Godkjent"
                    : application.status === "rejected"
                      ? "Avvist"
                      : "Suspendert"}
              </h2>
              <p className="text-muted-foreground mb-4">
                {
                  statusMessages[
                    application.status as keyof typeof statusMessages
                  ]
                }
              </p>

              <div className="text-sm text-muted-foreground">
                <p>
                  Søknad sendt:{" "}
                  {new Date(application.created_at).toLocaleDateString("no-NO")}
                </p>
                {application.reviewed_at && (
                  <p>
                    Behandlet:{" "}
                    {new Date(application.reviewed_at).toLocaleDateString(
                      "no-NO"
                    )}
                  </p>
                )}
              </div>

              {application.status === "approved" && (
                <div className="mt-4">
                  <Button asChild>
                    <Link href={`/profiler/${profileId}/partner`}>
                      Gå til Partner Dashboard
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </BlurFade>
      </div>
    );
  }

  // No application yet - show form
  return (
    <div className="container mx-auto px-4 py-8">
      <BlurFade delay={0.1} duration={0.5} inView>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Bli Partner</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Søk om å bli partner hos Nabostylisten og få din egen rabattkode.
            Tjen provisjon på kunder du henviser til plattformen.
          </p>
        </div>
      </BlurFade>

      <BlurFade delay={0.2} duration={0.5} inView>
        <AffiliateApplicationForm
          stylistId={profileId}
          onSuccess={() => {
            // Invalidate the query to refetch the application data
            refetch();
          }}
        />
      </BlurFade>
    </div>
  );
}
