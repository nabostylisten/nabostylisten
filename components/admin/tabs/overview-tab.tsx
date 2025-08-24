"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TimePeriod } from "@/lib/charts/time-periods";
import ChartCard from "@/components/charts/chart-card";
import { ChartCardSkeleton } from "@/components/charts/chart-skeletons";
import {
  useOverviewData,
  useUserGrowthTrends,
} from "@/hooks/admin/use-admin-data";
import UserTrendsStackedAreaChart from "@/components/charts/user-trends/stacked-area-chart";
import { Badge } from "@/components/ui/badge";

export default function OverviewTab() {
  const [userGrowthPeriod, setUserGrowthPeriod] = useState<TimePeriod>("last_30_days");

  const { platformKPIs, recentActivity } = useOverviewData();
  
  const { data: userTrends, isLoading: userTrendsLoading } = useUserGrowthTrends(userGrowthPeriod);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "confirmed":
      case "completed":
      case "active":
        return "default";
      case "pending":
      case "applied":
        return "secondary";
      case "cancelled":
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Oversikt</h2>
        <p className="text-muted-foreground">Nøkkeltall og aktivitet på plattformen</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {platformKPIs.isLoading ? (
          <ChartCardSkeleton />
        ) : (
          <ChartCard
            label="Totale brukere"
            value={platformKPIs.data?.users.total}
            icon="users"
          />
        )}
        {platformKPIs.isLoading ? (
          <ChartCardSkeleton />
        ) : (
          <ChartCard
            label="Aktive bookinger denne måneden"
            value={platformKPIs.data?.activeBookingsThisMonth}
            icon="calendar"
          />
        )}
        {platformKPIs.isLoading ? (
          <ChartCardSkeleton />
        ) : (
          <ChartCard
            label="Omsetning denne måneden"
            value={platformKPIs.data?.revenueThisMonth}
            unit="kr"
            icon="dollarSign"
          />
        )}
        {platformKPIs.isLoading ? (
          <ChartCardSkeleton />
        ) : (
          <ChartCard
            label="Ventende søknader"
            value={platformKPIs.data?.pendingApplications}
            icon="shoppingBag"
          />
        )}
      </div>

      <Separator />

      {/* User Breakdown */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {platformKPIs.isLoading ? (
          <ChartCardSkeleton />
        ) : (
          <ChartCard
            label="Kunder"
            value={platformKPIs.data?.users.customers}
            icon="users"
          />
        )}
        {platformKPIs.isLoading ? (
          <ChartCardSkeleton />
        ) : (
          <ChartCard
            label="Stylister"
            value={platformKPIs.data?.users.stylists}
            icon="star"
          />
        )}
        {platformKPIs.isLoading ? (
          <ChartCardSkeleton />
        ) : (
          <ChartCard
            label="Administratorer"
            value={platformKPIs.data?.users.admins}
            icon="users"
          />
        )}
      </div>

      <Separator />

      {/* Charts */}
      <div className="space-y-6">
        {/* User Growth Trends */}
        <UserTrendsStackedAreaChart
          data={userTrends || []}
          isLoading={userTrendsLoading}
          onPeriodChange={(period) => setUserGrowthPeriod(period)}
          currentPeriod={userGrowthPeriod}
          showControls={true}
        />

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Siste aktivitet</CardTitle>
            <p className="text-sm text-muted-foreground">Nyeste aktivitet på plattformen</p>
          </CardHeader>
          <CardContent>
            {recentActivity.isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                      <div className="h-3 bg-muted rounded animate-pulse w-1/2"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 bg-muted rounded animate-pulse w-16"></div>
                      <div className="h-6 bg-muted rounded animate-pulse w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.data && recentActivity.data.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.data.map((activity, index) => (
                  <div key={`${activity.type}-${activity.id}-${index}`} className="flex items-center justify-between border-b pb-2">
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString("nb-NO", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {activity.amount && (
                        <span className="text-sm font-medium">
                          {new Intl.NumberFormat("nb-NO", {
                            style: "currency",
                            currency: "NOK",
                          }).format(activity.amount)}
                        </span>
                      )}
                      <Badge variant={getStatusBadgeVariant(activity.status)}>
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Ingen aktivitet funnet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}