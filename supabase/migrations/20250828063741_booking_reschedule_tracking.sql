alter table "public"."bookings" add column "reschedule_reason" text;

alter table "public"."bookings" add column "rescheduled_at" timestamp with time zone;

alter table "public"."bookings" add column "rescheduled_from" timestamp with time zone;


