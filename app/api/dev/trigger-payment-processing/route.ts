import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { shouldShowDevTools } from "@/lib/dev-utils";
import { processPaymentsForBookings } from "@/server/cron/payment-processing";

/**
 * DEV-ONLY endpoint to manually trigger payment processing
 * This reuses the exact same logic as the production cron job but bypasses time windows
 *
 * SECURITY LAYERS:
 * 1. Environment check - only works in development
 * 2. User authorization - requires admin user with dev permissions
 * 3. Never runs in production regardless of authorization
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY LAYER 1: Environment check - NEVER run in production
    if (process.env.NODE_ENV === "production") {
      return new Response("Not available in production", { status: 403 });
    }

    // SECURITY LAYER 2: Check for CRON_SECRET (for script testing) OR user authorization (for UI)
    const authHeader = request.headers.get("authorization");
    const hasCronSecret = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const supabase = await createClient();

    if (!hasCronSecret) {
      // If no cron secret, check user authorization
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || !shouldShowDevTools(user)) {
        return new Response(
          "Unauthorized - dev tools access or CRON_SECRET required",
          { status: 401 },
        );
      }
    }

    // SECURITY LAYER 3: Double-check we're not in production
    if (process.env.VERCEL_ENV === "production") {
      return new Response("Not available in production environment", {
        status: 403,
      });
    }

    console.log(
      "[DEV_PAYMENT_PROCESSING] Starting manual payment processing...",
    );

    // Query ALL confirmed bookings that need payment processing (no time window in dev)
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        *,
        customer:profiles!customer_id(id, email, full_name),
        stylist:profiles!stylist_id(id, email, full_name),
        booking_services(
          service:services(
            title
          )
        )
      `)
      .eq("status", "confirmed")
      .is("payment_captured_at", null); // Only process if not already captured

    if (bookingsError) {
      console.error(
        "[DEV_PAYMENT_PROCESSING] Error fetching bookings:",
        bookingsError,
      );
      return new Response("Error fetching bookings", { status: 500 });
    }

    if (!bookings || bookings.length === 0) {
      console.log(
        "[DEV_PAYMENT_PROCESSING] No bookings found for payment processing",
      );
      return new Response(
        JSON.stringify({
          success: true,
          message: "No bookings require payment processing",
          bookingsProcessed: 0,
          paymentsProcessed: 0,
          emailsSent: 0,
          errors: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    console.log(
      `[DEV_PAYMENT_PROCESSING] Found ${bookings.length} bookings for payment processing`,
    );

    // Use the shared processing logic
    const result = await processPaymentsForBookings(
      bookings,
      "[DEV_PAYMENT_PROCESSING]",
      true, // In dev mode
    );

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[DEV_PAYMENT_PROCESSING] Dev endpoint failed:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
