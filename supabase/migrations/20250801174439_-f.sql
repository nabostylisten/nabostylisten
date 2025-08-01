drop policy "Anyone can create applications." on "public"."applications";

create policy "Anyone can create applications."
on "public"."applications"
as permissive
for insert
to anon, authenticated
with check (true);



