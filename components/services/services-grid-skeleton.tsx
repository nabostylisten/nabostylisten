import { ServiceCardSkeleton } from "./service-card-skeleton";

interface ServicesGridSkeletonProps {
  count?: number;
}

export function ServicesGridSkeleton({ count = 6 }: ServicesGridSkeletonProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, index) => (
        <ServiceCardSkeleton key={index} />
      ))}
    </div>
  );
}