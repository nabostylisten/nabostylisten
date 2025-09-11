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
      <div className="flex flex-1 flex-col gap-4 p-3 sm:p-4 md:p-6 pt-8 sm:pt-10 md:pt-12">
        <div className="max-w-4xl mx-auto w-full">
          <BlurFade delay={0.1} duration={0.5} inView>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 sm:mb-6">
              <Settings className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
                  Preferanser
                </h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base leading-relaxed">
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
