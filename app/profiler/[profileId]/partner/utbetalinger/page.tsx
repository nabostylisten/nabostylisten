import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, DollarSign, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";

import { getAffiliateEarnings } from "@/server/affiliate/affiliate-commission.actions";
import { getAffiliatePayouts } from "@/server/affiliate/affiliate-commission.actions";

interface Props {
  params: Promise<{
    profileId: string;
  }>;
}

function PayoutStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    pending: { label: "Venter", variant: "secondary" as const, icon: <Clock className="w-3 h-3" /> },
    processing: { label: "Behandles", variant: "default" as const, icon: <Clock className="w-3 h-3" /> },
    paid: { label: "Betalt", variant: "success" as const, icon: <CheckCircle className="w-3 h-3" /> },
    failed: { label: "Feilet", variant: "destructive" as const, icon: <XCircle className="w-3 h-3" /> }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}

async function PayoutHistoryContent({ profileId }: { profileId: string }) {
  const supabase = await createClient();
  
  // Check if user is authenticated and accessing their own profile
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || user.id !== profileId) {
    redirect("/auth/login");
  }

  // Get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", profileId)
    .single();

  if (!profile || profile.role !== "stylist") {
    redirect("/profiler/" + profileId);
  }

  // Get affiliate earnings and payouts
  const [earningsResult, payoutsResult] = await Promise.all([
    getAffiliateEarnings(profileId),
    getAffiliatePayouts({ stylistId: profileId })
  ]);

  const earnings = earningsResult.data?.earnings || [];
  const summary = earningsResult.data?.summary || {
    totalEarnings: 0,
    totalBookings: 0,
    totalPaidOut: 0,
    pendingAmount: 0,
    averageCommission: 0
  };
  const payouts = payoutsResult.data || [];

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <BlurFade delay={0.1} duration={0.5} inView>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/profiler/${profileId}/partner`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbake til Partner Dashboard
            </Link>
          </Button>
        </div>
      </BlurFade>

      <BlurFade delay={0.15} duration={0.5} inView>
        <div>
          <h1 className="text-3xl font-bold mb-2">Utbetalingshistorikk</h1>
          <p className="text-muted-foreground">
            Oversikt over dine provisjonsinntekter og utbetalinger
          </p>
        </div>
      </BlurFade>

      {/* Summary Cards */}
      <BlurFade delay={0.2} duration={0.5} inView>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tjent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalEarnings.toLocaleString('no-NO')} kr</div>
              <p className="text-xs text-muted-foreground">
                Fra {summary.totalBookings} bookinger
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utbetalt</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalPaidOut.toLocaleString('no-NO')} kr</div>
              <p className="text-xs text-muted-foreground">
                {payouts.filter(p => p.status === 'paid').length} utbetalinger
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventende</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.pendingAmount.toLocaleString('no-NO')} kr</div>
              <p className="text-xs text-muted-foreground">
                Venter på neste utbetaling
              </p>
            </CardContent>
          </Card>
        </div>
      </BlurFade>

      {/* Payout History */}
      <BlurFade delay={0.25} duration={0.5} inView>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Utbetalingshistorikk
            </CardTitle>
            <CardDescription>
              Alle dine provisjonsutbetalinger
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ingen utbetalinger ennå</h3>
                <p className="text-muted-foreground">
                  Utbetalinger skjer månedlig når du har tjent provisjon på bookinger.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {payouts.map((payout) => (
                  <div key={payout.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {Number(payout.payout_amount).toLocaleString('no-NO')} kr
                        </span>
                        <PayoutStatusBadge status={payout.status} />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(payout.created_at).toLocaleDateString('no-NO')}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Periode</div>
                        <div>
                          {new Date(payout.period_start).toLocaleDateString('no-NO')} - {' '}
                          {new Date(payout.period_end).toLocaleDateString('no-NO')}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Bookinger</div>
                        <div>{payout.total_bookings}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Provisjon</div>
                        <div>{Number(payout.total_commission_earned).toLocaleString('no-NO')} kr</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Status</div>
                        <div>
                          {payout.status === 'paid' && payout.processed_at
                            ? `Betalt ${new Date(payout.processed_at).toLocaleDateString('no-NO')}`
                            : payout.status === 'processing'
                            ? 'Behandles'
                            : payout.status === 'failed'
                            ? 'Feilet'
                            : 'Venter'}
                        </div>
                      </div>
                    </div>
                    
                    {payout.notes && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <strong>Merknad:</strong> {payout.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </BlurFade>

      {/* Individual Earnings */}
      {earnings.length > 0 && (
        <BlurFade delay={0.3} duration={0.5} inView>
          <Card>
            <CardHeader>
              <CardTitle>Detaljert Oversikt</CardTitle>
              <CardDescription>
                Alle provisjoner fra individuelle bookinger
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {earnings.slice(0, 50).map((earning, index) => (
                  <div key={earning.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          Booking #{earning.booking?.id?.slice(-8)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {earning.booking?.start_time 
                            ? new Date(earning.booking.start_time).toLocaleDateString('no-NO')
                            : 'Dato ikke tilgjengelig'
                          }
                          {' • '}
                          Kode: {earning.affiliate_link?.link_code}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {earning.commission_amount.toLocaleString('no-NO')} kr
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Fra {Number(earning.booking?.total_price || 0).toLocaleString('no-NO')} kr
                        </div>
                      </div>
                    </div>
                    {index < earnings.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}
                
                {earnings.length > 50 && (
                  <div className="text-center pt-4">
                    <p className="text-sm text-muted-foreground">
                      Viser de siste 50 transaksjonene av {earnings.length} totalt
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </BlurFade>
      )}

      {/* Tax Information */}
      <BlurFade delay={0.35} duration={0.5} inView>
        <Card>
          <CardHeader>
            <CardTitle>Skatteinformasjon</CardTitle>
            <CardDescription>
              Viktig informasjon om skatt på provisjonsinntekter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <h4 className="font-semibold text-amber-800 mb-2">Viktig:</h4>
              <p className="text-sm text-amber-700">
                Provisjonsinntekter er skattepliktig inntekt som må rapporteres i selvangivelsen din. 
                Vi anbefaler at du setter av penger til skatt og konsulterer en regnskapsfører hvis nødvendig.
              </p>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>• Alle utbetalinger rapporteres til Skatteetaten</p>
              <p>• Du mottar skatteoppgaver for inntekter over 1.000 kr per år</p>
              <p>• Typisk skattesats er 22% + eventuell toppskatt</p>
            </div>
            
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Last ned årsoppgave (kommer snart)
            </Button>
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  );
}

export default function PayoutHistoryPage({ params }: Props) {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-48 mb-4"></div>
            <div className="h-8 bg-muted rounded w-64 mb-2"></div>
            <div className="h-4 bg-muted rounded w-96"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded-lg animate-pulse"></div>
        </div>
      </div>
    }>
      <PayoutHistoryContent profileId={params.then(p => p.profileId)} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: Props) {
  const { profileId } = await params;
  
  return {
    title: "Utbetalinger - Partner Dashboard - Nabostylisten",
    description: "Se din utbetalingshistorikk og provisjonsinntekter fra partnerprogrammet.",
    openGraph: {
      title: "Utbetalinger - Partner Dashboard - Nabostylisten",
      description: "Se din utbetalingshistorikk og provisjonsinntekter fra partnerprogrammet.",
    },
  };
}