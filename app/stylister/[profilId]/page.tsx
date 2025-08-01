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
  Heart,
  Award,
  Users,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: {
    profilId: string;
  };
}

export default function StylistProfilPage({ params }: PageProps) {
  // This would normally fetch data based on params.profilId
  const stylist = {
    id: params.profilId,
    name: "Emma Larsen",
    avatar: "/placeholder-avatar.jpg",
    rating: 4.9,
    reviews: 234,
    experience: "8 år",
    location: "Oslo sentrum",
    bio: "Jeg er en erfaren frisør og colorist med over 8 års erfaring i bransjen. Jeg brenner for å skape unike looks som fremhever dine beste egenskaper. Jeg holder meg oppdatert på de nyeste trendene og teknikker, og bruker kun høykvalitetsprodukter.",
    specialties: ["Fargelegging", "Klipp", "Styling", "Behandlinger"],
    certifications: [
      "Frisørmester",
      "L'Oréal Professionnel sertifisert",
      "Balayage specialist",
    ],
    workingHours: "Man-Fre: 09:00-18:00, Lør: 10:00-16:00",
    responseTime: "Innen 2 timer",
    languages: ["Norsk", "Engelsk"],
  };

  const services = [
    {
      id: "1",
      title: "Klipp og farge",
      description: "Profesjonell hårklipp og fargelegging",
      price: "Fra 850 kr",
      duration: "2-3 timer",
      rating: 4.9,
      reviews: 67,
    },
    {
      id: "2",
      title: "Hårklipp",
      description: "Moderne hårklipp tilpasset din ansiktsform",
      price: "Fra 450 kr",
      duration: "1 time",
      rating: 4.8,
      reviews: 89,
    },
    {
      id: "3",
      title: "Hårbehandling",
      description: "Dype behandlinger for skadet hår",
      price: "Fra 650 kr",
      duration: "1,5 timer",
      rating: 5.0,
      reviews: 43,
    },
  ];

  const recentReviews = [
    {
      id: "1",
      author: "Sara K.",
      rating: 5,
      comment:
        "Emma er fantastisk! Hun forstår akkurat hva jeg ønsker og leverer alltid utover forventningene. Meget profesjonell og hyggelig.",
      date: "2 dager siden",
      service: "Klipp og farge",
    },
    {
      id: "2",
      author: "Maria H.",
      rating: 5,
      comment:
        "Første gang jeg besøkte Emma og jeg er så imponert! Fargen ble akkurat som jeg drømte om. Kommer definitivt tilbake.",
      date: "1 uke siden",
      service: "Fargelegging",
    },
    {
      id: "3",
      author: "Anna T.",
      rating: 4,
      comment:
        "God service og bra resultat. Emma er flink til å lytte til ønskene mine.",
      date: "2 uker siden",
      service: "Hårklipp",
    },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="w-32 h-32 mx-auto md:mx-0">
                <AvatarImage src={stylist.avatar} />
                <AvatarFallback className="text-2xl">
                  {stylist.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                  {stylist.name}
                </h1>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{stylist.rating}</span>
                    <span className="text-muted-foreground">
                      ({stylist.reviews} anmeldelser)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {stylist.location}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Award className="w-4 h-4" />
                    {stylist.experience} erfaring
                  </div>
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                  {stylist.specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {stylist.bio}
                </p>
              </div>
            </div>

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle>Mine tjenester</CardTitle>
                <CardDescription>
                  Alle prisene er startpriser og kan variere basert på hårlengde
                  og kompleksitet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {services.map((service, index) => (
                  <div key={service.id}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {service.title}
                        </h3>
                        <p className="text-muted-foreground mb-2">
                          {service.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            {service.rating} ({service.reviews})
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            {service.duration}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold text-lg">
                            {service.price}
                          </div>
                        </div>
                        <Button asChild>
                          <Link href={`/tjenester/${service.id}`}>Book</Link>
                        </Button>
                      </div>
                    </div>
                    {index < services.length - 1 && (
                      <Separator className="mt-6" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Anmeldelser ({stylist.reviews})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {recentReviews.map((review, index) => (
                  <div key={review.id}>
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="text-sm">
                          {review.author[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{review.author}</span>
                          <div className="flex">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star
                                key={i}
                                className="w-4 h-4 fill-yellow-400 text-yellow-400"
                              />
                            ))}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {review.service}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-1">
                          {review.comment}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {review.date}
                        </span>
                      </div>
                    </div>
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

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle>Kontakt {stylist.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button size="lg" className="w-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book tjeneste
                </Button>
                <Button variant="outline" size="lg" className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send melding
                </Button>
                <Button variant="outline" size="lg" className="w-full">
                  <Heart className="w-4 h-4 mr-2" />
                  Følg stylist
                </Button>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Informasjon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Åpningstider</h4>
                  <p className="text-sm text-muted-foreground">
                    {stylist.workingHours}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Svartid</h4>
                  <p className="text-sm text-muted-foreground">
                    {stylist.responseTime}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Språk</h4>
                  <div className="flex gap-2">
                    {stylist.languages.map((language) => (
                      <Badge
                        key={language}
                        variant="outline"
                        className="text-xs"
                      >
                        {language}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Sertifiseringer</h4>
                  <div className="space-y-2">
                    {stylist.certifications.map((cert) => (
                      <div key={cert} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {stylist.reviews}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Anmeldelser
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {stylist.rating}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Vurdering
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
