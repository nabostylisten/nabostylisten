drop policy "Customers can view booking notes marked as customer visible for" on "public"."booking_notes";

drop policy "Stylists can create booking notes for their bookings." on "public"."booking_notes";

drop policy "Stylists can delete their own booking notes." on "public"."booking_notes";

drop policy "Stylists can update their own booking notes." on "public"."booking_notes";

drop policy "Stylists can view their own booking notes." on "public"."booking_notes";

drop policy "Booking note images are viewable by stylist and customers if no" on "public"."media";

drop policy "Stylists can upload booking note images for their notes." on "public"."media";

alter table "public"."booking_notes" drop column "actual_end_time";

alter table "public"."booking_notes" drop column "actual_start_time";

alter table "public"."booking_notes" add column "duration_minutes" integer;

-- Re-enable RLS and recreate all policies
alter table "public"."booking_notes" enable row level security;

-- Recreate booking notes policies
CREATE POLICY "Stylists can view their own booking notes." ON public.booking_notes
FOR SELECT TO authenticated
USING ( stylist_id = (select auth.uid()) );

CREATE POLICY "Customers can view booking notes marked as customer visible for their bookings." ON public.booking_notes
FOR SELECT TO authenticated
USING (
  customer_visible = true AND
  booking_id IN (
    SELECT id FROM public.bookings WHERE customer_id = (select auth.uid())
  )
);

CREATE POLICY "Stylists can create booking notes for their bookings." ON public.booking_notes
FOR INSERT TO authenticated
WITH CHECK (
  stylist_id = (select auth.uid()) AND
  booking_id IN (
    SELECT id FROM public.bookings WHERE stylist_id = (select auth.uid())
  )
);

CREATE POLICY "Stylists can update their own booking notes." ON public.booking_notes
FOR UPDATE TO authenticated
USING ( stylist_id = (select auth.uid()) )
WITH CHECK ( stylist_id = (select auth.uid()) );

CREATE POLICY "Stylists can delete their own booking notes." ON public.booking_notes
FOR DELETE TO authenticated
USING ( stylist_id = (select auth.uid()) );

-- Recreate media policies for booking note images
CREATE POLICY "Booking note images are viewable by stylist and customers if note is visible." ON public.media
FOR SELECT TO authenticated
USING (
  media_type = 'booking_note_image' AND
  booking_note_id IN (
    SELECT bn.id FROM public.booking_notes bn
    JOIN public.bookings b ON bn.booking_id = b.id
    WHERE bn.stylist_id = (select auth.uid()) OR
          (bn.customer_visible = true AND b.customer_id = (select auth.uid()))
  )
);

CREATE POLICY "Stylists can upload booking note images for their notes." ON public.media
FOR INSERT TO authenticated
WITH CHECK (
  media_type = 'booking_note_image' AND
  (select auth.uid()) = owner_id AND
  booking_note_id IN (
    SELECT id FROM public.booking_notes WHERE stylist_id = (select auth.uid())
  )
);

