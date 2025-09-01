import type { User } from "@supabase/supabase-js";

/**
 * Checks if development tools should be visible for the current user
 * Dev tools are visible if:
 * 1. NODE_ENV is development, OR
 * 2. The current user's email is dev@nabostylisten.no
 */
export function shouldShowDevTools(user: User | null): boolean {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isDevUser = user?.email === "dev@nabostylisten.no";
  
  return isDevelopment || isDevUser;
}