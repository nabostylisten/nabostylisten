create policy "Users can insert chat images for their chats."
on "public"."media"
as permissive
for insert
to authenticated
with check (((media_type = 'chat_image'::media_type) AND (( SELECT auth.uid() AS uid) = owner_id) AND (chat_message_id IN ( SELECT cm.id
   FROM ((chat_messages cm
     JOIN chats c ON ((cm.chat_id = c.id)))
     JOIN bookings b ON ((c.booking_id = b.id)))
  WHERE ((b.customer_id = ( SELECT auth.uid() AS uid)) OR (b.stylist_id = ( SELECT auth.uid() AS uid)))))));



