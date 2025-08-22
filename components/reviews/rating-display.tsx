"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingDisplayProps {
  average: number;
  count: number;
  className?: string;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
}

export function RatingDisplay({
  average,
  count,
  className,
  showCount = true,
  size = "sm",
}: RatingDisplayProps) {
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