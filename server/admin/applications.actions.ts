"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/server/admin/middleware";

export async function getAllApplications() {
  await requireAdmin();
  
  const supabase = await createClient();
  
  try {
    const { data: applications, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching applications:", error);
      throw error;
    }

    return { data: applications || [], error: null };
  } catch (error) {
    console.error("Error in getAllApplications:", error);
    throw error;
  }
}