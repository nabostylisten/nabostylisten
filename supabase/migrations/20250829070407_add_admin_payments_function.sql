set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_admin_payments(search_term text DEFAULT NULL::text, status_filter text DEFAULT NULL::text, limit_count integer DEFAULT 50, offset_count integer DEFAULT 0)
 RETURNS TABLE(id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, booking_id uuid, payment_intent_id text, original_amount numeric, discount_amount numeric, final_amount numeric, platform_fee numeric, stylist_payout numeric, affiliate_commission numeric, currency text, discount_code text, status payment_status, captured_at timestamp with time zone, succeeded_at timestamp with time zone, refunded_amount numeric, refund_reason text, customer_id uuid, customer_name text, customer_email text, stylist_id uuid, stylist_name text, stylist_email text, booking_date timestamp with time zone)
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  SELECT 
    p.id,
    p.created_at,
    p.updated_at,
    p.booking_id,
    p.payment_intent_id,
    p.original_amount,
    p.discount_amount,
    p.final_amount,
    p.platform_fee,
    p.stylist_payout,
    p.affiliate_commission,
    p.currency,
    p.discount_code,
    p.status,
    p.captured_at,
    p.succeeded_at,
    p.refunded_amount,
    p.refund_reason,
    -- Customer data
    customer.id as customer_id,
    customer.full_name as customer_name,
    customer.email as customer_email,
    -- Stylist data  
    stylist.id as stylist_id,
    stylist.full_name as stylist_name,
    stylist.email as stylist_email,
    -- Booking data
    b.start_time as booking_date
  FROM public.payments p
  JOIN public.bookings b ON p.booking_id = b.id
  JOIN public.profiles customer ON b.customer_id = customer.id  
  JOIN public.profiles stylist ON b.stylist_id = stylist.id
  WHERE 
    -- Status filter
    (status_filter IS NULL OR p.status::text = status_filter OR 
     (status_filter = 'refunded' AND p.refunded_amount > 0) OR
     (status_filter = 'processing' AND p.status IN ('requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'requires_capture')))
    -- Search filter
    AND (search_term IS NULL OR 
         customer.full_name ILIKE '%' || search_term || '%' OR
         customer.email ILIKE '%' || search_term || '%' OR
         stylist.full_name ILIKE '%' || search_term || '%' OR
         stylist.email ILIKE '%' || search_term || '%' OR
         p.payment_intent_id ILIKE '%' || search_term || '%' OR
         p.discount_code ILIKE '%' || search_term || '%')
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
$function$
;


