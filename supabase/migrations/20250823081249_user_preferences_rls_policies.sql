alter table "public"."user_preferences" enable row level security;

create policy "Users can insert their own preferences"
on "public"."user_preferences"
as permissive
for insert
to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));


create policy "Users can update their own preferences"
on "public"."user_preferences"
as permissive
for update
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));


create policy "Users can view their own preferences"
on "public"."user_preferences"
as permissive
for select
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



