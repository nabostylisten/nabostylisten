alter table "public"."affiliate_commissions" alter column "status" drop default;

alter table "public"."affiliate_payouts" alter column "status" drop default;

alter type "public"."affiliate_payout_status" rename to "affiliate_payout_status__old_version_to_be_dropped";

create type "public"."affiliate_payout_status" as enum ('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled');

alter table "public"."affiliate_commissions" alter column status type "public"."affiliate_payout_status" using status::text::"public"."affiliate_payout_status";

alter table "public"."affiliate_payouts" alter column status type "public"."affiliate_payout_status" using status::text::"public"."affiliate_payout_status";

alter table "public"."affiliate_commissions" alter column "status" set default 'pending'::affiliate_payout_status;

alter table "public"."affiliate_payouts" alter column "status" set default 'pending'::affiliate_payout_status;

drop type "public"."affiliate_payout_status__old_version_to_be_dropped";


