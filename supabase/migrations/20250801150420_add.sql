create type "public"."day_of_week" as enum ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

alter table "public"."bookings" drop constraint "bookings_service_id_fkey";

alter table "public"."chats" drop constraint "chats_customer_id_fkey";

alter table "public"."chats" drop constraint "chats_stylist_id_fkey";

alter table "public"."service_categories" drop constraint "service_categories_parent_category_id_fkey";

alter table "public"."services" drop constraint "services_category_id_fkey";

alter table "public"."profiles" alter column "role" drop default;

alter type "public"."media_type" rename to "media_type__old_version_to_be_dropped";

create type "public"."media_type" as enum ('avatar', 'service_image', 'review_image', 'chat_image', 'application_image', 'landing_asset', 'logo_asset', 'other');

alter type "public"."user_role" rename to "user_role__old_version_to_be_dropped";

create type "public"."user_role" as enum ('customer', 'stylist', 'admin');

create table "public"."application_categories" (
    "application_id" uuid not null,
    "category_id" uuid not null
);


alter table "public"."application_categories" enable row level security;

create table "public"."booking_services" (
    "booking_id" uuid not null,
    "service_id" uuid not null
);


alter table "public"."booking_services" enable row level security;

create table "public"."recurring_unavailability_exceptions" (
    "id" uuid not null default gen_random_uuid(),
    "series_id" uuid not null,
    "original_start_time" timestamp with time zone not null,
    "new_start_time" timestamp with time zone,
    "new_end_time" timestamp with time zone
);


alter table "public"."recurring_unavailability_exceptions" enable row level security;

create table "public"."reviews" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "booking_id" uuid not null,
    "customer_id" uuid not null,
    "stylist_id" uuid not null,
    "rating" integer not null,
    "comment" text
);


alter table "public"."reviews" enable row level security;

create table "public"."stylist_availability_rules" (
    "id" uuid not null default gen_random_uuid(),
    "stylist_id" uuid not null,
    "day_of_week" day_of_week not null,
    "start_time" time without time zone not null,
    "end_time" time without time zone not null
);


alter table "public"."stylist_availability_rules" enable row level security;

create table "public"."stylist_recurring_unavailability" (
    "id" uuid not null default gen_random_uuid(),
    "stylist_id" uuid not null,
    "title" text,
    "start_time" time without time zone not null,
    "end_time" time without time zone not null,
    "series_start_date" date not null,
    "series_end_date" date,
    "rrule" text not null
);


alter table "public"."stylist_recurring_unavailability" enable row level security;

alter table "public"."media" alter column media_type type "public"."media_type" using media_type::text::"public"."media_type";

alter table "public"."profiles" alter column role type "public"."user_role" using role::text::"public"."user_role";

alter table "public"."profiles" alter column "role" set default 'customer'::user_role;

drop type "public"."media_type__old_version_to_be_dropped";

drop type "public"."user_role__old_version_to_be_dropped";

alter table "public"."addresses" drop column "is_home_address";

alter table "public"."addresses" add column "entry_instructions" text;

alter table "public"."addresses" add column "is_primary" boolean not null default false;

alter table "public"."addresses" enable row level security;

alter table "public"."applications" drop column "application_status";

alter table "public"."applications" drop column "application_type";

alter table "public"."applications" add column "address_id" uuid not null;

alter table "public"."applications" add column "birth_date" date not null;

alter table "public"."applications" add column "price_range_currency" text not null default 'NOK'::text;

alter table "public"."applications" add column "price_range_from" integer not null;

alter table "public"."applications" add column "price_range_to" integer not null;

alter table "public"."applications" add column "professional_experience" text not null;

alter table "public"."applications" add column "status" application_status not null default 'applied'::application_status;

alter table "public"."applications" enable row level security;

alter table "public"."bookings" drop column "service_id";

alter table "public"."bookings" drop column "stripe_payment_status";

alter table "public"."bookings" add column "total_duration_minutes" integer not null;

alter table "public"."bookings" add column "total_price" numeric(10,2) not null;

alter table "public"."bookings" enable row level security;

alter table "public"."chat_messages" enable row level security;

alter table "public"."chats" drop column "customer_id";

alter table "public"."chats" drop column "stylist_id";

alter table "public"."chats" enable row level security;

alter table "public"."media" add column "application_id" uuid;

alter table "public"."media" add column "review_id" uuid;

alter table "public"."media" enable row level security;

alter table "public"."profiles" drop column "avatar_url";

alter table "public"."profiles" drop column "gender";

alter table "public"."profiles" enable row level security;

alter table "public"."service_categories" add column "description" text;

alter table "public"."service_categories" enable row level security;

alter table "public"."services" drop column "at_customers_place";

alter table "public"."services" drop column "at_stylists_place";

alter table "public"."services" add column "at_customer_place" boolean not null default false;

alter table "public"."services" add column "at_stylist_place" boolean not null default true;

alter table "public"."services" enable row level security;

alter table "public"."stylist_unavailability" add column "reason" text;

alter table "public"."stylist_unavailability" enable row level security;

drop type "public"."application_type";

CREATE UNIQUE INDEX application_categories_pkey ON public.application_categories USING btree (application_id, category_id);

CREATE UNIQUE INDEX booking_services_pkey ON public.booking_services USING btree (booking_id, service_id);

CREATE UNIQUE INDEX chats_booking_id_key ON public.chats USING btree (booking_id);

CREATE UNIQUE INDEX media_file_path_key ON public.media USING btree (file_path);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX recurring_unavailability_exceptions_pkey ON public.recurring_unavailability_exceptions USING btree (id);

CREATE UNIQUE INDEX reviews_booking_id_key ON public.reviews USING btree (booking_id);

CREATE UNIQUE INDEX reviews_pkey ON public.reviews USING btree (id);

CREATE UNIQUE INDEX stylist_availability_rules_pkey ON public.stylist_availability_rules USING btree (id);

CREATE UNIQUE INDEX stylist_availability_rules_stylist_id_day_of_week_key ON public.stylist_availability_rules USING btree (stylist_id, day_of_week);

CREATE UNIQUE INDEX stylist_recurring_unavailability_pkey ON public.stylist_recurring_unavailability USING btree (id);

alter table "public"."application_categories" add constraint "application_categories_pkey" PRIMARY KEY using index "application_categories_pkey";

alter table "public"."booking_services" add constraint "booking_services_pkey" PRIMARY KEY using index "booking_services_pkey";

alter table "public"."recurring_unavailability_exceptions" add constraint "recurring_unavailability_exceptions_pkey" PRIMARY KEY using index "recurring_unavailability_exceptions_pkey";

alter table "public"."reviews" add constraint "reviews_pkey" PRIMARY KEY using index "reviews_pkey";

alter table "public"."stylist_availability_rules" add constraint "stylist_availability_rules_pkey" PRIMARY KEY using index "stylist_availability_rules_pkey";

alter table "public"."stylist_recurring_unavailability" add constraint "stylist_recurring_unavailability_pkey" PRIMARY KEY using index "stylist_recurring_unavailability_pkey";

alter table "public"."application_categories" add constraint "application_categories_application_id_fkey" FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE not valid;

alter table "public"."application_categories" validate constraint "application_categories_application_id_fkey";

alter table "public"."application_categories" add constraint "application_categories_category_id_fkey" FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE CASCADE not valid;

alter table "public"."application_categories" validate constraint "application_categories_category_id_fkey";

alter table "public"."applications" add constraint "applications_address_id_fkey" FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE RESTRICT not valid;

alter table "public"."applications" validate constraint "applications_address_id_fkey";

alter table "public"."booking_services" add constraint "booking_services_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE not valid;

alter table "public"."booking_services" validate constraint "booking_services_booking_id_fkey";

alter table "public"."booking_services" add constraint "booking_services_service_id_fkey" FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE not valid;

alter table "public"."booking_services" validate constraint "booking_services_service_id_fkey";

alter table "public"."chats" add constraint "chats_booking_id_key" UNIQUE using index "chats_booking_id_key";

alter table "public"."media" add constraint "media_application_id_fkey" FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE not valid;

alter table "public"."media" validate constraint "media_application_id_fkey";

alter table "public"."media" add constraint "media_file_path_key" UNIQUE using index "media_file_path_key";

alter table "public"."media" add constraint "media_review_id_fkey" FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE not valid;

alter table "public"."media" validate constraint "media_review_id_fkey";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."recurring_unavailability_exceptions" add constraint "recurring_unavailability_exceptions_series_id_fkey" FOREIGN KEY (series_id) REFERENCES stylist_recurring_unavailability(id) ON DELETE CASCADE not valid;

alter table "public"."recurring_unavailability_exceptions" validate constraint "recurring_unavailability_exceptions_series_id_fkey";

alter table "public"."reviews" add constraint "reviews_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_booking_id_fkey";

alter table "public"."reviews" add constraint "reviews_booking_id_key" UNIQUE using index "reviews_booking_id_key";

alter table "public"."reviews" add constraint "reviews_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_customer_id_fkey";

alter table "public"."reviews" add constraint "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."reviews" validate constraint "reviews_rating_check";

alter table "public"."reviews" add constraint "reviews_stylist_id_fkey" FOREIGN KEY (stylist_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_stylist_id_fkey";

alter table "public"."stylist_availability_rules" add constraint "stylist_availability_rules_stylist_id_day_of_week_key" UNIQUE using index "stylist_availability_rules_stylist_id_day_of_week_key";

alter table "public"."stylist_availability_rules" add constraint "stylist_availability_rules_stylist_id_fkey" FOREIGN KEY (stylist_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."stylist_availability_rules" validate constraint "stylist_availability_rules_stylist_id_fkey";

alter table "public"."stylist_recurring_unavailability" add constraint "stylist_recurring_unavailability_stylist_id_fkey" FOREIGN KEY (stylist_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."stylist_recurring_unavailability" validate constraint "stylist_recurring_unavailability_stylist_id_fkey";

alter table "public"."service_categories" add constraint "service_categories_parent_category_id_fkey" FOREIGN KEY (parent_category_id) REFERENCES service_categories(id) ON DELETE SET NULL not valid;

alter table "public"."service_categories" validate constraint "service_categories_parent_category_id_fkey";

alter table "public"."services" add constraint "services_category_id_fkey" FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE CASCADE not valid;

alter table "public"."services" validate constraint "services_category_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_my_role()
 RETURNS user_role
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT role::public.user_role FROM public.profiles WHERE id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$function$
;

grant delete on table "public"."application_categories" to "anon";

grant insert on table "public"."application_categories" to "anon";

grant references on table "public"."application_categories" to "anon";

grant select on table "public"."application_categories" to "anon";

grant trigger on table "public"."application_categories" to "anon";

grant truncate on table "public"."application_categories" to "anon";

grant update on table "public"."application_categories" to "anon";

grant delete on table "public"."application_categories" to "authenticated";

grant insert on table "public"."application_categories" to "authenticated";

grant references on table "public"."application_categories" to "authenticated";

grant select on table "public"."application_categories" to "authenticated";

grant trigger on table "public"."application_categories" to "authenticated";

grant truncate on table "public"."application_categories" to "authenticated";

grant update on table "public"."application_categories" to "authenticated";

grant delete on table "public"."application_categories" to "service_role";

grant insert on table "public"."application_categories" to "service_role";

grant references on table "public"."application_categories" to "service_role";

grant select on table "public"."application_categories" to "service_role";

grant trigger on table "public"."application_categories" to "service_role";

grant truncate on table "public"."application_categories" to "service_role";

grant update on table "public"."application_categories" to "service_role";

grant delete on table "public"."booking_services" to "anon";

grant insert on table "public"."booking_services" to "anon";

grant references on table "public"."booking_services" to "anon";

grant select on table "public"."booking_services" to "anon";

grant trigger on table "public"."booking_services" to "anon";

grant truncate on table "public"."booking_services" to "anon";

grant update on table "public"."booking_services" to "anon";

grant delete on table "public"."booking_services" to "authenticated";

grant insert on table "public"."booking_services" to "authenticated";

grant references on table "public"."booking_services" to "authenticated";

grant select on table "public"."booking_services" to "authenticated";

grant trigger on table "public"."booking_services" to "authenticated";

grant truncate on table "public"."booking_services" to "authenticated";

grant update on table "public"."booking_services" to "authenticated";

grant delete on table "public"."booking_services" to "service_role";

grant insert on table "public"."booking_services" to "service_role";

grant references on table "public"."booking_services" to "service_role";

grant select on table "public"."booking_services" to "service_role";

grant trigger on table "public"."booking_services" to "service_role";

grant truncate on table "public"."booking_services" to "service_role";

grant update on table "public"."booking_services" to "service_role";

grant delete on table "public"."recurring_unavailability_exceptions" to "anon";

grant insert on table "public"."recurring_unavailability_exceptions" to "anon";

grant references on table "public"."recurring_unavailability_exceptions" to "anon";

grant select on table "public"."recurring_unavailability_exceptions" to "anon";

grant trigger on table "public"."recurring_unavailability_exceptions" to "anon";

grant truncate on table "public"."recurring_unavailability_exceptions" to "anon";

grant update on table "public"."recurring_unavailability_exceptions" to "anon";

grant delete on table "public"."recurring_unavailability_exceptions" to "authenticated";

grant insert on table "public"."recurring_unavailability_exceptions" to "authenticated";

grant references on table "public"."recurring_unavailability_exceptions" to "authenticated";

grant select on table "public"."recurring_unavailability_exceptions" to "authenticated";

grant trigger on table "public"."recurring_unavailability_exceptions" to "authenticated";

grant truncate on table "public"."recurring_unavailability_exceptions" to "authenticated";

grant update on table "public"."recurring_unavailability_exceptions" to "authenticated";

grant delete on table "public"."recurring_unavailability_exceptions" to "service_role";

grant insert on table "public"."recurring_unavailability_exceptions" to "service_role";

grant references on table "public"."recurring_unavailability_exceptions" to "service_role";

grant select on table "public"."recurring_unavailability_exceptions" to "service_role";

grant trigger on table "public"."recurring_unavailability_exceptions" to "service_role";

grant truncate on table "public"."recurring_unavailability_exceptions" to "service_role";

grant update on table "public"."recurring_unavailability_exceptions" to "service_role";

grant delete on table "public"."reviews" to "anon";

grant insert on table "public"."reviews" to "anon";

grant references on table "public"."reviews" to "anon";

grant select on table "public"."reviews" to "anon";

grant trigger on table "public"."reviews" to "anon";

grant truncate on table "public"."reviews" to "anon";

grant update on table "public"."reviews" to "anon";

grant delete on table "public"."reviews" to "authenticated";

grant insert on table "public"."reviews" to "authenticated";

grant references on table "public"."reviews" to "authenticated";

grant select on table "public"."reviews" to "authenticated";

grant trigger on table "public"."reviews" to "authenticated";

grant truncate on table "public"."reviews" to "authenticated";

grant update on table "public"."reviews" to "authenticated";

grant delete on table "public"."reviews" to "service_role";

grant insert on table "public"."reviews" to "service_role";

grant references on table "public"."reviews" to "service_role";

grant select on table "public"."reviews" to "service_role";

grant trigger on table "public"."reviews" to "service_role";

grant truncate on table "public"."reviews" to "service_role";

grant update on table "public"."reviews" to "service_role";

grant delete on table "public"."stylist_availability_rules" to "anon";

grant insert on table "public"."stylist_availability_rules" to "anon";

grant references on table "public"."stylist_availability_rules" to "anon";

grant select on table "public"."stylist_availability_rules" to "anon";

grant trigger on table "public"."stylist_availability_rules" to "anon";

grant truncate on table "public"."stylist_availability_rules" to "anon";

grant update on table "public"."stylist_availability_rules" to "anon";

grant delete on table "public"."stylist_availability_rules" to "authenticated";

grant insert on table "public"."stylist_availability_rules" to "authenticated";

grant references on table "public"."stylist_availability_rules" to "authenticated";

grant select on table "public"."stylist_availability_rules" to "authenticated";

grant trigger on table "public"."stylist_availability_rules" to "authenticated";

grant truncate on table "public"."stylist_availability_rules" to "authenticated";

grant update on table "public"."stylist_availability_rules" to "authenticated";

grant delete on table "public"."stylist_availability_rules" to "service_role";

grant insert on table "public"."stylist_availability_rules" to "service_role";

grant references on table "public"."stylist_availability_rules" to "service_role";

grant select on table "public"."stylist_availability_rules" to "service_role";

grant trigger on table "public"."stylist_availability_rules" to "service_role";

grant truncate on table "public"."stylist_availability_rules" to "service_role";

grant update on table "public"."stylist_availability_rules" to "service_role";

grant delete on table "public"."stylist_recurring_unavailability" to "anon";

grant insert on table "public"."stylist_recurring_unavailability" to "anon";

grant references on table "public"."stylist_recurring_unavailability" to "anon";

grant select on table "public"."stylist_recurring_unavailability" to "anon";

grant trigger on table "public"."stylist_recurring_unavailability" to "anon";

grant truncate on table "public"."stylist_recurring_unavailability" to "anon";

grant update on table "public"."stylist_recurring_unavailability" to "anon";

grant delete on table "public"."stylist_recurring_unavailability" to "authenticated";

grant insert on table "public"."stylist_recurring_unavailability" to "authenticated";

grant references on table "public"."stylist_recurring_unavailability" to "authenticated";

grant select on table "public"."stylist_recurring_unavailability" to "authenticated";

grant trigger on table "public"."stylist_recurring_unavailability" to "authenticated";

grant truncate on table "public"."stylist_recurring_unavailability" to "authenticated";

grant update on table "public"."stylist_recurring_unavailability" to "authenticated";

grant delete on table "public"."stylist_recurring_unavailability" to "service_role";

grant insert on table "public"."stylist_recurring_unavailability" to "service_role";

grant references on table "public"."stylist_recurring_unavailability" to "service_role";

grant select on table "public"."stylist_recurring_unavailability" to "service_role";

grant trigger on table "public"."stylist_recurring_unavailability" to "service_role";

grant truncate on table "public"."stylist_recurring_unavailability" to "service_role";

grant update on table "public"."stylist_recurring_unavailability" to "service_role";

create policy "Users can delete their own addresses."
on "public"."addresses"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can insert their own addresses."
on "public"."addresses"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can update their own addresses."
on "public"."addresses"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can view their own addresses."
on "public"."addresses"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Admins can view all application categories."
on "public"."application_categories"
as permissive
for select
to public
using ((get_my_role() = 'admin'::user_role));


create policy "Users can manage categories on their own application."
on "public"."application_categories"
as permissive
for all
to public
using ((application_id IN ( SELECT applications.id
   FROM applications
  WHERE (applications.user_id = ( SELECT auth.uid() AS uid)))));


create policy "Admins can delete applications."
on "public"."applications"
as permissive
for delete
to public
using ((get_my_role() = 'admin'::user_role));


create policy "Admins can update applications."
on "public"."applications"
as permissive
for update
to public
using ((get_my_role() = 'admin'::user_role));


create policy "Users can create applications."
on "public"."applications"
as permissive
for insert
to public
with check ((user_id = ( SELECT auth.uid() AS uid)));


create policy "Users can view their own application, admins view all."
on "public"."applications"
as permissive
for select
to public
using (((user_id = ( SELECT auth.uid() AS uid)) OR (get_my_role() = 'admin'::user_role)));


create policy "Customers can add services to bookings."
on "public"."booking_services"
as permissive
for insert
to authenticated
with check ((booking_id IN ( SELECT bookings.id
   FROM bookings
  WHERE (bookings.customer_id = ( SELECT auth.uid() AS uid)))));


create policy "Users can view services on their bookings."
on "public"."booking_services"
as permissive
for select
to authenticated
using ((booking_id IN ( SELECT bookings.id
   FROM bookings
  WHERE ((bookings.customer_id = ( SELECT auth.uid() AS uid)) OR (bookings.stylist_id = ( SELECT auth.uid() AS uid))))));


create policy "Customers can create bookings."
on "public"."bookings"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = customer_id));


create policy "Users can update their own bookings."
on "public"."bookings"
as permissive
for update
to authenticated
using (((( SELECT auth.uid() AS uid) = customer_id) OR (( SELECT auth.uid() AS uid) = stylist_id)));


create policy "Users can view their own bookings."
on "public"."bookings"
as permissive
for select
to authenticated
using (((( SELECT auth.uid() AS uid) = customer_id) OR (( SELECT auth.uid() AS uid) = stylist_id)));


create policy "Users can insert messages in their own chats."
on "public"."chat_messages"
as permissive
for insert
to authenticated
with check (((( SELECT auth.uid() AS uid) = sender_id) AND (chat_id IN ( SELECT chats.id
   FROM chats))));


create policy "Users can view messages in their own chats."
on "public"."chat_messages"
as permissive
for select
to authenticated
using ((chat_id IN ( SELECT chats.id
   FROM chats)));


create policy "Users can view their own chats."
on "public"."chats"
as permissive
for select
to authenticated
using (((( SELECT auth.uid() AS uid) IN ( SELECT bookings.customer_id
   FROM bookings
  WHERE (bookings.id = chats.booking_id))) OR (( SELECT auth.uid() AS uid) IN ( SELECT bookings.stylist_id
   FROM bookings
  WHERE (bookings.id = chats.booking_id)))));


create policy "Chat images are viewable by participants."
on "public"."media"
as permissive
for select
to authenticated
using (((media_type = 'chat_image'::media_type) AND (chat_message_id IN ( SELECT chat_messages.id
   FROM chat_messages))));


create policy "Public media is viewable by everyone."
on "public"."media"
as permissive
for select
to anon, authenticated
using ((media_type = ANY (ARRAY['avatar'::media_type, 'service_image'::media_type, 'review_image'::media_type, 'landing_asset'::media_type, 'logo_asset'::media_type])));


create policy "Users can delete their own media."
on "public"."media"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = owner_id));


create policy "Users can insert their own media."
on "public"."media"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = owner_id));


create policy "Profiles are viewable by everyone."
on "public"."profiles"
as permissive
for select
to anon, authenticated
using (true);


create policy "Users can update their own profile."
on "public"."profiles"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = id))
with check ((( SELECT auth.uid() AS uid) = id));


create policy "Availability exceptions are viewable by authenticated users."
on "public"."recurring_unavailability_exceptions"
as permissive
for select
to authenticated
using (true);


create policy "Stylists can delete availability exceptions."
on "public"."recurring_unavailability_exceptions"
as permissive
for delete
to public
using ((series_id IN ( SELECT stylist_recurring_unavailability.id
   FROM stylist_recurring_unavailability
  WHERE (stylist_recurring_unavailability.stylist_id = ( SELECT auth.uid() AS uid)))));


create policy "Stylists can insert availability exceptions."
on "public"."recurring_unavailability_exceptions"
as permissive
for insert
to public
with check ((series_id IN ( SELECT stylist_recurring_unavailability.id
   FROM stylist_recurring_unavailability
  WHERE (stylist_recurring_unavailability.stylist_id = ( SELECT auth.uid() AS uid)))));


create policy "Stylists can update availability exceptions."
on "public"."recurring_unavailability_exceptions"
as permissive
for update
to public
using ((series_id IN ( SELECT stylist_recurring_unavailability.id
   FROM stylist_recurring_unavailability
  WHERE (stylist_recurring_unavailability.stylist_id = ( SELECT auth.uid() AS uid)))));


create policy "Customers can create reviews."
on "public"."reviews"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = customer_id));


create policy "Customers can delete their own reviews."
on "public"."reviews"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = customer_id));


create policy "Customers can update their own reviews."
on "public"."reviews"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = customer_id))
with check ((( SELECT auth.uid() AS uid) = customer_id));


create policy "Reviews are viewable by everyone."
on "public"."reviews"
as permissive
for select
to anon, authenticated
using (true);


create policy "Admins can delete service categories."
on "public"."service_categories"
as permissive
for delete
to public
using ((get_my_role() = 'admin'::user_role));


create policy "Admins can insert service categories."
on "public"."service_categories"
as permissive
for insert
to public
with check ((get_my_role() = 'admin'::user_role));


create policy "Admins can update service categories."
on "public"."service_categories"
as permissive
for update
to public
using ((get_my_role() = 'admin'::user_role));


create policy "Service categories are viewable by everyone."
on "public"."service_categories"
as permissive
for select
to anon, authenticated
using (true);


create policy "Services are viewable by everyone."
on "public"."services"
as permissive
for select
to anon, authenticated
using (true);


create policy "Stylists can create services."
on "public"."services"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = stylist_id));


create policy "Stylists can delete their own services."
on "public"."services"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = stylist_id));


create policy "Stylists can update their own services."
on "public"."services"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = stylist_id))
with check ((( SELECT auth.uid() AS uid) = stylist_id));


create policy "Availability is viewable by authenticated users."
on "public"."stylist_availability_rules"
as permissive
for select
to authenticated
using (true);


create policy "Stylists can delete their own availability rules."
on "public"."stylist_availability_rules"
as permissive
for delete
to public
using ((stylist_id = ( SELECT auth.uid() AS uid)));


create policy "Stylists can insert their own availability rules."
on "public"."stylist_availability_rules"
as permissive
for insert
to public
with check ((stylist_id = ( SELECT auth.uid() AS uid)));


create policy "Stylists can update their own availability rules."
on "public"."stylist_availability_rules"
as permissive
for update
to public
using ((stylist_id = ( SELECT auth.uid() AS uid)));


create policy "Recurring unavailability is viewable by authenticated users."
on "public"."stylist_recurring_unavailability"
as permissive
for select
to authenticated
using (true);


create policy "Stylists can delete recurring unavailability."
on "public"."stylist_recurring_unavailability"
as permissive
for delete
to public
using ((stylist_id = ( SELECT auth.uid() AS uid)));


create policy "Stylists can insert recurring unavailability."
on "public"."stylist_recurring_unavailability"
as permissive
for insert
to public
with check ((stylist_id = ( SELECT auth.uid() AS uid)));


create policy "Stylists can update recurring unavailability."
on "public"."stylist_recurring_unavailability"
as permissive
for update
to public
using ((stylist_id = ( SELECT auth.uid() AS uid)));


create policy "Stylists can delete their own unavailability."
on "public"."stylist_unavailability"
as permissive
for delete
to public
using ((stylist_id = ( SELECT auth.uid() AS uid)));


create policy "Stylists can insert their own unavailability."
on "public"."stylist_unavailability"
as permissive
for insert
to public
with check ((stylist_id = ( SELECT auth.uid() AS uid)));


create policy "Stylists can update their own unavailability."
on "public"."stylist_unavailability"
as permissive
for update
to public
using ((stylist_id = ( SELECT auth.uid() AS uid)));


create policy "Unavailability is viewable by authenticated users."
on "public"."stylist_unavailability"
as permissive
for select
to authenticated
using (true);



