alter table "public"."discounts" alter column "discount_amount" set data type numeric(10,2) using "discount_amount"::numeric(10,2);

alter table "public"."discounts" alter column "maximum_order_amount" set data type numeric(10,2) using "maximum_order_amount"::numeric(10,2);

alter table "public"."discounts" alter column "minimum_order_amount" set data type numeric(10,2) using "minimum_order_amount"::numeric(10,2);


