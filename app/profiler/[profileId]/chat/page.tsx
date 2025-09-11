import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileLayout } from "@/components/profile-layout";
import { ChatPageContent } from "@/components/chat/chat-page-content";

interface ChatPageProps {
  params: Promise<{ profileId: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
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

  return (
    <ProfileLayout profileId={profileId} userRole={profile?.role}>
      <div className="pt-8 sm:pt-12">
        <ChatPageContent
          profileId={profileId}
          userRole={profile?.role === "stylist" ? "stylist" : "customer"}
        />
      </div>
    </ProfileLayout>
  );
}
