alter table "public"."booking_notes" enable row level security;

create policy "Admins can create booking notes"
on "public"."booking_notes"
as permissive
for insert
to authenticated
with check ((get_my_role() = 'admin'::user_role));


create policy "Admins can delete booking notes"
on "public"."booking_notes"
as permissive
for delete
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Admins can update booking notes"
on "public"."booking_notes"
as permissive
for update
to authenticated
using ((get_my_role() = 'admin'::user_role))
with check ((get_my_role() = 'admin'::user_role));


create policy "Admins can view all booking notes"
on "public"."booking_notes"
as permissive
for select
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Customers can view visible booking notes"
on "public"."booking_notes"
as permissive
for select
to authenticated
using (((customer_visible = true) AND (booking_id IN ( SELECT bookings.id
   FROM bookings
  WHERE (bookings.customer_id = ( SELECT auth.uid() AS uid))))));


create policy "Stylists can create booking notes"
on "public"."booking_notes"
as permissive
for insert
to authenticated
with check (((stylist_id = ( SELECT auth.uid() AS uid)) AND (booking_id IN ( SELECT bookings.id
   FROM bookings
  WHERE (bookings.stylist_id = ( SELECT auth.uid() AS uid))))));


create policy "Stylists can delete their own booking notes"
on "public"."booking_notes"
as permissive
for delete
to authenticated
using ((stylist_id = ( SELECT auth.uid() AS uid)));


create policy "Stylists can update their own booking notes"
on "public"."booking_notes"
as permissive
for update
to authenticated
using ((stylist_id = ( SELECT auth.uid() AS uid)))
with check ((stylist_id = ( SELECT auth.uid() AS uid)));


create policy "Stylists can view their own booking notes."
on "public"."booking_notes"
as permissive
for select
to authenticated
using ((stylist_id = ( SELECT auth.uid() AS uid)));


create policy "Admins can add booking services"
on "public"."booking_services"
as permissive
for insert
to authenticated
with check ((get_my_role() = 'admin'::user_role));


create policy "Admins can delete booking services"
on "public"."booking_services"
as permissive
for delete
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Admins can create bookings"
on "public"."bookings"
as permissive
for insert
to authenticated
with check ((get_my_role() = 'admin'::user_role));


create policy "Admins can delete bookings"
on "public"."bookings"
as permissive
for delete
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Admins can update bookings"
on "public"."bookings"
as permissive
for update
to authenticated
using ((get_my_role() = 'admin'::user_role))
with check ((get_my_role() = 'admin'::user_role));


create policy "Admins can delete any media"
on "public"."media"
as permissive
for delete
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Admins can view all media"
on "public"."media"
as permissive
for select
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Admins can create payments"
on "public"."payments"
as permissive
for insert
to authenticated
with check ((get_my_role() = 'admin'::user_role));


create policy "Admins can delete payments"
on "public"."payments"
as permissive
for delete
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Admins can update payments"
on "public"."payments"
as permissive
for update
to authenticated
using ((get_my_role() = 'admin'::user_role))
with check ((get_my_role() = 'admin'::user_role));


create policy "Admins can update any profile"
on "public"."profiles"
as permissive
for update
to authenticated
using ((get_my_role() = 'admin'::user_role))
with check ((get_my_role() = 'admin'::user_role));


create policy "Admins can delete reviews"
on "public"."reviews"
as permissive
for delete
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Admins can update reviews"
on "public"."reviews"
as permissive
for update
to authenticated
using ((get_my_role() = 'admin'::user_role))
with check ((get_my_role() = 'admin'::user_role));


create policy "Admins can add service categories"
on "public"."service_service_categories"
as permissive
for insert
to authenticated
with check ((get_my_role() = 'admin'::user_role));


create policy "Admins can remove service categories"
on "public"."service_service_categories"
as permissive
for delete
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Admins can create services"
on "public"."services"
as permissive
for insert
to authenticated
with check ((get_my_role() = 'admin'::user_role));


create policy "Admins can delete services"
on "public"."services"
as permissive
for delete
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Admins can update services"
on "public"."services"
as permissive
for update
to authenticated
using ((get_my_role() = 'admin'::user_role))
with check ((get_my_role() = 'admin'::user_role));


create policy "Admins can create availability rules"
on "public"."stylist_availability_rules"
as permissive
for insert
to authenticated
with check ((get_my_role() = 'admin'::user_role));


create policy "Admins can delete availability rules"
on "public"."stylist_availability_rules"
as permissive
for delete
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Admins can update availability rules"
on "public"."stylist_availability_rules"
as permissive
for update
to authenticated
using ((get_my_role() = 'admin'::user_role))
with check ((get_my_role() = 'admin'::user_role));


create policy "Admins can view all availability rules"
on "public"."stylist_availability_rules"
as permissive
for select
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Admins can delete stylist details"
on "public"."stylist_details"
as permissive
for delete
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Admins can insert stylist details"
on "public"."stylist_details"
as permissive
for insert
to authenticated
with check ((get_my_role() = 'admin'::user_role));


create policy "Admins can update stylist details"
on "public"."stylist_details"
as permissive
for update
to authenticated
using ((get_my_role() = 'admin'::user_role))
with check ((get_my_role() = 'admin'::user_role));


create policy "Admins can create unavailability"
on "public"."stylist_unavailability"
as permissive
for insert
to authenticated
with check ((get_my_role() = 'admin'::user_role));


create policy "Admins can delete unavailability"
on "public"."stylist_unavailability"
as permissive
for delete
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Admins can update unavailability"
on "public"."stylist_unavailability"
as permissive
for update
to authenticated
using ((get_my_role() = 'admin'::user_role))
with check ((get_my_role() = 'admin'::user_role));


create policy "Admins can view all unavailability"
on "public"."stylist_unavailability"
as permissive
for select
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Admins can update user preferences"
on "public"."user_preferences"
as permissive
for update
to authenticated
using ((get_my_role() = 'admin'::user_role))
with check ((get_my_role() = 'admin'::user_role));


create policy "Admins can view all user preferences"
on "public"."user_preferences"
as permissive
for select
to authenticated
using ((get_my_role() = 'admin'::user_role));



