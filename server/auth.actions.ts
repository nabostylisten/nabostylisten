"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function checkUserExists(email: string) {
  try {
    const supabase = await createAdminClient();

    // Use admin client to check if user exists
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      return { error: "Kunne ikke sjekke bruker", exists: false };
    }

    // Check if any user has the provided email
    const userExists = data.users.some((user) => user.email === email);

    return { exists: userExists, error: null };
  } catch (error) {
    console.error(error);
    return { error: "En feil oppstod ved sjekk av bruker", exists: false };
  }
}
