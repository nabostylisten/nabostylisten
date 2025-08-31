create table "public"."discount_restrictions" (
    "discount_id" uuid not null,
    "profile_id" uuid not null
);


CREATE UNIQUE INDEX discount_restrictions_pkey ON public.discount_restrictions USING btree (discount_id, profile_id);

alter table "public"."discount_restrictions" add constraint "discount_restrictions_pkey" PRIMARY KEY using index "discount_restrictions_pkey";

alter table "public"."discount_restrictions" add constraint "discount_restrictions_discount_id_fkey" FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE CASCADE not valid;

alter table "public"."discount_restrictions" validate constraint "discount_restrictions_discount_id_fkey";

alter table "public"."discount_restrictions" add constraint "discount_restrictions_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."discount_restrictions" validate constraint "discount_restrictions_profile_id_fkey";

grant delete on table "public"."discount_restrictions" to "anon";

grant insert on table "public"."discount_restrictions" to "anon";

grant references on table "public"."discount_restrictions" to "anon";

grant select on table "public"."discount_restrictions" to "anon";

grant trigger on table "public"."discount_restrictions" to "anon";

grant truncate on table "public"."discount_restrictions" to "anon";

grant update on table "public"."discount_restrictions" to "anon";

grant delete on table "public"."discount_restrictions" to "authenticated";

grant insert on table "public"."discount_restrictions" to "authenticated";

grant references on table "public"."discount_restrictions" to "authenticated";

grant select on table "public"."discount_restrictions" to "authenticated";

grant trigger on table "public"."discount_restrictions" to "authenticated";

grant truncate on table "public"."discount_restrictions" to "authenticated";

grant update on table "public"."discount_restrictions" to "authenticated";

grant delete on table "public"."discount_restrictions" to "service_role";

grant insert on table "public"."discount_restrictions" to "service_role";

grant references on table "public"."discount_restrictions" to "service_role";

grant select on table "public"."discount_restrictions" to "service_role";

grant trigger on table "public"."discount_restrictions" to "service_role";

grant truncate on table "public"."discount_restrictions" to "service_role";

grant update on table "public"."discount_restrictions" to "service_role";


