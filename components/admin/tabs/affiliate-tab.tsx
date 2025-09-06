"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  UserCheck,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Loader,
} from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

// Import affiliate server actions
import {
  getAllAffiliateApplications,
  getAffiliateMetrics,
  approveAffiliateApplication,
  rejectAffiliateApplication,
} from "@/server/affiliate/affiliate-applications.actions";

import {
  getAllAffiliateCommissions,
  getCommissionMetrics,
} from "@/server/affiliate/affiliate-commission.actions";

import {
  getAllAffiliateCodes,
  deactivateAffiliateCode,
} from "@/server/affiliate/affiliate-codes.actions";

import { AffiliateApplicationDetailsDialog } from "@/components/admin/affiliate-application-details-dialog";

interface AffiliateApplication {
  id: string;
  profile_id: string;
  full_name: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  bio?: string;
  instagram_handle?: string;
  experience_years?: number;
  specialties?: string[];
  why_partner?: string;
}

interface AffiliateCode {
  id: string;
  profile_id: string;
  stylist_name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  clicks: number;
  conversions: number;
  commission_earned: number;
}

interface Commission {
  id: string;
  booking_id: string;
  affiliate_id: string;
  stylist_name: string;
  amount: number;
  status: "pending" | "paid" | "cancelled";
  created_at: string;
}

function ApplicationsSubTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());

  const {
    data: applications,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["affiliate-applications"],
    queryFn: getAllAffiliateApplications,
  });

  const handleApprove = async (applicationId: string) => {
    const actionKey = `approve-${applicationId}`;
    setLoadingActions(prev => new Set(prev).add(actionKey));
    
    try {
      const result = await approveAffiliateApplication(applicationId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Partner søknad godkjent!");
        refetch();
      }
    } catch (error) {
      toast.error("En uventet feil oppstod");
    } finally {
      setLoadingActions(prev => {
        const next = new Set(prev);
        next.delete(actionKey);
        return next;
      });
    }
  };

  const handleReject = async (applicationId: string) => {
    const actionKey = `reject-${applicationId}`;
    setLoadingActions(prev => new Set(prev).add(actionKey));
    
    try {
      const result = await rejectAffiliateApplication(applicationId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Partner søknad avvist");
        refetch();
      }
    } catch (error) {
      toast.error("En uventet feil oppstod");
    } finally {
      setLoadingActions(prev => {
        const next = new Set(prev);
        next.delete(actionKey);
        return next;
      });
    }
  };

  const filteredApplications =
    applications?.data?.filter((app) => {
      const matchesSearch =
        app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-200"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Venter
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="text-green-600 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Godkjent
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="text-red-600 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Avvist
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewDetails = (applicationId: string) => {
    setSelectedApplicationId(applicationId);
    setIsDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Partner søknader</h3>
          <p className="text-sm text-muted-foreground">
            Administrer søknader om å bli partner
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Søk etter navn eller e-post..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-input rounded-md text-sm bg-background"
          >
            <option value="all">Alle statuser</option>
            <option value="pending">Venter</option>
            <option value="approved">Godkjent</option>
            <option value="rejected">Avvist</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p>Laster søknader...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Ingen søknader funnet
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Ingen søknader matcher dine søkekriterier."
                  : "Det er ingen partner søknader å vise for øyeblikket."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold">{app.full_name}</h4>
                      {getStatusBadge(app.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{app.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Søkt:{" "}
                      {new Date(app.created_at).toLocaleDateString("no-NO")}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(app.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Detaljer
                    </Button>
                    {app.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(app.id)}
                          disabled={loadingActions.has(`approve-${app.id}`) || loadingActions.has(`reject-${app.id}`)}
                        >
                          {loadingActions.has(`approve-${app.id}`) ? (
                            <Loader className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          )}
                          {loadingActions.has(`approve-${app.id}`) ? "Godkjenner..." : "Godkjenn"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(app.id)}
                          disabled={loadingActions.has(`approve-${app.id}`) || loadingActions.has(`reject-${app.id}`)}
                        >
                          {loadingActions.has(`reject-${app.id}`) ? (
                            <Loader className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-1" />
                          )}
                          {loadingActions.has(`reject-${app.id}`) ? "Avviser..." : "Avvis"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AffiliateApplicationDetailsDialog
        applicationId={selectedApplicationId}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />
    </div>
  );
}

function CodesSubTab() {
  const {
    data: codes,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["affiliate-codes"],
    queryFn: () => getAllAffiliateCodes(),
  });

  const handleDeactivateCode = async (codeId: string) => {
    const result = await deactivateAffiliateCode(codeId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Partnerkode deaktivert");
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Partnerkoder</h3>
          <p className="text-sm text-muted-foreground">
            Oversikt over alle aktive partnerkoder
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Eksporter
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p>Laster partnerkoder...</p>
          </div>
        ) : codes?.data?.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <UserCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ingen partnerkoder</h3>
              <p className="text-muted-foreground">
                Ingen partnerkoder er opprettet ennå.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {codes?.data?.map((code: AffiliateCode) => (
              <Card key={code.id}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{code.stylist_name}</h4>
                        <p className="text-lg font-mono font-bold text-primary">
                          {code.code}
                        </p>
                      </div>
                      <Badge variant={code.is_active ? "default" : "secondary"}>
                        {code.is_active ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Klikk</p>
                        <p className="font-semibold">{code.clicks}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Konverteringer</p>
                        <p className="font-semibold">{code.conversions}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-muted-foreground text-sm">
                        Opptjent provisjon
                      </p>
                      <p className="font-semibold text-lg">
                        {code.commission_earned.toFixed(2)} NOK
                      </p>
                    </div>

                    {code.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleDeactivateCode(code.id)}
                      >
                        Deaktiver kode
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommissionsSubTab() {
  const { data: commissions, isLoading } = useQuery({
    queryKey: ["affiliate-commissions"],
    queryFn: getAllAffiliateCommissions,
  });

  const { data: metrics } = useQuery({
    queryKey: ["commission-metrics"],
    queryFn: getCommissionMetrics,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Provisjoner</h3>
          <p className="text-sm text-muted-foreground">
            Oversikt over alle provisjonsutbetalinger
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Eksporter
        </Button>
      </div>

      {metrics?.data && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total provisjon
                  </p>
                  <p className="text-2xl font-bold">
                    {metrics.data.totalCommissions.toFixed(2)} NOK
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Venter på utbetaling
                  </p>
                  <p className="text-2xl font-bold">
                    {metrics.data.pendingCommissions.toFixed(2)} NOK
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Utbetalt</p>
                  <p className="text-2xl font-bold">
                    {metrics.data.paidCommissions.toFixed(2)} NOK
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p>Laster provisjoner...</p>
          </div>
        ) : commissions?.data?.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ingen provisjoner</h3>
              <p className="text-muted-foreground">
                Ingen provisjoner er registrert ennå.
              </p>
            </CardContent>
          </Card>
        ) : (
          commissions?.data?.map((commission) => (
            <Card key={commission.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{commission.stylist_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Booking ID: {commission.booking_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(commission.created_at).toLocaleDateString(
                        "no-NO"
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      {commission.amount.toFixed(2)} NOK
                    </p>
                    <Badge
                      variant={
                        commission.status === "paid"
                          ? "default"
                          : commission.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {commission.status === "paid"
                        ? "Utbetalt"
                        : commission.status === "pending"
                          ? "Venter"
                          : "Kansellert"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default function AffiliateTab() {
  const { data: metrics } = useQuery({
    queryKey: ["affiliate-metrics"],
    queryFn: getAffiliateMetrics,
  });

  return (
    <div className="space-y-6">
      <BlurFade delay={0.1} duration={0.5} inView>
        {metrics?.data && (
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Aktive partnere
                    </p>
                    <p className="text-2xl font-bold">
                      {metrics.data.activeAffiliates}
                    </p>
                  </div>
                  <UserCheck className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Ventende søknader
                    </p>
                    <p className="text-2xl font-bold">
                      {metrics.data.pendingApplications}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total omsetning
                    </p>
                    <p className="text-2xl font-bold">
                      {metrics.data.totalRevenue.toFixed(2)} NOK
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Provisjoner</p>
                    <p className="text-2xl font-bold">
                      {metrics.data.totalCommissions.toFixed(2)} NOK
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </BlurFade>

      <BlurFade delay={0.15} duration={0.5} inView>
        <Tabs defaultValue="applications" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="applications">Søknader</TabsTrigger>
            <TabsTrigger value="codes">Partnerkoder</TabsTrigger>
            <TabsTrigger value="commissions">Provisjoner</TabsTrigger>
          </TabsList>
          <TabsContent value="applications" className="mt-6">
            <ApplicationsSubTab />
          </TabsContent>
          <TabsContent value="codes" className="mt-6">
            <CodesSubTab />
          </TabsContent>
          <TabsContent value="commissions" className="mt-6">
            <CommissionsSubTab />
          </TabsContent>
        </Tabs>
      </BlurFade>
    </div>
  );
}
