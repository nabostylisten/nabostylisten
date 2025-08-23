-- Fix booking note storage policies to match the correct path structure
-- Storage path: bookingId/noteId/filename, so noteId is at index [2]

-- Drop existing incorrect policies
DROP POLICY IF EXISTS "Booking note participants can view booking note media" ON storage.objects;
DROP POLICY IF EXISTS "Stylists can upload booking note media" ON storage.objects;
DROP POLICY IF EXISTS "Stylists can update booking note media" ON storage.objects;
DROP POLICY IF EXISTS "Stylists can delete booking note media" ON storage.objects;

-- Create corrected policies with proper folder indexing
CREATE POLICY "Booking note participants can view booking note media" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'booking-note-media' AND
  (storage.foldername(name))[2] IN (
    SELECT bn.id::text FROM public.booking_notes bn
    JOIN public.bookings b ON bn.booking_id = b.id
    WHERE bn.stylist_id = (select auth.uid()) OR
          (bn.customer_visible = true AND b.customer_id = (select auth.uid()))
  )
);

CREATE POLICY "Stylists can upload booking note media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'booking-note-media' AND
  (storage.foldername(name))[2] IN (
    SELECT bn.id::text FROM public.booking_notes bn WHERE bn.stylist_id = (select auth.uid())
  )
);

CREATE POLICY "Stylists can update booking note media" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'booking-note-media' AND
  (storage.foldername(name))[2] IN (
    SELECT bn.id::text FROM public.booking_notes bn WHERE bn.stylist_id = (select auth.uid())
  )
);

CREATE POLICY "Stylists can delete booking note media" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'booking-note-media' AND
  (storage.foldername(name))[2] IN (
    SELECT bn.id::text FROM public.booking_notes bn WHERE bn.stylist_id = (select auth.uid())
  )
);