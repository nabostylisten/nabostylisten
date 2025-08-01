drop policy "Users can create applications." on "public"."applications";

alter table "public"."applications" drop constraint "applications_address_id_fkey";

alter table "public"."applications" drop column "address_id";

alter table "public"."applications" add column "address_nickname" text;

alter table "public"."applications" add column "city" text not null;

alter table "public"."applications" add column "country" text not null;

alter table "public"."applications" add column "email" text not null;

alter table "public"."applications" add column "entry_instructions" text;

alter table "public"."applications" add column "full_name" text not null;

alter table "public"."applications" add column "phone_number" text not null;

alter table "public"."applications" add column "postal_code" text not null;

alter table "public"."applications" add column "street_address" text not null;

alter table "public"."applications" alter column "user_id" drop not null;

alter table "public"."media" alter column "owner_id" drop not null;

create policy "Anyone can create applications."
on "public"."applications"
as permissive
for insert
to public
with check (true);


create policy "Anyone can upload application images."
on "public"."media"
as permissive
for insert
to anon, authenticated
with check ((media_type = 'application_image'::media_type));



