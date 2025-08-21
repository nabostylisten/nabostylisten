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
      'booking-' || (
        SELECT b.id::text 
        FROM public.chats c 
        JOIN public.bookings b ON c.booking_id = b.id 
        WHERE c.id = NEW.chat_id
      ),
      false
    );
  END IF;
  
  RETURN NEW;
END;
$function$
;

create policy "Users can update messages in their own chats."
on "public"."chat_messages"
as permissive
for update
to authenticated
using ((chat_id IN ( SELECT chats.id
   FROM chats)))
with check ((chat_id IN ( SELECT chats.id
   FROM chats)));


CREATE TRIGGER broadcast_chat_message_read_status_trigger AFTER UPDATE ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION broadcast_chat_message_changes();

-- Simplified realtime policies - main security is handled by database table RLS
CREATE POLICY "authenticated can receive broadcasts" ON "realtime"."messages"
FOR SELECT TO authenticated
USING ( true );

CREATE POLICY "authenticated can send broadcasts" ON "realtime"."messages"
FOR INSERT TO authenticated
WITH CHECK ( true );


