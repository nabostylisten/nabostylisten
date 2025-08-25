create type "public"."affiliate_application_status" as enum ('pending', 'approved', 'rejected', 'suspended');

create type "public"."affiliate_payout_status" as enum ('pending', 'processing', 'paid', 'failed');

create type "public"."payment_status" as enum ('pending', 'requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'requires_capture', 'cancelled', 'succeeded');

create table "public"."affiliate_applications" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "stylist_id" uuid not null,
    "reason" text not null,
    "marketing_strategy" text,
    "expected_referrals" integer,
    "social_media_reach" integer,
    "status" affiliate_application_status not null default 'pending'::affiliate_application_status,
    "reviewed_by" uuid,
    "reviewed_at" timestamp with time zone,
    "review_notes" text,
    "terms_accepted" boolean not null default false,
    "terms_accepted_at" timestamp with time zone
);


alter table "public"."affiliate_applications" enable row level security;

create table "public"."affiliate_clicks" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "affiliate_link_id" uuid not null,
    "stylist_id" uuid not null,
    "visitor_id" text,
    "user_id" uuid,
    "ip_address" text,
    "user_agent" text,
    "referrer" text,
    "landing_page" text,
    "country_code" text,
    "city" text,
    "converted" boolean not null default false,
    "converted_at" timestamp with time zone,
    "booking_id" uuid,
    "commission_amount" numeric(10,2) not null default 0
);


alter table "public"."affiliate_clicks" enable row level security;

create table "public"."affiliate_links" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "stylist_id" uuid not null,
    "application_id" uuid not null,
    "link_code" text not null,
    "commission_percentage" numeric(5,4) not null default 0.20,
    "is_active" boolean not null default true,
    "expires_at" timestamp with time zone,
    "click_count" integer not null default 0,
    "conversion_count" integer not null default 0,
    "total_commission_earned" numeric(10,2) not null default 0,
    "notes" text
);


alter table "public"."affiliate_links" enable row level security;

create table "public"."affiliate_payouts" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "stylist_id" uuid not null,
    "affiliate_link_id" uuid not null,
    "payout_amount" numeric(10,2) not null,
    "currency" text not null default 'NOK'::text,
    "period_start" date not null,
    "period_end" date not null,
    "total_bookings" integer not null,
    "total_commission_earned" numeric(10,2) not null,
    "status" affiliate_payout_status not null default 'pending'::affiliate_payout_status,
    "processed_by" uuid,
    "processed_at" timestamp with time zone,
    "stripe_transfer_id" text,
    "stripe_payout_id" text,
    "notes" text
);


alter table "public"."affiliate_payouts" enable row level security;

create table "public"."platform_config" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid not null,
    "config_key" text not null,
    "config_value" jsonb not null,
    "description" text,
    "is_active" boolean not null default true,
    "environment" text not null default 'production'::text
);


alter table "public"."platform_config" enable row level security;

alter table "public"."payments" drop column "stylist_payout_amount";

alter table "public"."payments" drop column "total_amount";

alter table "public"."payments" add column "affiliate_commission" numeric(10,2) not null default 0;

alter table "public"."payments" add column "affiliate_commission_percentage" numeric(5,4);

alter table "public"."payments" add column "affiliate_id" uuid;

alter table "public"."payments" add column "authorized_at" timestamp with time zone;

alter table "public"."payments" add column "captured_at" timestamp with time zone;

alter table "public"."payments" add column "discount_amount" numeric(10,2) not null default 0;

alter table "public"."payments" add column "discount_code" text;

alter table "public"."payments" add column "discount_fixed_amount" numeric(10,2);

alter table "public"."payments" add column "discount_percentage" numeric(5,2);

alter table "public"."payments" add column "final_amount" numeric(10,2) not null;

alter table "public"."payments" add column "original_amount" numeric(10,2) not null;

alter table "public"."payments" add column "refund_reason" text;

alter table "public"."payments" add column "refunded_amount" numeric(10,2) not null default 0;

alter table "public"."payments" add column "stripe_application_fee_amount" integer not null;

alter table "public"."payments" add column "stylist_payout" numeric(10,2) not null;

alter table "public"."payments" alter column "platform_fee" set data type numeric(10,2) using "platform_fee"::numeric(10,2);

alter table "public"."payments" alter column "status" set default 'pending'::payment_status;

alter table "public"."payments" alter column "status" set data type payment_status using "status"::payment_status;

CREATE UNIQUE INDEX affiliate_applications_pkey ON public.affiliate_applications USING btree (id);

CREATE UNIQUE INDEX affiliate_clicks_pkey ON public.affiliate_clicks USING btree (id);

CREATE UNIQUE INDEX affiliate_links_application_id_key ON public.affiliate_links USING btree (application_id);

CREATE UNIQUE INDEX affiliate_links_link_code_key ON public.affiliate_links USING btree (link_code);

CREATE UNIQUE INDEX affiliate_links_pkey ON public.affiliate_links USING btree (id);

CREATE UNIQUE INDEX affiliate_links_stylist_id_key ON public.affiliate_links USING btree (stylist_id);

CREATE UNIQUE INDEX affiliate_payouts_pkey ON public.affiliate_payouts USING btree (id);

CREATE INDEX idx_affiliate_clicks_affiliate_link_id ON public.affiliate_clicks USING btree (affiliate_link_id);

CREATE INDEX idx_affiliate_clicks_booking_id ON public.affiliate_clicks USING btree (booking_id);

CREATE INDEX idx_affiliate_clicks_created_at ON public.affiliate_clicks USING btree (created_at);

CREATE INDEX idx_affiliate_clicks_user_id ON public.affiliate_clicks USING btree (user_id);

CREATE INDEX idx_affiliate_links_link_code ON public.affiliate_links USING btree (link_code);

CREATE INDEX idx_affiliate_links_stylist_id ON public.affiliate_links USING btree (stylist_id);

CREATE INDEX idx_payments_affiliate_id ON public.payments USING btree (affiliate_id);

CREATE INDEX idx_payments_booking_id ON public.payments USING btree (booking_id);

CREATE INDEX idx_payments_status ON public.payments USING btree (status);

CREATE UNIQUE INDEX platform_config_config_key_key ON public.platform_config USING btree (config_key);

CREATE UNIQUE INDEX platform_config_pkey ON public.platform_config USING btree (id);

alter table "public"."affiliate_applications" add constraint "affiliate_applications_pkey" PRIMARY KEY using index "affiliate_applications_pkey";

alter table "public"."affiliate_clicks" add constraint "affiliate_clicks_pkey" PRIMARY KEY using index "affiliate_clicks_pkey";

alter table "public"."affiliate_links" add constraint "affiliate_links_pkey" PRIMARY KEY using index "affiliate_links_pkey";

alter table "public"."affiliate_payouts" add constraint "affiliate_payouts_pkey" PRIMARY KEY using index "affiliate_payouts_pkey";

alter table "public"."platform_config" add constraint "platform_config_pkey" PRIMARY KEY using index "platform_config_pkey";

alter table "public"."affiliate_applications" add constraint "affiliate_applications_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."affiliate_applications" validate constraint "affiliate_applications_reviewed_by_fkey";

alter table "public"."affiliate_applications" add constraint "affiliate_applications_stylist_id_fkey" FOREIGN KEY (stylist_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."affiliate_applications" validate constraint "affiliate_applications_stylist_id_fkey";

alter table "public"."affiliate_clicks" add constraint "affiliate_clicks_affiliate_link_id_fkey" FOREIGN KEY (affiliate_link_id) REFERENCES affiliate_links(id) ON DELETE CASCADE not valid;

alter table "public"."affiliate_clicks" validate constraint "affiliate_clicks_affiliate_link_id_fkey";

alter table "public"."affiliate_clicks" add constraint "affiliate_clicks_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL not valid;

alter table "public"."affiliate_clicks" validate constraint "affiliate_clicks_booking_id_fkey";

alter table "public"."affiliate_clicks" add constraint "affiliate_clicks_stylist_id_fkey" FOREIGN KEY (stylist_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."affiliate_clicks" validate constraint "affiliate_clicks_stylist_id_fkey";

alter table "public"."affiliate_clicks" add constraint "affiliate_clicks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."affiliate_clicks" validate constraint "affiliate_clicks_user_id_fkey";

alter table "public"."affiliate_links" add constraint "affiliate_links_application_id_fkey" FOREIGN KEY (application_id) REFERENCES affiliate_applications(id) ON DELETE CASCADE not valid;

alter table "public"."affiliate_links" validate constraint "affiliate_links_application_id_fkey";

alter table "public"."affiliate_links" add constraint "affiliate_links_application_id_key" UNIQUE using index "affiliate_links_application_id_key";

alter table "public"."affiliate_links" add constraint "affiliate_links_link_code_key" UNIQUE using index "affiliate_links_link_code_key";

alter table "public"."affiliate_links" add constraint "affiliate_links_stylist_id_fkey" FOREIGN KEY (stylist_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."affiliate_links" validate constraint "affiliate_links_stylist_id_fkey";

alter table "public"."affiliate_links" add constraint "affiliate_links_stylist_id_key" UNIQUE using index "affiliate_links_stylist_id_key";

alter table "public"."affiliate_payouts" add constraint "affiliate_payouts_affiliate_link_id_fkey" FOREIGN KEY (affiliate_link_id) REFERENCES affiliate_links(id) ON DELETE CASCADE not valid;

alter table "public"."affiliate_payouts" validate constraint "affiliate_payouts_affiliate_link_id_fkey";

alter table "public"."affiliate_payouts" add constraint "affiliate_payouts_processed_by_fkey" FOREIGN KEY (processed_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."affiliate_payouts" validate constraint "affiliate_payouts_processed_by_fkey";

alter table "public"."affiliate_payouts" add constraint "affiliate_payouts_stylist_id_fkey" FOREIGN KEY (stylist_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."affiliate_payouts" validate constraint "affiliate_payouts_stylist_id_fkey";

alter table "public"."payments" add constraint "payments_affiliate_id_fkey" FOREIGN KEY (affiliate_id) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."payments" validate constraint "payments_affiliate_id_fkey";

alter table "public"."platform_config" add constraint "platform_config_config_key_key" UNIQUE using index "platform_config_config_key_key";

alter table "public"."platform_config" add constraint "platform_config_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."platform_config" validate constraint "platform_config_created_by_fkey";

grant delete on table "public"."affiliate_applications" to "anon";

grant insert on table "public"."affiliate_applications" to "anon";

grant references on table "public"."affiliate_applications" to "anon";

grant select on table "public"."affiliate_applications" to "anon";

grant trigger on table "public"."affiliate_applications" to "anon";

grant truncate on table "public"."affiliate_applications" to "anon";

grant update on table "public"."affiliate_applications" to "anon";

grant delete on table "public"."affiliate_applications" to "authenticated";

grant insert on table "public"."affiliate_applications" to "authenticated";

grant references on table "public"."affiliate_applications" to "authenticated";

grant select on table "public"."affiliate_applications" to "authenticated";

grant trigger on table "public"."affiliate_applications" to "authenticated";

grant truncate on table "public"."affiliate_applications" to "authenticated";

grant update on table "public"."affiliate_applications" to "authenticated";

grant delete on table "public"."affiliate_applications" to "service_role";

grant insert on table "public"."affiliate_applications" to "service_role";

grant references on table "public"."affiliate_applications" to "service_role";

grant select on table "public"."affiliate_applications" to "service_role";

grant trigger on table "public"."affiliate_applications" to "service_role";

grant truncate on table "public"."affiliate_applications" to "service_role";

grant update on table "public"."affiliate_applications" to "service_role";

grant delete on table "public"."affiliate_clicks" to "anon";

grant insert on table "public"."affiliate_clicks" to "anon";

grant references on table "public"."affiliate_clicks" to "anon";

grant select on table "public"."affiliate_clicks" to "anon";

grant trigger on table "public"."affiliate_clicks" to "anon";

grant truncate on table "public"."affiliate_clicks" to "anon";

grant update on table "public"."affiliate_clicks" to "anon";

grant delete on table "public"."affiliate_clicks" to "authenticated";

grant insert on table "public"."affiliate_clicks" to "authenticated";

grant references on table "public"."affiliate_clicks" to "authenticated";

grant select on table "public"."affiliate_clicks" to "authenticated";

grant trigger on table "public"."affiliate_clicks" to "authenticated";

grant truncate on table "public"."affiliate_clicks" to "authenticated";

grant update on table "public"."affiliate_clicks" to "authenticated";

grant delete on table "public"."affiliate_clicks" to "service_role";

grant insert on table "public"."affiliate_clicks" to "service_role";

grant references on table "public"."affiliate_clicks" to "service_role";

grant select on table "public"."affiliate_clicks" to "service_role";

grant trigger on table "public"."affiliate_clicks" to "service_role";

grant truncate on table "public"."affiliate_clicks" to "service_role";

grant update on table "public"."affiliate_clicks" to "service_role";

grant delete on table "public"."affiliate_links" to "anon";

grant insert on table "public"."affiliate_links" to "anon";

grant references on table "public"."affiliate_links" to "anon";

grant select on table "public"."affiliate_links" to "anon";

grant trigger on table "public"."affiliate_links" to "anon";

grant truncate on table "public"."affiliate_links" to "anon";

grant update on table "public"."affiliate_links" to "anon";

grant delete on table "public"."affiliate_links" to "authenticated";

grant insert on table "public"."affiliate_links" to "authenticated";

grant references on table "public"."affiliate_links" to "authenticated";

grant select on table "public"."affiliate_links" to "authenticated";

grant trigger on table "public"."affiliate_links" to "authenticated";

grant truncate on table "public"."affiliate_links" to "authenticated";

grant update on table "public"."affiliate_links" to "authenticated";

grant delete on table "public"."affiliate_links" to "service_role";

grant insert on table "public"."affiliate_links" to "service_role";

grant references on table "public"."affiliate_links" to "service_role";

grant select on table "public"."affiliate_links" to "service_role";

grant trigger on table "public"."affiliate_links" to "service_role";

grant truncate on table "public"."affiliate_links" to "service_role";

grant update on table "public"."affiliate_links" to "service_role";

grant delete on table "public"."affiliate_payouts" to "anon";

grant insert on table "public"."affiliate_payouts" to "anon";

grant references on table "public"."affiliate_payouts" to "anon";

grant select on table "public"."affiliate_payouts" to "anon";

grant trigger on table "public"."affiliate_payouts" to "anon";

grant truncate on table "public"."affiliate_payouts" to "anon";

grant update on table "public"."affiliate_payouts" to "anon";

grant delete on table "public"."affiliate_payouts" to "authenticated";

grant insert on table "public"."affiliate_payouts" to "authenticated";

grant references on table "public"."affiliate_payouts" to "authenticated";

grant select on table "public"."affiliate_payouts" to "authenticated";

grant trigger on table "public"."affiliate_payouts" to "authenticated";

grant truncate on table "public"."affiliate_payouts" to "authenticated";

grant update on table "public"."affiliate_payouts" to "authenticated";

grant delete on table "public"."affiliate_payouts" to "service_role";

grant insert on table "public"."affiliate_payouts" to "service_role";

grant references on table "public"."affiliate_payouts" to "service_role";

grant select on table "public"."affiliate_payouts" to "service_role";

grant trigger on table "public"."affiliate_payouts" to "service_role";

grant truncate on table "public"."affiliate_payouts" to "service_role";

grant update on table "public"."affiliate_payouts" to "service_role";

grant delete on table "public"."platform_config" to "anon";

grant insert on table "public"."platform_config" to "anon";

grant references on table "public"."platform_config" to "anon";

grant select on table "public"."platform_config" to "anon";

grant trigger on table "public"."platform_config" to "anon";

grant truncate on table "public"."platform_config" to "anon";

grant update on table "public"."platform_config" to "anon";

grant delete on table "public"."platform_config" to "authenticated";

grant insert on table "public"."platform_config" to "authenticated";

grant references on table "public"."platform_config" to "authenticated";

grant select on table "public"."platform_config" to "authenticated";

grant trigger on table "public"."platform_config" to "authenticated";

grant truncate on table "public"."platform_config" to "authenticated";

grant update on table "public"."platform_config" to "authenticated";

grant delete on table "public"."platform_config" to "service_role";

grant insert on table "public"."platform_config" to "service_role";

grant references on table "public"."platform_config" to "service_role";

grant select on table "public"."platform_config" to "service_role";

grant trigger on table "public"."platform_config" to "service_role";

grant truncate on table "public"."platform_config" to "service_role";

grant update on table "public"."platform_config" to "service_role";

create policy "Admins can view all affiliate applications"
on "public"."affiliate_applications"
as permissive
for select
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Only admins can update affiliate applications"
on "public"."affiliate_applications"
as permissive
for update
to authenticated
using ((get_my_role() = 'admin'::user_role))
with check ((get_my_role() = 'admin'::user_role));


create policy "Stylists can create affiliate applications"
on "public"."affiliate_applications"
as permissive
for insert
to authenticated
with check (((( SELECT auth.uid() AS uid) = stylist_id) AND (get_my_role() = 'stylist'::user_role)));


create policy "Users can view their own affiliate applications"
on "public"."affiliate_applications"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = stylist_id));


create policy "Admins can view all affiliate clicks"
on "public"."affiliate_clicks"
as permissive
for select
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "System can insert affiliate clicks"
on "public"."affiliate_clicks"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "System can update affiliate clicks for conversions"
on "public"."affiliate_clicks"
as permissive
for update
to authenticated
using (true)
with check (true);


create policy "Users can view their own affiliate clicks"
on "public"."affiliate_clicks"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = stylist_id));


create policy "Admins can view all affiliate links"
on "public"."affiliate_links"
as permissive
for select
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Only admins can create affiliate links"
on "public"."affiliate_links"
as permissive
for insert
to authenticated
with check ((get_my_role() = 'admin'::user_role));


create policy "Only admins can update affiliate links"
on "public"."affiliate_links"
as permissive
for update
to authenticated
using ((get_my_role() = 'admin'::user_role))
with check ((get_my_role() = 'admin'::user_role));


create policy "Users can disable their own affiliate links"
on "public"."affiliate_links"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = stylist_id))
with check (((( SELECT auth.uid() AS uid) = stylist_id) AND (is_active = false)));


create policy "Users can view their own affiliate links"
on "public"."affiliate_links"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = stylist_id));


create policy "Admins can view all affiliate payouts"
on "public"."affiliate_payouts"
as permissive
for select
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Only admins can create affiliate payouts"
on "public"."affiliate_payouts"
as permissive
for insert
to authenticated
with check ((get_my_role() = 'admin'::user_role));


create policy "Only admins can update affiliate payouts"
on "public"."affiliate_payouts"
as permissive
for update
to authenticated
using ((get_my_role() = 'admin'::user_role))
with check ((get_my_role() = 'admin'::user_role));


create policy "Users can view their own affiliate payouts"
on "public"."affiliate_payouts"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = stylist_id));


create policy "Only admins can delete platform config"
on "public"."platform_config"
as permissive
for delete
to authenticated
using ((get_my_role() = 'admin'::user_role));


create policy "Only admins can insert platform config"
on "public"."platform_config"
as permissive
for insert
to authenticated
with check ((get_my_role() = 'admin'::user_role));


create policy "Only admins can update platform config"
on "public"."platform_config"
as permissive
for update
to authenticated
using ((get_my_role() = 'admin'::user_role))
with check ((get_my_role() = 'admin'::user_role));


create policy "Only admins can view platform config"
on "public"."platform_config"
as permissive
for select
to authenticated
using ((get_my_role() = 'admin'::user_role));


CREATE TRIGGER update_affiliate_applications_updated_at BEFORE UPDATE ON public.affiliate_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_links_updated_at BEFORE UPDATE ON public.affiliate_links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_payouts_updated_at BEFORE UPDATE ON public.affiliate_payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_config_updated_at BEFORE UPDATE ON public.platform_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


