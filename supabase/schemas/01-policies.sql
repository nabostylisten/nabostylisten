ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylist_availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylist_unavailability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylist_recurring_unavailability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_unavailability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Profiles are public and can be viewed by anyone.
CREATE POLICY "Profiles are viewable by everyone." ON public.profiles
FOR SELECT TO anon, authenticated
USING ( true );

-- A user can update their own profile.
CREATE POLICY "Users can update their own profile." ON public.profiles
FOR UPDATE TO authenticated
USING ( (select auth.uid()) = id )
WITH CHECK ( (select auth.uid()) = id );

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

-- A function to check the current user's role (recommended for performance).
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role::public.user_role FROM public.profiles WHERE id = auth.uid();
$$;

-- Policies for `service_categories`
CREATE POLICY "Service categories are viewable by everyone." ON public.service_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert service categories." ON public.service_categories FOR INSERT WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "Admins can update service categories." ON public.service_categories FOR UPDATE USING (public.get_my_role() = 'admin');
CREATE POLICY "Admins can delete service categories." ON public.service_categories FOR DELETE USING (public.get_my_role() = 'admin');

-- Policies for `applications`
CREATE POLICY "Users can view their own application, admins view all." ON public.applications FOR SELECT USING (user_id = (select auth.uid()) OR public.get_my_role() = 'admin');
CREATE POLICY "Users can create applications." ON public.applications FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Admins can update applications." ON public.applications FOR UPDATE USING (public.get_my_role() = 'admin');
CREATE POLICY "Admins can delete applications." ON public.applications FOR DELETE USING (public.get_my_role() = 'admin');

-- Policies for `application_categories`
CREATE POLICY "Users can manage categories on their own application." ON public.application_categories FOR ALL USING (
  application_id IN (SELECT id FROM public.applications WHERE user_id = (select auth.uid()))
);
CREATE POLICY "Admins can view all application categories." ON public.application_categories FOR SELECT USING (public.get_my_role() = 'admin');