"use server";

import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: No user found");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,full_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Unauthorized: Profile not found");
  }

  if (profile.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }

  return { user, profile };
}

export type AdminContext = Awaited<ReturnType<typeof requireAdmin>>;
