import { ServiceCardSkeleton } from "./service-card-skeleton";
import { BlurFade } from "@/components/magicui/blur-fade";

interface ServicesGridSkeletonProps {
  count?: number;
}

export function ServicesGridSkeleton({ count = 6 }: ServicesGridSkeletonProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, index) => (
        <BlurFade key={index} delay={index * 0.1} duration={0.5} inView>
          <ServiceCardSkeleton />
        </BlurFade>
      ))}
    </div>
  );
}