import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
// Export the type so it can be used elsewhere
export type ServiceWithRelations = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  duration_minutes: number;
  is_published: boolean;
  at_customer_place: boolean;
  at_stylist_place: boolean;
  stylist_id: string;
  created_at: string;
  updated_at: string;
  service_service_categories?: Array<{
    service_categories: {
      id: string;
      name: string;
      description: string | null;
      parent_category_id: string | null;
    };
  }>;
  media?: Array<{
    id: string;
    file_path: string;
    media_type: string;
    is_preview_image: boolean;
    created_at: string;
    publicUrl?: string;
  }>;
  profiles?: {
    id: string;
    full_name: string | null;
    stylist_details?: {
      bio: string | null;
      can_travel: boolean;
      has_own_place: boolean;
      travel_distance_km: number | null;
    } | null;
    addresses?: Array<{
      id: string;
      city: string;
      postal_code: string;
      street_address: string;
      is_primary: boolean;
    }>;
  };
};

interface ServiceCardProps {
  service: ServiceWithRelations;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const serviceImages =
    service.media?.filter((m) => m.media_type === "service_image") || [];
  const primaryAddress = service.profiles?.addresses?.find(
    (addr) => addr.is_primary
  );
  const categories =
    service.service_service_categories?.map((ssc) => ssc.service_categories) ||
    [];
  const stylistDetails = service.profiles?.stylist_details;

  // Format price from øre to NOK
  const formatPrice = (priceInOre: number) => {
    return new Intl.NumberFormat("no-NO", {
      style: "currency",
      currency: "NOK",
      minimumFractionDigits: 0,
    }).format(priceInOre / 100);
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? "time" : "timer"}`;
    }
    return `${hours}t ${remainingMinutes}min`;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow h-full">
      <div className="aspect-video bg-muted rounded-t-xl relative overflow-hidden">
        {serviceImages.length > 0 ? (
          <Carousel
            className="w-full h-full"
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <CarouselContent>
              {serviceImages.map((image) => (
                <CarouselItem key={image.id}>
                  <div className="aspect-video relative">
                    <Image
                      src={image.publicUrl || image.file_path}
                      alt={service.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {serviceImages.length > 1 && (
              <>
                <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border-0 shadow-md" />
                <CarouselNext className="right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border-0 shadow-md" />
              </>
            )}
          </Carousel>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Ingen bilde</span>
          </div>
        )}
      </div>
      <Link href={`/tjenester/${service.id}`}>
        <div className="cursor-pointer">
          <CardHeader>
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="text-xl line-clamp-1">
                {service.title}
              </CardTitle>
              <Badge variant="secondary" className="shrink-0">
                Fra {formatPrice(service.price)}
              </Badge>
            </div>
            <CardDescription className="line-clamp-2">
              {service.description || "Ingen beskrivelse tilgjengelig"}
            </CardDescription>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {categories.slice(0, 2).map((category) => (
                  <Badge
                    key={category.id}
                    variant="outline"
                    className="text-xs"
                  >
                    {category.name}
                  </Badge>
                ))}
                {categories.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{categories.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(service.duration_minutes)}</span>
              </div>
              {primaryAddress && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1">{primaryAddress.city}</span>
                </div>
              )}
            </div>
            {service.profiles?.full_name && (
              <div className="mt-2 text-sm text-muted-foreground">
                av {service.profiles.full_name}
              </div>
            )}
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              {service.at_customer_place && service.at_stylist_place ? (
                <span>Hjemme eller hos stylist</span>
              ) : service.at_customer_place ? (
                <span>Hjemme hos deg</span>
              ) : (
                <span>Hos stylist</span>
              )}
            </div>
          </CardContent>
        </div>
      </Link>
    </Card>
  );
}
