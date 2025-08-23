drop policy "Customers can view booking notes marked as customer visible for" on "public"."booking_notes";

drop policy "Stylists can create booking notes for their bookings." on "public"."booking_notes";

drop policy "Stylists can delete their own booking notes." on "public"."booking_notes";

drop policy "Stylists can update their own booking notes." on "public"."booking_notes";

drop policy "Stylists can view their own booking notes." on "public"."booking_notes";

drop policy "Booking note images are viewable by stylist and customers if no" on "public"."media";

drop policy "Stylists can upload booking note images for their notes." on "public"."media";

alter table "public"."booking_notes" disable row level security;

create policy "Anyone can view booking services for reviews."
on "public"."booking_services"
as permissive
for select
to anon, authenticated
using (true);



