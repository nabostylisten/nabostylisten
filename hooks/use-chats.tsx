"use client";

import { useQuery } from "@tanstack/react-query";
import { getChatsByProfileId } from "@/server/chat.actions";
import { useAuth } from "@/hooks/use-auth";

export function useChats(profileId?: string) {
  const { user } = useAuth();
  const userId = profileId || user?.id;

  const {
    data: chatsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["chats", userId],
    queryFn: () => userId ? getChatsByProfileId(userId) : Promise.resolve({ data: null, error: "No user ID" }),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // Consider data stale after 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });

  return {
    chats: chatsResponse?.data || [],
    isLoading,
    error: chatsResponse?.error || error,
  };
}