create policy "Users can create chats for their bookings."
on "public"."chats"
as permissive
for insert
to authenticated
with check ((booking_id IN ( SELECT bookings.id
   FROM bookings
  WHERE ((bookings.customer_id = ( SELECT auth.uid() AS uid)) OR (bookings.stylist_id = ( SELECT auth.uid() AS uid))))));



