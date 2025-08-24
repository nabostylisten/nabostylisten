"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { subscribeToNewsletter, initializeBrevoClient, addContactToBrevo } from "@/lib/newsletter";
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
        } else {
          // User unsubscribed from newsletter - remove from Brevo
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", userId)
            .single();

          if (profile?.email) {
            await unsubscribeFromNewsletter(profile.email);
          }
        }
      } catch (newsletterError) {
        // Log the error but don't fail the preferences update
        console.error(
          "Error syncing newsletter subscription:",
          newsletterError,
        );
      }
    }

    // Sync marketing emails with Brevo if marketing_emails changed
    if (updates.marketing_emails !== undefined && updatedPreferences) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", userId)
          .single();

        if (profile?.email) {
          if (updates.marketing_emails) {
            // Subscribe to marketing emails
            await subscribeToMarketingEmails(profile.email, profile.full_name || undefined);
          } else {
            // Unsubscribe from marketing emails  
            await unsubscribeFromMarketingEmails(profile.email);
          }
        }
      } catch (marketingError) {
        // Log the error but don't fail the preferences update
        console.error(
          "Error syncing marketing email subscription:",
          marketingError,
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

/**
 * Server-side function to check notification preferences using service client
 * This bypasses RLS policies and should only be used in server actions for 
 * cross-user notification checks (e.g., checking stylist preferences when customer creates review)
 */
export async function shouldReceiveNotificationServerSide(
  userId: string,
  notificationType: keyof UserPreferences,
): Promise<boolean> {
  try {
    const serviceClient = createServiceClient();
    
    const { data: preferences, error } = await serviceClient
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !preferences) {
      console.error(`Failed to fetch preferences for user ${userId}:`, error);
      return false;
    }

    return Boolean(preferences[notificationType]);
  } catch (error) {
    console.error("Error checking notification preference (server-side):", error);
    return false; // Default to not sending notification on error
  }
}

// =============== NEWSLETTER & MARKETING EMAIL MANAGEMENT ===============

/**
 * Subscribe user to newsletter automatically after signup
 * This should be called BEFORE redirecting the user after successful signup
 */
export async function subscribeUserToNewsletterAfterSignup(
  userId: string,
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();

    // Get user preferences first to check if newsletter_subscribed is true
    const { data: preferences } = await getUserPreferences(userId);
    if (!preferences?.newsletter_subscribed) {
      return { data: undefined }; // User doesn't want newsletter, skip
    }

    // Get user profile for email and name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single();

    if (!profile?.email) {
      return { error: "User email not found" };
    }

    const nameParts = profile.full_name?.split(" ") || [];
    await subscribeToNewsletter(
      profile.email,
      nameParts[0] || undefined,
      nameParts.slice(1).join(" ") || undefined,
    );

    return { data: undefined };
  } catch (error) {
    return {
      error: `Error subscribing to newsletter: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Unsubscribe user from newsletter
 */
export async function unsubscribeFromNewsletter(
  email: string,
): Promise<void> {
  try {
    const contactsApi = initializeBrevoClient();
    await contactsApi.deleteContact(email);
    console.log(`Successfully unsubscribed ${email} from newsletter`);
  } catch (error) {
    console.error(`Error unsubscribing ${email} from newsletter:`, error);
    // Don't throw - we don't want to fail preference updates for Brevo errors
  }
}

/**
 * Subscribe user to marketing emails
 * This is separate from newsletter and might use different Brevo lists
 */
export async function subscribeToMarketingEmails(
  email: string,
  fullName?: string,
): Promise<void> {
  try {
    const nameParts = fullName?.split(" ") || [];
    await addContactToBrevo({
      email,
      firstName: nameParts[0] || undefined,
      lastName: nameParts.slice(1).join(" ") || undefined,
      attributes: {
        SOURCE: "marketing_preference",
        MARKETING_SUBSCRIBED_AT: new Date().toISOString(),
        MARKETING_EMAILS: "true",
      },
    });
    console.log(`Successfully subscribed ${email} to marketing emails`);
  } catch (error) {
    console.error(`Error subscribing ${email} to marketing emails:`, error);
    throw error; // Let the caller handle this error
  }
}

/**
 * Unsubscribe user from marketing emails
 * We update the contact attributes instead of deleting to preserve other subscriptions
 */
export async function unsubscribeFromMarketingEmails(
  email: string,
): Promise<void> {
  try {
    const contactsApi = initializeBrevoClient();
    
    // Update contact attributes to mark as unsubscribed from marketing
    await contactsApi.updateContact(email, {
      attributes: {
        MARKETING_EMAILS: "false",
        MARKETING_UNSUBSCRIBED_AT: new Date().toISOString(),
      },
    });
    
    console.log(`Successfully unsubscribed ${email} from marketing emails`);
  } catch (error) {
    console.error(`Error unsubscribing ${email} from marketing emails:`, error);
    // Don't throw - we don't want to fail preference updates for Brevo errors
  }
}

// =============== SMS NOTIFICATIONS (FUTURE IMPLEMENTATION) ===============

/**
 * Subscribe user to promotional SMS
 * TODO: Implement SMS service integration (likely Twilio)
 */
export async function subscribeToPromotionalSMS(
  phoneNumber: string,
  userId: string,
): Promise<ActionResult<void>> {
  // TODO: Implement SMS service integration
  console.log(`TODO: Subscribe ${phoneNumber} (user: ${userId}) to promotional SMS`);
  return { 
    error: "SMS notifications not yet implemented. Will integrate with Twilio or similar service." 
  };
}

/**
 * Unsubscribe user from promotional SMS
 * TODO: Implement SMS service integration (likely Twilio)
 */
export async function unsubscribeFromPromotionalSMS(
  phoneNumber: string,
  userId: string,
): Promise<ActionResult<void>> {
  // TODO: Implement SMS service integration
  console.log(`TODO: Unsubscribe ${phoneNumber} (user: ${userId}) from promotional SMS`);
  return { 
    error: "SMS notifications not yet implemented. Will integrate with Twilio or similar service." 
  };
}

/**
 * Send promotional SMS
 * TODO: Implement SMS service integration (likely Twilio)
 */
export async function sendPromotionalSMS(
  phoneNumber: string,
  message: string,
  userId?: string,
): Promise<ActionResult<void>> {
  // TODO: Implement SMS service integration
  console.log(`TODO: Send SMS to ${phoneNumber}: "${message}" (user: ${userId})`);
  return { 
    error: "SMS notifications not yet implemented. Will integrate with Twilio or similar service." 
  };
}
