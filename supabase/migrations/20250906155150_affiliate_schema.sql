create table "public"."affiliate_commissions" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "booking_id" uuid not null,
    "affiliate_id" uuid not null,
    "amount" numeric(10,2) not null,
    "currency" text not null default 'NOK'::text,
    "commission_percentage" numeric(5,2) not null,
    "status" affiliate_payout_status not null default 'pending'::affiliate_payout_status,
    "payout_id" uuid,
    "paid_at" timestamp with time zone,
    "notes" text
);


alter table "public"."affiliate_commissions" enable row level security;

alter table "public"."affiliate_payouts" add column "email_sent" boolean not null default false;

CREATE UNIQUE INDEX affiliate_commissions_pkey ON public.affiliate_commissions USING btree (id);

CREATE INDEX idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions USING btree (affiliate_id);

CREATE INDEX idx_affiliate_commissions_booking_id ON public.affiliate_commissions USING btree (booking_id);

CREATE INDEX idx_affiliate_commissions_payout_id ON public.affiliate_commissions USING btree (payout_id);

CREATE INDEX idx_affiliate_commissions_status ON public.affiliate_commissions USING btree (status);

CREATE INDEX idx_affiliate_payouts_email_sent ON public.affiliate_payouts USING btree (email_sent);

alter table "public"."affiliate_commissions" add constraint "affiliate_commissions_pkey" PRIMARY KEY using index "affiliate_commissions_pkey";

alter table "public"."affiliate_commissions" add constraint "affiliate_commissions_affiliate_id_fkey" FOREIGN KEY (affiliate_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."affiliate_commissions" validate constraint "affiliate_commissions_affiliate_id_fkey";

alter table "public"."affiliate_commissions" add constraint "affiliate_commissions_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE not valid;

alter table "public"."affiliate_commissions" validate constraint "affiliate_commissions_booking_id_fkey";

alter table "public"."affiliate_commissions" add constraint "affiliate_commissions_payout_id_fkey" FOREIGN KEY (payout_id) REFERENCES affiliate_payouts(id) ON DELETE SET NULL not valid;

alter table "public"."affiliate_commissions" validate constraint "affiliate_commissions_payout_id_fkey";

grant delete on table "public"."affiliate_commissions" to "anon";

grant insert on table "public"."affiliate_commissions" to "anon";

grant references on table "public"."affiliate_commissions" to "anon";

grant select on table "public"."affiliate_commissions" to "anon";

grant trigger on table "public"."affiliate_commissions" to "anon";

grant truncate on table "public"."affiliate_commissions" to "anon";

grant update on table "public"."affiliate_commissions" to "anon";

grant delete on table "public"."affiliate_commissions" to "authenticated";

grant insert on table "public"."affiliate_commissions" to "authenticated";

grant references on table "public"."affiliate_commissions" to "authenticated";

grant select on table "public"."affiliate_commissions" to "authenticated";

grant trigger on table "public"."affiliate_commissions" to "authenticated";

grant truncate on table "public"."affiliate_commissions" to "authenticated";

grant update on table "public"."affiliate_commissions" to "authenticated";

grant delete on table "public"."affiliate_commissions" to "service_role";

grant insert on table "public"."affiliate_commissions" to "service_role";

grant references on table "public"."affiliate_commissions" to "service_role";

grant select on table "public"."affiliate_commissions" to "service_role";

grant trigger on table "public"."affiliate_commissions" to "service_role";

grant truncate on table "public"."affiliate_commissions" to "service_role";

grant update on table "public"."affiliate_commissions" to "service_role";

create policy "Admins can view all affiliate commissions"
on "public"."affiliate_commissions"
as permissive
for select
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Only admins can update affiliate commissions"
on "public"."affiliate_commissions"
as permissive
for update
to authenticated
using ((get_my_role() = 'admin'::user_role))
with check ((get_my_role() = 'admin'::user_role));


create policy "Only system can create affiliate commissions"
on "public"."affiliate_commissions"
as permissive
for insert
to authenticated
with check ((get_my_role() = 'admin'::user_role));


create policy "Users can view their own affiliate commissions"
on "public"."affiliate_commissions"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = affiliate_id));


CREATE TRIGGER update_affiliate_commissions_updated_at BEFORE UPDATE ON public.affiliate_commissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


