import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend-utils";
import { BookingReminderEmail } from "@/transactional/emails/booking-reminder";
import { shouldReceiveNotification } from "@/lib/preferences-utils";
import { format, addHours } from "date-fns";
import { nb } from "date-fns/locale";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = await createClient();

    // Calculate the target date range (20-28 hours from now)
    const now = new Date();
    const startTime = addHours(now, 20); // 20 hours from now
    const endTime = addHours(now, 28); // 28 hours from now

    console.log(`[BOOKING_REMINDERS] Checking bookings between ${startTime.toISOString()} and ${endTime.toISOString()}`);

    // Query bookings that are confirmed and within the reminder window
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        *,
        customer:profiles!customer_id(id, email, full_name),
        stylist:profiles!stylist_id(id, email, full_name, phone_number),
        services:booking_services(
          service:services(
            title,
            duration_minutes
          )
        ),
        addresses(
          street_address,
          postal_code,
          city,
          entry_instructions
        )
      `)
      .eq("status", "confirmed")
      .gte("start_time", startTime.toISOString())
      .lte("start_time", endTime.toISOString());

    if (bookingsError) {
      console.error("[BOOKING_REMINDERS] Error fetching bookings:", bookingsError);
      return new Response("Error fetching bookings", { status: 500 });
    }

    if (!bookings || bookings.length === 0) {
      console.log("[BOOKING_REMINDERS] No bookings found for reminder window");
      return new Response("No bookings to remind", { status: 200 });
    }

    console.log(`[BOOKING_REMINDERS] Found ${bookings.length} bookings to process`);

    let emailsSent = 0;
    let errorsCount = 0;

    // Process each booking
    for (const booking of bookings) {
      try {
        // Check if customer wants booking reminders
        const canSendReminder = await shouldReceiveNotification(
          supabase,
          booking.customer_id,
  "booking.reminders"
        );

        if (!canSendReminder) {
          console.log(`[BOOKING_REMINDERS] Skipping reminder for booking ${booking.id} - customer preferences disabled`);
          continue;
        }

        if (!booking.customer?.email || !booking.stylist?.full_name) {
          console.log(`[BOOKING_REMINDERS] Skipping booking ${booking.id} - missing customer email or stylist name`);
          continue;
        }

        // Format booking details
        const bookingDate = format(new Date(booking.start_time), "d. MMMM yyyy", { locale: nb });
        const bookingStartTime = format(new Date(booking.start_time), "HH:mm");
        const bookingEndTime = format(new Date(booking.end_time), "HH:mm");
        const bookingTime = `${bookingStartTime} - ${bookingEndTime}`;

        // Get service names
        const serviceNames = booking.services?.map(bs => bs.service?.title).filter(Boolean) || [];

        // Determine location and address
        const location = booking.address_id ? "Hjemme hos deg" : "Hos stylisten";
        const address = booking.address_id && booking.addresses
          ? `${booking.addresses.street_address}, ${booking.addresses.postal_code} ${booking.addresses.city}`
          : undefined;

        // Send reminder email
        const { error: emailError } = await sendEmail({
          to: [booking.customer.email],
          subject: `Påminnelse: ${serviceNames[0] || "Din time"} i morgen`,
          react: BookingReminderEmail({
            logoUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/logo-email.png`,
            customerName: booking.customer.full_name || "Kunde",
            stylistName: booking.stylist.full_name || "Stylist",
            bookingId: booking.id,
            serviceName: serviceNames.join(", ") || "Skjønnhetstjeneste",
            bookingDate: bookingDate,
            bookingTime: bookingTime,
            location: location,
            address: address,
            entryInstructions: booking.addresses?.entry_instructions || undefined,
            stylistPhone: booking.stylist.phone_number || undefined,
            totalPrice: booking.total_price || 0,
            currency: "NOK",
          }),
        });

        if (emailError) {
          console.error(`[BOOKING_REMINDERS] Failed to send reminder for booking ${booking.id}:`, emailError);
          errorsCount++;
        } else {
          console.log(`[BOOKING_REMINDERS] Sent reminder for booking ${booking.id} to ${booking.customer.email}`);
          emailsSent++;
        }

      } catch (error) {
        console.error(`[BOOKING_REMINDERS] Error processing booking ${booking.id}:`, error);
        errorsCount++;
      }
    }

    console.log(`[BOOKING_REMINDERS] Completed: ${emailsSent} emails sent, ${errorsCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        bookingsProcessed: bookings.length,
        emailsSent,
        errors: errorsCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[BOOKING_REMINDERS] Cron job failed:", error);
    return new Response("Internal server error", { status: 500 });
  }
}