alter table "public"."bookings" drop column "post_payment_emails_sent_at";

alter table "public"."bookings" add column "customer_receipt_email_sent_at" timestamp with time zone;

alter table "public"."bookings" add column "stylist_notification_email_sent_at" timestamp with time zone;


