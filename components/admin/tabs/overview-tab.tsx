"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TimePeriod } from "@/lib/charts/time-periods";
import { TimePeriodSelector } from "@/lib/charts/components";
import ChartCard from "@/components/charts/chart-card";
import { ChartCardSkeleton } from "@/components/charts/chart-skeletons";
import {
  useOverviewData,
  useUserGrowthTrends,
  useBookingVolumeTrends,
  useRevenueOverview,
} from "@/hooks/admin/use-admin-data";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { getDateFormatter } from "@/lib/charts/time-periods";
import { Badge } from "@/components/ui/badge";

export default function OverviewTab() {
  const [userGrowthPeriod, setUserGrowthPeriod] = useState<TimePeriod>("last_30_days");
  const [bookingPeriod, setBookingPeriod] = useState<TimePeriod>("last_30_days");
  const [revenuePeriod, setRevenuePeriod] = useState<TimePeriod>("last_30_days");

  const { platformKPIs, recentActivity, isLoading: overviewLoading } = useOverviewData();
  
  const { data: userTrends, isLoading: userTrendsLoading } = useUserGrowthTrends(userGrowthPeriod);
  const { data: bookingTrends, isLoading: bookingTrendsLoading } = useBookingVolumeTrends(bookingPeriod);
  const { data: revenueTrends, isLoading: revenueTrendsLoading } = useRevenueOverview(revenuePeriod);

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

  if (overviewLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Oversikt</h2>
        <p className="text-muted-foreground">Nøkkeltall og aktivitet på plattformen</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ChartCard
          label="Totale brukere"
          value={platformKPIs.data?.users.total}
          icon="users"
        />
        <ChartCard
          label="Aktive bookinger denne måneden"
          value={platformKPIs.data?.activeBookingsThisMonth}
          icon="calendar"
        />
        <ChartCard
          label="Omsetning denne måneden"
          value={platformKPIs.data?.revenueThisMonth}
          unit="kr"
          icon="dollarSign"
        />
        <ChartCard
          label="Ventende søknader"
          value={platformKPIs.data?.pendingApplications}
          icon="shoppingBag"
        />
      </div>

      <Separator />

      {/* User Breakdown */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ChartCard
          label="Kunder"
          value={platformKPIs.data?.users.customers}
          icon="users"
        />
        <ChartCard
          label="Stylister"
          value={platformKPIs.data?.users.stylists}
          icon="star"
        />
        <ChartCard
          label="Administratorer"
          value={platformKPIs.data?.users.admins}
          icon="users"
        />
      </div>

      <Separator />

      {/* Charts */}
      <div className="space-y-6">
        {/* User Growth Trends */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Brukervekst</CardTitle>
              <p className="text-sm text-muted-foreground">Nye registreringer over tid</p>
            </div>
            <TimePeriodSelector 
              value={userGrowthPeriod} 
              onValueChange={(period) => setUserGrowthPeriod(period)} 
            />
          </CardHeader>
          <CardContent>
            {userTrendsLoading ? (
              <div className="h-[300px] w-full animate-pulse rounded-md bg-muted" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={userTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={getDateFormatter(userGrowthPeriod)}
                  />
                  <YAxis />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stackId="1" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="customers" 
                    stackId="2" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="stylists" 
                    stackId="3" 
                    stroke="#f59e0b" 
                    fill="#f59e0b" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Siste aktivitet</CardTitle>
            <p className="text-sm text-muted-foreground">Nyeste aktivitet på plattformen</p>
          </CardHeader>
          <CardContent>
            {recentActivity.data && recentActivity.data.length > 0 ? (
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