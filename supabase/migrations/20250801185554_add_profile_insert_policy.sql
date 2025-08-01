create policy "Profiles can be created by trigger function."
on "public"."profiles"
as permissive
for insert
to authenticated
with check (true);



