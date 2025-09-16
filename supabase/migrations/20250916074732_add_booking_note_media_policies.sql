create policy "Booking note images are viewable by participants"
on "public"."media"
as permissive
for select
to authenticated
using (((media_type = 'booking_note_image'::media_type) AND (booking_note_id IN ( SELECT bn.id
   FROM (booking_notes bn
     JOIN bookings b ON ((bn.booking_id = b.id)))
  WHERE ((b.customer_id = ( SELECT auth.uid() AS uid)) OR (b.stylist_id = ( SELECT auth.uid() AS uid)))))));


create policy "Stylists can upload booking note images"
on "public"."media"
as permissive
for insert
to authenticated
with check (((media_type = 'booking_note_image'::media_type) AND (( SELECT auth.uid() AS uid) = owner_id) AND (booking_note_id IN ( SELECT booking_notes.id
   FROM booking_notes
  WHERE (booking_notes.stylist_id = ( SELECT auth.uid() AS uid))))));



