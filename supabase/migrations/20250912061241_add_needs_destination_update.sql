alter table "public"."bookings" drop column "awaiting_payment_setup";

alter table "public"."bookings" add column "needs_destination_update" boolean not null default false;

alter table "public"."payments" add column "needs_destination_update" boolean not null default false;


