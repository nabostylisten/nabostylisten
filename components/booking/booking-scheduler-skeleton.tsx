import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function BookingSchedulerSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-9" />
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right space-y-1">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-8 bg-muted">
              <Skeleton className="h-12 w-full" />
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>

            <div className="space-y-0">
              {Array.from({ length: 10 }).map((_, hour) => (
                <div key={hour} className="grid grid-cols-8">
                  <Skeleton className="h-16 w-full" />
                  {Array.from({ length: 7 }).map((_, day) => (
                    <Skeleton key={day} className="h-16 w-full" />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}