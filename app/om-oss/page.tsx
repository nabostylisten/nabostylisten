import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, Heart, Users, Star } from "lucide-react";

const OmOssPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            Om Nabostylisten
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">
            Vi kobler deg sammen med{" "}
            <span className="text-primary">Norges beste stylister</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Nabostylisten er Norges ledende platform for å booke
            skjønnhetstjenester. Vi gjør det enkelt å finne og booke
            kvalifiserte stylister enten hjemme eller på salong.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/tjenester">Utforsk tjenester</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/bli-stylist">Bli stylist</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 lg:px-12 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Stylister</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                10,000+
              </div>
              <div className="text-sm text-muted-foreground">
                Fornøyde kunder
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">50+</div>
              <div className="text-sm text-muted-foreground">Byer</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">4.8</div>
              <div className="text-sm text-muted-foreground">
                Gjennomsnittlig rating
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Vår misjon</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Vi tror at alle fortjener tilgang til profesjonelle
                skjønnhetstjenester. Vår misjon er å gjøre det enkelt og trygt å
                finne kvalifiserte stylister som kan komme til deg eller som du
                kan besøke på deres salong.
              </p>
              <p className="text-lg text-muted-foreground">
                Ved å koble sammen kunder og stylister på en digital platform,
                skaper vi muligheter for både kunder som ønsker kvalitet og
                stylister som vil vokse sin virksomhet.
              </p>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center">
                <Heart className="w-24 h-24 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6 lg:px-12 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Våre verdier</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Vi bygger vår platform på grunnleggende verdier som sikrer beste
              opplevelse for både kunder og stylister.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Kvalitet</CardTitle>
                <CardDescription>
                  Vi verifiserer alle stylister og sikrer at de møter våre høye
                  kvalitetsstandarder.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Fellesskap</CardTitle>
                <CardDescription>
                  Vi bygger et støttende miljø hvor stylister kan vokse og
                  kunder kan finne sine favoritter.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Opplevelse</CardTitle>
                <CardDescription>
                  Vi fokuserer på å skape en sømløs og minneverdig opplevelse
                  for alle brukere.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Slik fungerer det</h2>
            <p className="text-lg text-muted-foreground">
              Tre enkle steg til din perfekte skjønnhetsopplevelse
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Finn stylist</h3>
              <p className="text-muted-foreground">
                Søk etter tjenester i ditt område og finn stylister som passer
                dine behov.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Book time</h3>
              <p className="text-muted-foreground">
                Velg tid og dato som passer deg, og betal trygt gjennom vår
                platform.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Nyt opplevelsen</h3>
              <p className="text-muted-foreground">
                Møt stylisten hjemme eller på salong og nyt din
                skjønnhetsopplevelse.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 lg:px-12 bg-muted text-muted-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Klar til å komme i gang?</h2>
          <p className="text-lg mb-8 opacity-90">
            Bli med i Norges største community av stylister og kunder
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/tjenester">Utforsk tjenester</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/bli-stylist">Bli stylist</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OmOssPage;
