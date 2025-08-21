"use client";

import { useQuery } from "@tanstack/react-query";
import { getUnreadMessageCount } from "@/server/chat.actions";
import { useAuth } from "@/hooks/use-auth";

export function useUnreadMessages() {
  const { user } = useAuth();

  const {
    data: unreadResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["unread-messages", user?.id],
    queryFn: () => user ? getUnreadMessageCount(user.id) : Promise.resolve({ data: { count: 0 }, error: null }),
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000, // Consider data stale after 20 seconds
  });

  return {
    unreadCount: unreadResponse?.data?.count || 0,
    isLoading,
    error: unreadResponse?.error || error,
  };
}