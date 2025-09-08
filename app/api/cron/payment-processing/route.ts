import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addHours } from "date-fns";
import { processPaymentsForBookings } from "@/server/cron/payment-processing";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = await createClient();

    // Calculate the target date range with a 3-hour window
    // We check for bookings 24-27 hours from now with 2-hour run intervals
    const now = new Date();
    const windowStart = addHours(now, 24); // 24 hours from now
    const windowEnd = addHours(now, 27); // 27 hours from now (3-hour window)

    console.log(
      `[PAYMENT_PROCESSING] Processing payments for bookings between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`,
    );

    // Query confirmed bookings that need payment processing
    // Using a 3-hour window with 2-hour intervals ensures complete coverage
    // For rescheduled bookings, we use the current start_time (not the original rescheduled_from time)
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
      .gte("start_time", windowStart.toISOString())
      .lt("start_time", windowEnd.toISOString())
      .is("payment_captured_at", null); // Only process if not already captured

    if (bookingsError) {
      console.error(
        "[PAYMENT_PROCESSING] Error fetching bookings:",
        bookingsError,
      );
      return new Response("Error fetching bookings", { status: 500 });
    }

    if (!bookings || bookings.length === 0) {
      console.log(
        "[PAYMENT_PROCESSING] No bookings found for payment processing",
      );
      return new Response("No payments to process", { status: 200 });
    }

    console.log(
      `[PAYMENT_PROCESSING] Found ${bookings.length} bookings for payment processing`,
    );

    // Use the shared processing logic
    const result = await processPaymentsForBookings(
      bookings,
      "[PAYMENT_PROCESSING]",
      false // Not in dev mode
    );

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[PAYMENT_PROCESSING] Cron job failed:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
