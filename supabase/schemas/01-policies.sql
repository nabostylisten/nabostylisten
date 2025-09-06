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
ALTER TABLE public.booking_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylist_availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylist_unavailability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylist_recurring_unavailability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_unavailability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

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

-- Admins can update any profile (for managing users)
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE TO authenticated
USING ( public.get_my_role() = 'admin' )
WITH CHECK ( public.get_my_role() = 'admin' );

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

-- Admins can manage stylist details
CREATE POLICY "Admins can insert stylist details" ON public.stylist_details
FOR INSERT TO authenticated
WITH CHECK ( public.get_my_role() = 'admin' );

CREATE POLICY "Admins can update stylist details" ON public.stylist_details
FOR UPDATE TO authenticated
USING ( public.get_my_role() = 'admin' )
WITH CHECK ( public.get_my_role() = 'admin' );

CREATE POLICY "Admins can delete stylist details" ON public.stylist_details
FOR DELETE TO authenticated
USING ( public.get_my_role() = 'admin' );

-- A user can view their own addresses.
CREATE POLICY "Users can view their own addresses." ON public.addresses
FOR SELECT TO authenticated
USING ( (select auth.uid()) = user_id );

-- Primary addresses of stylists with published services are viewable by everyone (needed for geographic search)
CREATE POLICY "Primary addresses of stylists with published services are viewable" ON public.addresses
FOR SELECT TO anon, authenticated
USING (
  is_primary = true 
  AND user_id IN (
    SELECT DISTINCT stylist_id 
    FROM public.services 
    WHERE is_published = true
  )
);

-- Admins can view all addresses
CREATE POLICY "Admins can view all addresses" ON public.addresses
FOR SELECT TO authenticated
USING ( public.get_my_role() = 'admin' );

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

-- Admins can manage all services
CREATE POLICY "Admins can create services" ON public.services
FOR INSERT TO authenticated
WITH CHECK ( public.get_my_role() = 'admin' );

CREATE POLICY "Admins can update services" ON public.services
FOR UPDATE TO authenticated
USING ( public.get_my_role() = 'admin' )
WITH CHECK ( public.get_my_role() = 'admin' );

CREATE POLICY "Admins can delete services" ON public.services
FOR DELETE TO authenticated
USING ( public.get_my_role() = 'admin' );

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

-- Admins can manage service category relationships
CREATE POLICY "Admins can add service categories" ON public.service_service_categories
FOR INSERT TO authenticated
WITH CHECK ( public.get_my_role() = 'admin' );

CREATE POLICY "Admins can remove service categories" ON public.service_service_categories
FOR DELETE TO authenticated
USING ( public.get_my_role() = 'admin' );

-- Customers and stylists can view bookings they are involved in, including trial sessions
CREATE POLICY "Users can view their own bookings." ON public.bookings
FOR SELECT TO authenticated
USING ( 
    (select auth.uid()) = customer_id 
    OR (select auth.uid()) = stylist_id 
);

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings" ON public.bookings
FOR SELECT TO authenticated
USING ( public.get_my_role() = 'admin' );

-- Customers can create bookings for themselves.
CREATE POLICY "Customers can create bookings." ON public.bookings
FOR INSERT TO authenticated
WITH CHECK ( (select auth.uid()) = customer_id );

-- Customers and stylists can update bookings they are involved in, stylists can update trial sessions
CREATE POLICY "Users can update their own bookings." ON public.bookings
FOR UPDATE TO authenticated
USING ( 
    (select auth.uid()) = customer_id 
    OR (select auth.uid()) = stylist_id
);

-- Admins can manage all bookings
CREATE POLICY "Admins can create bookings" ON public.bookings
FOR INSERT TO authenticated
WITH CHECK ( public.get_my_role() = 'admin' );

CREATE POLICY "Admins can update bookings" ON public.bookings
FOR UPDATE TO authenticated
USING ( public.get_my_role() = 'admin' )
WITH CHECK ( public.get_my_role() = 'admin' );

CREATE POLICY "Admins can delete bookings" ON public.bookings
FOR DELETE TO authenticated
USING ( public.get_my_role() = 'admin' );

-- Users can view services for bookings they are part of.
CREATE POLICY "Users can view services on their bookings." ON public.booking_services
FOR SELECT TO authenticated
USING (
  booking_id IN (
    SELECT id FROM public.bookings WHERE customer_id = (select auth.uid()) OR stylist_id = (select auth.uid())
  )
);

-- Allow anonymous users to view booking_services for public review display
CREATE POLICY "Anyone can view booking services for reviews." ON public.booking_services
FOR SELECT TO anon, authenticated
USING ( true );

-- Admins can view all booking services
CREATE POLICY "Admins can view all booking services" ON public.booking_services
FOR SELECT TO authenticated
USING ( public.get_my_role() = 'admin' );

-- Customers can add services to their own new bookings.
CREATE POLICY "Customers can add services to bookings." ON public.booking_services
FOR INSERT TO authenticated
WITH CHECK (
  booking_id IN (
    SELECT id FROM public.bookings WHERE customer_id = (select auth.uid())
  )
);

-- Admins can manage booking services
CREATE POLICY "Admins can add booking services" ON public.booking_services
FOR INSERT TO authenticated
WITH CHECK ( public.get_my_role() = 'admin' );

CREATE POLICY "Admins can delete booking services" ON public.booking_services
FOR DELETE TO authenticated
USING ( public.get_my_role() = 'admin' );

-- ========== BOOKING NOTES POLICIES ==========
-- Stylists can view their own booking notes
CREATE POLICY "Stylists can view their own booking notes." ON public.booking_notes
FOR SELECT TO authenticated
USING ( stylist_id = (select auth.uid()) );

-- Customers can view booking notes marked as customer visible for their bookings
CREATE POLICY "Customers can view visible booking notes" ON public.booking_notes
FOR SELECT TO authenticated
USING (
  customer_visible = true AND
  booking_id IN (
    SELECT id FROM public.bookings WHERE customer_id = (select auth.uid())
  )
);

-- Stylists can create booking notes for their bookings
CREATE POLICY "Stylists can create booking notes" ON public.booking_notes
FOR INSERT TO authenticated
WITH CHECK (
  stylist_id = (select auth.uid()) AND
  booking_id IN (
    SELECT id FROM public.bookings WHERE stylist_id = (select auth.uid())
  )
);

-- Stylists can update their own booking notes
CREATE POLICY "Stylists can update their own booking notes" ON public.booking_notes
FOR UPDATE TO authenticated
USING ( stylist_id = (select auth.uid()) )
WITH CHECK ( stylist_id = (select auth.uid()) );

-- Stylists can delete their own booking notes
CREATE POLICY "Stylists can delete their own booking notes" ON public.booking_notes
FOR DELETE TO authenticated
USING ( stylist_id = (select auth.uid()) );

-- Admins can view all booking notes
CREATE POLICY "Admins can view all booking notes" ON public.booking_notes
FOR SELECT TO authenticated
USING ( public.get_my_role() = 'admin' );

-- Admins can manage booking notes
CREATE POLICY "Admins can create booking notes" ON public.booking_notes
FOR INSERT TO authenticated
WITH CHECK ( public.get_my_role() = 'admin' );

CREATE POLICY "Admins can update booking notes" ON public.booking_notes
FOR UPDATE TO authenticated
USING ( public.get_my_role() = 'admin' )
WITH CHECK ( public.get_my_role() = 'admin' );

CREATE POLICY "Admins can delete booking notes" ON public.booking_notes
FOR DELETE TO authenticated
USING ( public.get_my_role() = 'admin' );

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

-- Admins can manage reviews (for moderation)
CREATE POLICY "Admins can update reviews" ON public.reviews
FOR UPDATE TO authenticated
USING ( public.get_my_role() = 'admin' )
WITH CHECK ( public.get_my_role() = 'admin' );

CREATE POLICY "Admins can delete reviews" ON public.reviews
FOR DELETE TO authenticated
USING ( public.get_my_role() = 'admin' );

-- Payment records can be viewed by involved parties (customer, stylist) and admins.
CREATE POLICY "Users can view payments for their bookings." ON public.payments
FOR SELECT TO authenticated
USING (
  booking_id IN (
    SELECT id FROM public.bookings 
    WHERE customer_id = (select auth.uid()) OR stylist_id = (select auth.uid())
  ) OR public.get_my_role() = 'admin'
);

-- Admins can manage payments (for refunds, adjustments)
CREATE POLICY "Admins can create payments" ON public.payments
FOR INSERT TO authenticated
WITH CHECK ( public.get_my_role() = 'admin' );

CREATE POLICY "Admins can update payments" ON public.payments
FOR UPDATE TO authenticated
USING ( public.get_my_role() = 'admin' )
WITH CHECK ( public.get_my_role() = 'admin' );

CREATE POLICY "Admins can delete payments" ON public.payments
FOR DELETE TO authenticated
USING ( public.get_my_role() = 'admin' );

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

-- Discount usage policies for tracking per-profile usage.
CREATE POLICY "Users can view their own discount usage." ON public.discount_usage
FOR SELECT TO authenticated
USING ( profile_id = auth.uid() );

CREATE POLICY "Admins can view all discount usage." ON public.discount_usage
FOR SELECT TO authenticated
USING ( public.get_my_role() = 'admin' );

CREATE POLICY "System can insert discount usage records." ON public.discount_usage
FOR INSERT TO authenticated
WITH CHECK ( profile_id = auth.uid() );

CREATE POLICY "Only admins can update discount usage." ON public.discount_usage
FOR UPDATE TO authenticated
USING ( public.get_my_role() = 'admin' );

CREATE POLICY "Only admins can delete discount usage." ON public.discount_usage
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

-- Admins can manage availability rules
CREATE POLICY "Admins can view all availability rules" ON public.stylist_availability_rules
FOR SELECT TO authenticated
USING ( public.get_my_role() = 'admin' );

CREATE POLICY "Admins can create availability rules" ON public.stylist_availability_rules
FOR INSERT TO authenticated
WITH CHECK ( public.get_my_role() = 'admin' );

CREATE POLICY "Admins can update availability rules" ON public.stylist_availability_rules
FOR UPDATE TO authenticated
USING ( public.get_my_role() = 'admin' )
WITH CHECK ( public.get_my_role() = 'admin' );

CREATE POLICY "Admins can delete availability rules" ON public.stylist_availability_rules
FOR DELETE TO authenticated
USING ( public.get_my_role() = 'admin' );

CREATE POLICY "Stylists can insert their own unavailability." ON public.stylist_unavailability FOR INSERT WITH CHECK (stylist_id = (select auth.uid()));
CREATE POLICY "Stylists can update their own unavailability." ON public.stylist_unavailability FOR UPDATE USING (stylist_id = (select auth.uid()));
CREATE POLICY "Stylists can delete their own unavailability." ON public.stylist_unavailability FOR DELETE USING (stylist_id = (select auth.uid()));

-- Admins can manage unavailability
CREATE POLICY "Admins can view all unavailability" ON public.stylist_unavailability
FOR SELECT TO authenticated
USING ( public.get_my_role() = 'admin' );

CREATE POLICY "Admins can create unavailability" ON public.stylist_unavailability
FOR INSERT TO authenticated
WITH CHECK ( public.get_my_role() = 'admin' );

CREATE POLICY "Admins can update unavailability" ON public.stylist_unavailability
FOR UPDATE TO authenticated
USING ( public.get_my_role() = 'admin' )
WITH CHECK ( public.get_my_role() = 'admin' );

CREATE POLICY "Admins can delete unavailability" ON public.stylist_unavailability
FOR DELETE TO authenticated
USING ( public.get_my_role() = 'admin' );

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

-- Admins can view all chats
CREATE POLICY "Admins can view all chats" ON public.chats
FOR SELECT TO authenticated
USING ( public.get_my_role() = 'admin' );

-- Users can create chats for bookings they are part of.
CREATE POLICY "Users can create chats for their bookings." ON public.chats
FOR INSERT TO authenticated
WITH CHECK (
  booking_id IN (
    SELECT id FROM public.bookings 
    WHERE customer_id = (select auth.uid()) OR stylist_id = (select auth.uid())
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

-- Admins can view all chat messages
CREATE POLICY "Admins can view all chat messages" ON public.chat_messages
FOR SELECT TO authenticated
USING ( public.get_my_role() = 'admin' );

-- Users can send messages in chats they are a part of.
CREATE POLICY "Users can insert messages in their own chats." ON public.chat_messages
FOR INSERT TO authenticated
WITH CHECK (
  (select auth.uid()) = sender_id AND
  chat_id IN (
    SELECT id FROM public.chats
  )
);

-- Users can update messages in chats they are a part of (for marking as read).
CREATE POLICY "Users can update messages in their own chats." ON public.chat_messages
FOR UPDATE TO authenticated
USING (
  chat_id IN (
    SELECT id FROM public.chats
  )
)
WITH CHECK (
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

-- Users can upload chat images for messages in chats they participate in.
CREATE POLICY "Users can insert chat images for their chats." ON public.media
FOR INSERT TO authenticated
WITH CHECK (
  media_type = 'chat_image' AND
  (select auth.uid()) = owner_id AND
  chat_message_id IN (
    SELECT cm.id 
    FROM public.chat_messages cm
    JOIN public.chats c ON cm.chat_id = c.id
    JOIN public.bookings b ON c.booking_id = b.id
    WHERE b.customer_id = (select auth.uid()) OR b.stylist_id = (select auth.uid())
  )
);

-- Users can update their own media.
CREATE POLICY "Users can update their own media." ON public.media
FOR UPDATE TO authenticated
USING ( (select auth.uid()) = owner_id )
WITH CHECK ( (select auth.uid()) = owner_id );

-- Users can delete their own media.
CREATE POLICY "Users can delete their own media." ON public.media
FOR DELETE TO authenticated
USING ( (select auth.uid()) = owner_id );

-- Admins can manage all media
CREATE POLICY "Admins can view all media" ON public.media
FOR SELECT TO authenticated
USING ( public.get_my_role() = 'admin' );

CREATE POLICY "Admins can delete any media" ON public.media
FOR DELETE TO authenticated
USING ( public.get_my_role() = 'admin' );

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

-- ========== REALTIME POLICIES ==========
-- Simplified realtime policies - main security is handled by database table RLS
CREATE POLICY "authenticated can receive broadcasts" ON "realtime"."messages"
FOR SELECT TO authenticated
USING ( true );

CREATE POLICY "authenticated can send broadcasts" ON "realtime"."messages"
FOR INSERT TO authenticated
WITH CHECK ( true );

-- ========== USER PREFERENCES POLICIES ==========
-- Users can view their own preferences
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
FOR SELECT TO authenticated
USING ( user_id = (select auth.uid()) );

-- Users can insert their own preferences (handled by server action with defaults)
CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
FOR INSERT TO authenticated
WITH CHECK ( user_id = (select auth.uid()) );

-- Users can update their own preferences
CREATE POLICY "Users can update their own preferences" ON public.user_preferences
FOR UPDATE TO authenticated
USING ( user_id = (select auth.uid()) )
WITH CHECK ( user_id = (select auth.uid()) );

-- Users cannot delete preferences (they should always exist with defaults)
-- No DELETE policy means no one can delete preferences

-- Admins can view all user preferences
CREATE POLICY "Admins can view all user preferences" ON public.user_preferences
FOR SELECT TO authenticated
USING ( public.get_my_role() = 'admin' );

-- Admins can update user preferences (for support)
CREATE POLICY "Admins can update user preferences" ON public.user_preferences
FOR UPDATE TO authenticated
USING ( public.get_my_role() = 'admin' )
WITH CHECK ( public.get_my_role() = 'admin' );

-- ========== PLATFORM CONFIG POLICIES ==========
-- Only admins can view platform configuration
CREATE POLICY "Only admins can view platform config" ON public.platform_config
FOR SELECT TO authenticated
USING ( public.get_my_role() = 'admin' );

-- Only admins can insert platform configuration
CREATE POLICY "Only admins can insert platform config" ON public.platform_config
FOR INSERT TO authenticated
WITH CHECK ( public.get_my_role() = 'admin' );

-- Only admins can update platform configuration
CREATE POLICY "Only admins can update platform config" ON public.platform_config
FOR UPDATE TO authenticated
USING ( public.get_my_role() = 'admin' )
WITH CHECK ( public.get_my_role() = 'admin' );

-- Only admins can delete platform configuration
CREATE POLICY "Only admins can delete platform config" ON public.platform_config
FOR DELETE TO authenticated
USING ( public.get_my_role() = 'admin' );

-- ========== AFFILIATE APPLICATION POLICIES ==========
-- Stylists can create their own affiliate applications
CREATE POLICY "Stylists can create affiliate applications" ON public.affiliate_applications
FOR INSERT TO authenticated
WITH CHECK ( 
  (select auth.uid()) = stylist_id 
  AND public.get_my_role() = 'stylist' 
);

-- Users can view their own affiliate applications
CREATE POLICY "Users can view their own affiliate applications" ON public.affiliate_applications
FOR SELECT TO authenticated
USING ( (select auth.uid()) = stylist_id );

-- Admins can view all affiliate applications
CREATE POLICY "Admins can view all affiliate applications" ON public.affiliate_applications
FOR SELECT TO authenticated
USING ( public.get_my_role() = 'admin' );

-- Only admins can update affiliate applications (for approval/rejection)
CREATE POLICY "Only admins can update affiliate applications" ON public.affiliate_applications
FOR UPDATE TO authenticated
USING ( public.get_my_role() = 'admin' )
WITH CHECK ( public.get_my_role() = 'admin' );

-- ========== AFFILIATE LINK POLICIES ==========
-- Users can view their own affiliate links
CREATE POLICY "Users can view their own affiliate links" ON public.affiliate_links
FOR SELECT TO authenticated
USING ( (select auth.uid()) = stylist_id );

-- Admins can view all affiliate links
CREATE POLICY "Admins can view all affiliate links" ON public.affiliate_links
FOR SELECT TO authenticated
USING ( public.get_my_role() = 'admin' );

-- Only admins can create affiliate links (after approving applications)
CREATE POLICY "Only admins can create affiliate links" ON public.affiliate_links
FOR INSERT TO authenticated
WITH CHECK ( public.get_my_role() = 'admin' );

-- Only admins can update affiliate links
CREATE POLICY "Only admins can update affiliate links" ON public.affiliate_links
FOR UPDATE TO authenticated
USING ( public.get_my_role() = 'admin' )
WITH CHECK ( public.get_my_role() = 'admin' );

-- Users can disable their own affiliate links
CREATE POLICY "Users can disable their own affiliate links" ON public.affiliate_links
FOR UPDATE TO authenticated
USING ( (select auth.uid()) = stylist_id )
WITH CHECK ( 
  (select auth.uid()) = stylist_id 
  AND is_active = false -- Only allow disabling, not other updates
);

-- ========== AFFILIATE CLICK POLICIES ==========
-- System can insert affiliate clicks (no user restrictions for tracking)
CREATE POLICY "System can insert affiliate clicks" ON public.affiliate_clicks
FOR INSERT TO anon, authenticated
WITH CHECK ( true );

-- Users can view clicks for their own affiliate links
CREATE POLICY "Users can view their own affiliate clicks" ON public.affiliate_clicks
FOR SELECT TO authenticated
USING ( (select auth.uid()) = stylist_id );

-- Admins can view all affiliate clicks
CREATE POLICY "Admins can view all affiliate clicks" ON public.affiliate_clicks
FOR SELECT TO authenticated
USING ( public.get_my_role() = 'admin' );

-- System can update affiliate clicks for conversion tracking
CREATE POLICY "System can update affiliate clicks for conversions" ON public.affiliate_clicks
FOR UPDATE TO authenticated
USING ( true )
WITH CHECK ( true );

-- ========== AFFILIATE PAYOUT POLICIES ==========
-- Users can view their own affiliate payouts
CREATE POLICY "Users can view their own affiliate payouts" ON public.affiliate_payouts
FOR SELECT TO authenticated
USING ( (select auth.uid()) = stylist_id );

-- Admins can view all affiliate payouts
CREATE POLICY "Admins can view all affiliate payouts" ON public.affiliate_payouts
FOR SELECT TO authenticated
USING ( public.get_my_role() = 'admin' );

-- Only admins can create affiliate payouts
CREATE POLICY "Only admins can create affiliate payouts" ON public.affiliate_payouts
FOR INSERT TO authenticated
WITH CHECK ( public.get_my_role() = 'admin' );

-- Only admins can update affiliate payouts
CREATE POLICY "Only admins can update affiliate payouts" ON public.affiliate_payouts
FOR UPDATE TO authenticated
USING ( public.get_my_role() = 'admin' )
WITH CHECK ( public.get_my_role() = 'admin' );

-- ========== AFFILIATE COMMISSIONS POLICIES ==========
-- Users can view their own affiliate commissions
CREATE POLICY "Users can view their own affiliate commissions" ON public.affiliate_commissions
FOR SELECT TO authenticated
USING ( (select auth.uid()) = affiliate_id );

-- Admins can view all affiliate commissions
CREATE POLICY "Admins can view all affiliate commissions" ON public.affiliate_commissions
FOR SELECT TO authenticated
USING ( public.get_my_role() = 'admin' );

-- Only system/admin can create affiliate commissions (automated process)
CREATE POLICY "Only system can create affiliate commissions" ON public.affiliate_commissions
FOR INSERT TO authenticated
WITH CHECK ( public.get_my_role() = 'admin' );

-- Only admins can update affiliate commissions (for status changes, payouts)
CREATE POLICY "Only admins can update affiliate commissions" ON public.affiliate_commissions
FOR UPDATE TO authenticated
USING ( public.get_my_role() = 'admin' )
WITH CHECK ( public.get_my_role() = 'admin' );