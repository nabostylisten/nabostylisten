import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ChatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1">
              <Skeleton className="w-5 h-5 rounded" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>

              <div className="text-sm text-muted-foreground mb-2">
                <div className="flex items-center gap-1 mb-1">
                  <Skeleton className="w-3 h-3 rounded" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-3 w-24" />
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChatCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <ChatCardSkeleton key={index} />
      ))}
    </div>
  );
}