import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function AdminPage() {
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

  // Get applications count for dashboard
  const { data: applications, error: applicationsError } = await supabase
    .from("applications")
    .select("status")
    .order("created_at", { ascending: false });

  const applicationCounts = {
    applied:
      applications?.filter((app) => app.status === "applied").length || 0,
    pending_info:
      applications?.filter((app) => app.status === "pending_info").length || 0,
    approved:
      applications?.filter((app) => app.status === "approved").length || 0,
    rejected:
      applications?.filter((app) => app.status === "rejected").length || 0,
  };

  const totalApplications = applications?.length || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Administrator Dashboard</h1>
        <p className="text-muted-foreground">
          Velkommen til administrator-panelet for Nabostylisten
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Totale Søknader
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApplications}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nye Søknader</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applicationCounts.applied}
            </div>
            <p className="text-xs text-muted-foreground">
              Venter på gjennomgang
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Godkjente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applicationCounts.approved}
            </div>
            <p className="text-xs text-muted-foreground">
              Stylister på platformen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avviste</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applicationCounts.rejected}
            </div>
            <p className="text-xs text-muted-foreground">Ikke godkjent</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Stylist Søknader</CardTitle>
            <CardDescription>
              Gjennomgå og håndter søknader fra potensielle stylister
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Nye søknader</span>
                <Badge variant="secondary">{applicationCounts.applied}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Venter på mer info</span>
                <Badge variant="outline">
                  {applicationCounts.pending_info}
                </Badge>
              </div>
              <Button asChild className="w-full">
                <Link href="/admin/applications">Se alle søknader</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Oversikt</CardTitle>
            <CardDescription>
              Administrer kategorier og platform-innstillinger
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Tjeneste kategorier</span>
                <Badge variant="outline">Administrer</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Platform innstillinger</span>
                <Badge variant="outline">Konfigurer</Badge>
              </div>
              <Button variant="outline" className="w-full" disabled>
                Kommer snart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Siste Aktivitet</CardTitle>
          <CardDescription>
            Oversikt over nylige handlinger i systemet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Ingen aktivitet å vise ennå</p>
            <p className="text-sm">
              Aktivitet vil vises her når søknader blir behandlet
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
