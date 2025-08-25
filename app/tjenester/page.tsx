import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Suspense } from "react";
import { getServiceCategoriesWithCounts } from "@/server/service.actions";
import { getStylists } from "@/server/profile.actions";
import { ServicesGridSkeleton } from "@/components/services/services-grid-skeleton";
import { ServiceFilterForm } from "@/components/services/service-filter-form";
import { InfiniteServicesGrid } from "@/components/services/infinite-services-grid";
import type { ServiceSearchParams } from "@/types";
import { searchParamsToFilters } from "@/types";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/magicui/blur-fade";
import { createPageMetadata } from "@/lib/brand";
import type { Metadata } from "next";

export const metadata: Metadata = createPageMetadata('tjenester', { url: '/tjenester' })

interface TjenesterPageProps {
  searchParams: Promise<ServiceSearchParams>;
}

async function FilterFormWrapper() {
  const [categoriesResult, stylistsResult] = await Promise.all([
    getServiceCategoriesWithCounts(),
    getStylists(),
  ]);

  const categories = categoriesResult.error ? [] : categoriesResult.data || [];
  const stylists = stylistsResult.error ? [] : stylistsResult.data || [];

  return (
    <BlurFade delay={0.1} duration={0.5} inView>
      <ServiceFilterForm
        categories={categories}
        stylists={stylists}
        mode="update"
      />
    </BlurFade>
  );
}

function ServicesWithFilters({
  searchParams,
}: {
  searchParams: ServiceSearchParams;
}) {
  const filters = searchParamsToFilters(searchParams);

  return <InfiniteServicesGrid filters={filters} />;
}

export default async function TjenesterPage({
  searchParams,
}: TjenesterPageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <div className="min-h-screen pt-2 pb-12">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Header */}
        <BlurFade duration={0.5} inView>
          <div className="text-center py-8">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">Tjenester</h1>
          </div>
        </BlurFade>

        {/* Filter Section */}
        <div className="max-w-4xl mx-auto mb-8">
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
            <FilterFormWrapper />
          </Suspense>
        </div>

        {/* Services Grid */}
        <div className="py-8">
          <Suspense fallback={<ServicesGridSkeleton count={12} />}>
            <ServicesWithFilters searchParams={resolvedSearchParams} />
          </Suspense>
        </div>
        {/* CTA Section */}
        <BlurFade delay={0.2} duration={0.5} inView>
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
                <Link href="/kontakt">Kontakt oss</Link>
              </Button>
            </div>
          </div>
        </BlurFade>
      </div>
    </div>
  );
}
