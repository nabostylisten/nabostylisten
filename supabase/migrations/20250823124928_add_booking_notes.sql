create type "public"."booking_note_category" as enum ('service_notes', 'customer_preferences', 'issues', 'results', 'follow_up', 'other');

-- Drop policies that depend on media_type
drop policy if exists "Public media is viewable by everyone." on "public"."media";
drop policy if exists "Chat images are viewable by participants." on "public"."media";
drop policy if exists "Users can insert chat images for their chats." on "public"."media";
drop policy if exists "Anyone can upload application images." on "public"."media";

alter type "public"."media_type" rename to "media_type__old_version_to_be_dropped";

create type "public"."media_type" as enum ('avatar', 'service_image', 'review_image', 'chat_image', 'application_image', 'landing_asset', 'logo_asset', 'booking_note_image', 'other');

create table "public"."booking_notes" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "booking_id" uuid not null,
    "stylist_id" uuid not null,
    "content" text not null,
    "category" booking_note_category not null default 'service_notes'::booking_note_category,
    "customer_visible" boolean not null default false,
    "actual_start_time" timestamp with time zone,
    "actual_end_time" timestamp with time zone,
    "next_appointment_suggestion" text,
    "tags" text[] not null default '{}'::text[]
);


alter table "public"."media" alter column media_type type "public"."media_type" using media_type::text::"public"."media_type";

drop type "public"."media_type__old_version_to_be_dropped";

alter table "public"."media" add column "booking_note_id" uuid;

CREATE UNIQUE INDEX booking_notes_pkey ON public.booking_notes USING btree (id);

alter table "public"."booking_notes" add constraint "booking_notes_pkey" PRIMARY KEY using index "booking_notes_pkey";

alter table "public"."booking_notes" add constraint "booking_notes_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE not valid;

alter table "public"."booking_notes" validate constraint "booking_notes_booking_id_fkey";

alter table "public"."booking_notes" add constraint "booking_notes_stylist_id_fkey" FOREIGN KEY (stylist_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."booking_notes" validate constraint "booking_notes_stylist_id_fkey";

alter table "public"."media" add constraint "media_booking_note_id_fkey" FOREIGN KEY (booking_note_id) REFERENCES booking_notes(id) ON DELETE CASCADE not valid;

alter table "public"."media" validate constraint "media_booking_note_id_fkey";

grant delete on table "public"."booking_notes" to "anon";

grant insert on table "public"."booking_notes" to "anon";

grant references on table "public"."booking_notes" to "anon";

grant select on table "public"."booking_notes" to "anon";

grant trigger on table "public"."booking_notes" to "anon";

grant truncate on table "public"."booking_notes" to "anon";

grant update on table "public"."booking_notes" to "anon";

grant delete on table "public"."booking_notes" to "authenticated";

grant insert on table "public"."booking_notes" to "authenticated";

grant references on table "public"."booking_notes" to "authenticated";

grant select on table "public"."booking_notes" to "authenticated";

grant trigger on table "public"."booking_notes" to "authenticated";

grant truncate on table "public"."booking_notes" to "authenticated";

grant update on table "public"."booking_notes" to "authenticated";

grant delete on table "public"."booking_notes" to "service_role";

grant insert on table "public"."booking_notes" to "service_role";

grant references on table "public"."booking_notes" to "service_role";

grant select on table "public"."booking_notes" to "service_role";

grant trigger on table "public"."booking_notes" to "service_role";

grant truncate on table "public"."booking_notes" to "service_role";

grant update on table "public"."booking_notes" to "service_role";

CREATE TRIGGER update_booking_notes_updated_at BEFORE UPDATE ON public.booking_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on booking_notes table
ALTER TABLE public.booking_notes ENABLE ROW LEVEL SECURITY;

-- Recreate dropped media policies with updated media_type enum
CREATE POLICY "Public media is viewable by everyone." ON public.media
FOR SELECT TO anon, authenticated
USING ( media_type IN ('avatar', 'service_image', 'review_image', 'landing_asset', 'logo_asset') );

CREATE POLICY "Chat images are viewable by participants." ON public.media
FOR SELECT TO authenticated
USING (
  media_type = 'chat_image' AND
  chat_message_id IN (SELECT id FROM public.chat_messages)
);

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

CREATE POLICY "Anyone can upload application images." ON public.media
FOR INSERT TO anon, authenticated
WITH CHECK ( media_type = 'application_image' );

-- New booking notes policies
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

-- Booking note images policies
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


