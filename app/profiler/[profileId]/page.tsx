import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getStylistProfileWithServices } from "@/server/profile.actions";
import { StylistPublicProfile } from "@/components/stylist-public-profile";
import type { Metadata } from "next";
import { companyConfig } from "@/lib/brand";

interface PageProps {
  params: Promise<{ profileId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { profileId } = await params;
  const { data: profileData, error } =
    await getStylistProfileWithServices(profileId);

  if (error || !profileData) {
    return {
      title: `Stylist ikke funnet - ${companyConfig.name}`,
      description:
        "Denne stylisten eksisterer ikke eller er ikke lenger tilgjengelig.",
    };
  }

  const name = profileData.profile.full_name || "Stylist";
  const serviceCount = profileData.services?.length || 0;
  const title = `${name} - Stylist på ${companyConfig.name}`;
  const description = profileData.profile.stylist_details?.bio
    ? profileData.profile.stylist_details?.bio.slice(0, 150) + "..."
    : `Profesjonell stylist ${name} med ${serviceCount} ${serviceCount === 1 ? "tjeneste" : "tjenester"} tilgjengelig på ${companyConfig.name}.`;

  return {
    title,
    description,
    applicationName: companyConfig.name,
    openGraph: {
      title,
      description,
      type: "website",
      url: `/profiler/${profileId}`,
      siteName: companyConfig.name,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { profileId } = await params;
  const supabase = await createClient();

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user is authenticated and owns this profile
  const isOwner = user && user.id === profileId;

  // If user owns this profile, redirect to the profil subpage
  if (isOwner) {
    redirect(`/profiler/${profileId}/profil`);
  }

  // For non-owners, check if this is a stylist profile
  const { data: profileData, error } =
    await getStylistProfileWithServices(profileId);

  if (error || !profileData) {
    // Not a stylist, check if it's a regular customer profile
    const { data: customerProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (!customerProfile) {
      notFound();
    }

    // For customer profiles, show limited info or redirect
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Brukerprofil</h1>
          <p className="text-muted-foreground">
            {customerProfile.full_name || "Ukjent bruker"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Denne profilen er ikke offentlig tilgjengelig.
          </p>
        </div>
      </div>
    );
  }

  // Show stylist profile with services - spread the entire profileData object
  return <StylistPublicProfile {...profileData} />;
}
