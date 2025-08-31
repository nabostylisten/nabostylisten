create policy "Admins can view all addresses"
on "public"."addresses"
as permissive
for select
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Admins can view all booking services"
on "public"."booking_services"
as permissive
for select
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Admins can view all bookings"
on "public"."bookings"
as permissive
for select
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Admins can view all chat messages"
on "public"."chat_messages"
as permissive
for select
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Admins can view all chats"
on "public"."chats"
as permissive
for select
to authenticated
using ((get_my_role() = 'admin'::user_role));



