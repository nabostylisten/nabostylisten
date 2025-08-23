create policy "Primary addresses of stylists with published services are viewa"
on "public"."addresses"
as permissive
for select
to anon, authenticated
using (((is_primary = true) AND (user_id IN ( SELECT DISTINCT services.stylist_id
   FROM services
  WHERE (services.is_published = true)))));



