import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { subHours } from "date-fns";
import { processPayoutsForBookings } from "@/server/cron/payout-processing";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = await createClient();
    const now = new Date();

    // Find completed bookings that need payout processing
    // Process bookings that ended 1-3 hours ago with hourly intervals for fast payouts
    const windowStart = subHours(now, 3);
    const windowEnd = subHours(now, 1);

    console.log(
      `[PAYOUT_PROCESSING] Processing payouts for bookings completed between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`,
    );

    // Query completed bookings that need payout processing
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
        ),
        payments(
          id,
          final_amount,
          stylist_payout,
          platform_fee,
          payment_intent_id,
          captured_at
        )
      `)
      .eq("status", "completed")
      .gte("end_time", windowStart.toISOString())
      .lt("end_time", windowEnd.toISOString())
      .not("payment_captured_at", "is", null) // Payment must have been captured
      .is("payout_processed_at", null); // Payout not yet processed

    if (bookingsError) {
      console.error(
        "[PAYOUT_PROCESSING] Error fetching bookings:",
        bookingsError,
      );
      return new Response("Error fetching bookings", { status: 500 });
    }

    if (!bookings || bookings.length === 0) {
      console.log(
        "[PAYOUT_PROCESSING] No bookings found for payout processing",
      );
      return new Response("No payouts to process", { status: 200 });
    }

    console.log(
      `[PAYOUT_PROCESSING] Found ${bookings.length} bookings for payout processing`,
    );

    // Use the shared processing logic
    const result = await processPayoutsForBookings(
      bookings,
      "[PAYOUT_PROCESSING]",
      false // Not in dev mode
    );

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[PAYOUT_PROCESSING] Cron job failed:", error);
    return new Response("Internal server error", { status: 500 });
  }
}