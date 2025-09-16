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
import { BlurFade } from "@/components/magicui/blur-fade";
import { getPlatformStats } from "@/server/stats.actions";
import { HowItWorks } from "@/components/landing/how-it-works";
import { AboutFounder } from "@/components/landing/about-founder";

const OmOssPage = async () => {
  const statsResult = await getPlatformStats();
  const stats = statsResult.error ? null : statsResult.data;
  const minValue = 10;

  console.log(stats);

  // Helper function to round values based on magnitude
  const roundValue = (value: number) => {
    if (value >= 1000) {
      // Round down to nearest 100 for thousands
      return Math.floor(value / 100) * 100;
    } else if (value >= 100) {
      // Round down to nearest 50 for hundreds
      return Math.floor(value / 50) * 50;
    } else {
      // Round down to nearest 10 for smaller values
      return Math.floor(value / 10) * 10;
    }
  };

  // Calculate rounded stats
  const roundedStylists = stats
    ? Math.max(roundValue(stats.stylists), minValue)
    : 500;
  const roundedCustomers = stats
    ? Math.max(roundValue(stats.customers), minValue)
    : 10000;
  const roundedBookings = stats
    ? Math.max(roundValue(stats.bookings), minValue)
    : 15000;
  const avgRating = stats?.averageRating || 4.8;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-6 lg:px-12">
        <BlurFade duration={0.5} inView>
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
        </BlurFade>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 lg:px-12 bg-muted/30">
        <BlurFade delay={0.1} duration={0.5} inView>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {roundedStylists}+
                </div>
                <div className="text-sm text-muted-foreground">Stylister</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {roundedCustomers}+
                </div>
                <div className="text-sm text-muted-foreground">
                  Fornøyde kunder
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {roundedBookings}+
                </div>
                <div className="text-sm text-muted-foreground">Bookinger</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {avgRating}
                </div>
                <div className="text-sm text-muted-foreground">Rating</div>
              </div>
            </div>
          </div>
        </BlurFade>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6 lg:px-12">
        <BlurFade delay={0.15} duration={0.5} inView>
          <div className="max-w-4xl mx-auto">
            <AboutFounder
              title="Vår misjon"
              description="Vi tror at alle fortjener tilgang til profesjonelle skjønnhetstjenester. Vår misjon er å gjøre det enkelt og trygt å finne kvalifiserte stylister som kan komme til deg eller som du kan besøke på deres salong. Ved å koble sammen kunder og stylister på en digital platform, skaper vi muligheter for både kunder som ønsker kvalitet og stylister som vil vokse sin virksomhet."
              personName="Teamet bak Nabostylisten"
              personTitle="Grunnleggere & Utviklere"
              imageUrl="/landing/founder.webp"
              ctaText="Les mer om oss"
              ctaLink="#values"
              showQuoteIcon={false}
            />
          </div>
        </BlurFade>
      </section>

      {/* Values Section */}
      <section id="values" className="py-20 px-6 lg:px-12 bg-muted/30">
        <BlurFade delay={0.2} duration={0.5} inView>
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
                    Vi verifiserer alle stylister og sikrer at de møter våre
                    høye kvalitetsstandarder.
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
        </BlurFade>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 lg:px-12 container mx-auto">
        <BlurFade delay={0.25} duration={0.5} inView>
          <HowItWorks />
        </BlurFade>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 lg:px-12 bg-muted text-muted-foreground">
        <BlurFade delay={0.3} duration={0.5} inView>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Klar til å komme i gang?
            </h2>
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
        </BlurFade>
      </section>
    </div>
  );
};

export default OmOssPage;
