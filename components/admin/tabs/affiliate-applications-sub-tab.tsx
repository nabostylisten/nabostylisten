"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Loader,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getAllAffiliateApplications,
  approveAffiliateApplication,
  rejectAffiliateApplication,
} from "@/server/affiliate/affiliate-applications.actions";

import { AffiliateApplicationDetailsDialog } from "@/components/admin/affiliate-application-details-dialog";
import { AffiliateApplicationActionDialog } from "@/components/admin/affiliate-application-action-dialog";
import { AffiliateStatusChangeDialog } from "@/components/admin/affiliate-status-change-dialog";

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

export function AffiliateApplicationsSubTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());

  // Action dialog state
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "approve" | "reject";
    applicationId: string;
    stylistName: string;
  } | null>(null);

  // Status change dialog state
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    applicationId: string;
    stylistName: string;
    currentStatus: string;
  } | null>(null);

  const {
    data: applications,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["affiliate-applications"],
    queryFn: getAllAffiliateApplications,
  });

  const handleApprove = (applicationId: string, stylistName: string) => {
    setPendingAction({
      type: "approve",
      applicationId,
      stylistName,
    });
    setActionDialogOpen(true);
  };

  const handleReject = (applicationId: string, stylistName: string) => {
    setPendingAction({
      type: "reject",
      applicationId,
      stylistName,
    });
    setActionDialogOpen(true);
  };

  const handleStatusChange = (
    applicationId: string,
    stylistName: string,
    currentStatus: string
  ) => {
    setPendingStatusChange({
      applicationId,
      stylistName,
      currentStatus,
    });
    setStatusChangeDialogOpen(true);
  };

  const handleActionConfirm = async (applicationId: string, notes?: string) => {
    if (!pendingAction) return;

    const actionKey = `${pendingAction.type}-${applicationId}`;
    setLoadingActions((prev) => new Set(prev).add(actionKey));

    try {
      let result;
      if (pendingAction.type === "approve") {
        result = await approveAffiliateApplication(applicationId, notes);
      } else {
        result = await rejectAffiliateApplication(applicationId, notes);
      }

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          pendingAction.type === "approve"
            ? "Partner søknad godkjent!"
            : "Partner søknad avvist"
        );
        refetch();
      }
    } catch (error) {
      toast.error("En uventet feil oppstod");
    } finally {
      setLoadingActions((prev) => {
        const next = new Set(prev);
        next.delete(actionKey);
        return next;
      });
      setPendingAction(null);
    }
  };

  const handleStatusChangeConfirm = async (
    applicationId: string,
    newStatus: string,
    notes?: string
  ) => {
    if (!pendingStatusChange) return;

    const actionKey = `change-${applicationId}`;
    setLoadingActions((prev) => new Set(prev).add(actionKey));

    try {
      let result;
      if (newStatus === "approved") {
        result = await approveAffiliateApplication(applicationId, notes);
      } else if (newStatus === "rejected") {
        result = await rejectAffiliateApplication(applicationId, notes);
      }

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `Status endret til ${newStatus === "approved" ? "godkjent" : "avvist"}`
        );
        refetch();
      }
    } catch (error) {
      toast.error("En uventet feil oppstod");
    } finally {
      setLoadingActions((prev) => {
        const next = new Set(prev);
        next.delete(actionKey);
        return next;
      });
      setPendingStatusChange(null);
      setStatusChangeDialogOpen(false);
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
            className="text-yellow-600 border-yellow-200 dark:text-yellow-400 dark:border-yellow-400"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Venter
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="outline"
            className="text-green-600 border-green-200 dark:text-green-400 dark:border-green-400"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Godkjent
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="text-red-600 border-red-200 dark:text-red-400 dark:border-red-400"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Avvist
          </Badge>
        );
      case "suspended":
        return (
          <Badge
            variant="outline"
            className="text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-400"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Suspendert
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
          <h3 className="text-lg font-semibold">Partner-søknader</h3>
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
            onChange={(e) =>
              setStatusFilter(
                e.target.value as "all" | "pending" | "approved" | "rejected"
              )
            }
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
          <>
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>

                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
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
                    {app.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(app.id, app.full_name)}
                          disabled={
                            loadingActions.has(`approve-${app.id}`) ||
                            loadingActions.has(`reject-${app.id}`)
                          }
                        >
                          {loadingActions.has(`approve-${app.id}`) ? (
                            <Loader className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          )}
                          {loadingActions.has(`approve-${app.id}`)
                            ? "Godkjenner..."
                            : "Godkjenn"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(app.id, app.full_name)}
                          disabled={
                            loadingActions.has(`approve-${app.id}`) ||
                            loadingActions.has(`reject-${app.id}`)
                          }
                        >
                          {loadingActions.has(`reject-${app.id}`) ? (
                            <Loader className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-1" />
                          )}
                          {loadingActions.has(`reject-${app.id}`)
                            ? "Avviser..."
                            : "Avvis"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleStatusChange(app.id, app.full_name, app.status)
                        }
                        disabled={loadingActions.has(`change-${app.id}`)}
                      >
                        {loadingActions.has(`change-${app.id}`) ? (
                          <Loader className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <AlertCircle className="w-4 h-4 mr-1" />
                        )}
                        {loadingActions.has(`change-${app.id}`)
                          ? "Endrer..."
                          : "Endre status"}
                      </Button>
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

      <AffiliateApplicationActionDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        action={pendingAction?.type || null}
        applicationId={pendingAction?.applicationId || null}
        stylistName={pendingAction?.stylistName}
        onConfirm={handleActionConfirm}
        loading={
          pendingAction
            ? loadingActions.has(
                `${pendingAction.type}-${pendingAction.applicationId}`
              )
            : false
        }
      />

      <AffiliateStatusChangeDialog
        open={statusChangeDialogOpen}
        onOpenChange={setStatusChangeDialogOpen}
        applicationId={pendingStatusChange?.applicationId || null}
        stylistName={pendingStatusChange?.stylistName}
        currentStatus={pendingStatusChange?.currentStatus}
        onConfirm={handleStatusChangeConfirm}
        loading={
          pendingStatusChange
            ? loadingActions.has(`change-${pendingStatusChange.applicationId}`)
            : false
        }
      />
    </div>
  );
}