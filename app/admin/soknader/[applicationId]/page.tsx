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

type Application = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  city: string;
  country: string;
  street_address: string;
  postal_code: string;
  address_nickname: string | null;
  entry_instructions: string | null;
  birth_date: string;
  status: "applied" | "pending_info" | "rejected" | "approved";
  created_at: string;
  professional_experience: string;
  price_range_from: number;
  price_range_to: number;
  price_range_currency: string;
  user_id: string | null;
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

export default async function ApplicationDetailPage({
  params,
}: {
  params: { applicationId: string };
}) {
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
    .eq("id", params.applicationId)
    .single();

  if (applicationError || !application) {
    redirect("/admin/soknader");
  }

  // Get application media/images
  const { data: media } = await supabase
    .from("media")
    .select("*")
    .eq("application_id", params.applicationId)
    .eq("media_type", "application_image");

  const applicationData = application as Application;
  const mediaData = media || [];

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Søknadsdetaljer</h1>
              <p className="text-muted-foreground">
                Gjennomgå søknad fra {applicationData.full_name}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Application Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{applicationData.full_name}</CardTitle>
                    <CardDescription>{applicationData.email}</CardDescription>
                  </div>
                  {getStatusBadge(applicationData.status)}
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

            {/* Application Images */}
            {mediaData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Arbeidsprøver</CardTitle>
                  <CardDescription>Bilder av tidligere arbeid</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mediaData.map((media) => (
                      <div
                        key={media.id}
                        className="aspect-square rounded-lg overflow-hidden"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${media.file_path}`}
                          alt="Arbeidsprøve"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Status Management */}
          <div className="space-y-6">
            <ApplicationStatusForm
              applicationId={applicationData.id}
              currentStatus={applicationData.status}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
