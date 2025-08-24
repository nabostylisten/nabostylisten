"use client";

import { useState } from "react";
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
import { StylistApplicationForm } from "@/components/forms/stylist-application-form";

export default function BliStylistPage() {
  const [showApplicationForm, setShowApplicationForm] = useState(false);

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

  const handleShowApplicationForm = () => {
    setShowApplicationForm(true);
    // Scroll to form section
    setTimeout(() => {
      document.getElementById("application-form")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  };

  const handleApplicationSuccess = () => {
    setShowApplicationForm(false);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
            <Button size="lg" onClick={handleShowApplicationForm}>
              Søk nå
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

        {/* Application Form Section */}
        {showApplicationForm && (
          <div id="application-form" className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Søk som stylist</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Fyll ut søknadsskjemaet nedenfor for å begynne din reise som
                stylist på Nabostylisten.
              </p>
            </div>
            <StylistApplicationForm onSuccess={handleApplicationSuccess} />
          </div>
        )}

        {/* Pricing Section - TODO */}
        <div className="py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Vår forretningsmodell
            </h2>
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">💼</span>
                  Prising kommer snart
                </CardTitle>
                <CardDescription>
                  Vi jobber med å finne den beste prismodellen for både stylister og kunder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Nabostylisten tar en liten provisjon på 15% av hver booking. Dette dekker:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Sikker betalingsbehandling gjennom Stripe</li>
                  <li>Markedsføring og kundeakkvisisjon</li>
                  <li>Teknisk support og plattformvedlikehold</li>
                  <li>Booking- og kalendersystem</li>
                  <li>Kundeservice og tvistehåndtering</li>
                </ul>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground italic">
                    Detaljert prisinformasjon og betalingsvilkår vil bli publisert snart.
                    Følg med for oppdateringer!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        {!showApplicationForm && (
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
                <Button size="lg" onClick={handleShowApplicationForm}>
                  Søk som stylist
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/contact">Kontakt oss</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
