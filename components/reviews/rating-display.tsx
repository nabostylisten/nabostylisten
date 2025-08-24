"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface RatingDisplayProps {
  average: number;
  count: number;
  className?: string;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function RatingDisplay({
  average,
  count,
  className,
  showCount = true,
  size = "sm",
  isLoading = false,
}: RatingDisplayProps) {
  if (isLoading) {
    const skeletonSizes = {
      sm: { star: "w-3 h-3", rating: "w-8 h-3", count: "w-16 h-3" },
      md: { star: "w-4 h-4", rating: "w-10 h-4", count: "w-20 h-4" },
      lg: { star: "w-5 h-5", rating: "w-12 h-5", count: "w-24 h-5" },
    };
    
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Skeleton className={cn("rounded-full", skeletonSizes[size].star)} />
        <Skeleton className={skeletonSizes[size].rating} />
        {showCount && <Skeleton className={skeletonSizes[size].count} />}
      </div>
    );
  }

  if (count === 0) {
    return null;
  }

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const starSizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className={cn("flex items-center gap-1", sizeClasses[size], className)}>
      <Star className={cn("fill-yellow-400 text-yellow-400", starSizeClasses[size])} />
      <span className="font-medium">{average.toFixed(1)}</span>
      {showCount && (
        <span className="text-muted-foreground">
          ({count} {count === 1 ? "anmeldelse" : "anmeldelser"})
        </span>
      )}
    </div>
  );
}