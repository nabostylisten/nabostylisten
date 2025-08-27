/**
 * Shared types for the MySQL → Supabase migration process
 */

// Raw MySQL table structures (from dump file)
export interface MySQLBuyer {
  id: string; // VARCHAR(36)
  name: string;
  email: string | null;
  phone_number: string | null;
  default_address_id: string | null;
  is_deleted: boolean;
  phone_verified: boolean;
  email_verified: boolean;
  bankid_verified: boolean;
  sms_enabled: boolean;
  email_enabled: boolean;
  last_login_at: string | null;
  created_at: string; // MySQL datetime(6)
  updated_at: string; // MySQL datetime(6)
  deleted_at: string | null;
  gender: string | null;
  stripe_customer_id: string | null;
  profile_picture_uploaded: boolean;
  is_blocked: boolean;
}

export interface MySQLStylist {
  id: string; // VARCHAR(36)
  name: string;
  email: string | null;
  phone_number: string | null;
  default_address_id: string | null;
  is_deleted: boolean;
  phone_verified: boolean;
  email_verified: boolean;
  bankid_verified: boolean;
  sms_enabled: boolean;
  email_enabled: boolean;
  last_login_at: string | null;
  created_at: string; // MySQL datetime(6)
  updated_at: string; // MySQL datetime(6)
  deleted_at: string | null;
  gender: string | null;
  stripe_account_id: string | null;
  bio: string | null;
  commission_percentage: number | null;
  facebook_profile: string;
  instagram_profile: string;
  twitter_profile: string;
  is_active: boolean;
  can_travel: boolean;
  travel_distance: number | null;
  salon_id: string | null;
  stripe_onboarding_completed: boolean;
  scheduler_resource_id: number | null;
  profile_picture_uploaded: boolean;
  has_own_place: boolean;
}

// Transformation types
export interface ConsolidatedUser {
  // Core profile data
  id: string; // Will be converted to UUID
  full_name: string | null;
  email: string;
  phone_number: string | null;
  bankid_verified: boolean;
  role: "customer" | "stylist";
  stripe_customer_id: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp

  // Stylist-specific data (null for customers)
  stylist_details: {
    bio: string | null;
    can_travel: boolean;
    has_own_place: boolean;
    travel_distance_km: number | null;
    instagram_profile: string | null;
    facebook_profile: string | null;
    tiktok_profile: string | null;
    youtube_profile: string | null;
    snapchat_profile: string | null;
    other_social_media_urls: string[];
    stripe_account_id: string | null;
  } | null;

  // User preferences
  user_preferences: {
    newsletter_subscribed: boolean;
    marketing_emails: boolean;
    promotional_sms: boolean;
    booking_confirmations: boolean;
    booking_reminders: boolean;
    booking_cancellations: boolean;
    booking_status_updates: boolean;
    chat_messages: boolean;
    new_booking_requests: boolean;
    review_notifications: boolean;
    payment_notifications: boolean;
    application_status_updates: boolean;
    email_delivery: boolean;
    sms_delivery: boolean;
    push_notifications: boolean;
  };

  // Original source tracking
  source_table: "buyer" | "stylist";
  original_id: string;
}

// Migration process types
export interface UserMigrationStats {
  total_buyers: number;
  total_stylists: number;
  active_buyers: number; // Not soft deleted
  active_stylists: number; // Not soft deleted
  duplicate_emails: number;
  merged_accounts: number;
  skipped_records: number;
  created_auth_users: number;
  created_profiles: number;
  created_stylist_details: number;
  created_user_preferences: number;
  errors: number;
}

export interface DuplicateUser {
  email: string;
  buyer_record: MySQLBuyer | null;
  stylist_record: MySQLStylist | null;
  resolution:
    | "merge_to_stylist"
    | "merge_to_customer"
    | "create_separate"
    | "skip";
  reason: string;
}

export interface MigrationResult {
  success: boolean;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  error?: string;
  timestamp: string;
}

export interface ValidationError {
  record_id: string;
  table: "buyer" | "stylist";
  field: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  error: string;
}

// Supabase Auth user creation data
export interface AuthUserCreate {
  email: string;
  password?: string;
  email_confirm: boolean;
  user_metadata: {
    full_name?: string;
    phone_number?: string;
    role: "customer" | "stylist";
    migration_source: "mysql_buyer" | "mysql_stylist";
    original_id: string;
  };
}

// Progress tracking
export interface MigrationProgress {
  phase: string;
  step: string;
  current: number;
  total: number;
  percentage: number;
  start_time: string;
  estimated_remaining?: string;
  errors: ValidationError[];
}

// Phase 2: Address Migration Types
export interface AddressMigrationStats {
  total_addresses: number;
  active_addresses: number; // Not soft deleted or salon addresses
  processed_addresses: number;
  skipped_addresses: number;
  addresses_with_coordinates: number;
  buyer_addresses: number;
  stylist_addresses: number;
  created_addresses: number; // Updated in step 2
  primary_address_updates: number; // Updated in step 3
  errors: number;
}
