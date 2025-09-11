"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  Download,
  CheckCircle,
  AlertCircle,
  Copy,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getAllAffiliateCommissions,
  getCommissionMetrics,
} from "@/server/affiliate/affiliate-commission.actions";

export function AffiliateCommissionsSubTab() {
  const { data: commissions, isLoading } = useQuery({
    queryKey: ["affiliate-commissions"],
    queryFn: getAllAffiliateCommissions,
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["commission-metrics"],
    queryFn: getCommissionMetrics,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
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

      {metricsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : metrics?.data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
      ) : null}

      <div className="space-y-4">
        {isLoading ? (
          <>
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="text-left sm:text-right space-y-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
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
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <h4 className="font-semibold">{commission.stylist_name}</h4>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(commission.booking_id);
                          toast.success("Booking-ID kopiert til utklippstavle");
                        }}
                        className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Kopier booking-ID
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(commission.created_at).toLocaleDateString(
                        "no-NO"
                      )}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
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
