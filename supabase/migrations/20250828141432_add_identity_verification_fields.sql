alter table "public"."stylist_details" add column "identity_verification_completed_at" timestamp with time zone;

alter table "public"."stylist_details" add column "stripe_verification_session_id" text;


