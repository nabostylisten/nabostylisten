alter table "public"."user_preferences" alter column "push_notifications" set default true;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role public.user_role;
BEGIN
  -- Safely extract and validate the role from metadata
  BEGIN
    -- Try to get role from user_metadata first, then app_metadata, then default to customer
    IF NEW.raw_user_meta_data ? 'role' THEN
      user_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
    ELSIF NEW.raw_app_meta_data ? 'role' THEN
      user_role := (NEW.raw_app_meta_data->>'role')::public.user_role;
    ELSE
      user_role := 'customer'::public.user_role;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If role casting fails, default to customer
    user_role := 'customer'::public.user_role;
  END;

  -- Insert the user profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone_number,
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'phone_number',
    user_role
  );

  -- Insert default user preferences
  INSERT INTO public.user_preferences (
    user_id,
    -- Newsletter and Marketing (defaults from schema)
    newsletter_subscribed,
    marketing_emails,
    promotional_sms,
    -- Booking Notifications (defaults from schema)
    booking_confirmations,
    booking_reminders,
    booking_cancellations,
    booking_status_updates,
    -- Chat and Communication (defaults from schema)
    chat_messages,
    -- Stylist-specific Notifications (defaults from schema)
    new_booking_requests,
    review_notifications,
    payment_notifications,
    -- Application Updates (defaults from schema)
    application_status_updates,
    -- Delivery Preferences (defaults from schema)
    email_delivery,
    sms_delivery,
    push_notifications
  ) VALUES (
    NEW.id,
    -- Newsletter and Marketing
    true, -- newsletter_subscribed
    true,  -- marketing_emails
    true, -- promotional_sms
    -- Booking Notifications
    true,  -- booking_confirmations
    true,  -- booking_reminders
    true,  -- booking_cancellations
    true,  -- booking_status_updates
    -- Chat and Communication
    true,  -- chat_messages
    -- Stylist-specific Notifications
    true,  -- new_booking_requests
    true,  -- review_notifications
    true,  -- payment_notifications
    -- Application Updates
    true,  -- application_status_updates
    -- Delivery Preferences
    true,  -- email_delivery
    true, -- sms_delivery
    true-- push_notifications
  );

  RETURN NEW;
END;
$function$
;


