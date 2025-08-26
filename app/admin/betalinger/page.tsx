import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/permissions";
import { AdminLayout } from "@/components/admin-layout";
import { PaymentsDataTable } from "@/components/admin/payments-data-table";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPaymentsPage() {
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
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <BlurFade duration={0.5} inView>
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Betalinger</h1>
            <p className="text-muted-foreground mt-2">
              Administrer betalinger, refusjon og transaksjoner
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.1} duration={0.5} inView>
          <Card>
            <CardHeader>
              <CardTitle>Betalingsoversikt</CardTitle>
              <CardDescription>
                Se og administrer alle betalinger på plattformen. Bruk filtrene for å finne spesifikke transaksjoner.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentsDataTable />
            </CardContent>
          </Card>
        </BlurFade>
      </div>
    </AdminLayout>
  );
}