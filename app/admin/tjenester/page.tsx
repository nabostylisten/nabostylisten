import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/permissions";
import { AdminLayout } from "@/components/admin-layout";
import { ServiceCategoriesClient } from "./service-categories-client";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default async function AdminTjenesterPage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/auth/login");
  }

  // Get user profile to check role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/auth/login");
  }

  // Check if user is admin
  if (!isAdmin(profile.role)) {
    redirect("/");
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <BlurFade delay={0.1} duration={0.5} inView>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Tjenestekategorier</h1>
            <p className="text-muted-foreground">
              Administrer kategorier for tjenester på plattformen
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.12} duration={0.5} inView>
          <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
            <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-200">
              Hvordan bruke tjenestekategorier
            </AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              <ol className="space-y-2 mt-3">
                <li className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full dark:text-blue-300 dark:bg-blue-900/50 flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    <strong>Opprett hovedkategorier</strong> (f.eks. "Hår", "Negler", "Sminke") ved å klikke "Ny kategori" og la "Overordnet kategori" stå tom
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full dark:text-blue-300 dark:bg-blue-900/50 flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    <strong>Opprett underkategorier</strong> ved å velge en hovedkategori som "Overordnet kategori" (f.eks. "Klipp" under "Hår")
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full dark:text-blue-300 dark:bg-blue-900/50 flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    <strong>Rediger</strong> kategorier ved å klikke på blyant-ikonet
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full dark:text-blue-300 dark:bg-blue-900/50 flex-shrink-0 mt-0.5">
                    4
                  </span>
                  <span>
                    <strong>Slett</strong> kategorier ved å klikke på søppelbøtte-ikonet (sletter også alle underkategorier)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full dark:text-blue-300 dark:bg-blue-900/50 flex-shrink-0 mt-0.5">
                    5
                  </span>
                  <span>
                    Bruk "Utvid alle" / "Skjul alle" for å navigere i kategoritreet
                  </span>
                </li>
              </ol>
            </AlertDescription>
          </Alert>
        </BlurFade>

        <BlurFade delay={0.15} duration={0.5} inView>
          <ServiceCategoriesClient />
        </BlurFade>
      </div>
    </AdminLayout>
  );
}
