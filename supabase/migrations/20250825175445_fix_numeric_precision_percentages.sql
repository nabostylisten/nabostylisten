alter table "public"."affiliate_links" alter column "commission_percentage" set data type numeric(3,2) using "commission_percentage"::numeric(3,2);

alter table "public"."payments" alter column "affiliate_commission_percentage" set data type numeric(3,2) using "affiliate_commission_percentage"::numeric(3,2);


