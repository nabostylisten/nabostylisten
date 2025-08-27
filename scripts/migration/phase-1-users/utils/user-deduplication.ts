/**
 * User deduplication utility for handling buyers and stylists with same email
 */

import type {
  MySQLBuyer,
  MySQLStylist,
  DuplicateUser,
  ConsolidatedUser
} from '../../shared/types';
import type { MigrationLogger } from '../../shared/logger';

export class UserDeduplicator {
  private logger: MigrationLogger;

  constructor(logger: MigrationLogger) {
    this.logger = logger;
  }

  /**
   * Find users with duplicate emails across buyer and stylist tables
   */
  findDuplicateEmails(
    buyers: MySQLBuyer[],
    stylists: MySQLStylist[]
  ): DuplicateUser[] {
    this.logger.info('Finding duplicate emails across buyer and stylist tables');

    const buyerEmails = new Map<string, MySQLBuyer>();
    const stylistEmails = new Map<string, MySQLStylist>();
    const duplicates: DuplicateUser[] = [];

    // Index buyers by email (only active ones)
    buyers
      .filter(buyer => !buyer.is_deleted && buyer.email)
      .forEach(buyer => {
        buyerEmails.set(buyer.email!.toLowerCase(), buyer);
      });

    // Index stylists by email (only active ones)
    stylists
      .filter(stylist => !stylist.is_deleted && stylist.email)
      .forEach(stylist => {
        stylistEmails.set(stylist.email!.toLowerCase(), stylist);
      });

    // Find overlapping emails
    const allEmails = new Set([...buyerEmails.keys(), ...stylistEmails.keys()]);
    
    for (const email of allEmails) {
      const buyer = buyerEmails.get(email);
      const stylist = stylistEmails.get(email);

      if (buyer && stylist) {
        // This email exists in both tables - it's a duplicate
        const duplicate: DuplicateUser = {
          email,
          buyer_record: buyer,
          stylist_record: stylist,
          resolution: this.determineResolution(buyer, stylist),
          reason: this.getResolutionReason(buyer, stylist)
        };

        duplicates.push(duplicate);
      }
    }

    this.logger.info(`Found ${duplicates.length} users with duplicate emails`, {
      total_duplicates: duplicates.length,
      resolutions: this.summarizeResolutions(duplicates)
    });

    return duplicates;
  }

  /**
   * Consolidate users, handling duplicates according to resolution strategy
   */
  consolidateUsers(
    buyers: MySQLBuyer[],
    stylists: MySQLStylist[],
    duplicates: DuplicateUser[]
  ): ConsolidatedUser[] {
    this.logger.info('Consolidating users with deduplication');

    const consolidatedUsers: ConsolidatedUser[] = [];
    const processedEmails = new Set<string>();

    // Process duplicates first
    for (const duplicate of duplicates) {
      const consolidated = this.resolveDuplicate(duplicate);
      if (consolidated) {
        consolidatedUsers.push(consolidated);
        processedEmails.add(duplicate.email.toLowerCase());
      }
    }

    // Process remaining buyers
    buyers
      .filter(buyer => 
        !buyer.is_deleted && 
        buyer.email && 
        !processedEmails.has(buyer.email.toLowerCase())
      )
      .forEach(buyer => {
        consolidatedUsers.push(this.convertBuyerToUser(buyer));
        processedEmails.add(buyer.email!.toLowerCase());
      });

    // Process remaining stylists
    stylists
      .filter(stylist => 
        !stylist.is_deleted && 
        stylist.email && 
        !processedEmails.has(stylist.email.toLowerCase())
      )
      .forEach(stylist => {
        consolidatedUsers.push(this.convertStylistToUser(stylist));
        processedEmails.add(stylist.email!.toLowerCase());
      });

    this.logger.success(`Consolidated ${consolidatedUsers.length} unique users`, {
      customers: consolidatedUsers.filter(u => u.role === 'customer').length,
      stylists: consolidatedUsers.filter(u => u.role === 'stylist').length,
      merged_accounts: duplicates.filter(d => d.resolution !== 'create_separate').length
    });

    return consolidatedUsers;
  }

  /**
   * Determine the best resolution strategy for a duplicate user
   */
  private determineResolution(
    buyer: MySQLBuyer,
    stylist: MySQLStylist
  ): DuplicateUser['resolution'] {
    // If stylist has business data (bio, social media, etc.), prefer stylist account
    if (this.hasStylistBusinessData(stylist)) {
      return 'merge_to_stylist';
    }

    // If buyer has more recent activity, prefer buyer
    const buyerLastActivity = buyer.last_login_at || buyer.updated_at;
    const stylistLastActivity = stylist.last_login_at || stylist.updated_at;

    if (buyerLastActivity && stylistLastActivity) {
      const buyerDate = new Date(buyerLastActivity);
      const stylistDate = new Date(stylistLastActivity);

      if (buyerDate > stylistDate) {
        return 'merge_to_customer';
      }
    }

    // Default: merge to stylist account (business account takes priority)
    return 'merge_to_stylist';
  }

  /**
   * Get human-readable reason for resolution strategy
   */
  private getResolutionReason(
    buyer: MySQLBuyer,
    stylist: MySQLStylist
  ): string {
    if (this.hasStylistBusinessData(stylist)) {
      return 'Stylist account has business profile data (bio, social media, etc.)';
    }

    const buyerLastActivity = buyer.last_login_at || buyer.updated_at;
    const stylistLastActivity = stylist.last_login_at || stylist.updated_at;

    if (buyerLastActivity && stylistLastActivity) {
      const buyerDate = new Date(buyerLastActivity);
      const stylistDate = new Date(stylistLastActivity);

      if (buyerDate > stylistDate) {
        return `Buyer account more recently active (${buyerLastActivity} vs ${stylistLastActivity})`;
      }
    }

    return 'Default strategy: business account (stylist) takes priority';
  }

  /**
   * Check if stylist has meaningful business data
   */
  private hasStylistBusinessData(stylist: MySQLStylist): boolean {
    return !!(
      stylist.bio ||
      stylist.instagram_profile ||
      stylist.facebook_profile ||
      stylist.twitter_profile ||
      stylist.stripe_account_id ||
      stylist.can_travel
    );
  }

  /**
   * Resolve a duplicate user according to the determined strategy
   */
  private resolveDuplicate(duplicate: DuplicateUser): ConsolidatedUser | null {
    const { buyer_record, stylist_record, resolution } = duplicate;

    if (!buyer_record || !stylist_record) {
      this.logger.warn('Invalid duplicate record - missing buyer or stylist data', duplicate);
      return null;
    }

    switch (resolution) {
      case 'merge_to_stylist':
        return this.mergeToStylist(buyer_record, stylist_record);

      case 'merge_to_customer':
        return this.mergeToCustomer(buyer_record, stylist_record);

      case 'create_separate':
        // For now, we don't support creating separate accounts
        // This would require email modification which is complex
        this.logger.warn('Separate account creation not implemented, defaulting to stylist merge', duplicate);
        return this.mergeToStylist(buyer_record, stylist_record);

      case 'skip':
        this.logger.info('Skipping duplicate user as requested', duplicate);
        return null;

      default:
        this.logger.error('Unknown resolution strategy', duplicate);
        return null;
    }
  }

  /**
   * Merge buyer and stylist data, prioritizing stylist role
   */
  private mergeToStylist(
    buyer: MySQLBuyer,
    stylist: MySQLStylist
  ): ConsolidatedUser {
    return {
      id: stylist.id, // Use stylist ID as primary
      full_name: stylist.name || buyer.name || null,
      email: stylist.email || buyer.email!,
      phone_number: stylist.phone_number || buyer.phone_number,
      bankid_verified: stylist.bankid_verified || buyer.bankid_verified,
      role: 'stylist',
      stripe_customer_id: buyer.stripe_customer_id, // Keep buyer's Stripe customer ID
      created_at: new Date(Math.min(
        new Date(stylist.created_at).getTime(),
        new Date(buyer.created_at).getTime()
      )).toISOString(),
      updated_at: new Date(Math.max(
        new Date(stylist.updated_at).getTime(),
        new Date(buyer.updated_at).getTime()
      )).toISOString(),

      stylist_details: {
        bio: stylist.bio,
        can_travel: stylist.can_travel,
        has_own_place: stylist.has_own_place,
        travel_distance_km: stylist.travel_distance,
        instagram_profile: stylist.instagram_profile || null,
        facebook_profile: stylist.facebook_profile || null,
        tiktok_profile: null,
        youtube_profile: null,
        snapchat_profile: null,
        other_social_media_urls: stylist.twitter_profile ? [stylist.twitter_profile] : [],
        stripe_account_id: stylist.stripe_account_id
      },

      user_preferences: {
        newsletter_subscribed: true,
        marketing_emails: stylist.email_enabled,
        promotional_sms: stylist.sms_enabled,
        booking_confirmations: true,
        booking_reminders: true,
        booking_cancellations: true,
        booking_status_updates: true,
        chat_messages: true,
        new_booking_requests: true,
        review_notifications: true,
        payment_notifications: true,
        application_status_updates: true,
        email_delivery: stylist.email_enabled,
        sms_delivery: stylist.sms_enabled,
        push_notifications: true
      },

      source_table: 'stylist',
      original_id: stylist.id
    };
  }

  /**
   * Merge buyer and stylist data, prioritizing customer role
   */
  private mergeToCustomer(
    buyer: MySQLBuyer,
    stylist: MySQLStylist
  ): ConsolidatedUser {
    return {
      id: buyer.id, // Use buyer ID as primary
      full_name: buyer.name || stylist.name || null,
      email: buyer.email || stylist.email!,
      phone_number: buyer.phone_number || stylist.phone_number,
      bankid_verified: buyer.bankid_verified || stylist.bankid_verified,
      role: 'customer',
      stripe_customer_id: buyer.stripe_customer_id,
      created_at: new Date(Math.min(
        new Date(buyer.created_at).getTime(),
        new Date(stylist.created_at).getTime()
      )).toISOString(),
      updated_at: new Date(Math.max(
        new Date(buyer.updated_at).getTime(),
        new Date(stylist.updated_at).getTime()
      )).toISOString(),

      stylist_details: null, // Customer account, no stylist data

      user_preferences: {
        newsletter_subscribed: true,
        marketing_emails: buyer.email_enabled,
        promotional_sms: buyer.sms_enabled,
        booking_confirmations: true,
        booking_reminders: true,
        booking_cancellations: true,
        booking_status_updates: true,
        chat_messages: true,
        new_booking_requests: false, // Not a stylist
        review_notifications: false, // Not a stylist
        payment_notifications: false, // Not a stylist
        application_status_updates: false, // Not a stylist
        email_delivery: buyer.email_enabled,
        sms_delivery: buyer.sms_enabled,
        push_notifications: true
      },

      source_table: 'buyer',
      original_id: buyer.id
    };
  }

  /**
   * Convert MySQL buyer to consolidated user
   */
  private convertBuyerToUser(buyer: MySQLBuyer): ConsolidatedUser {
    return {
      id: buyer.id,
      full_name: buyer.name || null,
      email: buyer.email!,
      phone_number: buyer.phone_number,
      bankid_verified: buyer.bankid_verified,
      role: 'customer',
      stripe_customer_id: buyer.stripe_customer_id,
      created_at: new Date(buyer.created_at).toISOString(),
      updated_at: new Date(buyer.updated_at).toISOString(),

      stylist_details: null,

      user_preferences: {
        newsletter_subscribed: true,
        marketing_emails: buyer.email_enabled,
        promotional_sms: buyer.sms_enabled,
        booking_confirmations: true,
        booking_reminders: true,
        booking_cancellations: true,
        booking_status_updates: true,
        chat_messages: true,
        new_booking_requests: false,
        review_notifications: false,
        payment_notifications: false,
        application_status_updates: false,
        email_delivery: buyer.email_enabled,
        sms_delivery: buyer.sms_enabled,
        push_notifications: true
      },

      source_table: 'buyer',
      original_id: buyer.id
    };
  }

  /**
   * Convert MySQL stylist to consolidated user
   */
  private convertStylistToUser(stylist: MySQLStylist): ConsolidatedUser {
    return {
      id: stylist.id,
      full_name: stylist.name || null,
      email: stylist.email!,
      phone_number: stylist.phone_number,
      bankid_verified: stylist.bankid_verified,
      role: 'stylist',
      stripe_customer_id: null, // Stylists don't have customer IDs by default
      created_at: new Date(stylist.created_at).toISOString(),
      updated_at: new Date(stylist.updated_at).toISOString(),

      stylist_details: {
        bio: stylist.bio,
        can_travel: stylist.can_travel,
        has_own_place: stylist.has_own_place,
        travel_distance_km: stylist.travel_distance,
        instagram_profile: stylist.instagram_profile || null,
        facebook_profile: stylist.facebook_profile || null,
        tiktok_profile: null,
        youtube_profile: null,
        snapchat_profile: null,
        other_social_media_urls: stylist.twitter_profile ? [stylist.twitter_profile] : [],
        stripe_account_id: stylist.stripe_account_id
      },

      user_preferences: {
        newsletter_subscribed: true,
        marketing_emails: stylist.email_enabled,
        promotional_sms: stylist.sms_enabled,
        booking_confirmations: true,
        booking_reminders: true,
        booking_cancellations: true,
        booking_status_updates: true,
        chat_messages: true,
        new_booking_requests: true,
        review_notifications: true,
        payment_notifications: true,
        application_status_updates: true,
        email_delivery: stylist.email_enabled,
        sms_delivery: stylist.sms_enabled,
        push_notifications: true
      },

      source_table: 'stylist',
      original_id: stylist.id
    };
  }

  /**
   * Summarize resolution strategies for logging
   */
  private summarizeResolutions(duplicates: DuplicateUser[]): Record<string, number> {
    const summary: Record<string, number> = {};

    duplicates.forEach(duplicate => {
      summary[duplicate.resolution] = (summary[duplicate.resolution] || 0) + 1;
    });

    return summary;
  }
}