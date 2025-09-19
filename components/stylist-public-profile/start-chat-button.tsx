"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/auth-dialog";
import { MessageCircle } from "lucide-react";
import { getChatByParticipants } from "@/server/chat.actions";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface StartChatButtonProps {
  stylistId: string;
  stylistName: string;
}

export function StartChatButton({ stylistId, stylistName }: StartChatButtonProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleStartChat = async () => {
    // If user is not authenticated, show auth dialog
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    // User is authenticated, create or get chat
    setIsLoading(true);
    try {
      const { data: chat, error } = await getChatByParticipants(
        user.id, // Customer is the current user
        stylistId // Stylist from the profile
      );

      if (error) {
        toast.error("Kunne ikke starte samtale. Prøv igjen.");
        return;
      }

      if (chat) {
        // Navigate to the chat
        router.push(`/chat/${chat.id}`);
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Noe gikk galt. Prøv igjen senere.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleStartChat}
        disabled={loading || isLoading}
        size="lg"
        className="w-full"
      >
        <MessageCircle className="mr-2 h-5 w-5" />
        {isLoading ? "Starter samtale..." : "Chat med stylist"}
      </Button>

      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        redirectTo={`/profiler/${stylistId}`}
        initialMode="login"
        labels={{
          loginTitle: "Logg inn for å chatte",
          loginDescription: `Logg inn for å starte en samtale med ${stylistName}`,
          signupTitle: "Opprett konto for å chatte",
          signupDescription: `Opprett en konto for å starte en samtale med ${stylistName}`,
        }}
      />
    </>
  );
}