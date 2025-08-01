import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage({
  params,
}: {
  params: { profileId: string };
}) {
  const supabase = await createClient();

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch profile data
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.profileId)
    .single();

  if (error || !profile) {
    redirect("/auth/login");
  }

  // Check if user is authenticated and owns this profile
  const isOwner = user && user.id === params.profileId ? true : false;

  // Non-owners shouldn't be able to access this subpage
  if (!isOwner) {
    redirect(`/profiler/${params.profileId}`);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="max-w-2xl mx-auto w-full">
        <ProfileForm profile={profile} isOwner={isOwner} />
      </div>
    </div>
  );
}
