-- Create a public schema for all tables
CREATE SCHEMA IF NOT EXISTS public;

-- ================== ENUMS ==================

-- Enum for user roles 
CREATE TYPE public.user_role AS ENUM ('customer', 'stylist', 'admin');

-- Enum for booking statuses
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Enum for application statuses
CREATE TYPE public.application_status AS ENUM ('applied', 'pending_info', 'rejected', 'approved');

-- Enum for different types of media, adding application and review images
CREATE TYPE public.media_type AS ENUM ('avatar', 'service_image', 'review_image', 'chat_image', 'application_image', 'landing_asset', 'logo_asset', 'other');

-- Enum for days of the week for stylist availability rules
CREATE TYPE public.day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');


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
    stripe_customer_id text,
    subscribed_to_newsletter boolean DEFAULT false NOT NULL
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
    entry_instructions text, -- For "how to enter the place"
    latitude double precision,
    longitude double precision,

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
    entry_instructions text,

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
    duration_minutes integer NOT NULL,

    category_id uuid NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,

    -- Location options
    at_customer_place boolean DEFAULT false NOT NULL,
    at_stylist_place boolean DEFAULT true NOT NULL
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

    -- The address where the service will take place (if at customer's place)
    address_id uuid REFERENCES public.addresses(id) ON DELETE SET NULL,

    -- Calculated totals
    total_price numeric(10, 2) NOT NULL,
    total_duration_minutes integer NOT NULL,

    -- Stripe Integration
    stripe_payment_intent_id text
);

-- Junction table to link a single booking to multiple services
CREATE TABLE IF NOT EXISTS public.booking_services (
    booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    PRIMARY KEY (booking_id, service_id)
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
    file_path text NOT NULL UNIQUE,
    media_type public.media_type NOT NULL,

    -- Foreign keys to link media to specific entities
    -- A media item can only be linked to one entity at a time
    service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
    review_id uuid REFERENCES public.reviews(id) ON DELETE CASCADE,
    chat_message_id uuid REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE
);
-- Note: owner_id links to the uploader. For avatars, media_type = 'avatar' and owner_id is the profile owner.

-- ================== TRIGGERS AND FUNCTIONS ==================

-- Function to update the 'updated_at' column automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update the 'updated_at' column on relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON public.chats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();