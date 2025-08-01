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