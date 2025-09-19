import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ServiceFilterForm } from "@/components/services/service-filter-form";
import { getServiceCategoriesWithCounts } from "@/server/service.actions";
import { getStylists } from "@/server/profile.actions";
import Link from "next/link";
import { Suspense } from "react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Highlighter } from "@/components/magicui/highlighter";
import { HowItWorks } from "@/components/landing/how-it-works";
import { AboutFounder } from "@/components/landing/about-founder";
import { PopularServices } from "@/components/landing/popular-services";
import { MediaMentions } from "@/components/landing/media-mentions";
import { FAQPreview } from "@/components/landing/faq-preview";
import { StylistCTA } from "@/components/landing/stylist-cta";
import { brandColors } from "@/lib/brand";

async function ServiceFilterSection() {
  const [categoriesResult, stylistsResult] = await Promise.all([
    getServiceCategoriesWithCounts(),
    getStylists(),
  ]);

  const categories = categoriesResult.error ? [] : categoriesResult.data || [];
  const stylists = stylistsResult.error ? [] : stylistsResult.data || [];

  return (
    <BlurFade duration={0.5} inView inViewMargin="-10px">
      <div className="max-w-4xl mx-auto px-4">
        <ServiceFilterForm
          categories={categories}
          stylists={stylists}
          mode="redirect"
        />
      </div>
    </BlurFade>
  );
}

export default async function Home() {
  return (
    <main className="min-h-screen">
      <div className="w-full">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12 md:py-20 max-w-6xl">
          <div className="text-center space-y-6 md:space-y-8">
            <BlurFade duration={0.5} inView>
              <div className="space-y-4 md:space-y-6">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-fraunces">
                  Nabostylisten
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto px-2">
                  Din lokale markedsplass for{" "}
                  <Highlighter
                    action="underline"
                    color={brandColors.dark.secondary}
                    animationDuration={1500}
                    delay={500}
                  >
                    skjønnhetstjenester
                  </Highlighter>
                </p>
                <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto px-2">
                  Koble deg sammen med profesjonelle stylister for hår, negler,
                  sminke og mer - enten hjemme hos deg eller hos stylisten.
                </p>
              </div>
            </BlurFade>

            <BlurFade delay={0.1} duration={0.5} inView>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link href="/tjenester">Se tjenester</Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="w-full sm:w-auto"
                >
                  <Link href="/bli-stylist">Bli stylist</Link>
                </Button>
              </div>
            </BlurFade>

            {/* Separator */}
            <BlurFade delay={0.12} duration={0.5} inView>
              <div className="flex items-center gap-4 max-w-md mx-auto">
                <Separator className="flex-1" />
                <span className="text-muted-foreground text-sm font-medium px-2">
                  eller
                </span>
                <Separator className="flex-1" />
              </div>
            </BlurFade>

            {/* Service Filter Form */}
            <div>
              <BlurFade delay={0.15} duration={0.5} inView>
                <div className="text-center mb-6 md:mb-8">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-fraunces mb-3 md:mb-4">
                    Søk etter tjenester
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-2">
                    Finn akkurat den tjenesten du leter etter med våre smarte
                    filtre
                  </p>
                </div>
              </BlurFade>
              <Suspense
                fallback={
                  <BlurFade duration={0.5} inView>
                    <Card className="mx-4">
                      <CardContent className="p-4 md:p-6">
                        <div className="animate-pulse space-y-4">
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 h-10 bg-muted rounded"></div>
                            <div className="flex-1 h-10 bg-muted rounded"></div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="h-10 bg-muted rounded"></div>
                            <div className="h-10 bg-muted rounded"></div>
                            <div className="h-10 bg-muted rounded"></div>
                          </div>
                          <div className="h-10 bg-muted rounded"></div>
                        </div>
                      </CardContent>
                    </Card>
                  </BlurFade>
                }
              >
                <ServiceFilterSection />
              </Suspense>
            </div>
          </div>
        </section>

        {/* Content Sections */}
        <div className="space-y-16 md:space-y-24 pb-8">
          {/* Popular Services Section */}
          <section className="container mx-auto px-4 max-w-7xl">
            <PopularServices />
          </section>

          {/* How It Works Section */}
          <section className="container mx-auto px-4 max-w-6xl">
            <HowItWorks />
          </section>

          {/* Media Section */}
          <section className="container mx-auto px-4 max-w-6xl">
            <MediaMentions />
          </section>

          {/* FAQ Section */}
          <section className="container mx-auto px-4 max-w-5xl">
            <FAQPreview />
          </section>

          {/* About the Founder Section */}
          <section className="container mx-auto px-4 max-w-6xl">
            <AboutFounder />
          </section>

          {/* Stylist CTA Section */}
          <section className="container mx-auto px-4 max-w-5xl">
            <StylistCTA />
          </section>
        </div>
      </div>
    </main>
  );
}
