create schema if not exists "gis";

create extension if not exists "postgis" with schema "gis" version '3.3.7';

DO $$ BEGIN
    CREATE TYPE "gis"."geometry_dump" AS ("path" integer[], "geom" gis.geometry);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "gis"."valid_detail" AS ("valid" boolean, "reason" character varying, "location" gis.geometry);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


create table "public"."discounts" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "code" text not null,
    "description" text,
    "discount_percentage" numeric(5,2),
    "discount_amount" integer,
    "currency" text not null default 'NOK'::text,
    "max_uses" integer,
    "current_uses" integer not null default 0,
    "max_uses_per_user" integer not null default 1,
    "is_active" boolean not null default true,
    "valid_from" timestamp with time zone not null default now(),
    "expires_at" timestamp with time zone,
    "minimum_order_amount" integer
);


alter table "public"."discounts" enable row level security;

create table "public"."payments" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "booking_id" uuid not null,
    "payment_intent_id" text not null,
    "total_amount" integer not null,
    "platform_fee" integer not null,
    "stylist_payout_amount" integer not null,
    "currency" text not null default 'NOK'::text,
    "stylist_transfer_id" text,
    "status" text not null default 'pending'::text,
    "succeeded_at" timestamp with time zone,
    "payout_initiated_at" timestamp with time zone,
    "payout_completed_at" timestamp with time zone
);


alter table "public"."payments" enable row level security;

create table "public"."stylist_details" (
    "profile_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "bio" text,
    "can_travel" boolean not null default true,
    "has_own_place" boolean not null default true,
    "travel_distance_km" integer,
    "instagram_profile" text,
    "facebook_profile" text,
    "tiktok_profile" text,
    "youtube_profile" text,
    "snapchat_profile" text,
    "other_social_media_urls" text[],
    "stripe_account_id" text
);


alter table "public"."stylist_details" enable row level security;

alter table "public"."addresses" drop column "latitude";

alter table "public"."addresses" drop column "longitude";

alter table "public"."addresses" add column "location" gis.geography(Point,4326);

alter table "public"."bookings" add column "cancellation_reason" text;

alter table "public"."bookings" add column "cancelled_at" timestamp with time zone;

alter table "public"."bookings" add column "discount_applied" numeric(10,2) not null default 0;

alter table "public"."bookings" add column "discount_id" uuid;

alter table "public"."services" add column "currency" text not null default 'NOK'::text;

alter table "public"."services" add column "is_published" boolean not null default false;

CREATE UNIQUE INDEX discounts_code_key ON public.discounts USING btree (code);

CREATE UNIQUE INDEX discounts_pkey ON public.discounts USING btree (id);

CREATE INDEX idx_addresses_location ON public.addresses USING gist (location);

CREATE UNIQUE INDEX payments_booking_id_key ON public.payments USING btree (booking_id);

CREATE UNIQUE INDEX payments_payment_intent_id_key ON public.payments USING btree (payment_intent_id);

CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id);

CREATE UNIQUE INDEX stylist_details_pkey ON public.stylist_details USING btree (profile_id);

alter table "public"."discounts" add constraint "discounts_pkey" PRIMARY KEY using index "discounts_pkey";

alter table "public"."payments" add constraint "payments_pkey" PRIMARY KEY using index "payments_pkey";

alter table "public"."stylist_details" add constraint "stylist_details_pkey" PRIMARY KEY using index "stylist_details_pkey";

alter table "public"."bookings" add constraint "bookings_discount_id_fkey" FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE SET NULL not valid;

alter table "public"."bookings" validate constraint "bookings_discount_id_fkey";

alter table "public"."discounts" add constraint "discount_check" CHECK ((((discount_percentage IS NOT NULL) AND (discount_amount IS NULL)) OR ((discount_percentage IS NULL) AND (discount_amount IS NOT NULL)))) not valid;

alter table "public"."discounts" validate constraint "discount_check";

alter table "public"."discounts" add constraint "discounts_code_key" UNIQUE using index "discounts_code_key";

alter table "public"."discounts" add constraint "discounts_discount_percentage_check" CHECK (((discount_percentage >= (0)::numeric) AND (discount_percentage <= (100)::numeric))) not valid;

alter table "public"."discounts" validate constraint "discounts_discount_percentage_check";

alter table "public"."payments" add constraint "payments_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE not valid;

alter table "public"."payments" validate constraint "payments_booking_id_fkey";

alter table "public"."payments" add constraint "payments_booking_id_key" UNIQUE using index "payments_booking_id_key";

alter table "public"."payments" add constraint "payments_payment_intent_id_key" UNIQUE using index "payments_payment_intent_id_key";

alter table "public"."stylist_details" add constraint "stylist_details_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."stylist_details" validate constraint "stylist_details_profile_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.nearby_addresses(lat double precision, long double precision, radius_km double precision DEFAULT 10.0)
 RETURNS TABLE(id uuid, user_id uuid, nickname text, street_address text, city text, postal_code text, country text, entry_instructions text, is_primary boolean, lat double precision, long double precision, distance_meters double precision)
 LANGUAGE sql
 SET search_path TO ''
AS $function$
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
$function$
;

grant delete on table "public"."discounts" to "anon";

grant insert on table "public"."discounts" to "anon";

grant references on table "public"."discounts" to "anon";

grant select on table "public"."discounts" to "anon";

grant trigger on table "public"."discounts" to "anon";

grant truncate on table "public"."discounts" to "anon";

grant update on table "public"."discounts" to "anon";

grant delete on table "public"."discounts" to "authenticated";

grant insert on table "public"."discounts" to "authenticated";

grant references on table "public"."discounts" to "authenticated";

grant select on table "public"."discounts" to "authenticated";

grant trigger on table "public"."discounts" to "authenticated";

grant truncate on table "public"."discounts" to "authenticated";

grant update on table "public"."discounts" to "authenticated";

grant delete on table "public"."discounts" to "service_role";

grant insert on table "public"."discounts" to "service_role";

grant references on table "public"."discounts" to "service_role";

grant select on table "public"."discounts" to "service_role";

grant trigger on table "public"."discounts" to "service_role";

grant truncate on table "public"."discounts" to "service_role";

grant update on table "public"."discounts" to "service_role";

grant delete on table "public"."payments" to "anon";

grant insert on table "public"."payments" to "anon";

grant references on table "public"."payments" to "anon";

grant select on table "public"."payments" to "anon";

grant trigger on table "public"."payments" to "anon";

grant truncate on table "public"."payments" to "anon";

grant update on table "public"."payments" to "anon";

grant delete on table "public"."payments" to "authenticated";

grant insert on table "public"."payments" to "authenticated";

grant references on table "public"."payments" to "authenticated";

grant select on table "public"."payments" to "authenticated";

grant trigger on table "public"."payments" to "authenticated";

grant truncate on table "public"."payments" to "authenticated";

grant update on table "public"."payments" to "authenticated";

grant delete on table "public"."payments" to "service_role";

grant insert on table "public"."payments" to "service_role";

grant references on table "public"."payments" to "service_role";

grant select on table "public"."payments" to "service_role";

grant trigger on table "public"."payments" to "service_role";

grant truncate on table "public"."payments" to "service_role";

grant update on table "public"."payments" to "service_role";

grant delete on table "public"."stylist_details" to "anon";

grant insert on table "public"."stylist_details" to "anon";

grant references on table "public"."stylist_details" to "anon";

grant select on table "public"."stylist_details" to "anon";

grant trigger on table "public"."stylist_details" to "anon";

grant truncate on table "public"."stylist_details" to "anon";

grant update on table "public"."stylist_details" to "anon";

grant delete on table "public"."stylist_details" to "authenticated";

grant insert on table "public"."stylist_details" to "authenticated";

grant references on table "public"."stylist_details" to "authenticated";

grant select on table "public"."stylist_details" to "authenticated";

grant trigger on table "public"."stylist_details" to "authenticated";

grant truncate on table "public"."stylist_details" to "authenticated";

grant update on table "public"."stylist_details" to "authenticated";

grant delete on table "public"."stylist_details" to "service_role";

grant insert on table "public"."stylist_details" to "service_role";

grant references on table "public"."stylist_details" to "service_role";

grant select on table "public"."stylist_details" to "service_role";

grant trigger on table "public"."stylist_details" to "service_role";

grant truncate on table "public"."stylist_details" to "service_role";

grant update on table "public"."stylist_details" to "service_role";

create policy "Discounts are viewable by everyone."
on "public"."discounts"
as permissive
for select
to anon, authenticated
using (true);


create policy "Only admins can delete discounts."
on "public"."discounts"
as permissive
for delete
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Only admins can insert discounts."
on "public"."discounts"
as permissive
for insert
to authenticated
with check ((get_my_role() = 'admin'::user_role));


create policy "Only admins can update discounts."
on "public"."discounts"
as permissive
for update
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Users can view payments for their bookings."
on "public"."payments"
as permissive
for select
to authenticated
using (((booking_id IN ( SELECT bookings.id
   FROM bookings
  WHERE ((bookings.customer_id = ( SELECT auth.uid() AS uid)) OR (bookings.stylist_id = ( SELECT auth.uid() AS uid))))) OR (get_my_role() = 'admin'::user_role)));


create policy "Stylist details are viewable by everyone."
on "public"."stylist_details"
as permissive
for select
to anon, authenticated
using (true);


create policy "Stylists can create their own details."
on "public"."stylist_details"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = profile_id));


create policy "Stylists can delete their own details."
on "public"."stylist_details"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = profile_id));


create policy "Stylists can update their own details."
on "public"."stylist_details"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = profile_id))
with check ((( SELECT auth.uid() AS uid) = profile_id));


CREATE TRIGGER update_discounts_updated_at BEFORE UPDATE ON public.discounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stylist_details_updated_at BEFORE UPDATE ON public.stylist_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


