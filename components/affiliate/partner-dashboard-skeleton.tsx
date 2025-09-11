import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PartnerDashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header skeleton */}
      <div className="text-center space-y-2">
        <Skeleton className="h-9 w-full max-w-64 mx-auto" />
        <Skeleton className="h-5 w-full max-w-96 mx-auto" />
      </div>

      {/* Metrics cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-1" />
              <Skeleton className="h-3 w-full max-w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Code card skeleton */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full max-w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <div className="flex flex-col sm:flex-row gap-2">
              <Skeleton className="h-10 w-full sm:w-32" />
              <Skeleton className="h-10 w-full sm:w-32" />
            </div>
          </CardContent>
        </Card>

        {/* Performance overview skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-full max-w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 flex-1 max-w-24" />
              <Skeleton className="h-4 w-16 flex-shrink-0" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 flex-1 max-w-24" />
              <Skeleton className="h-4 w-16 flex-shrink-0" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 flex-1 max-w-24" />
              <Skeleton className="h-4 w-16 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-full max-w-48" />
          <Skeleton className="h-4 w-full max-w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PartnerApplicationPendingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8 space-y-2">
          <Skeleton className="h-9 w-full max-w-48 mx-auto" />
          <Skeleton className="h-5 w-full max-w-64 mx-auto" />
        </div>

        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-full max-w-40 mx-auto" />
            <Skeleton className="h-4 w-full max-w-56 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full max-w-48" />
              <Skeleton className="h-4 w-full max-w-40" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function PartnerNotAppliedSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8 space-y-2">
          <Skeleton className="h-9 w-full max-w-48 mx-auto" />
          <Skeleton className="h-5 w-full max-w-80 mx-auto" />
        </div>

        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-full max-w-32 mx-auto" />
            <Skeleton className="h-4 w-full max-w-48 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <Skeleton className="h-5 w-full max-w-40" />
              <div className="space-y-1">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}