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
import Link from "next/link";
import { Calendar, Users, Star, MapPin } from "lucide-react";
import { Suspense } from "react";

async function ServiceFilterSection() {
  const [categoriesResult, stylistsResult] = await Promise.all([
    getServiceCategoriesWithCounts(),
    getStylists(),
  ]);

  const categories = categoriesResult.error ? [] : categoriesResult.data || [];
  const stylists = stylistsResult.error ? [] : stylistsResult.data || [];

  return (
    <div className="max-w-7xl mx-auto">
      <ServiceFilterForm
        categories={categories}
        stylists={stylists}
        mode="redirect"
      />
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          {/* Hero Section */}
          <div className="text-center space-y-8 pt-20">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold">Nabostylisten</h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                Din lokale markedsplass for skjønnhetstjenester
              </p>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Koble deg sammen med profesjonelle stylister for hår, negler,
                sminke og mer - enten hjemme hos deg eller hos stylisten.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/tjenester">Se tjenester</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/bli-stylist">Bli stylist</Link>
              </Button>
            </div>

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
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Søk etter tjenester
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Finn akkurat den tjenesten du leter etter med våre smarte
                  filtre
                </p>
              </div>
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

          {/* Work in Progress Notice */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-center">🚧 Under utvikling</CardTitle>
              <CardDescription className="text-center">
                Vi jobber hardt med å lage den beste opplevelsen for deg
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </main>
  );
}
