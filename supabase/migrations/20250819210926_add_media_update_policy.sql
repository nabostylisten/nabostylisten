create policy "Users can update their own media."
on "public"."media"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = owner_id))
with check ((( SELECT auth.uid() AS uid) = owner_id));



