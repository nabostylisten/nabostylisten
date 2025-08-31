create table "public"."discount_usage" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "discount_id" uuid not null,
    "profile_id" uuid not null,
    "booking_id" uuid,
    "used_at" timestamp with time zone not null default now()
);


alter table "public"."discount_usage" enable row level security;

alter table "public"."discounts" add column "maximum_order_amount" integer;

CREATE UNIQUE INDEX discount_usage_discount_id_profile_id_booking_id_key ON public.discount_usage USING btree (discount_id, profile_id, booking_id);

CREATE UNIQUE INDEX discount_usage_pkey ON public.discount_usage USING btree (id);

alter table "public"."discount_usage" add constraint "discount_usage_pkey" PRIMARY KEY using index "discount_usage_pkey";

alter table "public"."discount_usage" add constraint "discount_usage_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL not valid;

alter table "public"."discount_usage" validate constraint "discount_usage_booking_id_fkey";

alter table "public"."discount_usage" add constraint "discount_usage_discount_id_fkey" FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE CASCADE not valid;

alter table "public"."discount_usage" validate constraint "discount_usage_discount_id_fkey";

alter table "public"."discount_usage" add constraint "discount_usage_discount_id_profile_id_booking_id_key" UNIQUE using index "discount_usage_discount_id_profile_id_booking_id_key";

alter table "public"."discount_usage" add constraint "discount_usage_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."discount_usage" validate constraint "discount_usage_profile_id_fkey";

grant delete on table "public"."discount_usage" to "anon";

grant insert on table "public"."discount_usage" to "anon";

grant references on table "public"."discount_usage" to "anon";

grant select on table "public"."discount_usage" to "anon";

grant trigger on table "public"."discount_usage" to "anon";

grant truncate on table "public"."discount_usage" to "anon";

grant update on table "public"."discount_usage" to "anon";

grant delete on table "public"."discount_usage" to "authenticated";

grant insert on table "public"."discount_usage" to "authenticated";

grant references on table "public"."discount_usage" to "authenticated";

grant select on table "public"."discount_usage" to "authenticated";

grant trigger on table "public"."discount_usage" to "authenticated";

grant truncate on table "public"."discount_usage" to "authenticated";

grant update on table "public"."discount_usage" to "authenticated";

grant delete on table "public"."discount_usage" to "service_role";

grant insert on table "public"."discount_usage" to "service_role";

grant references on table "public"."discount_usage" to "service_role";

grant select on table "public"."discount_usage" to "service_role";

grant trigger on table "public"."discount_usage" to "service_role";

grant truncate on table "public"."discount_usage" to "service_role";

grant update on table "public"."discount_usage" to "service_role";

create policy "Admins can view all discount usage."
on "public"."discount_usage"
as permissive
for select
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Only admins can delete discount usage."
on "public"."discount_usage"
as permissive
for delete
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Only admins can update discount usage."
on "public"."discount_usage"
as permissive
for update
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "System can insert discount usage records."
on "public"."discount_usage"
as permissive
for insert
to authenticated
with check ((profile_id = auth.uid()));


create policy "Users can view their own discount usage."
on "public"."discount_usage"
as permissive
for select
to authenticated
using ((profile_id = auth.uid()));



