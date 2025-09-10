import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

interface BookingToComplete {
  id: string;
  customer_id: string;
  stylist_id: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: "confirmed";
  customer: {
    id: string;
    email: string | null;
    full_name: string | null;
  } | null;
  stylist: {
    id: string;
    email: string | null;
    full_name: string | null;
  } | null;
  booking_services:
    | Array<{
        service: {
          title: string | null;
        } | null;
      }>
    | null;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error("Unauthorized auto-complete cron job attempt");
      return new Response("Unauthorized", { status: 401 });
    }

    console.log("[AUTO_COMPLETE_CRON] Starting auto-completion of overdue bookings");

    const supabase = createServiceClient();
    
    // Calculate cutoff time - bookings that ended more than 1 hour ago
    // This gives stylists some time to manually complete bookings
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 1);
    
    console.log(
      `[AUTO_COMPLETE_CRON] Looking for confirmed bookings that ended before ${cutoffTime.toISOString()}`
    );

    // Find confirmed bookings that have passed their end time
    const { data: overdueBookings, error: fetchError } = await supabase
      .from("bookings")
      .select(`
        id,
        customer_id,
        stylist_id,
        start_time,
        end_time,
        total_price,
        status,
        customer:profiles!bookings_customer_id_fkey(
          id,
          email,
          full_name
        ),
        stylist:profiles!bookings_stylist_id_fkey(
          id,
          email,
          full_name
        ),
        booking_services(
          service:services(
            title
          )
        )
      `)
      .eq("status", "confirmed")
      .lt("end_time", cutoffTime.toISOString());

    if (fetchError) {
      console.error("[AUTO_COMPLETE_CRON] Error fetching overdue bookings:", fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          timestamp: new Date().toISOString(),
          bookingsProcessed: 0,
          bookingsCompleted: 0,
          emailsSent: 0,
          errors: 1,
          message: "Failed to fetch overdue bookings",
          errorDetails: [fetchError.message]
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const bookings = overdueBookings as BookingToComplete[];
    
    if (!bookings || bookings.length === 0) {
      console.log("[AUTO_COMPLETE_CRON] No overdue bookings found");
      return new Response(
        JSON.stringify({
          success: true,
          timestamp: new Date().toISOString(),
          bookingsProcessed: 0,
          bookingsCompleted: 0,
          emailsSent: 0,
          errors: 0,
          message: "No overdue bookings to complete"
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(
      `[AUTO_COMPLETE_CRON] Found ${bookings.length} overdue bookings to complete`
    );

    let completedCount = 0;
    let emailsSent = 0;
    let errorsCount = 0;
    const errorDetails: string[] = [];

    // Process each booking
    for (const booking of bookings) {
      try {
        console.log(
          `[AUTO_COMPLETE_CRON] Processing booking ${booking.id} (ended at ${booking.end_time})`
        );

        // Update booking status to completed
        const { error: updateError } = await supabase
          .from("bookings")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", booking.id);

        if (updateError) {
          console.error(
            `[AUTO_COMPLETE_CRON] Failed to update booking ${booking.id}:`,
            updateError
          );
          errorsCount++;
          errorDetails.push(`Booking ${booking.id}: ${updateError.message}`);
          continue;
        }

        completedCount++;
        console.log(
          `[AUTO_COMPLETE_CRON] Successfully completed booking ${booking.id}`
        );

        // Send completion emails
        try {
          if (booking.customer?.email && booking.stylist?.email) {
            // Import email sending utilities
            const { sendEmail } = await import("@/lib/resend-utils");
            const { getNabostylistenLogoUrl } = await import("@/lib/supabase/utils");
            const { format } = await import("date-fns");
            const { nb } = await import("date-fns/locale");
            const { shouldReceiveNotificationServerSide } = await import(
              "@/server/preferences.actions"
            );

            // Check user preferences for booking notifications
            const [canSendToCustomer, canSendToStylist] = await Promise.all([
              shouldReceiveNotificationServerSide(
                booking.customer_id,
                "booking_status_updates"
              ),
              shouldReceiveNotificationServerSide(
                booking.stylist_id,
                "booking_status_updates"
              ),
            ]);

            if (canSendToCustomer || canSendToStylist) {
              // Prepare common email data
              const services = booking.booking_services?.map((bs) =>
                bs.service
              ).filter(Boolean) || [];
              const serviceName = services.length > 0
                ? services[0]?.title || "Booking"
                : "Booking";
              const serviceNameWithCount = services.length > 1
                ? `${serviceName} +${services.length - 1} til`
                : serviceName;

              const startTime = new Date(booking.start_time);
              const endTime = new Date(booking.end_time);
              const bookingDate = format(startTime, "EEEE d. MMMM yyyy", {
                locale: nb,
              });
              const bookingTime = `${format(startTime, "HH:mm")} - ${
                format(endTime, "HH:mm")
              }`;

              // Import the completion email template
              const BookingCompletionEmail =
                (await import("@/transactional/emails/booking-completion")).default;

              const emailProps = {
                customerName: booking.customer.full_name || "Kunde",
                stylistName: booking.stylist.full_name || "Stylisten",
                bookingId: booking.id,
                stylistId: booking.stylist_id,
                serviceName: serviceNameWithCount,
                bookingDate,
                bookingTime,
                status: "completed" as const,
                location: "Ikke oppgitt", // Default since we don't have address data in this context
                isTrialSession: false, // We can't determine this from current data structure
              };

              // Send email to customer
              if (canSendToCustomer) {
                try {
                  await sendEmail({
                    to: [booking.customer.email],
                    subject: `Tjeneste fullført: ${serviceName}`,
                    react: BookingCompletionEmail({
                      logoUrl: getNabostylistenLogoUrl("png"),
                      ...emailProps,
                      recipientType: "customer",
                    }),
                  });
                  emailsSent++;
                  console.log(
                    `[AUTO_COMPLETE_CRON] Sent completion email to customer for booking ${booking.id}`
                  );
                } catch (emailError) {
                  console.error(
                    `[AUTO_COMPLETE_CRON] Failed to send customer email for booking ${booking.id}:`,
                    emailError
                  );
                  errorDetails.push(
                    `Booking ${booking.id} customer email: ${
                      emailError instanceof Error
                        ? emailError.message
                        : "Unknown error"
                    }`
                  );
                }
              }

              // Send email to stylist
              if (canSendToStylist) {
                try {
                  await sendEmail({
                    to: [booking.stylist.email],
                    subject: `Tjeneste automatisk fullført: ${serviceName}`,
                    react: BookingCompletionEmail({
                      logoUrl: getNabostylistenLogoUrl("png"),
                      ...emailProps,
                      recipientType: "stylist",
                    }),
                  });
                  emailsSent++;
                  console.log(
                    `[AUTO_COMPLETE_CRON] Sent completion email to stylist for booking ${booking.id}`
                  );
                } catch (emailError) {
                  console.error(
                    `[AUTO_COMPLETE_CRON] Failed to send stylist email for booking ${booking.id}:`,
                    emailError
                  );
                  errorDetails.push(
                    `Booking ${booking.id} stylist email: ${
                      emailError instanceof Error
                        ? emailError.message
                        : "Unknown error"
                    }`
                  );
                }
              }
            }
          }
        } catch (emailError) {
          console.error(
            `[AUTO_COMPLETE_CRON] Error sending completion emails for booking ${booking.id}:`,
            emailError
          );
          errorDetails.push(
            `Booking ${booking.id} emails: ${
              emailError instanceof Error ? emailError.message : "Unknown error"
            }`
          );
        }
      } catch (bookingError) {
        console.error(
          `[AUTO_COMPLETE_CRON] Error processing booking ${booking.id}:`,
          bookingError
        );
        errorsCount++;
        errorDetails.push(
          `Booking ${booking.id}: ${
            bookingError instanceof Error
              ? bookingError.message
              : "Unknown error"
          }`
        );
      }
    }

    const duration = Date.now() - startTime;
    const message =
      `Processed ${bookings.length} overdue bookings: ${completedCount} completed, ${emailsSent} emails sent, ${errorsCount} errors`;

    console.log(`[AUTO_COMPLETE_CRON] ${message} in ${duration}ms`);

    const success = errorsCount === 0;
    
    if (success) {
      console.log(`[AUTO_COMPLETE_CRON] Successfully completed: ${message}`);
    } else {
      console.error(`[AUTO_COMPLETE_CRON] Completed with errors: ${message}`);
      if (errorDetails.length > 0) {
        console.error(`[AUTO_COMPLETE_CRON] Error details:`, errorDetails);
      }
    }

    return new Response(
      JSON.stringify({
        success,
        timestamp: new Date().toISOString(),
        bookingsProcessed: bookings.length,
        bookingsCompleted: completedCount,
        emailsSent,
        errors: errorsCount,
        message,
        duration: `${duration}ms`,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined
      }),
      { 
        status: success ? 200 : 207, // 207 Multi-Status for partial success
        headers: { "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[AUTO_COMPLETE_CRON] Cron job failed:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Cron job failed",
        duration: `${duration}ms`
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}