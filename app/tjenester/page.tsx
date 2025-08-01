import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Star, Filter } from "lucide-react";
import Link from "next/link";

export default function TjenesterPage() {
  const categories = [
    { name: "Hår", count: 245, href: "/services/hair" },
    { name: "Negler", count: 189, href: "/services/nails" },
    { name: "Sminke", count: 156, href: "/services/makeup" },
    { name: "Vipper & Bryn", count: 134, href: "/services/lashes-brows" },
    { name: "Bryllup", count: 89, href: "/services/wedding" },
  ];

  const featuredServices = [
    {
      id: "1",
      title: "Klipp og farge",
      description: "Profesjonell hårklipp og fargelegging hjemme hos deg",
      price: "Fra 850 kr",
      rating: 4.9,
      reviews: 127,
      location: "Oslo sentrum",
      image: "/placeholder-service.jpg",
    },
    {
      id: "2",
      title: "Gelélakk manikyr",
      description: "Langtidsholdbar neglelakk som varer i 2-3 uker",
      price: "Fra 450 kr",
      rating: 4.8,
      reviews: 93,
      location: "Grünerløkka",
      image: "/placeholder-service.jpg",
    },
    {
      id: "3",
      title: "Bryllupssminke",
      description: "Profesjonell sminke for din store dag",
      price: "Fra 1200 kr",
      rating: 5.0,
      reviews: 64,
      location: "Frogner",
      image: "/placeholder-service.jpg",
    },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Hero Section */}
        <div className="text-center py-16">
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">
            Finn din perfekte
            <span className="text-primary"> stylist</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Søk blant hundrevis av profesjonelle skjønnhetstjenester i ditt
            område. Book enkelt og trygt online.
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Søk etter tjeneste eller behandling..."
                    className="pl-10"
                  />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Hvor?" className="pl-10" />
                </div>
                <Button size="default" className="md:w-auto">
                  <Search className="w-4 h-4 mr-2" />
                  Søk
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Section */}
        <div className="py-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Populære kategorier
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((category) => (
              <Link key={category.name} href={category.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-semibold text-lg mb-2">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {category.count} tjenester
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured Services */}
        <div className="py-16">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Utvalgte tjenester</h2>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtre
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredServices.map((service) => (
              <Link key={service.id} href={`/tjenester/${service.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-video bg-muted rounded-t-lg"></div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{service.title}</CardTitle>
                      <Badge variant="secondary">{service.price}</Badge>
                    </div>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{service.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({service.reviews})
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {service.location}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 text-center">
          <div className="bg-primary/5 rounded-lg p-12">
            <h2 className="text-3xl font-bold mb-6">
              Kan du ikke finne det du leter etter?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Vi har hundrevis av stylister som tilbyr ulike tjenester. Kontakt
              oss så hjelper vi deg med å finne riktig match.
            </p>
            <Button size="lg" asChild>
              <Link href="/contact">Kontakt oss</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
