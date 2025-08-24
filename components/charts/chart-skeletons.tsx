"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

export const ChartCardSkeleton = () => {
  return (
    <Card className="flex h-48 max-w-full flex-col justify-between">
      <Skeleton className="h-full w-full" />
    </Card>
  );
};

interface ChartSkeletonProps {
  label: string;
  icon?: LucideIcon;
  className?: string;
  description?: string;
}

export const ChartSkeleton = ({
  label,
  icon: Icon,
  className,
  description,
}: ChartSkeletonProps) => {
  return (
    <Card className={cn("flex h-[20rem] w-full animate-pulse flex-col gap-4", className)}>
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center justify-start gap-2 text-sm">
          {Icon && <Icon className="h-4 w-4" />}
          {label}
        </CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center pb-2">
        <Skeleton className="h-full w-full" />
      </CardContent>
    </Card>
  );
};

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex gap-4 border-b pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          {/* Rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-4 py-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};