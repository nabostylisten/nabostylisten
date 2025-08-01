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
  RETURN NEW;
END;
$function$
;


