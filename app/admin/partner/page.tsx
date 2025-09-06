import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/permissions";
import { AdminLayout } from "@/components/admin-layout";
import AffiliateTab from "@/components/admin/tabs/affiliate-tab";
import { BlurFade } from "@/components/magicui/blur-fade";

export default async function PartnerPage() {
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
            <h1 className="text-3xl font-bold mb-2">Partner-administrasjon</h1>
            <p className="text-muted-foreground">
              Administrer partner-søknader, koder og provisjoner
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.15} duration={0.5} inView>
          <AffiliateTab />
        </BlurFade>
      </div>
    </AdminLayout>
  );
}
