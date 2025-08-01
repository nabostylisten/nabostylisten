drop policy "Users can view their own application, admins view all." on "public"."applications";

drop policy "Anyone can create applications." on "public"."applications";

create policy "Anyone can view applications."
on "public"."applications"
as permissive
for select
to public
using (true);


create policy "Anyone can create applications."
on "public"."applications"
as permissive
for insert
to public
with check (true);



