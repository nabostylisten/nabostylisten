import { Skeleton } from "@/components/ui/skeleton"

export function AvailabilitySchedulerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-7 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        
        {/* Week navigation skeleton */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-9" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>

        {/* Calendar skeleton */}
        <div className="border rounded-lg overflow-hidden">
          {/* Header row skeleton */}
          <div className="grid grid-cols-8 bg-muted">
            <div className="p-2 border-r">
              <Skeleton className="w-4 h-4 mx-auto" />
            </div>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="p-2 text-center border-r last:border-r-0">
                <Skeleton className="h-4 w-8 mx-auto mb-1" />
                <Skeleton className="h-5 w-6 mx-auto" />
              </div>
            ))}
          </div>
          
          {/* Calendar body skeleton */}
          <div className="space-y-0">
            {Array.from({ length: 10 }).map((_, hourIndex) => (
              <div key={hourIndex} className="grid grid-cols-8 border-t">
                <div className="p-2 text-center border-r bg-muted/50">
                  <Skeleton className="h-4 w-12 mx-auto" />
                </div>
                {Array.from({ length: 7 }).map((_, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="p-2 border-r last:border-r-0 min-h-[60px]"
                  >
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend skeleton */}
        <div className="flex gap-4 mt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}