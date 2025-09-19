import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ProfileLayout } from "@/components/profile-layout";
import { getChatMessages } from "@/server/chat.actions";
import { ChatContent } from "@/components/chat-content";
import { BlurFade } from "@/components/magicui/blur-fade";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get user profile with role information
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  // Get chat and validate access
  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select(
      `
      id,
      customer_id,
      stylist_id,
      created_at,
      updated_at,
      customer:profiles!customer_id (
        id,
        full_name
      ),
      stylist:profiles!stylist_id (
        id,
        full_name
      )
    `
    )
    .eq("id", chatId)
    .single();

  if (chatError || !chat) {
    notFound();
  }

  // Validate user is participant
  const hasAccess = chat.customer_id === user.id || chat.stylist_id === user.id;

  if (!hasAccess && userProfile?.role !== "admin") {
    notFound();
  }

  // Determine user role in this chat
  const isCustomer = chat.customer_id === user.id;
  const partner = isCustomer ? chat.stylist : chat.customer;

  // Get chat messages
  const { data: messages, error: messagesError } =
    await getChatMessages(chatId);

  return (
    <ProfileLayout profileId={user.id} userRole={userProfile?.role}>
      <div className="space-y-6 pt-12">
        <BlurFade delay={0.1} duration={0.5} inView>
          <ChatContent
            chatId={chatId}
            customerId={chat.customer_id}
            stylistId={chat.stylist_id}
            currentUserId={user.id}
            currentUserName={userProfile?.full_name || "Ukjent bruker"}
            partnerName={partner?.full_name || "Ukjent bruker"}
            initialMessages={messages || []}
            messagesError={messagesError}
          />
        </BlurFade>
      </div>
    </ProfileLayout>
  );
}
