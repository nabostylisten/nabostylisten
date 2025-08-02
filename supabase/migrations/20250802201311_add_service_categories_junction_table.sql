alter table "public"."services" drop constraint "services_category_id_fkey";

create table "public"."service_service_categories" (
    "service_id" uuid not null,
    "category_id" uuid not null
);


alter table "public"."services" drop column "category_id";

CREATE UNIQUE INDEX service_service_categories_pkey ON public.service_service_categories USING btree (service_id, category_id);

alter table "public"."service_service_categories" add constraint "service_service_categories_pkey" PRIMARY KEY using index "service_service_categories_pkey";

alter table "public"."service_service_categories" add constraint "service_service_categories_category_id_fkey" FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE CASCADE not valid;

alter table "public"."service_service_categories" validate constraint "service_service_categories_category_id_fkey";

alter table "public"."service_service_categories" add constraint "service_service_categories_service_id_fkey" FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE not valid;

alter table "public"."service_service_categories" validate constraint "service_service_categories_service_id_fkey";

grant delete on table "public"."service_service_categories" to "anon";

grant insert on table "public"."service_service_categories" to "anon";

grant references on table "public"."service_service_categories" to "anon";

grant select on table "public"."service_service_categories" to "anon";

grant trigger on table "public"."service_service_categories" to "anon";

grant truncate on table "public"."service_service_categories" to "anon";

grant update on table "public"."service_service_categories" to "anon";

grant delete on table "public"."service_service_categories" to "authenticated";

grant insert on table "public"."service_service_categories" to "authenticated";

grant references on table "public"."service_service_categories" to "authenticated";

grant select on table "public"."service_service_categories" to "authenticated";

grant trigger on table "public"."service_service_categories" to "authenticated";

grant truncate on table "public"."service_service_categories" to "authenticated";

grant update on table "public"."service_service_categories" to "authenticated";

grant delete on table "public"."service_service_categories" to "service_role";

grant insert on table "public"."service_service_categories" to "service_role";

grant references on table "public"."service_service_categories" to "service_role";

grant select on table "public"."service_service_categories" to "service_role";

grant trigger on table "public"."service_service_categories" to "service_role";

grant truncate on table "public"."service_service_categories" to "service_role";

grant update on table "public"."service_service_categories" to "service_role";


