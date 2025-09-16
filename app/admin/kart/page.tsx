import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/permissions";
import { AdminLayout } from "@/components/admin-layout";
import { AdminMapView } from "@/components/admin/admin-map-view";
import { BlurFade } from "@/components/magicui/blur-fade";

export default async function AdminKartPage() {
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
      <div className="container mx-auto px-4 py-12">
        <BlurFade delay={0.1} duration={0.5} inView>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Geografisk oversikt</h1>
            <p className="text-muted-foreground">
              Kart over alle brukere og deres adresser på plattformen
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.12} duration={0.5} inView>
          <div className="h-[calc(100vh-16rem)]">
            <AdminMapView />
          </div>
        </BlurFade>
      </div>
    </AdminLayout>
  );
}
