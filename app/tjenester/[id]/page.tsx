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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TjenesteDetailPage({ params }: PageProps) {
  const { id } = await params;

  // This would normally fetch data based on id
  const service = {
    id: id,
    title: "Klipp og farge",
    description:
      "Profesjonell hårklipp og fargelegging hjemme hos deg. Jeg tilbyr individuell konsultasjon og bruker kun høykvalitetsprodukter for best mulig resultat.",
    price: "Fra 850 kr",
    duration: "2-3 timer",
    rating: 4.9,
    reviews: 127,
    location: "Oslo sentrum",
    images: ["/placeholder-service.jpg", "/placeholder-service.jpg"],
    stylist: {
      id: "1",
      name: "Emma Larsen",
      avatar: "/placeholder-avatar.jpg",
      rating: 4.9,
      reviews: 234,
      experience: "8 år",
    },
    includes: [
      "Konsultasjon og fargeråd",
      "Klipp og styling",
      "Profesjonelle produkter",
      "Oppfølging etter behandling",
    ],
    requirements: [
      "Tilgang til vask og strøm",
      "God belysning",
      "Plass til arbeid",
    ],
  };

  const recentReviews = [
    {
      id: "1",
      author: "Sara K.",
      rating: 5,
      comment:
        "Fantastisk resultat! Emma var super profesjonell og gjorde en utrolig jobb.",
      date: "2 dager siden",
    },
    {
      id: "2",
      author: "Maria H.",
      rating: 5,
      comment: "Så fornøyd med fargen! Kommer definitivt til å booke igjen.",
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
              <div className="aspect-video bg-muted rounded-lg mb-6"></div>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {service.price}
                </Badge>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{service.rating}</span>
                  <span className="text-muted-foreground">
                    ({service.reviews} anmeldelser)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {service.location}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {service.duration}
                </div>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                {service.title}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {service.description}
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
                    <AvatarImage src={service.stylist.avatar} />
                    <AvatarFallback>
                      {service.stylist.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {service.stylist.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {service.stylist.rating} ({service.stylist.reviews})
                      </div>
                      <span>{service.stylist.experience} erfaring</span>
                    </div>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href={`/stylister/${service.stylist.id}`}>
                      <User className="w-4 h-4 mr-2" />
                      Se profil
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* What's Included */}
            <Card>
              <CardHeader>
                <CardTitle>Hva er inkludert</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {service.includes.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Krav hjemme hos deg</CardTitle>
                <CardDescription>
                  For å kunne utføre tjenesten trenger vi følgende:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {service.requirements.map((requirement, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <span>{requirement}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Nylige anmeldelser</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {recentReviews.map((review, index) => (
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
                    {index < recentReviews.length - 1 && (
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
                <CardTitle className="text-2xl">{service.price}</CardTitle>
                <CardDescription>Per behandling</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
