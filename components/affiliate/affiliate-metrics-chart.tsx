"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Users,
  DollarSign,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AffiliateMetric {
  label: string;
  value: number;
  previousValue?: number;
  format?: "number" | "currency" | "percentage";
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "amber";
  tooltip?: string;
}

interface AffiliateMetricsChartProps {
  clickCount: number;
  conversionCount: number;
  totalEarnings: number;
  previousPeriod?: {
    clickCount: number;
    conversionCount: number;
    totalEarnings: number;
  };
}

export function AffiliateMetricsChart({
  clickCount,
  conversionCount,
  totalEarnings,
  previousPeriod,
}: AffiliateMetricsChartProps) {
  const conversionRate =
    clickCount > 0 ? (conversionCount / clickCount) * 100 : 0;
  const previousConversionRate =
    previousPeriod && previousPeriod.clickCount > 0
      ? (previousPeriod.conversionCount / previousPeriod.clickCount) * 100
      : 0;

  const metrics: AffiliateMetric[] = useMemo(
    () => [
      {
        label: "Totale klikk",
        value: clickCount,
        previousValue: previousPeriod?.clickCount,
        format: "number",
        icon: <Eye className="w-4 h-4" />,
        color: "blue",
      },
      {
        label: "Bookinger",
        value: conversionCount,
        previousValue: previousPeriod?.conversionCount,
        format: "number",
        icon: <Users className="w-4 h-4" />,
        color: "green",
      },
      {
        label: "Konverteringsrate",
        value: conversionRate,
        previousValue: previousConversionRate,
        format: "percentage",
        icon: <TrendingUp className="w-4 h-4" />,
        color: "purple",
        tooltip:
          "Konverteringsrate viser hvor mange prosent av de som klikker på din partnerkode som faktisk booker en tjeneste. For eksempel: 10% betyr at 1 av 10 klikk fører til en booking. Jo høyere rate, desto bedre presterer partnerkoden din!",
      },
      {
        label: "Total inntjening",
        value: totalEarnings,
        previousValue: previousPeriod?.totalEarnings,
        format: "currency",
        icon: <DollarSign className="w-4 h-4" />,
        color: "amber",
      },
    ],
    [clickCount, conversionCount, conversionRate, totalEarnings, previousPeriod, previousConversionRate]
  );

  const formatValue = (value: number, format?: string) => {
    switch (format) {
      case "currency":
        return `${value.toLocaleString("no-NO")} kr`;
      case "percentage":
        return `${value.toFixed(1)}%`;
      case "number":
      default:
        return value.toLocaleString("no-NO");
    }
  };

  const getChangeInfo = (current: number, previous?: number) => {
    if (previous === undefined || previous === 0) {
      return { change: 0, trend: "neutral" as const, changeText: "Ingen data" };
    }

    const change = ((current - previous) / previous) * 100;
    const trend = (change > 0 ? "up" : change < 0 ? "down" : "neutral") as
      | "up"
      | "down"
      | "neutral";
    const changeText = `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;

    return { change: Math.abs(change), trend, changeText };
  };

  const getTrendIcon = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3" />;
      case "down":
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  const getTrendColor = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return "text-green-600 bg-green-50 border-green-200";
      case "down":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const { trend, changeText } = getChangeInfo(
          metric.value,
          metric.previousValue
        );

        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                {metric.label}
                {metric.tooltip && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 cursor-help text-muted-foreground/70 hover:text-muted-foreground transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{metric.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </CardTitle>
              <div
                className={cn(
                  "p-2 rounded-md border",
                  metric.color === "blue" &&
                    "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
                  metric.color === "green" &&
                    "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300",
                  metric.color === "purple" &&
                    "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300",
                  metric.color === "amber" &&
                    "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                )}
              >
                {metric.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {formatValue(metric.value, metric.format)}
                </div>

                {metric.previousValue !== undefined && (
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      className={cn("text-xs", getTrendColor(trend))}
                    >
                      <span className="flex items-center space-x-1">
                        {getTrendIcon(trend)}
                        <span>{changeText}</span>
                      </span>
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      fra forrige periode
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

interface AffiliatePerformanceOverviewProps {
  clickCount: number;
  conversionCount: number;
  totalEarnings: number;
  activeCodeSince?: string;
}

export function AffiliatePerformanceOverview({
  clickCount,
  conversionCount,
  totalEarnings,
  activeCodeSince,
}: AffiliatePerformanceOverviewProps) {
  const conversionRate =
    clickCount > 0 ? (conversionCount / clickCount) * 100 : 0;
  const averageEarningPerConversion =
    conversionCount > 0 ? totalEarnings / conversionCount : 0;

  const daysSinceActive = activeCodeSince
    ? Math.floor(
        (Date.now() - new Date(activeCodeSince).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="hyphens-manual">Ytelses&shy;sammendrag</CardTitle>
        <CardDescription>
          {activeCodeSince && `Aktiv siden ${daysSinceActive} dager`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {conversionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground hyphens-manual">
                Konverterings&shy;rate
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {conversionRate > 5
                  ? "Utmerket!"
                  : conversionRate > 2
                    ? "Bra!"
                    : "Kan forbedres"}
              </div>
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {averageEarningPerConversion.toLocaleString("no-NO", {
                  maximumFractionDigits: 0,
                })}{" "}
                kr
              </div>
              <div className="text-sm text-muted-foreground">
                Snitt per booking
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Provisjon per kunde
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
              <span className="text-sm text-muted-foreground">
                Måloppnåelse
              </span>
              <span className="text-sm font-medium hyphens-manual">
                {conversionCount}/10 bookinger denne måned&shy;en
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((conversionCount / 10) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          {conversionCount === 0 && clickCount > 0 && (
            <div className="text-center p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-sm text-amber-800 hyphens-manual">
                Du har fått klikk, men ingen bookinger ennå. Fortsett å dele
                partner&shy;koden din!
              </div>
            </div>
          )}

          {clickCount === 0 && (
            <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800 hyphens-manual">
                Start med å dele partner&shy;koden din for å få dine første klikk og
                kunder!
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
