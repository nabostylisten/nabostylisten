import { Suspense } from "react";
import { getPopularServices } from "@/server/stats.actions";
import type { PopularService } from "@/server/stats.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Marquee } from "@/components/magicui/marquee";
import { BlurFade } from "@/components/magicui/blur-fade";
import { ArrowRight, ChevronRight, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPublicUrlFromPath } from "@/lib/supabase/storage";
import { Button } from "../ui/button";

function PopularServicesSkeleton() {
  return (
    <div className="flex gap-4 justify-center">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="w-[350px] h-[300px] rounded-lg" />
      ))}
    </div>
  );
}

async function PopularServicesContent() {
  const { data: services } = await getPopularServices(12);
  const supabase = await createClient();

  if (!services || services.length === 0) {
    return null;
  }

  const firstRow = services.slice(0, Math.ceil(services.length / 2));
  const secondRow = services.slice(Math.ceil(services.length / 2));

  const ServiceCard = ({ service }: { service: PopularService }) => {
    const previewImage = service.media?.find((m) => m.is_preview_image);
    const imageUrl = previewImage
      ? getPublicUrlFromPath(supabase, previewImage.file_path)
      : null;
    const category =
      service.service_service_categories?.[0]?.service_categories;

    return (
      <Link href={`/tjenester/${service.id}`}>
        <figure className="relative h-full w-[350px] cursor-pointer overflow-hidden rounded-xl border p-4 border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05] dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15] transition-colors">
          {imageUrl && (
            <div className="relative h-48 w-full mb-4">
              <Image
                src={imageUrl}
                alt={service.title}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          )}
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold line-clamp-1">
                  {service.title}
                </h3>
                {category && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    {category.name}
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{service.price} kr</p>
                <p className="text-xs text-muted-foreground">
                  {service.duration_minutes} min
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">
                  {service.average_rating > 0
                    ? service.average_rating.toFixed(1)
                    : "Ny"}
                </span>
                {service.total_reviews > 0 && (
                  <span className="text-muted-foreground">
                    ({service.total_reviews})
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">
                {service.profiles?.full_name}
              </p>
            </div>
          </div>
        </figure>
      </Link>
    );
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden py-4">
      <Marquee pauseOnHover className="[--duration:40s] [--gap:1rem]">
        {firstRow.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:40s] [--gap:1rem]">
        {secondRow.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 lg:w-1/10 bg-gradient-to-r from-background"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 lg:w-1/10 bg-gradient-to-l from-background"></div>
      <div className="mt-8 pointer-events-auto">
        <Button asChild className="group">
          <Link href="/tjenester">
            Se alle tjenester
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function PopularServices() {
  return (
    <BlurFade delay={0.12} duration={0.5} inView>
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-fraunces mb-4">
            Populære tjenester
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Oppdag våre mest etterspurte og høyest rangerte tjenester
          </p>
        </div>
        <Suspense fallback={<PopularServicesSkeleton />}>
          <PopularServicesContent />
        </Suspense>
      </div>
    </BlurFade>
  );
}
