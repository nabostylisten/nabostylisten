drop policy "Users can update their own bookings." on "public"."bookings";

drop policy "Users can view their own bookings." on "public"."bookings";

create policy "Users can update their own bookings."
on "public"."bookings"
as permissive
for update
to authenticated
using (((( SELECT auth.uid() AS uid) = customer_id) OR (( SELECT auth.uid() AS uid) = stylist_id)));


create policy "Users can view their own bookings."
on "public"."bookings"
as permissive
for select
to authenticated
using (((( SELECT auth.uid() AS uid) = customer_id) OR (( SELECT auth.uid() AS uid) = stylist_id)));



