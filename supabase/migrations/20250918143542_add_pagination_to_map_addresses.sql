drop function if exists "public"."get_map_addresses"();

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_map_addresses(limit_param integer DEFAULT 1000, offset_param integer DEFAULT 0)
 RETURNS TABLE(id uuid, user_id uuid, nickname text, street_address text, city text, postal_code text, country text, latitude double precision, longitude double precision, user_role user_role, user_name text, user_email text, is_primary boolean)
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  SELECT
    a.id,
    a.user_id,
    a.nickname,
    a.street_address,
    a.city,
    a.postal_code,
    a.country,
    gis.st_y(a.location::gis.geometry) as latitude,
    gis.st_x(a.location::gis.geometry) as longitude,
    p.role as user_role,
    p.full_name as user_name,
    p.email as user_email,
    a.is_primary
  FROM public.addresses a
  INNER JOIN public.profiles p ON a.user_id = p.id
  WHERE a.location IS NOT NULL
  ORDER BY p.role, a.city
  LIMIT limit_param
  OFFSET offset_param;
$function$
;


