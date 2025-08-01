-- Create a public schema for all tables
CREATE SCHEMA IF NOT EXISTS public;

-- ================== ENUMS ==================

-- Enum for user roles
CREATE TYPE public.user_role AS ENUM ('customer', 'stylist', 'studio', 'admin');

-- Enum for booking statuses
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Enum for application types
CREATE TYPE public.application_type AS ENUM ('stylist', 'studio');

-- Enum for application statuses
CREATE TYPE public.application_status AS ENUM ('applied', 'pending_info', 'rejected', 'approved');

-- Enum for different types of media
CREATE TYPE public.media_type AS ENUM ('avatar', 'service_image', 'review_image', 'chat_image', 'landing_asset', 'logo_asset', 'other');

-- ================== TABLES ==================

-- Table for user profiles
-- The 'id' column is a UUID that links to Supabase's 'auth.users' table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  
  full_name text,
  avatar_url text, -- We can keep this simple for avatars, as it's a single image
  email text,
  phone_number text,
  gender text,
  
  bankid_verified boolean DEFAULT false NOT NULL,
  role public.user_role DEFAULT 'customer' NOT NULL,
  
  stripe_customer_id text,
  subscribed_to_newsletter boolean DEFAULT false NOT NULL
);

-- Table for addresses associated with a user
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  nickname text,
  street_address text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL,
  latitude double precision,
  longitude double precision,
  
  is_home_address boolean DEFAULT false NOT NULL
);

-- Table for service categories and subcategories
CREATE TABLE IF NOT EXISTS public.service_categories (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  parent_category_id uuid REFERENCES public.service_categories(id)
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
  
  category_id uuid NOT NULL REFERENCES public.service_categories(id),
  
  at_customers_place boolean DEFAULT false NOT NULL,
  at_stylists_place boolean DEFAULT true NOT NULL
);

-- Table for booking requests
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stylist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  message_to_stylist text,
  
  status public.booking_status DEFAULT 'pending' NOT NULL,
  
  address_id uuid REFERENCES public.addresses(id) ON DELETE SET NULL,
  
  stripe_payment_intent_id text,
  stripe_payment_status text
);

-- Table for stylist's unavailability
CREATE TABLE IF NOT EXISTS public.stylist_unavailability (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL
);

-- Table for stylist and studio applications
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  application_type public.application_type NOT NULL,
  application_status public.application_status DEFAULT 'applied' NOT NULL
  
  -- TODO: Add columns for form data when we know what we need
);

-- Table for chats between a customer and a stylist
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,

  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stylist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE
);

-- Table for chat messages within a chat
-- Note: 'media_url' is removed, and images will be a separate 'media' entry
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  
  is_read boolean DEFAULT false NOT NULL
);

-- Table for all media assets
CREATE TABLE IF NOT EXISTS public.media (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- The path to the file in Supabase Storage
  file_path text NOT NULL,
  
  -- The type of media this is
  media_type public.media_type NOT NULL,
  
  -- Links to a specific chat message, if applicable
  chat_message_id uuid REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  
  -- Links to a specific service, if applicable
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  
  -- The user who owns this media asset
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
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

-- Triggers to automatically update the 'updated_at' column
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON public.chats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();