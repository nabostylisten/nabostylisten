import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { shouldShowDevTools } from "@/lib/dev-utils";
import { isAdmin } from "@/lib/permissions";
import { AdminLayout } from "@/components/admin-layout";
import { DevToolsDashboard } from "@/components/dev-tools/dev-tools-dashboard";
import { BlurFade } from "@/components/magicui/blur-fade";
import { AlertTriangle } from "lucide-react";

export default async function DevToolsPage() {
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

  // Check if user has dev tools access
  if (!shouldShowDevTools(user)) {
    redirect("/admin");
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <BlurFade delay={0.1} duration={0.5} inView>
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Utvikler-verktøy</h1>
            <p className="text-muted-foreground mt-2">
              Test betalingsflyt og cron jobs manuelt i utviklingsmiljø
            </p>

            {process.env.NODE_ENV !== "development" && (
              <div className="mt-4 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                <p className="text-destructive font-medium">
                  <AlertTriangle className="h-4 w-4 mr-2" /> Dette er ikke et
                  utviklingsmiljø. Vær forsiktig med testing.
                </p>
              </div>
            )}
          </div>
        </BlurFade>

        <BlurFade delay={0.15} duration={0.5} inView>
          <DevToolsDashboard />
        </BlurFade>
      </div>
    </AdminLayout>
  );
}
