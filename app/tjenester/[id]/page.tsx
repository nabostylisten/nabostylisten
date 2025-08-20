import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MapPin,
  Star,
  Clock,
  CheckCircle,
  Calendar,
  User,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPublicService } from "@/server/service.actions";
import { ServiceDetailSkeleton } from "@/components/services/service-detail-skeleton";
import Image from "next/image";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

async function ServiceDetailContent({ serviceId }: { serviceId: string }) {
  const { data: service, error } = await getPublicService(serviceId);

  if (error || !service) {
    notFound();
  }

  const previewImage = service.media?.find((m) => m.is_preview_image);
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

  // Get actual includes and requirements from service data
  const serviceIncludes = service.includes || [];
  const serviceRequirements = service.requirements || [];

  const mockReviews = [
    {
      id: "1",
      author: "Sara K.",
      rating: 5,
      comment:
        "Fantastisk resultat! Super profesjonell og gjorde en utrolig jobb.",
      date: "2 dager siden",
    },
    {
      id: "2",
      author: "Maria H.",
      rating: 5,
      comment:
        "Så fornøyd med resultatet! Kommer definitivt til å booke igjen.",
      date: "1 uke siden",
    },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Section */}
            <div>
              <div className="aspect-video bg-muted rounded-lg mb-6 relative overflow-hidden">
                {previewImage?.publicUrl ? (
                  <Image
                    src={previewImage.publicUrl}
                    alt={service.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <span className="text-muted-foreground">Ingen bilde</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  Fra {formatPrice(service.price)}
                </Badge>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {primaryAddress?.city || "Ukjent lokasjon"}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {formatDuration(service.duration_minutes)}
                </div>
              </div>

              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((category) => (
                    <Badge key={category.id} variant="outline">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              )}

              <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                {service.title}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {service.description || "Ingen beskrivelse tilgjengelig"}
              </p>
            </div>

            {/* Stylist Info */}
            <Card>
              <CardHeader>
                <CardTitle>Din stylist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback>
                      {service.profiles?.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {service.profiles?.full_name || "Ukjent stylist"}
                    </h3>
                    {stylistDetails?.bio && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {stylistDetails.bio}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {stylistDetails?.can_travel && (
                        <Badge variant="outline" className="text-xs">
                          Reiser til deg
                        </Badge>
                      )}
                      {stylistDetails?.has_own_place && (
                        <Badge variant="outline" className="text-xs">
                          Har eget sted
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" asChild>
                    <Link
                      href={`/stylister/${service.profiles?.id}`}
                      target="_blank"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Se profil
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* What's Included */}
            {serviceIncludes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Hva er inkludert</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {serviceIncludes.map((item: string, index: number) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Requirements */}
            {service.at_customer_place && serviceRequirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Krav hjemme hos deg</CardTitle>
                  <CardDescription>
                    For å kunne utføre tjenesten trenger vi følgende:
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {serviceRequirements.map(
                    (requirement: string, index: number) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <span>{requirement}</span>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Nylige anmeldelser</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {mockReviews.map((review, index) => (
                  <div key={review.id}>
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {review.author[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{review.author}</span>
                          <div className="flex">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star
                                key={i}
                                className="w-4 h-4 fill-yellow-400 text-yellow-400"
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {review.date}
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground">{review.comment}</p>
                    {index < mockReviews.length - 1 && (
                      <Separator className="mt-6" />
                    )}
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  Se alle anmeldelser
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-2xl">
                  Fra {formatPrice(service.price)}
                </CardTitle>
                <CardDescription>Per behandling</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  <p>Varighet: {formatDuration(service.duration_minutes)}</p>
                  <p className="mt-1">
                    Tilgjengelig:{" "}
                    {service.at_customer_place && service.at_stylist_place
                      ? "Hjemme eller hos stylist"
                      : service.at_customer_place
                        ? "Hjemme hos deg"
                        : "Hos stylist"}
                  </p>
                </div>
                <Button size="lg" className="w-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book nå
                </Button>
                <Button variant="outline" size="lg" className="w-full">
                  <Heart className="w-4 h-4 mr-2" />
                  Lagre
                </Button>
                <Separator />
                <div className="text-center text-sm text-muted-foreground">
                  <p>✓ Gratis avbestilling frem til 24 timer før</p>
                  <p>✓ Sikker betaling</p>
                  <p>✓ Kvalitetsgaranti</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function TjenesteDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<ServiceDetailSkeleton />}>
      <ServiceDetailContent serviceId={id} />
    </Suspense>
  );
}
