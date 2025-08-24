import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ServiceFilterForm } from "@/components/services/service-filter-form";
import { getServiceCategoriesWithCounts } from "@/server/service.actions";
import { getStylists } from "@/server/profile.actions";
import { getPlatformStats, getPopularServices } from "@/server/stats.actions";
import Link from "next/link";
import {
  Calendar,
  Users,
  Star,
  MapPin,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Package,
  Hash,
} from "lucide-react";
import { Suspense } from "react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Marquee } from "@/components/magicui/marquee";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { Highlighter } from "@/components/magicui/highlighter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { faqCategories, getPopularFAQs } from "@/lib/faq";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { getPublicUrl } from "@/lib/supabase/storage";
import type { PopularService } from "@/server/stats.actions";
import { HowItWorks } from "@/components/landing/how-it-works";
import { AboutFounder } from "@/components/landing/about-founder";

async function ServiceFilterSection() {
  const [categoriesResult, stylistsResult] = await Promise.all([
    getServiceCategoriesWithCounts(),
    getStylists(),
  ]);

  const categories = categoriesResult.error ? [] : categoriesResult.data || [];
  const stylists = stylistsResult.error ? [] : stylistsResult.data || [];

  return (
    <BlurFade duration={0.6} inView inViewMargin="-10px">
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

async function PopularServicesSection() {
  const { data: services } = await getPopularServices(12);

  if (!services || services.length === 0) {
    return null;
  }

  const firstRow = services.slice(0, Math.ceil(services.length / 2));
  const secondRow = services.slice(Math.ceil(services.length / 2));

  const ServiceCard = ({ service }: { service: PopularService }) => {
    const previewImage = service.media?.find((m) => m.is_preview_image);
    const imageUrl = previewImage ? getPublicUrl(previewImage.file_path) : null;
    const category =
      service.service_service_categories?.[0]?.service_categories;

    return (
      <Card className="w-[350px] cursor-pointer hover:shadow-lg transition-shadow">
        {imageUrl && (
          <div className="relative h-48 w-full">
            <Image
              src={imageUrl}
              alt={service.title}
              fill
              className="object-cover rounded-t-lg"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-1">
                {service.title}
              </CardTitle>
              {category && (
                <Badge variant="outline" className="mt-1">
                  {category.name}
                </Badge>
              )}
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">{service.price} kr</p>
              <p className="text-xs text-muted-foreground">
                {service.duration_minutes} min
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">
                {(service as any).average_rating > 0
                  ? ((service as any).average_rating as number).toFixed(1)
                  : "Ny"}
              </span>
              {(service as any).total_reviews > 0 && (
                <span className="text-sm text-muted-foreground">
                  ({(service as any).total_reviews})
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {service.profiles?.business_name || service.profiles?.full_name}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
      <Marquee pauseOnHover className="[--duration:40s]">
        {firstRow.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:40s]">
        {secondRow.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
    </div>
  );
}

async function StatsSection() {
  const { data: stats } = await getPlatformStats();

  if (!stats) {
    return null;
  }

  const statItems = [
    {
      label: "Stylister",
      value: stats.stylists,
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: "Tjenester",
      value: stats.services,
      icon: <Package className="w-5 h-5" />,
    },
    {
      label: "Kategorier",
      value: stats.categories,
      icon: <Hash className="w-5 h-5" />,
    },
    // Bookinger - commented out for now
    // {
    //   label: "Bookinger",
    //   value: stats.bookings,
    //   icon: <Calendar className="w-5 h-5" />,
    // },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((stat, index) => (
        <BlurFade key={stat.label} delay={index * 0.1} inView>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <div className="text-primary">{stat.icon}</div>
              </div>
              <div className="text-3xl font-bold">
                <NumberTicker value={stat.value} />
              </div>
            </CardContent>
          </Card>
        </BlurFade>
      ))}
    </div>
  );
}

export default async function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          {/* Hero Section */}
          <div className="text-center space-y-8 pt-20">
            <BlurFade duration={0.8} inView>
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold font-fraunces">
                  Nabostylisten
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                  Din lokale markedsplass for{" "}
                  <Highlighter action="underline" color="#9b8cc8">
                    skjønnhetstjenester
                  </Highlighter>
                </p>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Koble deg sammen med profesjonelle stylister for hår, negler,
                  sminke og mer - enten hjemme hos deg eller hos stylisten.
                </p>
              </div>
            </BlurFade>

            <BlurFade delay={0.2} duration={0.8} inView>
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
            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-muted-foreground text-sm font-medium">
                eller
              </span>
              <Separator className="flex-1" />
            </div>

            {/* Service Filter Form */}
            <div className="pb-8">
              <BlurFade delay={0.3} duration={0.8} inView>
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
                }
              >
                <ServiceFilterSection />
              </Suspense>
            </div>
          </div>

          {/* Popular Services Section */}
          <BlurFade delay={0.4} duration={0.8} inView>
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold font-fraunces mb-4">
                  Populære tjenester
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Oppdag våre mest etterspurte og høyest rangerte tjenester
                </p>
              </div>
              <Suspense
                fallback={
                  <div className="flex gap-4 justify-center">
                    {[1, 2, 3].map((i) => (
                      <Skeleton
                        key={i}
                        className="w-[350px] h-[300px] rounded-lg"
                      />
                    ))}
                  </div>
                }
              >
                <PopularServicesSection />
              </Suspense>
            </div>
          </BlurFade>

          {/* How It Works Section */}
          <BlurFade delay={0.5} duration={0.8} inView>
            <div className="space-y-8">
              <HowItWorks />
            </div>
          </BlurFade>

          {/* Media Section */}
          <BlurFade delay={0.6} duration={0.8} inView>
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold font-fraunces mb-4">
                  Som omtalt i
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Nabostylisten har blitt omtalt i flere av Norges ledende
                  medier
                </p>
              </div>
              <div className="flex justify-center items-center gap-8 lg:gap-16 flex-wrap">
                <Image
                  src="/publicity/e24.png"
                  alt="E24"
                  width={120}
                  height={60}
                  className="opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                />
                <Image
                  src="/publicity/elle.png"
                  alt="Elle"
                  width={100}
                  height={60}
                  className="opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                />
                <Image
                  src="/publicity/melk-og-honning.png"
                  alt="Melk og Honning"
                  width={140}
                  height={60}
                  className="opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                />
              </div>
            </div>
          </BlurFade>

          {/* Stats Section */}
          <BlurFade delay={0.7} duration={0.8} inView>
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold font-fraunces mb-4">
                  Se vårt voksende fellesskap
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Se hvordan Nabostylisten vokser og hjelper tusenvis av
                  nordmenn
                </p>
              </div>
              <Suspense
                fallback={
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-[120px] rounded-lg" />
                    ))}
                  </div>
                }
              >
                <StatsSection />
              </Suspense>
            </div>
          </BlurFade>

          {/* FAQ Section */}
          <BlurFade delay={0.8} duration={0.8} inView>
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold font-fraunces mb-4">
                  Ofte stilte spørsmål
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Få svar på de vanligste spørsmålene om Nabostylisten
                </p>
              </div>
              <Card>
                <CardContent className="p-6">
                  <Tabs defaultValue="booking" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="booking">Kunde</TabsTrigger>
                      <TabsTrigger value="stylist">Stylist</TabsTrigger>
                      <TabsTrigger value="general">Generelt</TabsTrigger>
                    </TabsList>
                    {["booking", "stylist", "general"].map((category) => (
                      <TabsContent
                        key={category}
                        value={category}
                        className="space-y-4 mt-6"
                      >
                        {getPopularFAQs(category, 3).map((faq) => (
                          <Card key={faq.id}>
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <CardTitle className="text-left text-base">
                                        {faq.question}
                                      </CardTitle>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {
                                          faqCategories.find(
                                            (cat) => cat.id === faq.category
                                          )?.name
                                        }
                                      </Badge>
                                    </div>
                                    <ChevronDown className="h-4 w-4 transition-transform" />
                                  </div>
                                </CardHeader>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <CardContent className="pt-0">
                                  <p className="text-muted-foreground leading-relaxed">
                                    {faq.answer}
                                  </p>
                                </CardContent>
                              </CollapsibleContent>
                            </Collapsible>
                          </Card>
                        ))}
                      </TabsContent>
                    ))}
                  </Tabs>
                  <div className="mt-6 text-center">
                    <Button variant="outline" asChild>
                      <Link href="/faq">
                        Se alle spørsmål
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </BlurFade>

          {/* About the Founder Section */}
          <BlurFade delay={0.9} duration={0.8} inView>
            <div className="space-y-8">
              <AboutFounder />
            </div>
          </BlurFade>

          {/* Stylist CTA Section */}
          <BlurFade delay={1.0} duration={0.8} inView>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-12 text-center">
                <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-3xl md:text-4xl font-bold font-fraunces mb-4">
                  Er du vår neste stylist?
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                  Bli en del av Norges raskest voksende plattform for
                  skjønnhetstjenester. Start din egen virksomhet med{" "}
                  <Highlighter action="underline" color="#4a7c4a">
                    full fleksibilitet
                  </Highlighter>{" "}
                  og støtte fra oss.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild>
                    <Link href="/bli-stylist">
                      Søk som stylist
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/faq#stylist">Les mer om å bli stylist</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </BlurFade>
        </div>
      </div>
    </main>
  );
}
