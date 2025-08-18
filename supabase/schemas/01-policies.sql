ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylist_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylist_availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylist_unavailability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylist_recurring_unavailability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_unavailability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- A function to check the current user's role (recommended for performance).
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role::public.user_role FROM public.profiles WHERE id = auth.uid();
$$;

-- Profiles are public and can be viewed by anyone.
CREATE POLICY "Profiles are viewable by everyone." ON public.profiles
FOR SELECT TO anon, authenticated
USING ( true );

-- Allow the trigger function to create profiles for new users.
CREATE POLICY "Profiles can be created by trigger function." ON public.profiles
FOR INSERT TO authenticated
WITH CHECK ( true );

-- A user can update their own profile.
CREATE POLICY "Users can update their own profile." ON public.profiles
FOR UPDATE TO authenticated
USING ( (select auth.uid()) = id )
WITH CHECK ( (select auth.uid()) = id );

-- Stylist details are viewable by everyone (for displaying stylist profiles).
CREATE POLICY "Stylist details are viewable by everyone." ON public.stylist_details
FOR SELECT TO anon, authenticated
USING ( true );

-- Stylists can create their own details.
CREATE POLICY "Stylists can create their own details." ON public.stylist_details
FOR INSERT TO authenticated
WITH CHECK ( (select auth.uid()) = profile_id );

-- Stylists can update their own details.
CREATE POLICY "Stylists can update their own details." ON public.stylist_details
FOR UPDATE TO authenticated
USING ( (select auth.uid()) = profile_id )
WITH CHECK ( (select auth.uid()) = profile_id );

-- Stylists can delete their own details.
CREATE POLICY "Stylists can delete their own details." ON public.stylist_details
FOR DELETE TO authenticated
USING ( (select auth.uid()) = profile_id );

-- A user can view their own addresses.
CREATE POLICY "Users can view their own addresses." ON public.addresses
FOR SELECT TO authenticated
USING ( (select auth.uid()) = user_id );

-- A user can create an address for themselves.
CREATE POLICY "Users can insert their own addresses." ON public.addresses
FOR INSERT TO authenticated
WITH CHECK ( (select auth.uid()) = user_id );

-- A user can update their own addresses.
CREATE POLICY "Users can update their own addresses." ON public.addresses
FOR UPDATE TO authenticated
USING ( (select auth.uid()) = user_id )
WITH CHECK ( (select auth.uid()) = user_id );

-- A user can delete their own addresses.
CREATE POLICY "Users can delete their own addresses." ON public.addresses
FOR DELETE TO authenticated
USING ( (select auth.uid()) = user_id );

-- All services are public and can be viewed by anyone.
CREATE POLICY "Services are viewable by everyone." ON public.services
FOR SELECT TO anon, authenticated
USING ( true );

-- Stylists can create new services for themselves.
CREATE POLICY "Stylists can create services." ON public.services
FOR INSERT TO authenticated
WITH CHECK ( (select auth.uid()) = stylist_id );

-- Stylists can update their own services.
CREATE POLICY "Stylists can update their own services." ON public.services
FOR UPDATE TO authenticated
USING ( (select auth.uid()) = stylist_id )
WITH CHECK ( (select auth.uid()) = stylist_id );

-- Stylists can delete their own services.
CREATE POLICY "Stylists can delete their own services." ON public.services
FOR DELETE TO authenticated
USING ( (select auth.uid()) = stylist_id );

-- Service-category relationships are viewable by everyone (since services are public).
CREATE POLICY "Service categories relationships are viewable by everyone." ON public.service_service_categories
FOR SELECT TO anon, authenticated
USING ( true );

-- Stylists can manage categories for their own services.
CREATE POLICY "Stylists can add categories to their own services." ON public.service_service_categories
FOR INSERT TO authenticated
WITH CHECK (
  service_id IN (
    SELECT id FROM public.services WHERE stylist_id = (select auth.uid())
  )
);

-- Stylists can remove categories from their own services.
CREATE POLICY "Stylists can remove categories from their own services." ON public.service_service_categories
FOR DELETE TO authenticated
USING (
  service_id IN (
    SELECT id FROM public.services WHERE stylist_id = (select auth.uid())
  )
);

-- Customers and stylists can view bookings they are involved in.
CREATE POLICY "Users can view their own bookings." ON public.bookings
FOR SELECT TO authenticated
USING ( (select auth.uid()) = customer_id OR (select auth.uid()) = stylist_id );

-- Customers can create bookings for themselves.
CREATE POLICY "Customers can create bookings." ON public.bookings
FOR INSERT TO authenticated
WITH CHECK ( (select auth.uid()) = customer_id );

-- Customers and stylists can update bookings they are involved in.
CREATE POLICY "Users can update their own bookings." ON public.bookings
FOR UPDATE TO authenticated
USING ( (select auth.uid()) = customer_id OR (select auth.uid()) = stylist_id );

-- Users can view services for bookings they are part of.
CREATE POLICY "Users can view services on their bookings." ON public.booking_services
FOR SELECT TO authenticated
USING (
  booking_id IN (
    SELECT id FROM public.bookings WHERE customer_id = (select auth.uid()) OR stylist_id = (select auth.uid())
  )
);

-- Customers can add services to their own new bookings.
CREATE POLICY "Customers can add services to bookings." ON public.booking_services
FOR INSERT TO authenticated
WITH CHECK (
  booking_id IN (
    SELECT id FROM public.bookings WHERE customer_id = (select auth.uid())
  )
);

-- All reviews are public and can be viewed by anyone.
CREATE POLICY "Reviews are viewable by everyone." ON public.reviews
FOR SELECT TO anon, authenticated
USING ( true );

-- Customers can create reviews for their own bookings.
CREATE POLICY "Customers can create reviews." ON public.reviews
FOR INSERT TO authenticated
WITH CHECK ( (select auth.uid()) = customer_id );

-- Customers can update their own reviews.
CREATE POLICY "Customers can update their own reviews." ON public.reviews
FOR UPDATE TO authenticated
USING ( (select auth.uid()) = customer_id )
WITH CHECK ( (select auth.uid()) = customer_id );

-- Customers can delete their own reviews.
CREATE POLICY "Customers can delete their own reviews." ON public.reviews
FOR DELETE TO authenticated
USING ( (select auth.uid()) = customer_id );

-- Payment records can be viewed by involved parties (customer, stylist) and admins.
CREATE POLICY "Users can view payments for their bookings." ON public.payments
FOR SELECT TO authenticated
USING (
  booking_id IN (
    SELECT id FROM public.bookings 
    WHERE customer_id = (select auth.uid()) OR stylist_id = (select auth.uid())
  ) OR public.get_my_role() = 'admin'
);

-- Discounts are viewable by everyone (to validate codes).
CREATE POLICY "Discounts are viewable by everyone." ON public.discounts
FOR SELECT TO anon, authenticated
USING ( true );

-- Only admins can manage discounts.
CREATE POLICY "Only admins can insert discounts." ON public.discounts
FOR INSERT TO authenticated
WITH CHECK ( public.get_my_role() = 'admin' );

CREATE POLICY "Only admins can update discounts." ON public.discounts
FOR UPDATE TO authenticated
USING ( public.get_my_role() = 'admin' );

CREATE POLICY "Only admins can delete discounts." ON public.discounts
FOR DELETE TO authenticated
USING ( public.get_my_role() = 'admin' );

-- Authenticated users can view stylist availability to enable booking.
CREATE POLICY "Availability is viewable by authenticated users." ON public.stylist_availability_rules FOR SELECT TO authenticated USING ( true );
CREATE POLICY "Unavailability is viewable by authenticated users." ON public.stylist_unavailability FOR SELECT TO authenticated USING ( true );
CREATE POLICY "Recurring unavailability is viewable by authenticated users." ON public.stylist_recurring_unavailability FOR SELECT TO authenticated USING ( true );
CREATE POLICY "Availability exceptions are viewable by authenticated users." ON public.recurring_unavailability_exceptions FOR SELECT TO authenticated USING ( true );

-- Stylists can manage their own availability records.
CREATE POLICY "Stylists can insert their own availability rules." ON public.stylist_availability_rules FOR INSERT WITH CHECK (stylist_id = (select auth.uid()));
CREATE POLICY "Stylists can update their own availability rules." ON public.stylist_availability_rules FOR UPDATE USING (stylist_id = (select auth.uid()));
CREATE POLICY "Stylists can delete their own availability rules." ON public.stylist_availability_rules FOR DELETE USING (stylist_id = (select auth.uid()));

CREATE POLICY "Stylists can insert their own unavailability." ON public.stylist_unavailability FOR INSERT WITH CHECK (stylist_id = (select auth.uid()));
CREATE POLICY "Stylists can update their own unavailability." ON public.stylist_unavailability FOR UPDATE USING (stylist_id = (select auth.uid()));
CREATE POLICY "Stylists can delete their own unavailability." ON public.stylist_unavailability FOR DELETE USING (stylist_id = (select auth.uid()));

CREATE POLICY "Stylists can insert recurring unavailability." ON public.stylist_recurring_unavailability FOR INSERT WITH CHECK (stylist_id = (select auth.uid()));
CREATE POLICY "Stylists can update recurring unavailability." ON public.stylist_recurring_unavailability FOR UPDATE USING (stylist_id = (select auth.uid()));
CREATE POLICY "Stylists can delete recurring unavailability." ON public.stylist_recurring_unavailability FOR DELETE USING (stylist_id = (select auth.uid()));

CREATE POLICY "Stylists can insert availability exceptions." ON public.recurring_unavailability_exceptions FOR INSERT WITH CHECK (
  series_id IN (SELECT id FROM public.stylist_recurring_unavailability WHERE stylist_id = (select auth.uid()))
);
CREATE POLICY "Stylists can update availability exceptions." ON public.recurring_unavailability_exceptions FOR UPDATE USING (
  series_id IN (SELECT id FROM public.stylist_recurring_unavailability WHERE stylist_id = (select auth.uid()))
);
CREATE POLICY "Stylists can delete availability exceptions." ON public.recurring_unavailability_exceptions FOR DELETE USING (
  series_id IN (SELECT id FROM public.stylist_recurring_unavailability WHERE stylist_id = (select auth.uid()))
);

-- Users can view chats they are a part of.
CREATE POLICY "Users can view their own chats." ON public.chats
FOR SELECT TO authenticated
USING (
  (select auth.uid()) IN (
    SELECT customer_id FROM public.bookings WHERE id = booking_id
  ) OR (select auth.uid()) IN (
    SELECT stylist_id FROM public.bookings WHERE id = booking_id
  )
);

-- Users can view messages in chats they are a part of.
CREATE POLICY "Users can view messages in their own chats." ON public.chat_messages
FOR SELECT TO authenticated
USING (
  chat_id IN (
    SELECT id FROM public.chats
  )
);

-- Users can send messages in chats they are a part of.
CREATE POLICY "Users can insert messages in their own chats." ON public.chat_messages
FOR INSERT TO authenticated
WITH CHECK (
  (select auth.uid()) = sender_id AND
  chat_id IN (
    SELECT id FROM public.chats
  )
);

-- Public media is viewable by everyone.
CREATE POLICY "Public media is viewable by everyone." ON public.media
FOR SELECT TO anon, authenticated
USING ( media_type IN ('avatar', 'service_image', 'review_image', 'landing_asset', 'logo_asset') );

-- Chat images are viewable by chat participants.
CREATE POLICY "Chat images are viewable by participants." ON public.media
FOR SELECT TO authenticated
USING (
  media_type = 'chat_image' AND
  chat_message_id IN (SELECT id FROM public.chat_messages)
);

-- Users can upload media they own.
CREATE POLICY "Users can insert their own media." ON public.media
FOR INSERT TO authenticated
WITH CHECK ( (select auth.uid()) = owner_id );

-- Users can delete their own media.
CREATE POLICY "Users can delete their own media." ON public.media
FOR DELETE TO authenticated
USING ( (select auth.uid()) = owner_id );

-- Anyone can upload application images (for stylist applications).
CREATE POLICY "Anyone can upload application images." ON public.media
FOR INSERT TO anon, authenticated
WITH CHECK ( media_type = 'application_image' );


-- Policies for `service_categories`
CREATE POLICY "Service categories are viewable by everyone." ON public.service_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert service categories." ON public.service_categories FOR INSERT WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "Admins can update service categories." ON public.service_categories FOR UPDATE USING (public.get_my_role() = 'admin');
CREATE POLICY "Admins can delete service categories." ON public.service_categories FOR DELETE USING (public.get_my_role() = 'admin');

-- Policies for `applications`
CREATE POLICY "Anyone can create applications." ON public.applications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can view applications." ON public.applications FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can update applications." ON public.applications FOR UPDATE USING (public.get_my_role() = 'admin');
CREATE POLICY "Admins can delete applications." ON public.applications FOR DELETE USING (public.get_my_role() = 'admin');

-- Policies for `application_categories`
CREATE POLICY "Users can manage categories on their own application." ON public.application_categories FOR ALL USING (
  application_id IN (SELECT id FROM public.applications WHERE user_id = (select auth.uid()))
);
CREATE POLICY "Admins can view all application categories." ON public.application_categories FOR SELECT USING (public.get_my_role() = 'admin');

-- ================== STORAGE POLICIES ==================

-- RLS is already enabled on storage.objects by default in Supabase
-- Create comprehensive storage policies for all buckets

-- ========== APPLICATIONS BUCKET ==========
-- Anyone can upload application portfolio images
CREATE POLICY "Anyone can upload application files" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'applications');

-- Anyone can view application files  
CREATE POLICY "Anyone can view application files" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'applications');

-- Allow the uploader to delete their own application files
CREATE POLICY "Users can delete their own application files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'applications' AND (select auth.uid()) = owner);

-- Allow admins to delete any application files
CREATE POLICY "Admins can delete any application files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'applications' AND public.get_my_role() = 'admin');

-- ========== AVATARS BUCKET ==========
-- Anyone can view avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'avatars');

-- Authenticated users can upload avatars for themselves
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (select auth.uid())::text = (storage.foldername(name))[1]);

-- Users can update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (select auth.uid())::text = (storage.foldername(name))[1]);

-- Users can delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (select auth.uid())::text = (storage.foldername(name))[1]);

-- ========== CHAT-MEDIA BUCKET ==========
-- Chat participants can view chat media (private)
CREATE POLICY "Chat participants can view chat media" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-media' AND
  (storage.foldername(name))[1] IN (
    SELECT c.id::text FROM public.chats c
    JOIN public.bookings b ON c.booking_id = b.id
    WHERE b.customer_id = (select auth.uid()) OR b.stylist_id = (select auth.uid())
  )
);

-- Chat participants can upload chat media
CREATE POLICY "Chat participants can upload chat media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-media' AND
  (storage.foldername(name))[1] IN (
    SELECT c.id::text FROM public.chats c
    JOIN public.bookings b ON c.booking_id = b.id
    WHERE b.customer_id = (select auth.uid()) OR b.stylist_id = (select auth.uid())
  )
);

-- Users can delete their own chat media
CREATE POLICY "Users can delete their own chat media" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'chat-media' AND (select auth.uid()) = owner);

-- ========== SERVICE-MEDIA BUCKET ==========
-- Anyone can view service media
CREATE POLICY "Anyone can view service media" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'service-media');

-- Stylists can upload media for their own services
CREATE POLICY "Stylists can upload service media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'service-media' AND
  (storage.foldername(name))[1] IN (
    SELECT s.id::text FROM public.services s WHERE s.stylist_id = (select auth.uid())
  )
);

-- Stylists can update their own service media
CREATE POLICY "Stylists can update service media" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'service-media' AND
  (storage.foldername(name))[1] IN (
    SELECT s.id::text FROM public.services s WHERE s.stylist_id = (select auth.uid())
  )
);

-- Stylists can delete their own service media
CREATE POLICY "Stylists can delete service media" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'service-media' AND
  (storage.foldername(name))[1] IN (
    SELECT s.id::text FROM public.services s WHERE s.stylist_id = (select auth.uid())
  )
);

-- ========== REVIEW-MEDIA BUCKET ==========
-- Anyone can view review media
CREATE POLICY "Anyone can view review media" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'review-media');

-- Customers can upload media for their own reviews
CREATE POLICY "Customers can upload review media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'review-media' AND
  (storage.foldername(name))[1] IN (
    SELECT r.id::text FROM public.reviews r WHERE r.customer_id = (select auth.uid())
  )
);

-- Customers can update their own review media
CREATE POLICY "Customers can update review media" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'review-media' AND
  (storage.foldername(name))[1] IN (
    SELECT r.id::text FROM public.reviews r WHERE r.customer_id = (select auth.uid())
  )
);

-- Customers can delete their own review media
CREATE POLICY "Customers can delete review media" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'review-media' AND
  (storage.foldername(name))[1] IN (
    SELECT r.id::text FROM public.reviews r WHERE r.customer_id = (select auth.uid())
  )
);

-- ========== PORTFOLIO BUCKET ==========
-- Anyone can view portfolio images
CREATE POLICY "Anyone can view portfolio images" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'portfolio');

-- Stylists can upload their own portfolio images
CREATE POLICY "Stylists can upload portfolio images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'portfolio' AND (select auth.uid())::text = (storage.foldername(name))[1]);

-- Stylists can update their own portfolio images
CREATE POLICY "Stylists can update portfolio images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'portfolio' AND (select auth.uid())::text = (storage.foldername(name))[1]);

-- Stylists can delete their own portfolio images
CREATE POLICY "Stylists can delete portfolio images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'portfolio' AND (select auth.uid())::text = (storage.foldername(name))[1]);

-- ========== PUBLIC ASSETS BUCKETS ==========
-- Anyone can view public assets (landing-media, assets)
CREATE POLICY "Anyone can view landing media" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'landing-media');

CREATE POLICY "Anyone can view assets" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'assets');

-- Admins can manage public assets
CREATE POLICY "Admins can upload landing media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'landing-media' AND public.get_my_role() = 'admin');

CREATE POLICY "Admins can upload assets" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'assets' AND public.get_my_role() = 'admin');

CREATE POLICY "Admins can update landing media" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'landing-media' AND public.get_my_role() = 'admin');

CREATE POLICY "Admins can update assets" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'assets' AND public.get_my_role() = 'admin');

CREATE POLICY "Admins can delete landing media" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'landing-media' AND public.get_my_role() = 'admin');

CREATE POLICY "Admins can delete assets" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'assets' AND public.get_my_role() = 'admin');

-- ========== STORAGE BUCKETS POLICIES ==========
-- Allow everyone to view bucket information
CREATE POLICY "Anyone can view buckets" ON storage.buckets
FOR SELECT TO anon, authenticated
USING (true);

-- Only admins can manage buckets
CREATE POLICY "Admins can manage buckets" ON storage.buckets
FOR ALL TO authenticated
USING (public.get_my_role() = 'admin')
WITH CHECK (public.get_my_role() = 'admin');