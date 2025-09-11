import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Calendar, Info } from "lucide-react";
import { ProfileLayout } from "@/components/profile-layout";
import { AvailabilitySchedulerWrapper } from "./availability-scheduler-wrapper";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      <div className="flex flex-1 flex-col gap-4 p-4 pt-12">
        <div className="max-w-6xl mx-auto w-full">
          <BlurFade delay={0.1} duration={0.5} inView>
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-8 h-8" />
              <div>
                <h1 className="text-3xl font-bold">Tilgjengelighet</h1>
                <p className="text-muted-foreground mt-1">
                  Administrer din arbeidskalender og tilgjengelighet
                </p>
              </div>
            </div>
          </BlurFade>

          <BlurFade delay={0.15} duration={0.5} inView>
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Kalenderen er ikke optimalisert for mobile enheter. For beste
                brukeropplevelse, anbefaler vi å bruke en datamaskin.
              </AlertDescription>
            </Alert>
          </BlurFade>

          <BlurFade delay={0.2} duration={0.5} inView>
            <AvailabilitySchedulerWrapper stylistId={profileId} />
          </BlurFade>
        </div>
      </div>
    </ProfileLayout>
  );
}
