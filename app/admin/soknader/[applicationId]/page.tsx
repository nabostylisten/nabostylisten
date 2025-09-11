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
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { ApplicationStatusForm } from "./application-status-form";
import { ChevronLeft } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { BlurFade } from "@/components/magicui/blur-fade";
import { getPublicUrlFromPath } from "@/lib/supabase/storage";
import Image from "next/image";
import { DatabaseTables } from "@/types";

type Application = DatabaseTables["applications"]["Row"];

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

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
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

  // Get application details
  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (applicationError || !application) {
    redirect("/admin/soknader");
  }

  // Get application media/images
  const { data: media } = await supabase
    .from("media")
    .select("*")
    .eq("application_id", applicationId)
    .eq("media_type", "application_image");

  const applicationData = application as Application;

  // Add public URLs for media using the proper storage handling
  const mediaWithUrls =
    media?.map((mediaItem) => ({
      ...mediaItem,
      publicUrl: getPublicUrlFromPath(
        supabase,
        mediaItem.file_path,
        mediaItem.media_type
      ),
    })) || [];

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-12">
        <BlurFade delay={0.1} duration={0.5} inView>
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Link href="/admin/soknader">
                    <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                  <h1 className="text-2xl sm:text-3xl font-bold break-words">Søknadsdetaljer</h1>
                </div>
                <p className="text-muted-foreground break-words">
                  Gjennomgå søknad fra {applicationData.full_name}
                </p>
              </div>
            </div>
          </div>
        </BlurFade>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Application Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <BlurFade delay={0.15} duration={0.5} inView>
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="break-words">{applicationData.full_name}</CardTitle>
                      <CardDescription className="break-words">{applicationData.email}</CardDescription>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(applicationData.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Telefon</p>
                      <p className="text-sm text-muted-foreground">
                        {applicationData.phone_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Fødselsdato</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(applicationData.birth_date), "PPP", {
                          locale: nb,
                        })}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium">Adresse</p>
                    <p className="text-sm text-muted-foreground">
                      {applicationData.street_address}
                      <br />
                      {applicationData.postal_code} {applicationData.city}
                      <br />
                      {applicationData.country}
                    </p>
                    {applicationData.address_nickname && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <strong>Kallenavn:</strong>{" "}
                        {applicationData.address_nickname}
                      </p>
                    )}
                    {applicationData.entry_instructions && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <strong>Inngangsinstruksjoner:</strong>{" "}
                        {applicationData.entry_instructions}
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium">Profesjonell erfaring</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {applicationData.professional_experience}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium">Prisintervall</p>
                    <p className="text-sm text-muted-foreground">
                      {applicationData.price_range_from} -{" "}
                      {applicationData.price_range_to}{" "}
                      {applicationData.price_range_currency}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium">Søknadsdato</p>
                    <p className="text-sm text-muted-foreground">
                      {format(
                        new Date(applicationData.created_at),
                        "PPP 'kl' HH:mm",
                        { locale: nb }
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </BlurFade>

            {/* Application Images */}
            {mediaWithUrls.length > 0 && (
              <BlurFade delay={0.2} duration={0.5} inView>
                <Card>
                  <CardHeader>
                    <CardTitle>Arbeidsprøver</CardTitle>
                    <CardDescription>
                      Bilder av tidligere arbeid
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {mediaWithUrls.map((mediaItem) => (
                        <div
                          key={mediaItem.id}
                          className="aspect-square rounded-lg overflow-hidden relative"
                        >
                          <Image
                            src={mediaItem.publicUrl}
                            alt="Arbeidsprøve"
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </BlurFade>
            )}
          </div>

          {/* Status Management */}
          <BlurFade delay={0.25} duration={0.5} inView>
            <div className="space-y-6">
              <ApplicationStatusForm
                applicationId={applicationData.id}
                currentStatus={applicationData.status}
              />
            </div>
          </BlurFade>
        </div>
      </div>
    </AdminLayout>
  );
}
