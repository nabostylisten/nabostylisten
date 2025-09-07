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
import { StatsSection } from "@/components/landing/stats-section";
import { MediaMentions } from "@/components/landing/media-mentions";
import { FAQPreview } from "@/components/landing/faq-preview";
import { StylistCTA } from "@/components/landing/stylist-cta";
import { brandColors } from "@/lib/brand";
import { cookies } from "next/headers";

async function ServiceFilterSection() {
  const [categoriesResult, stylistsResult] = await Promise.all([
    getServiceCategoriesWithCounts(),
    getStylists(),
  ]);

  const categories = categoriesResult.error ? [] : categoriesResult.data || [];
  const stylists = stylistsResult.error ? [] : stylistsResult.data || [];

  return (
    <BlurFade duration={0.5} inView inViewMargin="-10px">
      <div className="max-w-7xl mx-auto">
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
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          {/* Hero Section */}
          <div className="text-center space-y-8 pt-20">
            <BlurFade duration={0.5} inView>
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold font-fraunces">
                  Nabostylisten
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
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
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Koble deg sammen med profesjonelle stylister for hår, negler,
                  sminke og mer - enten hjemme hos deg eller hos stylisten.
                </p>
              </div>
            </BlurFade>

            <BlurFade delay={0.1} duration={0.5} inView>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/tjenester">Se tjenester</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/bli-stylist">Bli stylist</Link>
                </Button>
              </div>
            </BlurFade>

            {/* Separator */}
            <BlurFade delay={0.12} duration={0.5} inView>
              <div className="flex items-center gap-4">
                <Separator className="flex-1" />
                <span className="text-muted-foreground text-sm font-medium">
                  eller
                </span>
                <Separator className="flex-1" />
              </div>
            </BlurFade>

            {/* Service Filter Form */}
            <div className="pb-8">
              <BlurFade delay={0.15} duration={0.5} inView>
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold font-fraunces mb-4">
                    Søk etter tjenester
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Finn akkurat den tjenesten du leter etter med våre smarte
                    filtre
                  </p>
                </div>
              </BlurFade>
              <Suspense
                fallback={
                  <BlurFade duration={0.5} inView>
                    <Card>
                      <CardContent className="p-6">
                        <div className="animate-pulse space-y-4">
                          <div className="flex gap-4">
                            <div className="flex-1 h-10 bg-muted rounded"></div>
                            <div className="flex-1 h-10 bg-muted rounded"></div>
                          </div>
                          <div className="flex gap-4">
                            <div className="flex-1 h-10 bg-muted rounded"></div>
                            <div className="flex-1 h-10 bg-muted rounded"></div>
                            <div className="flex-1 h-10 bg-muted rounded"></div>
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

          {/* Popular Services Section */}
          <PopularServices />

          {/* How It Works Section */}
          <HowItWorks />

          {/* Media Section */}
          <MediaMentions />

          {/* Stats Section */}
          {/* <StatsSection /> */}

          {/* FAQ Section */}
          <FAQPreview />

          {/* About the Founder Section */}
          <AboutFounder />

          {/* Stylist CTA Section */}
          <StylistCTA />
        </div>
      </div>
    </main>
  );
}
