import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type UserPreferences = Database["public"]["Tables"]["user_preferences"]["Row"];

/**
 * Structured user notification preferences with typed notification categories
 */
export interface UserNotificationPreferences {
  // Core delivery preferences
  canReceiveEmails: boolean;
  canReceiveSMS: boolean;
  canReceivePushNotifications: boolean;

  // Newsletter and Marketing
  newsletter: {
    subscribed: boolean;
    marketingEmails: boolean;
    promotionalSMS: boolean;
  };

  // Booking Notifications
  booking: {
    confirmations: boolean;
    reminders: boolean;
    cancellations: boolean;
    statusUpdates: boolean;
  };

  // Chat and Communication
  chat: {
    messages: boolean;
  };

  // Stylist-specific Notifications
  stylist: {
    newBookingRequests: boolean;
    reviewNotifications: boolean;
    paymentNotifications: boolean;
  };

  // Application Updates
  application: {
    statusUpdates: boolean;
  };

  // Raw preferences for direct access
  raw: UserPreferences;
}

/**
 * Runtime-agnostic function to get structured user notification preferences
 * 
 * This function fetches user preferences and returns a structured object
 * that makes it easy to check notification permissions throughout the app.
 * 
 * @param supabase - Supabase client (server or client)
 * @param profileId - User profile ID
 * @returns Promise with structured preferences or null if user not found
 */
export async function getUserNotificationPreferences(
  supabase: SupabaseClient<Database>,
  profileId: string
): Promise<UserNotificationPreferences | null> {
  try {
    const { data: preferences, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", profileId)
      .single();

    if (error || !preferences) {
      console.error(`Failed to fetch preferences for user ${profileId}:`, error);
      return null;
    }

    return {
      // Core delivery preferences - these override all specific preferences
      canReceiveEmails: preferences.email_delivery,
      canReceiveSMS: preferences.sms_delivery,
      canReceivePushNotifications: preferences.push_notifications,

      // Structured notification categories
      newsletter: {
        subscribed: preferences.newsletter_subscribed && preferences.email_delivery,
        marketingEmails: preferences.marketing_emails && preferences.email_delivery,
        promotionalSMS: preferences.promotional_sms && preferences.sms_delivery,
      },

      booking: {
        confirmations: preferences.booking_confirmations && preferences.email_delivery,
        reminders: preferences.booking_reminders && preferences.email_delivery,
        cancellations: preferences.booking_cancellations && preferences.email_delivery,
        statusUpdates: preferences.booking_status_updates && preferences.email_delivery,
      },

      chat: {
        messages: preferences.chat_messages && preferences.email_delivery,
      },

      stylist: {
        newBookingRequests: preferences.new_booking_requests && preferences.email_delivery,
        reviewNotifications: preferences.review_notifications && preferences.email_delivery,
        paymentNotifications: preferences.payment_notifications && preferences.email_delivery,
      },

      application: {
        statusUpdates: preferences.application_status_updates && preferences.email_delivery,
      },

      // Provide raw access to preferences for edge cases
      raw: preferences,
    };
  } catch (error) {
    console.error(`Error fetching preferences for user ${profileId}:`, error);
    return null;
  }
}

/**
 * Check if a user should receive a specific notification type
 * 
 * This is a convenience function for quick preference checks
 * 
 * @param supabase - Supabase client
 * @param profileId - User profile ID
 * @param notificationType - The type of notification to check
 * @returns Promise<boolean> - Whether the user should receive the notification
 */
export async function shouldReceiveNotification(
  supabase: SupabaseClient<Database>,
  profileId: string,
  notificationType: 
    | 'newsletter.subscribed'
    | 'newsletter.marketingEmails'
    | 'newsletter.promotionalSMS'
    | 'booking.confirmations'
    | 'booking.reminders'
    | 'booking.cancellations'
    | 'booking.statusUpdates'
    | 'chat.messages'
    | 'stylist.newBookingRequests'
    | 'stylist.reviewNotifications'
    | 'stylist.paymentNotifications'
    | 'application.statusUpdates'
): Promise<boolean> {
  const preferences = await getUserNotificationPreferences(supabase, profileId);
  
  if (!preferences) {
    return false; // Default to not sending if we can't fetch preferences
  }

  // Navigate the nested object structure based on the notification type
  const [category, field] = notificationType.split('.') as [string, string];
  
  switch (category) {
    case 'newsletter':
      return preferences.newsletter[field as keyof typeof preferences.newsletter];
    case 'booking':
      return preferences.booking[field as keyof typeof preferences.booking];
    case 'chat':
      return preferences.chat[field as keyof typeof preferences.chat];
    case 'stylist':
      return preferences.stylist[field as keyof typeof preferences.stylist];
    case 'application':
      return preferences.application[field as keyof typeof preferences.application];
    default:
      console.warn(`Unknown notification type: ${notificationType}`);
      return false;
  }
}

/**
 * Batch check multiple notification preferences for a user
 * 
 * Useful when you need to check several preferences at once
 * 
 * @param supabase - Supabase client
 * @param profileId - User profile ID
 * @param notificationTypes - Array of notification types to check
 * @returns Promise with object mapping notification types to boolean values
 */
export async function batchCheckNotificationPreferences(
  supabase: SupabaseClient<Database>,
  profileId: string,
  notificationTypes: Parameters<typeof shouldReceiveNotification>[2][]
): Promise<Record<string, boolean>> {
  const preferences = await getUserNotificationPreferences(supabase, profileId);
  
  if (!preferences) {
    // Return all false if we can't fetch preferences
    return Object.fromEntries(
      notificationTypes.map(type => [type, false])
    );
  }

  const results: Record<string, boolean> = {};
  
  for (const notificationType of notificationTypes) {
    const [category, field] = notificationType.split('.') as [string, string];
    
    switch (category) {
      case 'newsletter':
        results[notificationType] = preferences.newsletter[field as keyof typeof preferences.newsletter];
        break;
      case 'booking':
        results[notificationType] = preferences.booking[field as keyof typeof preferences.booking];
        break;
      case 'chat':
        results[notificationType] = preferences.chat[field as keyof typeof preferences.chat];
        break;
      case 'stylist':
        results[notificationType] = preferences.stylist[field as keyof typeof preferences.stylist];
        break;
      case 'application':
        results[notificationType] = preferences.application[field as keyof typeof preferences.application];
        break;
      default:
        console.warn(`Unknown notification type: ${notificationType}`);
        results[notificationType] = false;
    }
  }

  return results;
}