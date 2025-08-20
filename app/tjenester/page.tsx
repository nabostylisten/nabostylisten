import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Filter } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { getServiceCategoriesWithCounts } from "@/server/service.actions";
import { getStylists } from "@/server/profile.actions";
import { ServicesGridSkeleton } from "@/components/services/services-grid-skeleton";
import { ServiceFilterForm } from "@/components/services/service-filter-form";
import { InfiniteServicesGrid } from "@/components/services/infinite-services-grid";
import type { ServiceSearchParams } from "@/types";
import { searchParamsToFilters } from "@/types";

interface TjenesterPageProps {
  searchParams: Promise<ServiceSearchParams>;
}

async function SearchFormWrapper() {
  const [categoriesResult, stylistsResult] = await Promise.all([
    getServiceCategoriesWithCounts(),
    getStylists(),
  ]);

  const categories = categoriesResult.error ? [] : categoriesResult.data || [];
  const stylists = stylistsResult.error ? [] : stylistsResult.data || [];

  return <ServiceFilterForm categories={categories} stylists={stylists} />;
}

async function CategoriesSection() {
  const { data: categories, error } = await getServiceCategoriesWithCounts();

  if (error || !categories) {
    return (
      <div className="text-center text-muted-foreground">
        Kunne ikke laste kategorier
      </div>
    );
  }

  // Filter to only show main categories (no parent_category_id) with services
  const mainCategories = categories
    .filter((cat) => !cat.parent_category_id && cat.service_count > 0)
    .slice(0, 5);

  console.log(mainCategories);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {mainCategories.map((category) => (
        <Link key={category.id} href={`/tjenester?category=${category.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
              <p className="text-sm text-muted-foreground">
                {category.service_count} tjenester
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
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
                    </div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <SearchFormWrapper />
          </Suspense>
        </div>
        {/* Categories Section */}
        <div className="py-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Populære kategorier
          </h2>
          <Suspense
            fallback={
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6 text-center">
                      <div className="h-6 bg-muted rounded mb-2"></div>
                      <div className="h-4 bg-muted rounded w-2/3 mx-auto"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            }
          >
            <CategoriesSection />
          </Suspense>
        </div>
        {/* Featured Services */}
        <div className="py-16">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">
              {resolvedSearchParams.search ||
              resolvedSearchParams.category ||
              resolvedSearchParams.location
                ? "Søkeresultater"
                : "Utvalgte tjenester"}
            </h2>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtre
            </Button>
          </div>

          <Suspense fallback={<ServicesGridSkeleton count={12} />}>
            <ServicesWithFilters searchParams={resolvedSearchParams} />
          </Suspense>
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
              <Link href="/kontakt">Kontakt oss</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
