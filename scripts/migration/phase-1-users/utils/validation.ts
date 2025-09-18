/**
 * Validation utilities for user migration data
 */

import type {
  MySQLBuyer,
  MySQLStylist,
  ConsolidatedUser,
  ValidationError
} from '../../shared/types';
import type { MigrationLogger } from '../../shared/logger';

export class UserValidator {
  private logger: MigrationLogger;

  constructor(logger: MigrationLogger) {
    this.logger = logger;
  }

  /**
   * Validate MySQL buyer records
   */
  validateBuyers(buyers: MySQLBuyer[]): ValidationError[] {
    this.logger.info('Validating buyer records');
    const errors: ValidationError[] = [];

    buyers.forEach(buyer => {
      // Validate required fields
      if (!buyer.id) {
        errors.push({
          record_id: buyer.id || 'unknown',
          table: 'buyer',
          field: 'id',
          value: buyer.id,
          error: 'ID is required'
        });
      }

      if (!buyer.email) {
        errors.push({
          record_id: buyer.id,
          table: 'buyer',
          field: 'email',
          value: buyer.email,
          error: 'Email is required'
        });
      }

      // Validate UUID format
      if (buyer.id && !this.isValidUUID(buyer.id)) {
        errors.push({
          record_id: buyer.id,
          table: 'buyer',
          field: 'id',
          value: buyer.id,
          error: 'Invalid UUID format'
        });
      }

      // Validate email format
      if (buyer.email && !this.isValidEmail(buyer.email)) {
        errors.push({
          record_id: buyer.id,
          table: 'buyer',
          field: 'email',
          value: buyer.email,
          error: 'Invalid email format'
        });
      }

      // Validate phone number format (if provided)
      if (buyer.phone_number && !this.isValidPhoneNumber(buyer.phone_number)) {
        errors.push({
          record_id: buyer.id,
          table: 'buyer',
          field: 'phone_number',
          value: buyer.phone_number,
          error: 'Invalid phone number format'
        });
      }

      // Validate dates
      if (buyer.created_at && !this.isValidDate(buyer.created_at)) {
        errors.push({
          record_id: buyer.id,
          table: 'buyer',
          field: 'created_at',
          value: buyer.created_at,
          error: 'Invalid date format'
        });
      }

      if (buyer.updated_at && !this.isValidDate(buyer.updated_at)) {
        errors.push({
          record_id: buyer.id,
          table: 'buyer',
          field: 'updated_at',
          value: buyer.updated_at,
          error: 'Invalid date format'
        });
      }
    });

    this.logger.info(`Buyer validation completed. Found ${errors.length} errors`);
    return errors;
  }

  /**
   * Validate MySQL stylist records
   */
  validateStylists(stylists: MySQLStylist[]): ValidationError[] {
    this.logger.info('Validating stylist records');
    const errors: ValidationError[] = [];

    stylists.forEach(stylist => {
      // Validate required fields
      if (!stylist.id) {
        errors.push({
          record_id: stylist.id || 'unknown',
          table: 'stylist',
          field: 'id',
          value: stylist.id,
          error: 'ID is required'
        });
      }

      if (!stylist.email) {
        errors.push({
          record_id: stylist.id,
          table: 'stylist',
          field: 'email',
          value: stylist.email,
          error: 'Email is required'
        });
      }

      // Validate UUID format
      if (stylist.id && !this.isValidUUID(stylist.id)) {
        errors.push({
          record_id: stylist.id,
          table: 'stylist',
          field: 'id',
          value: stylist.id,
          error: 'Invalid UUID format'
        });
      }

      // Validate email format
      if (stylist.email && !this.isValidEmail(stylist.email)) {
        errors.push({
          record_id: stylist.id,
          table: 'stylist',
          field: 'email',
          value: stylist.email,
          error: 'Invalid email format'
        });
      }

      // Validate phone number format (if provided)
      if (stylist.phone_number && !this.isValidPhoneNumber(stylist.phone_number)) {
        errors.push({
          record_id: stylist.id,
          table: 'stylist',
          field: 'phone_number',
          value: stylist.phone_number,
          error: 'Invalid phone number format'
        });
      }

      // Validate travel distance (if provided)
      if (stylist.travel_distance !== null && stylist.travel_distance !== undefined) {
        if (stylist.travel_distance < 0 || stylist.travel_distance > 1000) {
          errors.push({
            record_id: stylist.id,
            table: 'stylist',
            field: 'travel_distance',
            value: stylist.travel_distance,
            error: 'Travel distance must be between 0 and 1000 km'
          });
        }
      }

      // Validate social media URLs (if provided)
      if (stylist.instagram_profile && !this.isValidInstagramUrl(stylist.instagram_profile)) {
        errors.push({
          record_id: stylist.id,
          table: 'stylist',
          field: 'instagram_profile',
          value: stylist.instagram_profile,
          error: 'Invalid Instagram URL format'
        });
      }

      if (stylist.facebook_profile && !this.isValidFacebookUrl(stylist.facebook_profile)) {
        errors.push({
          record_id: stylist.id,
          table: 'stylist',
          field: 'facebook_profile',
          value: stylist.facebook_profile,
          error: 'Invalid Facebook URL format'
        });
      }

      // Validate dates
      if (stylist.created_at && !this.isValidDate(stylist.created_at)) {
        errors.push({
          record_id: stylist.id,
          table: 'stylist',
          field: 'created_at',
          value: stylist.created_at,
          error: 'Invalid date format'
        });
      }

      if (stylist.updated_at && !this.isValidDate(stylist.updated_at)) {
        errors.push({
          record_id: stylist.id,
          table: 'stylist',
          field: 'updated_at',
          value: stylist.updated_at,
          error: 'Invalid date format'
        });
      }
    });

    this.logger.info(`Stylist validation completed. Found ${errors.length} errors`);
    return errors;
  }

  /**
   * Validate consolidated users before database insertion
   */
  validateConsolidatedUsers(users: ConsolidatedUser[]): ValidationError[] {
    this.logger.info('Validating consolidated user records');
    const errors: ValidationError[] = [];
    const seenIds = new Set<string>();
    const seenEmails = new Set<string>();

    users.forEach(user => {
      // Check for duplicate IDs
      if (seenIds.has(user.id)) {
        errors.push({
          record_id: user.id,
          table: user.source_table,
          field: 'id',
          value: user.id,
          error: 'Duplicate user ID found'
        });
      }
      seenIds.add(user.id);

      // Check for duplicate emails
      if (seenEmails.has(user.email.toLowerCase())) {
        errors.push({
          record_id: user.id,
          table: user.source_table,
          field: 'email',
          value: user.email,
          error: 'Duplicate email found'
        });
      }
      seenEmails.add(user.email.toLowerCase());

      // Validate required fields
      if (!user.id) {
        errors.push({
          record_id: user.id || 'unknown',
          table: user.source_table,
          field: 'id',
          value: user.id,
          error: 'ID is required'
        });
      }

      if (!user.email) {
        errors.push({
          record_id: user.id,
          table: user.source_table,
          field: 'email',
          value: user.email,
          error: 'Email is required'
        });
      }

      // Validate UUID format
      if (user.id && !this.isValidUUID(user.id)) {
        errors.push({
          record_id: user.id,
          table: user.source_table,
          field: 'id',
          value: user.id,
          error: 'Invalid UUID format'
        });
      }

      // Validate email format
      if (user.email && !this.isValidEmail(user.email)) {
        errors.push({
          record_id: user.id,
          table: user.source_table,
          field: 'email',
          value: user.email,
          error: 'Invalid email format'
        });
      }

      // Validate role
      if (!['customer', 'stylist'].includes(user.role)) {
        errors.push({
          record_id: user.id,
          table: user.source_table,
          field: 'role',
          value: user.role,
          error: 'Invalid role. Must be "customer" or "stylist"'
        });
      }

      // Validate stylist-specific fields
      if (user.role === 'stylist' && !user.stylist_details) {
        errors.push({
          record_id: user.id,
          table: user.source_table,
          field: 'stylist_details',
          value: null,
          error: 'Stylist role requires stylist_details'
        });
      }

      if (user.role === 'customer' && user.stylist_details) {
        errors.push({
          record_id: user.id,
          table: user.source_table,
          field: 'stylist_details',
          value: 'not null',
          error: 'Customer role should not have stylist_details'
        });
      }

      // Validate timestamps
      if (!this.isValidISODate(user.created_at)) {
        errors.push({
          record_id: user.id,
          table: user.source_table,
          field: 'created_at',
          value: user.created_at,
          error: 'Invalid ISO date format for created_at'
        });
      }

      if (!this.isValidISODate(user.updated_at)) {
        errors.push({
          record_id: user.id,
          table: user.source_table,
          field: 'updated_at',
          value: user.updated_at,
          error: 'Invalid ISO date format for updated_at'
        });
      }
    });

    this.logger.info(`Consolidated user validation completed. Found ${errors.length} errors`);
    return errors;
  }

  /**
   * Get validation summary statistics
   */
  getValidationSummary(
    buyerErrors: ValidationError[],
    stylistErrors: ValidationError[],
    consolidatedErrors: ValidationError[]
  ): Record<string, number | string> {
    const totalErrors = buyerErrors.length + stylistErrors.length + consolidatedErrors.length;
    
    return {
      'Total Errors': totalErrors,
      'Buyer Errors': buyerErrors.length,
      'Stylist Errors': stylistErrors.length,
      'Consolidated Errors': consolidatedErrors.length,
      'Validation Status': totalErrors === 0 ? '✅ PASSED' : '❌ FAILED'
    };
  }

  // Validation helper methods

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhoneNumber(phone: string): boolean {
    // Allow various phone number formats
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,20}$/;
    return phoneRegex.test(phone);
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date.getTime() > 0;
  }

  private isValidISODate(dateString: string): boolean {
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/;
    return isoRegex.test(dateString) && this.isValidDate(dateString);
  }

  /**
   * Normalize Instagram URL to standard format: https://www.instagram.com/username/
   */
  public normalizeInstagramUrl(url: string): string {
    if (!url) return url;

    // Remove @ prefix if present
    let cleanUrl = url.trim().replace(/^@/, '');

    // Handle username-only format
    if (!cleanUrl.includes('instagram.com')) {
      return `https://www.instagram.com/${cleanUrl}/`;
    }

    // Handle URLs with or without protocol
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    // Ensure www. prefix
    cleanUrl = cleanUrl.replace(/^https?:\/\/(?!www\.)/, 'https://www.');

    // Extract username from URL (everything after last slash, before query params)
    const urlMatch = cleanUrl.match(/instagram\.com\/([^/?#]+)/i);
    if (urlMatch && urlMatch[1]) {
      const username = urlMatch[1];
      return `https://www.instagram.com/${username}/`;
    }

    return cleanUrl;
  }

  /**
   * Normalize Facebook URL to standard format: https://www.facebook.com/username/
   */
  public normalizeFacebookUrl(url: string): string {
    if (!url) return url;

    // Remove @ prefix if present
    let cleanUrl = url.trim().replace(/^@/, '');

    // Handle username-only format
    if (!cleanUrl.includes('facebook.com') && !cleanUrl.includes('fb.com')) {
      return `https://www.facebook.com/${cleanUrl}/`;
    }

    // Handle URLs with or without protocol
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    // Replace fb.com with facebook.com and ensure www. prefix
    cleanUrl = cleanUrl.replace(/^https?:\/\/(www\.)?fb\.com/, 'https://www.facebook.com');
    cleanUrl = cleanUrl.replace(/^https?:\/\/(?!www\.)facebook\.com/, 'https://www.facebook.com');

    // Extract username from URL (everything after last slash, before query params)
    const urlMatch = cleanUrl.match(/facebook\.com\/([^/?#]+)/i);
    if (urlMatch && urlMatch[1]) {
      const username = urlMatch[1];
      return `https://www.facebook.com/${username}/`;
    }

    return cleanUrl;
  }

  private isValidInstagramUrl(url: string): boolean {
    if (!url) return false;

    // First normalize the URL
    const normalizedUrl = this.normalizeInstagramUrl(url);

    // Check if the normalized URL matches our standard format
    return /^https:\/\/www\.instagram\.com\/[\w\.-]+\/$/i.test(normalizedUrl);
  }

  private isValidFacebookUrl(url: string): boolean {
    if (!url) return false;

    // First normalize the URL
    const normalizedUrl = this.normalizeFacebookUrl(url);

    // Check if the normalized URL matches our standard format
    return /^https:\/\/www\.facebook\.com\/[\w\.-]+\/$/i.test(normalizedUrl);
  }
}