"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function checkUserExists(email: string) {
  try {
    const supabase = await createAdminClient();

    // Use admin client to list users with pagination and filter by email
    // Since there's no direct getUserByEmail, we'll filter the results
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000, // Large enough to get all users
    });

    if (error) {
      console.error("Error listing users:", error);
      return { error: "Kunne ikke sjekke bruker", exists: false };
    }

    // Check if any user has the provided email and is confirmed
    const user = data.users.find((user) => 
      user.email === email && 
      user.email_confirmed_at !== null &&
      user.deleted_at === null
    );

    return { exists: !!user, error: null };
  } catch (error) {
    console.error("Error checking user exists:", error);
    return { error: "En feil oppstod ved sjekk av bruker", exists: false };
  }
}
