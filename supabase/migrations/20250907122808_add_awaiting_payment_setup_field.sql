alter table "public"."bookings" add column "awaiting_payment_setup" boolean not null default false;

CREATE UNIQUE INDEX affiliate_commissions_booking_affiliate_unique ON public.affiliate_commissions USING btree (booking_id, affiliate_id);

CREATE UNIQUE INDEX affiliate_commissions_booking_id_key ON public.affiliate_commissions USING btree (booking_id);

alter table "public"."affiliate_commissions" add constraint "affiliate_commissions_booking_affiliate_unique" UNIQUE using index "affiliate_commissions_booking_affiliate_unique";

alter table "public"."affiliate_commissions" add constraint "affiliate_commissions_booking_id_key" UNIQUE using index "affiliate_commissions_booking_id_key";


