"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BaseChartProps, TimePeriodSelector } from "@/lib/charts/components";
import { getDateFormatter, getPeriodLabel } from "@/lib/charts/time-periods";
import { Users, UserPlus, Star } from "lucide-react";
import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface UserGrowthData {
  date: string;
  total: number;
  customers: number;
  stylists: number;
}

interface UserTrendsStackedAreaChartProps extends BaseChartProps {
  data: UserGrowthData[];
  title?: string;
}

const chartConfig = {
  total: {
    label: "Totalt",
    color: "var(--chart-1)",
    icon: Users,
  },
  customers: {
    label: "Kunder",
    color: "var(--chart-2)",
    icon: UserPlus,
  },
  stylists: {
    label: "Stylister",
    color: "var(--chart-3)",
    icon: Star,
  },
} satisfies ChartConfig;

export default function UserTrendsStackedAreaChart({
  data = [],
  isLoading,
  onPeriodChange,
  currentPeriod = "last_30_days",
  showControls = true,
  title = "Brukervekst",
}: UserTrendsStackedAreaChartProps) {
  const [timeRange, setTimeRange] = React.useState(currentPeriod);

  const handlePeriodChange = (period: typeof currentPeriod) => {
    setTimeRange(period);
    onPeriodChange?.(period);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Nye registreringer over tid
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full animate-pulse rounded-md bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Nye registreringer over tid
            </p>
          </div>
          {showControls && (
            <TimePeriodSelector
              value={timeRange}
              onValueChange={handlePeriodChange}
            />
          )}
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Users className="mx-auto mb-2 h-12 w-12" />
              <p className="mb-2">Ingen data tilgjengelig for denne perioden</p>
              <p className="text-sm">Prøv å velge en annen tidsperiode</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Viser data for {getPeriodLabel(timeRange)}
          </p>
        </div>
        {showControls && (
          <TimePeriodSelector
            value={timeRange}
            onValueChange={handlePeriodChange}
          />
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            data={data}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
            height={400}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={getDateFormatter(timeRange)}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(value: string) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("nb-NO", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <defs>
              <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-total)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-total)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillCustomers" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-customers)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-customers)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillStylists" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-stylists)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-stylists)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="customers"
              type="natural"
              fill="url(#fillCustomers)"
              fillOpacity={0.4}
              stroke="var(--color-customers)"
              stackId="a"
            />
            <Area
              dataKey="stylists"
              type="natural"
              fill="url(#fillStylists)"
              fillOpacity={0.4}
              stroke="var(--color-stylists)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
