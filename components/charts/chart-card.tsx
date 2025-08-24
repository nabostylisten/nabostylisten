"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  ShoppingBag,
  Star,
  Clock,
  type LucideIcon,
} from "lucide-react";

type LucideIconName =
  | "barChart"
  | "trendingUp"
  | "users"
  | "dollarSign"
  | "calendar"
  | "shoppingBag"
  | "star"
  | "clock";

const iconMap: Record<LucideIconName, LucideIcon> = {
  barChart: BarChart3,
  trendingUp: TrendingUp,
  users: Users,
  dollarSign: DollarSign,
  calendar: Calendar,
  shoppingBag: ShoppingBag,
  star: Star,
  clock: Clock,
};

interface ChartCardProps {
  label: string;
  value?: number | string;
  unit?: string;
  icon?: LucideIconName;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const ChartCard = ({ label, value, unit, icon, trend }: ChartCardProps) => {
  const hasData = value !== undefined && value !== null;
  const Icon = icon ? iconMap[icon] : null;

  const formattedValue = () => {
    if (typeof value === "number") {
      if (unit === "%") {
        return `${value.toFixed(1)}%`;
      }
      if (unit === "kr") {
        return new Intl.NumberFormat("nb-NO", {
          style: "currency",
          currency: "NOK",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      }
      return value.toLocaleString("nb-NO", { maximumFractionDigits: 2 });
    }
    return value;
  };

  return (
    <Card className="flex h-48 max-w-full flex-col justify-between">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center justify-start gap-2 text-sm">
          {Icon && <Icon className="h-4 w-4" />}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-grow flex-col items-center justify-center text-center">
        {hasData ? (
          <>
            <div className="text-4xl font-bold">{formattedValue()}</div>
            {unit && unit !== "%" && unit !== "kr" && (
              <div className="text-sm text-muted-foreground">{unit}</div>
            )}
            {trend && (
              <div
                className={`text-sm ${trend.isPositive ? "text-green-600" : "text-red-600"} flex items-center gap-1 mt-2`}
              >
                <TrendingUp
                  className={`h-3 w-3 ${!trend.isPositive && "rotate-180"}`}
                />
                {trend.isPositive ? "+" : "-"}
                {trend.value.toFixed(1)}%
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <BarChart3 className="h-10 w-10" />
            <div className="text-sm">Ingen data funnet</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChartCard;
