import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/permissions";
import { AdminLayout } from "@/components/admin-layout";
import { ServiceCategoriesClient } from "./service-categories-client";
import { BlurFade } from "@/components/magicui/blur-fade";

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

  // Fetch all service categories
  const { data: categories } = await supabase
    .from("service_categories")
    .select("*")
    .order("name");

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

        <BlurFade delay={0.15} duration={0.5} inView>
          <ServiceCategoriesClient categories={categories || []} />
        </BlurFade>
      </div>
    </AdminLayout>
  );
}
