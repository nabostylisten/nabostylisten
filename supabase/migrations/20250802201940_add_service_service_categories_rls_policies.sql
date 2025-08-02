alter table "public"."service_service_categories" enable row level security;

create policy "Service categories relationships are viewable by everyone."
on "public"."service_service_categories"
as permissive
for select
to anon, authenticated
using (true);


create policy "Stylists can add categories to their own services."
on "public"."service_service_categories"
as permissive
for insert
to authenticated
with check ((service_id IN ( SELECT services.id
   FROM services
  WHERE (services.stylist_id = ( SELECT auth.uid() AS uid)))));


create policy "Stylists can remove categories from their own services."
on "public"."service_service_categories"
as permissive
for delete
to authenticated
using ((service_id IN ( SELECT services.id
   FROM services
  WHERE (services.stylist_id = ( SELECT auth.uid() AS uid)))));



