import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Calendar } from "lucide-react";
import { ProfileLayout } from "@/components/profile-layout";
import { AvailabilitySchedulerWrapper } from "./availability-scheduler-wrapper";

export default async function TilgjengelighetPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const supabase = await createClient();

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Non-owners shouldn't be able to access this subpage
  if (!user || user.id !== profileId) {
    redirect(`/profiler/${profileId}`);
  }

  // Fetch profile data to get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", profileId)
    .single();

  // Only stylists should have access to availability settings
  if (profile?.role !== "stylist") {
    redirect(`/profiler/${profileId}`);
  }

  return (
    <ProfileLayout profileId={profileId} userRole={profile?.role}>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">Tilgjengelighet</h1>
              <p className="text-muted-foreground mt-1">
                Administrer din arbeidskalender og tilgjengelighet
              </p>
            </div>
          </div>

          <AvailabilitySchedulerWrapper stylistId={profileId} />
        </div>
      </div>
    </ProfileLayout>
  );
}
