import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { ProfileLayout } from "@/components/profile-layout";
import { PreferencesForm } from "@/components/preferences";
import { BlurFade } from "@/components/magicui/blur-fade";

export default async function PreferansePage({
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

  if (!profile) {
    redirect(`/profiler/${profileId}`);
  }

  return (
    <ProfileLayout profileId={profileId} userRole={profile.role}>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-12">
        <div className="max-w-4xl mx-auto w-full">
          <BlurFade delay={0.1} duration={0.5} inView>
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-8 h-8" />
              <div>
                <h1 className="text-3xl font-bold">Preferanser</h1>
                <p className="text-muted-foreground mt-1">
                  Administrer dine varsler og kommunikasjonsinnstillinger
                </p>
              </div>
            </div>
          </BlurFade>

          <BlurFade delay={0.15} duration={0.5} inView>
            <PreferencesForm userId={profileId} userRole={profile.role} />
          </BlurFade>
        </div>
      </div>
    </ProfileLayout>
  );
}
