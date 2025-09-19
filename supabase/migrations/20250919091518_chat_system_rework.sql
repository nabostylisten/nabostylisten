drop policy "Users can create chats for their bookings." on "public"."chats";

drop policy "Users can insert messages in their own chats." on "public"."chat_messages";

drop policy "Users can update messages in their own chats." on "public"."chat_messages";

drop policy "Users can view messages in their own chats." on "public"."chat_messages";

drop policy "Users can view their own chats." on "public"."chats";

drop policy "Users can insert chat images for their chats." on "public"."media";

drop policy "Chat participants can view chat media" on "storage"."objects";

drop policy "Chat participants can upload chat media" on "storage"."objects";

alter table "public"."chats" drop constraint "chats_booking_id_fkey";

alter table "public"."chats" drop constraint "chats_booking_id_key";

drop index if exists "public"."chats_booking_id_key";

alter table "public"."chats" drop column "booking_id";

alter table "public"."chats" add column "customer_id" uuid not null;

alter table "public"."chats" add column "stylist_id" uuid not null;

CREATE UNIQUE INDEX chats_customer_id_stylist_id_key ON public.chats USING btree (customer_id, stylist_id);

alter table "public"."chats" add constraint "chats_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."chats" validate constraint "chats_customer_id_fkey";

alter table "public"."chats" add constraint "chats_customer_id_stylist_id_key" UNIQUE using index "chats_customer_id_stylist_id_key";

alter table "public"."chats" add constraint "chats_stylist_id_fkey" FOREIGN KEY (stylist_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."chats" validate constraint "chats_stylist_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.broadcast_chat_message_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only broadcast when is_read status changes
  IF TG_OP = 'UPDATE' AND OLD.is_read != NEW.is_read THEN
    PERFORM realtime.send(
      jsonb_build_object(
        'type', 'message_read_status_change',
        'chat_id', NEW.chat_id,
        'message_id', NEW.id,
        'is_read', NEW.is_read,
        'sender_id', NEW.sender_id
      ),
      'chat_message_read_status',
      'chat-' || NEW.chat_id::text,
      false
    );
  END IF;

  RETURN NEW;
END;
$function$
;

create policy "Users can create chats with their booking partners."
on "public"."chats"
as permissive
for insert
to authenticated
with check (((( SELECT auth.uid() AS uid) = customer_id) OR (( SELECT auth.uid() AS uid) = stylist_id)));


create policy "Users can insert messages in their own chats."
on "public"."chat_messages"
as permissive
for insert
to authenticated
with check (((( SELECT auth.uid() AS uid) = sender_id) AND (chat_id IN ( SELECT chats.id
   FROM chats
  WHERE ((chats.customer_id = ( SELECT auth.uid() AS uid)) OR (chats.stylist_id = ( SELECT auth.uid() AS uid)))))));


create policy "Users can update messages in their own chats."
on "public"."chat_messages"
as permissive
for update
to authenticated
using ((chat_id IN ( SELECT chats.id
   FROM chats
  WHERE ((chats.customer_id = ( SELECT auth.uid() AS uid)) OR (chats.stylist_id = ( SELECT auth.uid() AS uid))))))
with check ((chat_id IN ( SELECT chats.id
   FROM chats
  WHERE ((chats.customer_id = ( SELECT auth.uid() AS uid)) OR (chats.stylist_id = ( SELECT auth.uid() AS uid))))));


create policy "Users can view messages in their own chats."
on "public"."chat_messages"
as permissive
for select
to authenticated
using ((chat_id IN ( SELECT chats.id
   FROM chats
  WHERE ((chats.customer_id = ( SELECT auth.uid() AS uid)) OR (chats.stylist_id = ( SELECT auth.uid() AS uid))))));


create policy "Users can view their own chats."
on "public"."chats"
as permissive
for select
to authenticated
using (((( SELECT auth.uid() AS uid) = customer_id) OR (( SELECT auth.uid() AS uid) = stylist_id)));


create policy "Users can insert chat images for their chats."
on "public"."media"
as permissive
for insert
to authenticated
with check (((media_type = 'chat_image'::media_type) AND (( SELECT auth.uid() AS uid) = owner_id) AND (chat_message_id IN ( SELECT cm.id
   FROM (chat_messages cm
     JOIN chats c ON ((cm.chat_id = c.id)))
  WHERE ((c.customer_id = ( SELECT auth.uid() AS uid)) OR (c.stylist_id = ( SELECT auth.uid() AS uid)))))));


CREATE POLICY "Chat participants can view chat media" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-media' AND
  (storage.foldername(name))[1] IN (
    SELECT c.id::text FROM public.chats c
    WHERE c.customer_id = (select auth.uid()) OR c.stylist_id = (select auth.uid())
  )
);

CREATE POLICY "Chat participants can upload chat media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-media' AND
  (storage.foldername(name))[1] IN (
    SELECT c.id::text FROM public.chats c
    WHERE c.customer_id = (select auth.uid()) OR c.stylist_id = (select auth.uid())
  )
);

