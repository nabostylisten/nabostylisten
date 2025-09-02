drop policy "Users can update their own bookings." on "public"."bookings";

drop policy "Users can view their own bookings." on "public"."bookings";

alter table "public"."bookings" add column "is_trial_session" boolean not null default false;

alter table "public"."bookings" add column "main_booking_id" uuid;

alter table "public"."bookings" add column "trial_booking_id" uuid;

alter table "public"."services" add column "has_trial_session" boolean not null default false;

alter table "public"."services" add column "trial_session_description" text;

alter table "public"."services" add column "trial_session_duration_minutes" integer;

alter table "public"."services" add column "trial_session_price" numeric(10,2);

alter table "public"."bookings" add constraint "bookings_main_booking_id_fkey" FOREIGN KEY (main_booking_id) REFERENCES bookings(id) ON DELETE CASCADE not valid;

alter table "public"."bookings" validate constraint "bookings_main_booking_id_fkey";

alter table "public"."bookings" add constraint "bookings_trial_booking_id_fkey" FOREIGN KEY (trial_booking_id) REFERENCES bookings(id) ON DELETE SET NULL not valid;

alter table "public"."bookings" validate constraint "bookings_trial_booking_id_fkey";

create policy "Users can update their own bookings."
on "public"."bookings"
as permissive
for update
to authenticated
using (((( SELECT auth.uid() AS uid) = customer_id) OR (( SELECT auth.uid() AS uid) = stylist_id) OR ((is_trial_session = true) AND (EXISTS ( SELECT 1
   FROM bookings main
  WHERE ((main.id = bookings.main_booking_id) AND (main.stylist_id = ( SELECT auth.uid() AS uid))))))));


create policy "Users can view their own bookings."
on "public"."bookings"
as permissive
for select
to authenticated
using (((( SELECT auth.uid() AS uid) = customer_id) OR (( SELECT auth.uid() AS uid) = stylist_id) OR (EXISTS ( SELECT 1
   FROM bookings main
  WHERE ((main.id = bookings.main_booking_id) AND ((main.customer_id = ( SELECT auth.uid() AS uid)) OR (main.stylist_id = ( SELECT auth.uid() AS uid))))))));



