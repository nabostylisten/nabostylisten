set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.nearby_services(lat double precision, long double precision, radius_km double precision DEFAULT 10.0, search_term text DEFAULT NULL::text, category_ids text[] DEFAULT NULL::text[], min_price_ore integer DEFAULT NULL::integer, max_price_ore integer DEFAULT NULL::integer, at_customer_place boolean DEFAULT NULL::boolean, at_stylist_place boolean DEFAULT NULL::boolean, stylist_ids text[] DEFAULT NULL::text[], sort_by text DEFAULT 'distance_asc'::text)
 RETURNS TABLE(service_id uuid, service_title text, service_description text, service_price numeric, service_currency text, service_duration_minutes integer, service_at_customer_place boolean, service_at_stylist_place boolean, service_is_published boolean, service_created_at timestamp with time zone, service_has_trial_session boolean, service_trial_session_price numeric, service_trial_session_duration_minutes integer, service_trial_session_description text, stylist_id uuid, stylist_full_name text, stylist_bio text, stylist_can_travel boolean, stylist_has_own_place boolean, address_id uuid, address_street_address text, address_city text, address_postal_code text, address_country text, address_lat double precision, address_lng double precision, distance_meters double precision, average_rating numeric, total_reviews integer)
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  WITH service_ratings AS (
    SELECT 
      s.id as service_id,
      AVG(r.rating) as average_rating,
      COUNT(r.rating) as total_reviews
    FROM public.services s
    LEFT JOIN public.booking_services bs ON s.id = bs.service_id
    LEFT JOIN public.bookings b ON bs.booking_id = b.id
    LEFT JOIN public.reviews r ON r.booking_id = b.id
    GROUP BY s.id
  )
  SELECT 
    s.id as service_id,
    s.title as service_title,
    s.description as service_description,
    s.price as service_price,
    s.currency as service_currency,
    s.duration_minutes as service_duration_minutes,
    s.at_customer_place as service_at_customer_place,
    s.at_stylist_place as service_at_stylist_place,
    s.is_published as service_is_published,
    s.created_at as service_created_at,
    s.has_trial_session as service_has_trial_session,
    s.trial_session_price as service_trial_session_price,
    s.trial_session_duration_minutes as service_trial_session_duration_minutes,
    s.trial_session_description as service_trial_session_description,
    p.id as stylist_id,
    p.full_name as stylist_full_name,
    sd.bio as stylist_bio,
    sd.can_travel as stylist_can_travel,
    sd.has_own_place as stylist_has_own_place,
    a.id as address_id,
    a.street_address as address_street_address,
    a.city as address_city,
    a.postal_code as address_postal_code,
    a.country as address_country,
    gis.st_y(a.location::gis.geometry) as address_lat,
    gis.st_x(a.location::gis.geometry) as address_lng,
    gis.st_distance(a.location, gis.st_point(long, lat)::gis.geography) as distance_meters,
    COALESCE(sr.average_rating, 0) as average_rating,
    COALESCE(sr.total_reviews, 0) as total_reviews
  FROM public.services s
  INNER JOIN public.profiles p ON s.stylist_id = p.id
  LEFT JOIN public.stylist_details sd ON p.id = sd.profile_id
  INNER JOIN public.addresses a ON a.user_id = p.id AND a.is_primary = true
  LEFT JOIN service_ratings sr ON s.id = sr.service_id
  WHERE 
    -- Geographic constraint
    a.location IS NOT NULL
    AND gis.st_distance(a.location, gis.st_point(long, lat)::gis.geography) <= (radius_km * 1000)
    -- Service must be published
    AND s.is_published = true
    -- CRITICAL: Only include services from verified stylists
    AND sd.identity_verification_completed_at IS NOT NULL
    -- Search term filtering
    AND (
      search_term IS NULL 
      OR s.title ILIKE '%' || search_term || '%'
      OR s.description ILIKE '%' || search_term || '%'
    )
    -- Category filtering
    AND (
      category_ids IS NULL
      OR EXISTS (
        SELECT 1 FROM public.service_service_categories ssc
        WHERE ssc.service_id = s.id AND ssc.category_id::text = ANY(category_ids)
      )
    )
    -- Price filtering (prices stored as numeric, convert to øre for comparison)
    AND (min_price_ore IS NULL OR (s.price * 100)::integer >= min_price_ore)
    AND (max_price_ore IS NULL OR (s.price * 100)::integer <= max_price_ore)
    -- Service destination filtering
    AND (
      (at_customer_place IS NULL OR s.at_customer_place = at_customer_place)
      OR (at_stylist_place IS NULL OR s.at_stylist_place = at_stylist_place)
      OR (at_customer_place IS NULL AND at_stylist_place IS NULL)
    )
    -- Stylist filtering
    AND (stylist_ids IS NULL OR p.id::text = ANY(stylist_ids))
  ORDER BY 
    CASE 
      WHEN sort_by = 'distance_asc' THEN gis.st_distance(a.location, gis.st_point(long, lat)::gis.geography)
      ELSE NULL
    END ASC,
    CASE 
      WHEN sort_by = 'price_asc' THEN s.price
      ELSE NULL
    END ASC,
    CASE 
      WHEN sort_by = 'price_desc' THEN s.price
      ELSE NULL
    END DESC,
    CASE 
      WHEN sort_by = 'rating_desc' THEN COALESCE(sr.average_rating, 0)
      ELSE NULL
    END DESC,
    CASE 
      WHEN sort_by = 'rating_asc' THEN COALESCE(sr.average_rating, 0)
      ELSE NULL
    END ASC,
    CASE 
      WHEN sort_by = 'newest' THEN s.created_at
      ELSE NULL
    END DESC,
    -- Default fallback ordering
    gis.st_distance(a.location, gis.st_point(long, lat)::gis.geography) ASC;
$function$
;

CREATE OR REPLACE FUNCTION public.traditional_services(search_term text DEFAULT NULL::text, category_ids text[] DEFAULT NULL::text[], min_price_ore integer DEFAULT NULL::integer, max_price_ore integer DEFAULT NULL::integer, at_customer_place boolean DEFAULT NULL::boolean, at_stylist_place boolean DEFAULT NULL::boolean, stylist_ids text[] DEFAULT NULL::text[], city_filter text DEFAULT NULL::text, sort_by text DEFAULT 'newest'::text, limit_count integer DEFAULT 12, offset_count integer DEFAULT 0)
 RETURNS TABLE(service_id uuid, service_title text, service_description text, service_price numeric, service_currency text, service_duration_minutes integer, service_at_customer_place boolean, service_at_stylist_place boolean, service_is_published boolean, service_created_at timestamp with time zone, service_has_trial_session boolean, service_trial_session_price numeric, service_trial_session_duration_minutes integer, service_trial_session_description text, stylist_id uuid, stylist_full_name text, stylist_bio text, stylist_can_travel boolean, stylist_has_own_place boolean, address_id uuid, address_street_address text, address_city text, address_postal_code text, address_country text, average_rating numeric, total_reviews integer)
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  WITH service_ratings AS (
    SELECT 
      s.id as service_id,
      AVG(r.rating) as average_rating,
      COUNT(r.rating) as total_reviews
    FROM public.services s
    LEFT JOIN public.booking_services bs ON s.id = bs.service_id
    LEFT JOIN public.bookings b ON bs.booking_id = b.id
    LEFT JOIN public.reviews r ON r.booking_id = b.id
    GROUP BY s.id
  )
  SELECT 
    s.id as service_id,
    s.title as service_title,
    s.description as service_description,
    s.price as service_price,
    s.currency as service_currency,
    s.duration_minutes as service_duration_minutes,
    s.at_customer_place as service_at_customer_place,
    s.at_stylist_place as service_at_stylist_place,
    s.is_published as service_is_published,
    s.created_at as service_created_at,
    s.has_trial_session as service_has_trial_session,
    s.trial_session_price as service_trial_session_price,
    s.trial_session_duration_minutes as service_trial_session_duration_minutes,
    s.trial_session_description as service_trial_session_description,
    p.id as stylist_id,
    p.full_name as stylist_full_name,
    sd.bio as stylist_bio,
    sd.can_travel as stylist_can_travel,
    sd.has_own_place as stylist_has_own_place,
    a.id as address_id,
    a.street_address as address_street_address,
    a.city as address_city,
    a.postal_code as address_postal_code,
    a.country as address_country,
    COALESCE(sr.average_rating, 0) as average_rating,
    COALESCE(sr.total_reviews, 0) as total_reviews
  FROM public.services s
  INNER JOIN public.profiles p ON s.stylist_id = p.id
  LEFT JOIN public.stylist_details sd ON p.id = sd.profile_id
  LEFT JOIN public.addresses a ON a.user_id = p.id AND a.is_primary = true
  LEFT JOIN service_ratings sr ON s.id = sr.service_id
  WHERE 
    -- Service must be published
    s.is_published = true
    -- CRITICAL: Only include services from verified stylists
    AND sd.identity_verification_completed_at IS NOT NULL
    -- Search term filtering
    AND (
      search_term IS NULL 
      OR s.title ILIKE '%' || search_term || '%'
      OR s.description ILIKE '%' || search_term || '%'
    )
    -- Category filtering
    AND (
      category_ids IS NULL
      OR EXISTS (
        SELECT 1 FROM public.service_service_categories ssc
        WHERE ssc.service_id = s.id AND ssc.category_id::text = ANY(category_ids)
      )
    )
    -- Price filtering (prices stored as numeric, convert to øre for comparison)
    AND (min_price_ore IS NULL OR (s.price * 100)::integer >= min_price_ore)
    AND (max_price_ore IS NULL OR (s.price * 100)::integer <= max_price_ore)
    -- Service destination filtering
    AND (
      (at_customer_place IS NULL OR s.at_customer_place = at_customer_place)
      OR (at_stylist_place IS NULL OR s.at_stylist_place = at_stylist_place)
      OR (at_customer_place IS NULL AND at_stylist_place IS NULL)
    )
    -- Stylist filtering
    AND (stylist_ids IS NULL OR p.id::text = ANY(stylist_ids))
    -- City filtering (text-based location matching)
    AND (city_filter IS NULL OR a.city ILIKE '%' || city_filter || '%')
  ORDER BY 
    CASE 
      WHEN sort_by = 'price_asc' THEN s.price
      ELSE NULL
    END ASC,
    CASE 
      WHEN sort_by = 'price_desc' THEN s.price
      ELSE NULL
    END DESC,
    CASE 
      WHEN sort_by = 'rating_desc' THEN COALESCE(sr.average_rating, 0)
      ELSE NULL
    END DESC,
    CASE 
      WHEN sort_by = 'rating_asc' THEN COALESCE(sr.average_rating, 0)
      ELSE NULL
    END ASC,
    CASE 
      WHEN sort_by = 'newest' THEN s.created_at
      ELSE NULL
    END DESC,
    -- Default fallback ordering
    s.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
$function$
;


