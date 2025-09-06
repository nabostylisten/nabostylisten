"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Users, TrendingUp } from "lucide-react";

import { AffiliateCodeCard } from "@/components/affiliate/affiliate-code-card";
import {
  AffiliateMetricsChart,
  AffiliatePerformanceOverview,
} from "@/components/affiliate/affiliate-metrics-chart";
import { AffiliateInstructions } from "@/components/affiliate/affiliate-instructions";
import { getUserAffiliateApplication } from "@/server/affiliate/affiliate-applications.actions";
import { getAffiliateCodeByStylist } from "@/server/affiliate/affiliate-codes.actions";
import { getAffiliateEarnings } from "@/server/affiliate/affiliate-commission.actions";
import {
  PartnerDashboardSkeleton,
  PartnerApplicationPendingSkeleton,
  PartnerNotAppliedSkeleton,
} from "./partner-dashboard-skeleton";
import { toast } from "sonner";

interface PartnerDashboardClientProps {
  profileId: string;
  fullName: string;
}

export function PartnerDashboardClient({
  profileId,
  fullName,
}: PartnerDashboardClientProps) {
  const router = useRouter();

  // Fetch affiliate application
  const {
    data: application,
    isLoading: applicationLoading,
    error: applicationError,
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

  // Fetch affiliate code (only if approved)
  const {
    data: affiliateCode,
    isLoading: codeLoading,
    error: codeError,
  } = useQuery({
    queryKey: ["affiliate-code", profileId],
    queryFn: async () => {
      const result = await getAffiliateCodeByStylist(profileId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: application?.status === "approved",
    retry: 1,
  });

  // Fetch earnings (only if approved)
  const {
    data: earnings,
    isLoading: earningsLoading,
    error: earningsError,
  } = useQuery({
    queryKey: ["affiliate-earnings", profileId],
    queryFn: async () => {
      const result = await getAffiliateEarnings(profileId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: application?.status === "approved",
    retry: 1,
  });

  // Show error state
  if (applicationError || codeError || earningsError) {
    toast.error("Kunne ikke laste partner-data. Prøv igjen senere.");
    router.push(`/profiler/${profileId}`);
    return null;
  }

  // Show loading state
  if (applicationLoading) {
    return <PartnerNotAppliedSkeleton />;
  }

  // No application submitted yet
  if (!application) {
    return (
      <div className="container mx-auto px-4 py-8">
        <BlurFade delay={0.1} duration={0.5} inView>
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Bli partner</h1>
              <p className="text-muted-foreground">
                Bli partner hos Nabostylisten og tjen provisjon på kunder du
                henviser
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Bli partner
                </CardTitle>
                <CardDescription>
                  Du har ikke søkt om å bli partner ennå
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">
                    Fordeler ved å bli partner:
                  </h3>
                  <ul className="text-sm space-y-1 text-left">
                    <li>• Tjen provisjon på kunder du henviser</li>
                    <li>• Få din egen unike rabattkode</li>
                    <li>• Detaljert statistikk og analyse</li>
                    <li>• Månedlig utbetaling av provisjon</li>
                    <li>• Markedsføringsverktøy og veiledning</li>
                  </ul>
                </div>

                <Button asChild className="w-full">
                  <Link href={`/profiler/${profileId}/partner/soknad`}>
                    Søk om å bli partner
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </BlurFade>
      </div>
    );
  }

  // Application pending
  if (application.status === "pending") {
    return (
      <div className="container mx-auto px-4 py-8">
        <BlurFade delay={0.1} duration={0.5} inView>
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Søknad om å bli partner
              </h1>
              <p className="text-muted-foreground">
                Din søknad er under behandling
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-center">
                  Under behandling
                </CardTitle>
                <CardDescription>
                  Vi behandler din partnersøknad og kommer tilbake til deg snart
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Din partnersøknad ble sendt inn{" "}
                    {new Date(application.created_at).toLocaleDateString(
                      "no-NO"
                    )}
                    . Vi behandler søknader innen 3-5 virkedager. Du vil motta
                    en e-post når søknaden din er behandlet.
                  </p>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>
                    Forventede henvisninger per måned:{" "}
                    <strong>{application.expected_referrals}</strong>
                  </p>
                  <p>
                    Total rekkevidde:{" "}
                    <strong>
                      {application.social_media_reach?.toLocaleString("no-NO")}{" "}
                      følgere
                    </strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </BlurFade>
      </div>
    );
  }

  // Application rejected
  if (application.status === "rejected") {
    return (
      <div className="container mx-auto px-4 py-8">
        <BlurFade delay={0.1} duration={0.5} inView>
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Partner Søknad</h1>
              <p className="text-muted-foreground">
                Din søknad ble dessverre avvist
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-center">
                  <ExternalLink className="w-5 h-5" />
                  Søknad avvist
                  <Badge variant="destructive">Rejected</Badge>
                </CardTitle>
                <CardDescription>
                  Du kan sende inn en ny søknad om 30 dager
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">
                    Begrunnelse:
                  </h4>
                  <p className="text-sm text-red-700">
                    {application.review_notes ||
                      "Ingen spesifikk begrunnelse oppgitt."}
                  </p>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>
                    Behandlet:{" "}
                    {application.reviewed_at
                      ? new Date(application.reviewed_at).toLocaleDateString(
                          "no-NO"
                        )
                      : "Ikke oppgitt"}
                  </p>
                  <p className="mt-2">
                    Du kan sende inn en ny søknad etter{" "}
                    {new Date(
                      new Date(application.created_at).getTime() +
                        30 * 24 * 60 * 60 * 1000
                    ).toLocaleDateString("no-NO")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </BlurFade>
      </div>
    );
  }

  // Application approved - loading affiliate data
  if (codeLoading || earningsLoading) {
    return <PartnerDashboardSkeleton />;
  }

  // Approved but no code generated yet
  if (!affiliateCode) {
    return (
      <div className="container mx-auto px-4 py-8">
        <BlurFade delay={0.1} duration={0.5} inView>
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardHeader>
                <CardTitle>Partner Dashboard</CardTitle>
                <CardDescription>Din partnerkode genereres...</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Din søknad er godkjent! Vi genererer partnerkoden din. Dette
                  tar normalt bare noen minutter. Prøv å laste siden på nytt om
                  litt.
                </p>
              </CardContent>
            </Card>
          </div>
        </BlurFade>
      </div>
    );
  }

  const summary = earnings?.summary || {
    totalEarnings: 0,
    totalBookings: 0,
    totalPaidOut: 0,
    pendingAmount: 0,
    averageCommission: 0,
  };

  // Full dashboard
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <BlurFade delay={0.1} duration={0.5} inView>
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Partner Dashboard</h1>
          <p className="text-muted-foreground">
            Velkommen til ditt partner-dashboard, {fullName}
          </p>
        </div>
      </BlurFade>

      <BlurFade delay={0.15} duration={0.5} inView>
        <AffiliateMetricsChart
          clickCount={affiliateCode.click_count}
          conversionCount={affiliateCode.conversion_count}
          totalEarnings={summary.totalEarnings}
        />
      </BlurFade>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BlurFade delay={0.2} duration={0.5} inView className="lg:col-span-2">
          <AffiliateCodeCard
            affiliateCode={affiliateCode}
            clickCount={affiliateCode.click_count}
            conversionCount={affiliateCode.conversion_count}
            totalEarnings={summary.totalEarnings}
          />
        </BlurFade>

        <BlurFade delay={0.25} duration={0.5} inView>
          <AffiliatePerformanceOverview
            clickCount={affiliateCode.click_count}
            conversionCount={affiliateCode.conversion_count}
            totalEarnings={summary.totalEarnings}
            activeCodeSince={affiliateCode.created_at}
          />
        </BlurFade>
      </div>

      <BlurFade delay={0.3} duration={0.5} inView>
        <AffiliateInstructions
          partnerCode={affiliateCode.link_code}
          commissionPercentage={affiliateCode.commission_percentage}
        />
      </BlurFade>

      {/* {summary.totalEarnings > 0 && (
        <BlurFade delay={0.35} duration={0.5} inView>
          <div className="text-center">
            <Button asChild variant="outline">
              <Link href={`/profiler/${profileId}/partner/utbetalinger`}>
                Se utbetalingshistorikk
              </Link>
            </Button>
          </div>
        </BlurFade>
      )} */}
    </div>
  );
}
