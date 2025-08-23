"use server";

import { createClient } from "@/lib/supabase/server";
import { subscribeToNewsletter } from "@/lib/newsletter";
import type { Database } from "@/types/database.types";

type UserPreferences = Database["public"]["Tables"]["user_preferences"]["Row"];
type UserPreferencesInsert =
  Database["public"]["Tables"]["user_preferences"]["Insert"];
type UserPreferencesUpdate =
  Database["public"]["Tables"]["user_preferences"]["Update"];

export interface ActionResult<T> {
  data?: T;
  error?: string;
}

// Get user preferences with defaults if none exist
export async function getUserPreferences(
  userId: string,
): Promise<ActionResult<UserPreferences>> {
  try {
    const supabase = await createClient();

    // First try to get existing preferences
    const { data: preferences, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
      return { error: `Error fetching preferences: ${error.message}` };
    }

    // If no preferences exist, create default ones
    if (!preferences) {
      const defaultPreferences: UserPreferencesInsert = {
        user_id: userId,
        // All defaults are set in the database schema
      };

      const { data: newPreferences, error: createError } = await supabase
        .from("user_preferences")
        .insert(defaultPreferences)
        .select()
        .single();

      if (createError) {
        return { error: `Error creating preferences: ${createError.message}` };
      }

      return { data: newPreferences };
    }

    return { data: preferences };
  } catch (error) {
    return {
      error: `Unexpected error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

// Update user preferences
export async function updateUserPreferences(
  userId: string,
  updates: Partial<UserPreferencesUpdate>,
): Promise<ActionResult<UserPreferences>> {
  try {
    const supabase = await createClient();

    // Get current user to check permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return { error: "Unauthorized: Can only update your own preferences" };
    }

    // First ensure preferences exist
    const { data: existingPrefs } = await getUserPreferences(userId);
    if (!existingPrefs) {
      return { error: "Failed to initialize preferences" };
    }

    // Update preferences
    const { data: updatedPreferences, error } = await supabase
      .from("user_preferences")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      return { error: `Error updating preferences: ${error.message}` };
    }

    // Sync newsletter subscription with Brevo if newsletter_subscribed changed
    if (updates.newsletter_subscribed !== undefined && updatedPreferences) {
      try {
        if (updates.newsletter_subscribed) {
          // Get user profile for name
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", userId)
            .single();

          if (profile?.email) {
            const nameParts = profile.full_name?.split(" ") || [];
            await subscribeToNewsletter(
              profile.email,
              nameParts[0] || undefined,
              nameParts.slice(1).join(" ") || undefined,
            );
          }
        }
        // Note: We don't unsubscribe from Brevo when newsletter_subscribed is false
        // as the user might want to remain in the system for other communications
      } catch (newsletterError) {
        // Log the error but don't fail the preferences update
        console.error(
          "Error syncing newsletter subscription:",
          newsletterError,
        );
      }
    }

    return { data: updatedPreferences };
  } catch (error) {
    return {
      error: `Unexpected error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

// Toggle a specific preference
export async function toggleUserPreference(
  userId: string,
  preferenceKey: keyof UserPreferencesUpdate,
  value: boolean,
): Promise<ActionResult<UserPreferences>> {
  try {
    const updates: Partial<UserPreferencesUpdate> = {
      [preferenceKey]: value,
    };

    return await updateUserPreferences(userId, updates);
  } catch (error) {
    return {
      error: `Unexpected error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

// Check if user should receive a specific type of notification
export async function shouldReceiveNotification(
  userId: string,
  notificationType: keyof UserPreferences,
): Promise<boolean> {
  try {
    const { data: preferences } = await getUserPreferences(userId);
    if (!preferences) return false;

    return Boolean(preferences[notificationType]);
  } catch (error) {
    console.error("Error checking notification preference:", error);
    return false; // Default to not sending notification on error
  }
}
