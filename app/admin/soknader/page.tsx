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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

type Application = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  city: string;
  status: "applied" | "pending_info" | "rejected" | "approved";
  created_at: string;
  professional_experience: string;
  price_range_from: number;
  price_range_to: number;
  price_range_currency: string;
};

const getStatusBadge = (status: Application["status"]) => {
  const variants = {
    applied: "secondary",
    pending_info: "outline",
    approved: "default",
    rejected: "destructive",
  } as const;

  const labels = {
    applied: "Ny søknad",
    pending_info: "Venter på info",
    approved: "Godkjent",
    rejected: "Avvist",
  };

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
};

export default async function ApplicationsPage() {
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

  // Get all applications
  const { data: applications, error: applicationsError } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (applicationsError) {
    console.error("Error fetching applications:", applicationsError);
  }

  const applicationsData = applications || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Stylist Søknader</h1>
            <p className="text-muted-foreground">
              Gjennomgå og håndter søknader fra potensielle stylister
            </p>
          </div>
          <Button asChild>
            <Link href="/admin">← Tilbake til Dashboard</Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {
                applicationsData.filter((app) => app.status === "applied")
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">Nye søknader</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {
                applicationsData.filter((app) => app.status === "pending_info")
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">Venter på info</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {
                applicationsData.filter((app) => app.status === "approved")
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">Godkjente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {
                applicationsData.filter((app) => app.status === "rejected")
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">Avviste</p>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alle Søknader</CardTitle>
          <CardDescription>
            {applicationsData.length} søknader totalt
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applicationsData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Ingen søknader funnet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applicationsData.map((application: Application) => (
                <div
                  key={application.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">
                          {application.full_name}
                        </h3>
                        {getStatusBadge(application.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <p>
                            <strong>E-post:</strong> {application.email}
                          </p>
                          <p>
                            <strong>Telefon:</strong> {application.phone_number}
                          </p>
                          <p>
                            <strong>By:</strong> {application.city}
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>Prisintervall:</strong>{" "}
                            {application.price_range_from} -{" "}
                            {application.price_range_to}{" "}
                            {application.price_range_currency}
                          </p>
                          <p>
                            <strong>Søknadsdato:</strong>{" "}
                            {format(new Date(application.created_at), "PPP", {
                              locale: nb,
                            })}
                          </p>
                        </div>
                      </div>

                      {application.professional_experience && (
                        <div className="mt-3">
                          <p className="text-sm">
                            <strong>Erfaring:</strong>{" "}
                            {application.professional_experience}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button asChild size="sm">
                        <Link href={`/admin/soknader/${application.id}`}>
                          Se detaljer
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
