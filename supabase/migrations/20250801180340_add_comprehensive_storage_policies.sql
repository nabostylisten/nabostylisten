drop policy "Anyone can create applications." on "public"."applications";

drop policy "Anyone can view applications." on "public"."applications";

create policy "Anyone can create applications."
on "public"."applications"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Anyone can view applications."
on "public"."applications"
as permissive
for select
to anon, authenticated
using (true);



