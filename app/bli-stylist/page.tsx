import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Users, Calendar, CreditCard } from "lucide-react";
import Link from "next/link";

export default function BliStylistPage() {
  const benefits = [
    {
      icon: <Users className="w-6 h-6 text-primary" />,
      title: "Bygge kunde-base",
      description:
        "Få tilgang til tusenvis av potensielle kunder i ditt område",
    },
    {
      icon: <Calendar className="w-6 h-6 text-primary" />,
      title: "Fleksibel timeplan",
      description: "Bestem selv når du vil jobbe og hvilke tjenester du tilbyr",
    },
    {
      icon: <CreditCard className="w-6 h-6 text-primary" />,
      title: "Sikker betaling",
      description: "Få betalt automatisk gjennom vår sikre betalingsplattform",
    },
  ];

  const requirements = [
    "Gyldig frisørsertifikat eller tilsvarende utdanning",
    "Minimum 2 års erfaring innen skjønnhetsbransjen",
    "Eget utstyr og produkter",
    "Forsikring for selvstendig næringsdrivende",
    "Politiattest (ikke eldre enn 3 måneder)",
  ];

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Hero Section */}
        <div className="text-center py-16">
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">
            Bli en del av
            <span className="text-primary"> Nabostylisten</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Gjør drømmen din til virkelighet og start din egen
            skjønnhetsvirksomhet med oss. Vi gir deg verktøyene du trenger for å
            lykkes.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">Søk nå</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#requirements">Les mer</Link>
            </Button>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="py-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Hvorfor velge Nabostylisten?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">{benefit.icon}</div>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Requirements Section */}
        <div id="requirements" className="py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Krav for å bli stylist
            </h2>
            <Card>
              <CardHeader>
                <CardTitle>Det du trenger</CardTitle>
                <CardDescription>
                  For å sikre høy kvalitet på alle tjenester krever vi følgende:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {requirements.map((requirement, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{requirement}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 text-center">
          <div className="bg-primary/5 rounded-lg p-12">
            <h2 className="text-3xl font-bold mb-6">
              Klar til å starte din reise?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Søk nå og bli en del av Norges ledende platform for
              skjønnhetstjenester. Vi hjelper deg med å bygge din
              drømmevirksomhet.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/auth/sign-up">Søk som stylist</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Kontakt oss</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
