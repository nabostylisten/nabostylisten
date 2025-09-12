-- Create a public schema for all tables
CREATE SCHEMA IF NOT EXISTS public;

-- Create a dedicated schema for PostGIS
CREATE SCHEMA IF NOT EXISTS gis;

-- Enable PostGIS extension in the gis schema for geographic queries
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA gis;

-- ================== ENUMS ==================

-- Enum for user roles 
CREATE TYPE public.user_role AS ENUM ('customer', 'stylist', 'admin');

-- Enum for booking statuses
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Enum for application statuses
CREATE TYPE public.application_status AS ENUM ('applied', 'pending_info', 'rejected', 'approved');

-- Enum for different types of media, adding application and review images
CREATE TYPE public.media_type AS ENUM ('avatar', 'service_image', 'review_image', 'chat_image', 'application_image', 'landing_asset', 'logo_asset', 'booking_note_image', 'other');

-- Enum for days of the week for stylist availability rules
CREATE TYPE public.day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- Enum for booking note categories
CREATE TYPE public.booking_note_category AS ENUM ('service_notes', 'customer_preferences', 'issues', 'results', 'follow_up', 'other');

-- Enum for payment statuses
CREATE TYPE public.payment_status AS ENUM ('pending', 'requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'requires_capture', 'cancelled', 'succeeded');

-- Enum for affiliate application statuses
CREATE TYPE public.affiliate_application_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- Enum for affiliate payout statuses
CREATE TYPE public.affiliate_payout_status AS ENUM ('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled');


-- ================== TABLES ==================

-- Table for user profiles
-- The 'id' column is a UUID that links to Supabase's 'auth.users' table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Personal Details
    full_name text,
    email text UNIQUE,
    phone_number text,

    -- App-specific fields
    bankid_verified boolean DEFAULT false NOT NULL,
    role public.user_role DEFAULT 'customer' NOT NULL,

    -- Integrations
    stripe_customer_id text
);

-- Table for stylist-specific details (one-to-one with profiles where role = 'stylist')
CREATE TABLE IF NOT EXISTS public.stylist_details (
    profile_id uuid NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Professional Details
    bio text,
    can_travel boolean DEFAULT true NOT NULL,
    has_own_place boolean DEFAULT true NOT NULL,
    travel_distance_km integer, -- Max travel distance in kilometers

    -- Social Media
    instagram_profile text,
    facebook_profile text,
    tiktok_profile text,
    youtube_profile text,
    snapchat_profile text,
    other_social_media_urls text[],

    -- Payment Integration
    stripe_account_id text, -- CRITICAL for stylist payouts via Stripe Connect
    
    -- Identity Verification
    stripe_verification_session_id text, -- Stripe Identity verification session ID
    identity_verification_completed_at timestamp with time zone -- When identity verification was completed
);

-- Table for addresses associated with a user
CREATE TABLE IF NOT EXISTS public.addresses (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Address Details
    nickname text, -- e.g., "Home", "Work"
    street_address text NOT NULL,
    city text NOT NULL,
    postal_code text NOT NULL,
    country text NOT NULL,
    country_code text, -- ISO 3166-1 alpha-2 country code (e.g., NO, DK, SE) from Mapbox geocoding
    entry_instructions text, -- For "how to enter the place"
    location gis.geography(Point, 4326), -- PostGIS geography column for efficient spatial queries

    is_primary boolean DEFAULT false NOT NULL
);

-- Table for service categories and subcategories
CREATE TABLE IF NOT EXISTS public.service_categories (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    parent_category_id uuid REFERENCES public.service_categories(id) ON DELETE SET NULL
);

-- Table for stylist applications, reflecting the form fields
CREATE TABLE IF NOT EXISTS public.applications (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Link to the user profile that is applying (nullable for unauthenticated applications)
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Applicant Information (stored directly, no foreign key dependencies)
    full_name text NOT NULL,
    email text NOT NULL,
    phone_number text NOT NULL,
    birth_date date NOT NULL,

    -- Address Information (stored directly)
    address_nickname text,
    street_address text NOT NULL,
    city text NOT NULL,
    postal_code text NOT NULL,
    country text NOT NULL,
    country_code text, -- ISO 3166-1 alpha-2 country code (e.g., NO, DK, SE) from Mapbox geocoding
    entry_instructions text,
    address_geometry gis.geography(Point, 4326),

    -- Professional Information
    professional_experience text NOT NULL,
    price_range_from integer NOT NULL,
    price_range_to integer NOT NULL,
    price_range_currency text DEFAULT 'NOK' NOT NULL,

    -- Status
    status public.application_status DEFAULT 'applied' NOT NULL
);

-- Junction table to link applications to the service categories they apply for
CREATE TABLE IF NOT EXISTS public.application_categories (
    application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (application_id, category_id)
);


-- Table for services offered by stylists
CREATE TABLE IF NOT EXISTS public.services (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    stylist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    title text NOT NULL,
    description text,
    price numeric(10, 2) NOT NULL,
    currency text DEFAULT 'NOK' NOT NULL,
    duration_minutes integer NOT NULL,

    -- Publishing status
    is_published boolean DEFAULT false NOT NULL,

    -- Location options
    at_customer_place boolean DEFAULT false NOT NULL,
    at_stylist_place boolean DEFAULT true NOT NULL,

    -- Service details
    includes text[], -- What's included in the service (nullable)
    requirements text[], -- Requirements for home services (nullable)
    
    -- Trial session fields
    has_trial_session boolean DEFAULT false NOT NULL,
    trial_session_price numeric(10, 2),
    trial_session_duration_minutes integer,
    trial_session_description text
);

-- Junction table to link services to multiple categories
CREATE TABLE IF NOT EXISTS public.service_service_categories (
    service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (service_id, category_id)
);

-- Table for discounts
CREATE TABLE IF NOT EXISTS public.discounts (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    code text NOT NULL UNIQUE,
    description text,

    -- Discount configuration (either percentage OR fixed amount, not both)
    discount_percentage numeric(5, 2) CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    discount_amount numeric(10, 2), -- In NOK
    currency text DEFAULT 'NOK' NOT NULL,

    -- Usage limits
    max_uses integer, -- NULL means unlimited
    current_uses integer DEFAULT 0 NOT NULL,
    max_uses_per_user integer DEFAULT 1 NOT NULL,

    -- Validity period
    is_active boolean DEFAULT true NOT NULL,
    valid_from timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,

    -- Order amount requirements
    minimum_order_amount numeric(10, 2), -- In NOK
    maximum_order_amount numeric(10, 2), -- In NOK

    CONSTRAINT discount_check CHECK (
        (discount_percentage IS NOT NULL AND discount_amount IS NULL) OR
        (discount_percentage IS NULL AND discount_amount IS NOT NULL)
    )
);


-- Table for booking requests
CREATE TABLE IF NOT EXISTS public.bookings (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stylist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    message_to_stylist text,

    status public.booking_status DEFAULT 'pending' NOT NULL,

    -- Cancellation tracking
    cancelled_at timestamp with time zone,
    cancellation_reason text,

    -- The address where the service will take place (if at customer's place)
    address_id uuid REFERENCES public.addresses(id) ON DELETE SET NULL,

    -- Discount application
    discount_id uuid REFERENCES public.discounts(id) ON DELETE SET NULL,
    discount_applied numeric(10, 2) DEFAULT 0 NOT NULL,

    -- Calculated totals
    total_price numeric(10, 2) NOT NULL,
    total_duration_minutes integer NOT NULL,

    -- Stripe Integration
    stripe_payment_intent_id text,
    needs_destination_update boolean DEFAULT false NOT NULL, -- Payment intent needs destination update when stylist completes onboarding
    
    -- Payment capture tracking
    payment_captured_at timestamp with time zone, -- When payment was captured
    
    -- Payout tracking
    payout_processed_at timestamp with time zone, -- When payout was sent to stylist after service completion
    
    -- Email tracking
    customer_receipt_email_sent_at timestamp with time zone,
    stylist_notification_email_sent_at timestamp with time zone,
    payout_email_sent_at timestamp with time zone, -- When payout notification was sent
    
    -- Reschedule tracking
    rescheduled_from timestamp with time zone, -- Original start time if booking was moved
    rescheduled_at timestamp with time zone, -- When the reschedule happened
    reschedule_reason text, -- Optional message from stylist explaining the reschedule
    
    -- Trial session tracking
    is_trial_session boolean DEFAULT false NOT NULL,
    main_booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE, -- Link from trial to main booking
    trial_booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL -- Link from main to trial booking
);

-- Junction table to link a single booking to multiple services
CREATE TABLE IF NOT EXISTS public.booking_services (
    booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    PRIMARY KEY (booking_id, service_id)
);

-- Junction table for discount user restrictions
CREATE TABLE IF NOT EXISTS public.discount_restrictions (
    discount_id uuid NOT NULL REFERENCES public.discounts(id) ON DELETE CASCADE,
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (discount_id, profile_id)
);

-- Table for tracking discount usage per profile
CREATE TABLE IF NOT EXISTS public.discount_usage (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    discount_id uuid NOT NULL REFERENCES public.discounts(id) ON DELETE CASCADE,
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
    used_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Ensure unique usage per discount per profile per booking (prevents duplicate tracking)
    UNIQUE(discount_id, profile_id, booking_id)
);

-- Table for customer reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,

    booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stylist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text
);

-- Table for detailed payment tracking (one-to-one with bookings)
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
    payment_intent_id text NOT NULL UNIQUE,

    -- Amounts in NOK (stored as numeric for precision)
    original_amount numeric(10, 2) NOT NULL, -- Amount before discounts
    discount_amount numeric(10, 2) DEFAULT 0 NOT NULL,
    final_amount numeric(10, 2) NOT NULL, -- Amount after discounts
    platform_fee numeric(10, 2) NOT NULL,
    stylist_payout numeric(10, 2) NOT NULL,
    affiliate_commission numeric(10, 2) DEFAULT 0 NOT NULL,
    currency text DEFAULT 'NOK' NOT NULL,

    -- Discount tracking
    discount_code text,
    discount_percentage numeric(5, 2), -- If percentage-based discount
    discount_fixed_amount numeric(10, 2), -- If fixed amount discount

    -- Affiliate tracking
    affiliate_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    affiliate_commission_percentage numeric(3, 2), -- Percentage as decimal (0.20 = 20%)

    -- Stripe-specific tracking
    stripe_application_fee_amount integer NOT NULL, -- Stored in øre for Stripe
    stylist_transfer_id text, -- Stripe Transfer ID for funds transferred to stylist's connected account
    needs_destination_update boolean DEFAULT false NOT NULL, -- Payment intent needs destination update when stylist completes onboarding
    
    -- Payment status tracking
    status public.payment_status DEFAULT 'pending' NOT NULL,
    
    -- Timestamps for payment lifecycle
    authorized_at timestamp with time zone, -- When payment was authorized
    captured_at timestamp with time zone, -- When payment was captured (24h before appointment)
    succeeded_at timestamp with time zone, -- When payment fully succeeded
    payout_initiated_at timestamp with time zone,
    payout_completed_at timestamp with time zone,
    
    -- Refund tracking
    refunded_amount numeric(10, 2) DEFAULT 0 NOT NULL,
    refund_reason text
);

-- Table for booking notes created by stylists
CREATE TABLE IF NOT EXISTS public.booking_notes (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    
    booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    stylist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Core content
    content text NOT NULL,
    category public.booking_note_category DEFAULT 'service_notes' NOT NULL,
    
    -- Additional metadata
    customer_visible boolean DEFAULT false NOT NULL,
    duration_minutes integer, -- How long the service actually took
    
    -- Future booking suggestions
    next_appointment_suggestion text,
    tags text[] DEFAULT '{}' NOT NULL
);


-- Table for stylist's general availability rules (e.g., "M-F, 9-5")
CREATE TABLE IF NOT EXISTS public.stylist_availability_rules (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    stylist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    day_of_week public.day_of_week NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    UNIQUE (stylist_id, day_of_week)
);

-- Table for stylist's specific one-off unavailability (e.g., "Vacation" or "Doctor's appointment")
CREATE TABLE IF NOT EXISTS public.stylist_unavailability (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    stylist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    reason text -- optional, e.g., "Holiday"
);

-- Table to store the RECURENCE RULE for a series of unavailabilities
CREATE TABLE IF NOT EXISTS public.stylist_recurring_unavailability (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    stylist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Details about the recurring event
    title text,
    start_time time NOT NULL, -- e.g., '10:00:00'
    end_time time NOT NULL,   -- e.g., '12:00:00'

    -- The date range for the entire series
    series_start_date date NOT NULL,
    series_end_date date, -- NULL if it continues indefinitely

    -- The recurrence rule using the iCalendar standard (e.g., 'FREQ=WEEKLY;BYDAY=TU')
    rrule text NOT NULL
);

-- Table to store EXCEPTIONS for a recurring series
-- e.g., a single instance that is canceled or rescheduled
CREATE TABLE IF NOT EXISTS public.recurring_unavailability_exceptions (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id uuid NOT NULL REFERENCES public.stylist_recurring_unavailability(id) ON DELETE CASCADE,

    -- The original start time of the instance being overridden
    original_start_time timestamp with time zone NOT NULL,

    -- The new times for the exception, NULL if the instance is simply canceled
    new_start_time timestamp with time zone,
    new_end_time timestamp with time zone
);

-- Table for chats between a customer and a stylist, linked to a booking
CREATE TABLE IF NOT EXISTS public.chats (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- A chat is uniquely identified by the booking it's associated with.
    booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE
);

-- Table for chat messages within a chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,

    chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,

    is_read boolean DEFAULT false NOT NULL
);

-- Central table for all media assets
CREATE TABLE IF NOT EXISTS public.media (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- Nullable for application images

    -- The path to the file in Supabase Storage. e.g., 'public/services/service_uuid/image_uuid.jpg'
    file_path text NOT NULL,
    media_type public.media_type NOT NULL,

    -- For service images: mark which one is the preview/main image
    is_preview_image boolean DEFAULT false NOT NULL,

    -- Foreign keys to link media to specific entities
    -- A media item can only be linked to one entity at a time
    service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
    review_id uuid REFERENCES public.reviews(id) ON DELETE CASCADE,
    chat_message_id uuid REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
    booking_note_id uuid REFERENCES public.booking_notes(id) ON DELETE CASCADE
);
-- Note: owner_id links to the uploader. For avatars, media_type = 'avatar' and owner_id is the profile owner.

-- Table for user preferences and notification settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Newsletter and Marketing
    newsletter_subscribed boolean DEFAULT true NOT NULL,
    marketing_emails boolean DEFAULT true NOT NULL,
    promotional_sms boolean DEFAULT true NOT NULL,

    -- Booking Notifications
    booking_confirmations boolean DEFAULT true NOT NULL,
    booking_reminders boolean DEFAULT true NOT NULL,
    booking_cancellations boolean DEFAULT true NOT NULL,
    booking_status_updates boolean DEFAULT true NOT NULL,

    -- Chat and Communication
    chat_messages boolean DEFAULT true NOT NULL,

    -- Stylist-specific Notifications (for stylists)
    new_booking_requests boolean DEFAULT true NOT NULL,
    review_notifications boolean DEFAULT true NOT NULL,
    payment_notifications boolean DEFAULT true NOT NULL,

    -- Application Updates (for pending/applied stylists)
    application_status_updates boolean DEFAULT true NOT NULL,

    -- Delivery Preferences
    email_delivery boolean DEFAULT true NOT NULL,
    sms_delivery boolean DEFAULT true NOT NULL,
    push_notifications boolean DEFAULT true NOT NULL -- Future: for mobile app
);

-- Table for platform configuration settings (managed by admins)
CREATE TABLE IF NOT EXISTS public.platform_config (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Configuration key and value
    config_key text NOT NULL UNIQUE,
    config_value jsonb NOT NULL,
    description text,

    -- Metadata
    is_active boolean DEFAULT true NOT NULL,
    environment text DEFAULT 'production' NOT NULL -- 'production', 'staging', 'development'
);

-- Table for affiliate link applications
CREATE TABLE IF NOT EXISTS public.affiliate_applications (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Applicant information
    stylist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Application details
    reason text NOT NULL, -- Why they want to be an affiliate
    marketing_strategy text, -- How they plan to promote the platform
    expected_referrals integer, -- Estimated referrals per month
    social_media_reach integer, -- Total followers/reach across platforms

    -- Application status
    status public.affiliate_application_status DEFAULT 'pending' NOT NULL,
    reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at timestamp with time zone,
    review_notes text,

    -- Terms agreement
    terms_accepted boolean DEFAULT false NOT NULL,
    terms_accepted_at timestamp with time zone
);

-- Table for affiliate links (one-to-one with approved applications)
CREATE TABLE IF NOT EXISTS public.affiliate_links (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Link ownership
    stylist_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    application_id uuid NOT NULL UNIQUE REFERENCES public.affiliate_applications(id) ON DELETE CASCADE,

    -- Link details
    link_code text NOT NULL UNIQUE, -- Unique identifier for the link (e.g., 'anna-hair-oslo')
    commission_percentage numeric(3, 2) DEFAULT 0.20 NOT NULL, -- Percentage as decimal (0.20 = 20%)

    -- Link status and validity
    is_active boolean DEFAULT true NOT NULL,
    expires_at timestamp with time zone, -- NULL means no expiration
    
    -- Usage tracking
    click_count integer DEFAULT 0 NOT NULL,
    conversion_count integer DEFAULT 0 NOT NULL,
    total_commission_earned numeric(10, 2) DEFAULT 0 NOT NULL,

    -- Metadata
    notes text -- Admin notes about this affiliate link
);

-- Table for tracking affiliate link clicks
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Link tracking
    affiliate_link_id uuid NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
    stylist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Click details
    visitor_id text, -- Anonymous visitor identifier (cookie/session)
    user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- If user is logged in
    
    -- Technical details
    ip_address text,
    user_agent text,
    referrer text,
    landing_page text,

    -- Geographic data (if available)
    country_code text,
    city text,

    -- Conversion tracking
    converted boolean DEFAULT false NOT NULL,
    converted_at timestamp with time zone,
    booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
    commission_amount numeric(10, 2) DEFAULT 0 NOT NULL
);

-- Table for affiliate commission payouts
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Payout details
    stylist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    affiliate_link_id uuid NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,

    -- Payout amount and period
    payout_amount numeric(10, 2) NOT NULL,
    currency text DEFAULT 'NOK' NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,

    -- Commission details
    total_bookings integer NOT NULL,
    total_commission_earned numeric(10, 2) NOT NULL,
    
    -- Payout status
    status public.affiliate_payout_status DEFAULT 'pending' NOT NULL,
    processed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    processed_at timestamp with time zone,
    
    -- Stripe payout tracking
    stripe_transfer_id text,
    stripe_payout_id text,
    
    -- Email tracking
    email_sent boolean DEFAULT false NOT NULL,

    -- Metadata
    notes text
);

-- Table for detailed affiliate commission tracking
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Link to the booking that generated this commission
    booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
    
    -- Link to the affiliate who earned this commission
    affiliate_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Commission details
    amount numeric(10, 2) NOT NULL,
    currency text DEFAULT 'NOK' NOT NULL,
    commission_percentage numeric(5, 2) NOT NULL, -- The percentage used for this commission
    
    -- Status tracking
    status public.affiliate_payout_status DEFAULT 'pending' NOT NULL,
    
    -- Payout tracking
    payout_id uuid REFERENCES public.affiliate_payouts(id) ON DELETE SET NULL,
    paid_at timestamp with time zone,
    
    -- Additional metadata
    notes text,
    
    -- Ensure only one commission per booking (prevents duplicate payouts)
    CONSTRAINT affiliate_commissions_booking_affiliate_unique UNIQUE (booking_id, affiliate_id)
);

-- ================== TRIGGERS AND FUNCTIONS ==================

-- Function to update the 'updated_at' column automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role public.user_role;
BEGIN
  -- Safely extract and validate the role from metadata
  BEGIN
    -- Try to get role from user_metadata first, then app_metadata, then default to customer
    IF NEW.raw_user_meta_data ? 'role' THEN
      user_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
    ELSIF NEW.raw_app_meta_data ? 'role' THEN
      user_role := (NEW.raw_app_meta_data->>'role')::public.user_role;
    ELSE
      user_role := 'customer'::public.user_role;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If role casting fails, default to customer
    user_role := 'customer'::public.user_role;
  END;

  -- Insert the user profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone_number,
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'phone_number',
    user_role
  );

  -- Insert default user preferences
  INSERT INTO public.user_preferences (
    user_id,
    -- Newsletter and Marketing (defaults from schema)
    newsletter_subscribed,
    marketing_emails,
    promotional_sms,
    -- Booking Notifications (defaults from schema)
    booking_confirmations,
    booking_reminders,
    booking_cancellations,
    booking_status_updates,
    -- Chat and Communication (defaults from schema)
    chat_messages,
    -- Stylist-specific Notifications (defaults from schema)
    new_booking_requests,
    review_notifications,
    payment_notifications,
    -- Application Updates (defaults from schema)
    application_status_updates,
    -- Delivery Preferences (defaults from schema)
    email_delivery,
    sms_delivery,
    push_notifications
  ) VALUES (
    NEW.id,
    -- Newsletter and Marketing
    true, -- newsletter_subscribed
    true,  -- marketing_emails
    true, -- promotional_sms
    -- Booking Notifications
    true,  -- booking_confirmations
    true,  -- booking_reminders
    true,  -- booking_cancellations
    true,  -- booking_status_updates
    -- Chat and Communication
    true,  -- chat_messages
    -- Stylist-specific Notifications
    true,  -- new_booking_requests
    true,  -- review_notifications
    true,  -- payment_notifications
    -- Application Updates
    true,  -- application_status_updates
    -- Delivery Preferences
    true,  -- email_delivery
    true, -- sms_delivery
    true-- push_notifications
  );

  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER SET search_path = public;

-- Triggers to automatically update the 'updated_at' column on relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stylist_details_updated_at BEFORE UPDATE ON public.stylist_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_discounts_updated_at BEFORE UPDATE ON public.discounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON public.chats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_booking_notes_updated_at BEFORE UPDATE ON public.booking_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_platform_config_updated_at BEFORE UPDATE ON public.platform_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_affiliate_applications_updated_at BEFORE UPDATE ON public.affiliate_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_affiliate_links_updated_at BEFORE UPDATE ON public.affiliate_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_affiliate_payouts_updated_at BEFORE UPDATE ON public.affiliate_payouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_affiliate_commissions_updated_at BEFORE UPDATE ON public.affiliate_commissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to automatically create a profile when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to broadcast chat message read status changes
CREATE OR REPLACE FUNCTION public.broadcast_chat_message_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only broadcast when is_read status changes
  IF TG_OP = 'UPDATE' AND OLD.is_read != NEW.is_read THEN
    PERFORM realtime.send(
      jsonb_build_object(
        'type', 'message_read_status_change',
        'chat_id', NEW.chat_id,
        'message_id', NEW.id,
        'is_read', NEW.is_read,
        'sender_id', NEW.sender_id
      ),
      'chat_message_read_status',
      'booking-' || (
        SELECT b.id::text 
        FROM public.chats c 
        JOIN public.bookings b ON c.booking_id = b.id 
        WHERE c.id = NEW.chat_id
      ),
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to broadcast chat message read status changes
CREATE TRIGGER broadcast_chat_message_read_status_trigger
AFTER UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.broadcast_chat_message_changes();

-- ================== PERMISSIONS ==================

-- Grant access to the gis schema for PostGIS functions
GRANT USAGE ON SCHEMA gis TO anon, authenticated, service_role;

-- ================== FUNCTIONS ==================

-- Function to get all payments with customer and stylist details for admin
CREATE OR REPLACE FUNCTION public.get_admin_payments(
  search_term text DEFAULT NULL,
  status_filter text DEFAULT NULL,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  booking_id uuid,
  payment_intent_id text,
  original_amount numeric,
  discount_amount numeric,
  final_amount numeric,
  platform_fee numeric,
  stylist_payout numeric,
  affiliate_commission numeric,
  currency text,
  discount_code text,
  status payment_status,
  captured_at timestamptz,
  succeeded_at timestamptz,
  refunded_amount numeric,
  refund_reason text,
  customer_id uuid,
  customer_name text,
  customer_email text,
  stylist_id uuid,
  stylist_name text,
  stylist_email text,
  booking_date timestamptz
)
SET search_path = ''
LANGUAGE sql
AS $$
  SELECT 
    p.id,
    p.created_at,
    p.updated_at,
    p.booking_id,
    p.payment_intent_id,
    p.original_amount,
    p.discount_amount,
    p.final_amount,
    p.platform_fee,
    p.stylist_payout,
    p.affiliate_commission,
    p.currency,
    p.discount_code,
    p.status,
    p.captured_at,
    p.succeeded_at,
    p.refunded_amount,
    p.refund_reason,
    -- Customer data
    customer.id as customer_id,
    customer.full_name as customer_name,
    customer.email as customer_email,
    -- Stylist data  
    stylist.id as stylist_id,
    stylist.full_name as stylist_name,
    stylist.email as stylist_email,
    -- Booking data
    b.start_time as booking_date
  FROM public.payments p
  JOIN public.bookings b ON p.booking_id = b.id
  JOIN public.profiles customer ON b.customer_id = customer.id  
  JOIN public.profiles stylist ON b.stylist_id = stylist.id
  WHERE 
    -- Status filter
    (status_filter IS NULL OR p.status::text = status_filter OR 
     (status_filter = 'refunded' AND p.refunded_amount > 0) OR
     (status_filter = 'processing' AND p.status IN ('requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'requires_capture')))
    -- Search filter
    AND (search_term IS NULL OR 
         customer.full_name ILIKE '%' || search_term || '%' OR
         customer.email ILIKE '%' || search_term || '%' OR
         stylist.full_name ILIKE '%' || search_term || '%' OR
         stylist.email ILIKE '%' || search_term || '%' OR
         p.payment_intent_id ILIKE '%' || search_term || '%' OR
         p.discount_code ILIKE '%' || search_term || '%')
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
$$;

-- Function to find nearby addresses within a given radius
CREATE OR REPLACE FUNCTION public.nearby_addresses(lat float, long float, radius_km float DEFAULT 10.0)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  nickname text,
  street_address text,
  city text,
  postal_code text,
  country text,
  entry_instructions text,
  is_primary boolean,
  lat float,
  long float,
  distance_meters float
)
SET search_path = ''
LANGUAGE sql
AS $$
  SELECT 
    a.id,
    a.user_id,
    a.nickname,
    a.street_address,
    a.city,
    a.postal_code,
    a.country,
    a.entry_instructions,
    a.is_primary,
    gis.st_y(a.location::gis.geometry) as lat,
    gis.st_x(a.location::gis.geometry) as long,
    gis.st_distance(a.location, gis.st_point(long, lat)::gis.geography) as distance_meters
  FROM public.addresses a
  WHERE a.location IS NOT NULL
    AND gis.st_distance(a.location, gis.st_point(long, lat)::gis.geography) <= (radius_km * 1000)
  ORDER BY a.location operator(gis.<->) gis.st_point(long, lat)::gis.geography;
$$;

-- Function to find traditional services (non-geographical) with comprehensive filtering
CREATE OR REPLACE FUNCTION public.traditional_services(
  search_term text DEFAULT NULL,
  category_ids text[] DEFAULT NULL,
  min_price_ore integer DEFAULT NULL,
  max_price_ore integer DEFAULT NULL,
  at_customer_place boolean DEFAULT NULL,
  at_stylist_place boolean DEFAULT NULL,
  stylist_ids text[] DEFAULT NULL,
  city_filter text DEFAULT NULL,
  sort_by text DEFAULT 'newest',
  limit_count integer DEFAULT 12,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  service_id uuid,
  service_title text,
  service_description text,
  service_price numeric,
  service_currency text,
  service_duration_minutes integer,
  service_at_customer_place boolean,
  service_at_stylist_place boolean,
  service_is_published boolean,
  service_created_at timestamptz,
  service_has_trial_session boolean,
  service_trial_session_price numeric,
  service_trial_session_duration_minutes integer,
  service_trial_session_description text,
  stylist_id uuid,
  stylist_full_name text,
  stylist_bio text,
  stylist_can_travel boolean,
  stylist_has_own_place boolean,
  address_id uuid,
  address_street_address text,
  address_city text,
  address_postal_code text,
  address_country text,
  average_rating numeric,
  total_reviews integer
)
SET search_path = ''
LANGUAGE sql
AS $$
  WITH service_ratings AS (
    SELECT 
      s.id as service_id,
      AVG(r.rating) as average_rating,
      COUNT(r.rating) as total_reviews
    FROM public.services s
    LEFT JOIN public.booking_services bs ON s.id = bs.service_id
    LEFT JOIN public.bookings b ON bs.booking_id = b.id
    LEFT JOIN public.reviews r ON r.booking_id = b.id
    GROUP BY s.id
  )
  SELECT 
    s.id as service_id,
    s.title as service_title,
    s.description as service_description,
    s.price as service_price,
    s.currency as service_currency,
    s.duration_minutes as service_duration_minutes,
    s.at_customer_place as service_at_customer_place,
    s.at_stylist_place as service_at_stylist_place,
    s.is_published as service_is_published,
    s.created_at as service_created_at,
    s.has_trial_session as service_has_trial_session,
    s.trial_session_price as service_trial_session_price,
    s.trial_session_duration_minutes as service_trial_session_duration_minutes,
    s.trial_session_description as service_trial_session_description,
    p.id as stylist_id,
    p.full_name as stylist_full_name,
    sd.bio as stylist_bio,
    sd.can_travel as stylist_can_travel,
    sd.has_own_place as stylist_has_own_place,
    a.id as address_id,
    a.street_address as address_street_address,
    a.city as address_city,
    a.postal_code as address_postal_code,
    a.country as address_country,
    COALESCE(sr.average_rating, 0) as average_rating,
    COALESCE(sr.total_reviews, 0) as total_reviews
  FROM public.services s
  INNER JOIN public.profiles p ON s.stylist_id = p.id
  LEFT JOIN public.stylist_details sd ON p.id = sd.profile_id
  LEFT JOIN public.addresses a ON a.user_id = p.id AND a.is_primary = true
  LEFT JOIN service_ratings sr ON s.id = sr.service_id
  WHERE 
    -- Service must be published
    s.is_published = true
    -- CRITICAL: Only include services from verified stylists
    AND sd.identity_verification_completed_at IS NOT NULL
    -- Search term filtering
    AND (
      search_term IS NULL 
      OR s.title ILIKE '%' || search_term || '%'
      OR s.description ILIKE '%' || search_term || '%'
    )
    -- Category filtering
    AND (
      category_ids IS NULL
      OR EXISTS (
        SELECT 1 FROM public.service_service_categories ssc
        WHERE ssc.service_id = s.id AND ssc.category_id::text = ANY(category_ids)
      )
    )
    -- Price filtering (prices stored as numeric, convert to øre for comparison)
    AND (min_price_ore IS NULL OR (s.price * 100)::integer >= min_price_ore)
    AND (max_price_ore IS NULL OR (s.price * 100)::integer <= max_price_ore)
    -- Service destination filtering
    AND (
      (at_customer_place IS NULL OR s.at_customer_place = at_customer_place)
      OR (at_stylist_place IS NULL OR s.at_stylist_place = at_stylist_place)
      OR (at_customer_place IS NULL AND at_stylist_place IS NULL)
    )
    -- Stylist filtering
    AND (stylist_ids IS NULL OR p.id::text = ANY(stylist_ids))
    -- City filtering (text-based location matching)
    AND (city_filter IS NULL OR a.city ILIKE '%' || city_filter || '%')
  ORDER BY 
    CASE 
      WHEN sort_by = 'price_asc' THEN s.price
      ELSE NULL
    END ASC,
    CASE 
      WHEN sort_by = 'price_desc' THEN s.price
      ELSE NULL
    END DESC,
    CASE 
      WHEN sort_by = 'rating_desc' THEN COALESCE(sr.average_rating, 0)
      ELSE NULL
    END DESC,
    CASE 
      WHEN sort_by = 'rating_asc' THEN COALESCE(sr.average_rating, 0)
      ELSE NULL
    END ASC,
    CASE 
      WHEN sort_by = 'newest' THEN s.created_at
      ELSE NULL
    END DESC,
    -- Default fallback ordering
    s.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
$$;

-- Function to find nearby services within a given radius with comprehensive filtering
CREATE OR REPLACE FUNCTION public.nearby_services(
  lat float, 
  long float, 
  radius_km float DEFAULT 10.0,
  search_term text DEFAULT NULL,
  category_ids text[] DEFAULT NULL,
  min_price_ore integer DEFAULT NULL,
  max_price_ore integer DEFAULT NULL,
  at_customer_place boolean DEFAULT NULL,
  at_stylist_place boolean DEFAULT NULL,
  stylist_ids text[] DEFAULT NULL,
  sort_by text DEFAULT 'distance_asc'
)
RETURNS TABLE (
  service_id uuid,
  service_title text,
  service_description text,
  service_price numeric,
  service_currency text,
  service_duration_minutes integer,
  service_at_customer_place boolean,
  service_at_stylist_place boolean,
  service_is_published boolean,
  service_created_at timestamptz,
  service_has_trial_session boolean,
  service_trial_session_price numeric,
  service_trial_session_duration_minutes integer,
  service_trial_session_description text,
  stylist_id uuid,
  stylist_full_name text,
  stylist_bio text,
  stylist_can_travel boolean,
  stylist_has_own_place boolean,
  address_id uuid,
  address_street_address text,
  address_city text,
  address_postal_code text,
  address_country text,
  address_lat float,
  address_lng float,
  distance_meters float,
  average_rating numeric,
  total_reviews integer
)
SET search_path = ''
LANGUAGE sql
AS $$
  WITH service_ratings AS (
    SELECT 
      s.id as service_id,
      AVG(r.rating) as average_rating,
      COUNT(r.rating) as total_reviews
    FROM public.services s
    LEFT JOIN public.booking_services bs ON s.id = bs.service_id
    LEFT JOIN public.bookings b ON bs.booking_id = b.id
    LEFT JOIN public.reviews r ON r.booking_id = b.id
    GROUP BY s.id
  )
  SELECT 
    s.id as service_id,
    s.title as service_title,
    s.description as service_description,
    s.price as service_price,
    s.currency as service_currency,
    s.duration_minutes as service_duration_minutes,
    s.at_customer_place as service_at_customer_place,
    s.at_stylist_place as service_at_stylist_place,
    s.is_published as service_is_published,
    s.created_at as service_created_at,
    s.has_trial_session as service_has_trial_session,
    s.trial_session_price as service_trial_session_price,
    s.trial_session_duration_minutes as service_trial_session_duration_minutes,
    s.trial_session_description as service_trial_session_description,
    p.id as stylist_id,
    p.full_name as stylist_full_name,
    sd.bio as stylist_bio,
    sd.can_travel as stylist_can_travel,
    sd.has_own_place as stylist_has_own_place,
    a.id as address_id,
    a.street_address as address_street_address,
    a.city as address_city,
    a.postal_code as address_postal_code,
    a.country as address_country,
    gis.st_y(a.location::gis.geometry) as address_lat,
    gis.st_x(a.location::gis.geometry) as address_lng,
    gis.st_distance(a.location, gis.st_point(long, lat)::gis.geography) as distance_meters,
    COALESCE(sr.average_rating, 0) as average_rating,
    COALESCE(sr.total_reviews, 0) as total_reviews
  FROM public.services s
  INNER JOIN public.profiles p ON s.stylist_id = p.id
  LEFT JOIN public.stylist_details sd ON p.id = sd.profile_id
  INNER JOIN public.addresses a ON a.user_id = p.id AND a.is_primary = true
  LEFT JOIN service_ratings sr ON s.id = sr.service_id
  WHERE 
    -- Geographic constraint
    a.location IS NOT NULL
    AND gis.st_distance(a.location, gis.st_point(long, lat)::gis.geography) <= (radius_km * 1000)
    -- Service must be published
    AND s.is_published = true
    -- CRITICAL: Only include services from verified stylists
    AND sd.identity_verification_completed_at IS NOT NULL
    -- Search term filtering
    AND (
      search_term IS NULL 
      OR s.title ILIKE '%' || search_term || '%'
      OR s.description ILIKE '%' || search_term || '%'
    )
    -- Category filtering
    AND (
      category_ids IS NULL
      OR EXISTS (
        SELECT 1 FROM public.service_service_categories ssc
        WHERE ssc.service_id = s.id AND ssc.category_id::text = ANY(category_ids)
      )
    )
    -- Price filtering (prices stored as numeric, convert to øre for comparison)
    AND (min_price_ore IS NULL OR (s.price * 100)::integer >= min_price_ore)
    AND (max_price_ore IS NULL OR (s.price * 100)::integer <= max_price_ore)
    -- Service destination filtering
    AND (
      (at_customer_place IS NULL OR s.at_customer_place = at_customer_place)
      OR (at_stylist_place IS NULL OR s.at_stylist_place = at_stylist_place)
      OR (at_customer_place IS NULL AND at_stylist_place IS NULL)
    )
    -- Stylist filtering
    AND (stylist_ids IS NULL OR p.id::text = ANY(stylist_ids))
  ORDER BY 
    CASE 
      WHEN sort_by = 'distance_asc' THEN gis.st_distance(a.location, gis.st_point(long, lat)::gis.geography)
      ELSE NULL
    END ASC,
    CASE 
      WHEN sort_by = 'price_asc' THEN s.price
      ELSE NULL
    END ASC,
    CASE 
      WHEN sort_by = 'price_desc' THEN s.price
      ELSE NULL
    END DESC,
    CASE 
      WHEN sort_by = 'rating_desc' THEN COALESCE(sr.average_rating, 0)
      ELSE NULL
    END DESC,
    CASE 
      WHEN sort_by = 'rating_asc' THEN COALESCE(sr.average_rating, 0)
      ELSE NULL
    END ASC,
    CASE 
      WHEN sort_by = 'newest' THEN s.created_at
      ELSE NULL
    END DESC,
    -- Default fallback ordering
    gis.st_distance(a.location, gis.st_point(long, lat)::gis.geography) ASC;
$$;

-- ================== INDEXES ==================

-- Spatial index for efficient geographic queries on addresses
CREATE INDEX IF NOT EXISTS idx_addresses_location ON public.addresses USING gist (location);

-- Indexes for affiliate system performance
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_link_id ON public.affiliate_clicks(affiliate_link_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_user_id ON public.affiliate_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_booking_id ON public.affiliate_clicks(booking_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_created_at ON public.affiliate_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_link_code ON public.affiliate_links(link_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_stylist_id ON public.affiliate_links(stylist_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_email_sent ON public.affiliate_payouts(email_sent);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_booking_id ON public.affiliate_commissions(booking_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON public.affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_payout_id ON public.affiliate_commissions(payout_id);
CREATE INDEX IF NOT EXISTS idx_payments_affiliate_id ON public.payments(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- ================== DEFAULT DATA ==================
-- Platform configuration will be managed at the application level
-- No automatic insertion of platform config data