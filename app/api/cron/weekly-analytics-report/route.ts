import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/resend-utils";
import AdminWeeklyDigestEmail from "@/transactional/emails/admin-weekly-digest";
import { endOfWeek, startOfWeek, subWeeks } from "date-fns";
import { getNabostylistenLogoUrl } from "@/lib/supabase/utils";

interface WeeklyMetrics {
  newUsers: {
    total: number;
    customers: number;
    stylists: number;
    previousWeek: number;
  };
  totalUsers: {
    total: number;
    customers: number;
    stylists: number;
  };
  bookings: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
    averageValue: number;
    totalValue: number;
    previousWeekTotal: number;
  };
  revenue: {
    totalBookingsValue: number;
    platformFees: number;
    stylistPayouts: number;
    previousWeekRevenue: number;
  };
  topStylists: Array<{
    name: string;
    bookingsCount: number;
    averageRating: number;
    totalEarnings: number;
  }>;
  popularServices: Array<{
    categoryName: string;
    bookingsCount: number;
    averagePrice: number;
  }>;
  applications: {
    newApplications: number;
    pendingReview: number;
    approved: number;
    rejected: number;
  };
  engagement: {
    reviewsLeft: number;
    chatMessages: number;
  };
}

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔄 Starting weekly analytics report generation...");

    const supabase = createServiceClient();
    const now = new Date();

    // Calculate date ranges
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
    const previousWeekStart = startOfWeek(subWeeks(now, 1), {
      weekStartsOn: 1,
    });
    const previousWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    console.log(
      `📅 Current week: ${currentWeekStart.toISOString()} to ${currentWeekEnd.toISOString()}`,
    );
    console.log(
      `📅 Previous week: ${previousWeekStart.toISOString()} to ${previousWeekEnd.toISOString()}`,
    );

    // Get admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "admin");

    if (adminError) {
      console.error("❌ Error fetching admin users:", adminError);
      return NextResponse.json({ error: "Failed to fetch admin users" }, {
        status: 500,
      });
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log("ℹ️ No admin users found, skipping email send");
      return NextResponse.json({ message: "No admin users found" }, {
        status: 200,
      });
    }

    // 1. Get new user registrations (current week vs previous week)
    const [currentWeekUsers, previousWeekUsers, totalUsers] = await Promise.all(
      [
        supabase
          .from("profiles")
          .select("role")
          .gte("created_at", currentWeekStart.toISOString())
          .lte("created_at", currentWeekEnd.toISOString()),

        supabase
          .from("profiles")
          .select("role")
          .gte("created_at", previousWeekStart.toISOString())
          .lte("created_at", previousWeekEnd.toISOString()),

        supabase
          .from("profiles")
          .select("role"),
      ],
    );

    if (currentWeekUsers.error || previousWeekUsers.error || totalUsers.error) {
      throw new Error("Failed to fetch user metrics");
    }

    // Process user metrics
    const newUsersThisWeek: Omit<WeeklyMetrics["newUsers"], "previousWeek"> = {
      total: currentWeekUsers.data?.length || 0,
      customers: currentWeekUsers.data?.filter((u) =>
        u.role === "customer"
      ).length || 0,
      stylists: currentWeekUsers.data?.filter((u) =>
        u.role === "stylist"
      ).length || 0,
    };

    const newUsersPreviousWeek: WeeklyMetrics["newUsers"]["previousWeek"] =
      previousWeekUsers.data?.length || 0;

    const totalUsersCount: WeeklyMetrics["totalUsers"] = {
      total: totalUsers.data?.length || 0,
      customers: totalUsers.data?.filter((u) => u.role === "customer").length ||
        0,
      stylists: totalUsers.data?.filter((u) => u.role === "stylist").length ||
        0,
    };

    console.log("👥 User metrics calculated");

    // 2. Get booking statistics
    const [currentWeekBookings, previousWeekBookings] = await Promise.all([
      supabase
        .from("bookings")
        .select(`
          id,
          status,
          total_price,
          payments (
            final_amount,
            stylist_payout,
            platform_fee
          )
        `)
        .gte("created_at", currentWeekStart.toISOString())
        .lte("created_at", currentWeekEnd.toISOString()),

      supabase
        .from("bookings")
        .select("id, status, total_price")
        .gte("created_at", previousWeekStart.toISOString())
        .lte("created_at", previousWeekEnd.toISOString()),
    ]);

    if (currentWeekBookings.error || previousWeekBookings.error) {
      throw new Error("Failed to fetch booking metrics");
    }

    const currentBookings = currentWeekBookings.data || [];
    const previousBookings = previousWeekBookings.data || [];

    // Calculate booking metrics
    const bookingMetrics: WeeklyMetrics["bookings"] = {
      total: currentBookings.length,
      completed: currentBookings.filter((b) => b.status === "completed").length,
      cancelled: currentBookings.filter((b) => b.status === "cancelled").length,
      pending: currentBookings.filter((b) => b.status === "pending").length,
      averageValue: currentBookings.length > 0
        ? currentBookings.reduce((sum, b) => sum + (b.total_price || 0), 0) /
          currentBookings.length
        : 0,
      totalValue: currentBookings.reduce(
        (sum, b) => sum + (b.total_price || 0),
        0,
      ),
      previousWeekTotal: previousBookings.length,
    };

    // Calculate revenue metrics from payments
    const completedBookings = currentBookings.filter((b) =>
      b.status === "completed" && b.payments
    );
    const revenueMetrics: WeeklyMetrics["revenue"] = {
      totalBookingsValue: bookingMetrics.totalValue,
      platformFees: completedBookings.reduce(
        (sum, b) => sum + (b.payments?.platform_fee || 0),
        0,
      ),
      stylistPayouts: completedBookings.reduce(
        (sum, b) => sum + (b.payments?.stylist_payout || 0),
        0,
      ),
      previousWeekRevenue: previousBookings.reduce(
        (sum, b) => sum + (b.total_price || 0),
        0,
      ),
    };

    console.log("📅 Booking and revenue metrics calculated");

    // 3. Get top performing stylists (completed bookings this week)
    const { data: topStylistsData, error: stylistsError } = await supabase
      .from("bookings")
      .select(`
        stylist_id,
        profiles!bookings_stylist_id_fkey (
          full_name
        ),
        payments (
          stylist_payout
        ),
        reviews (
          rating
        )
      `)
      .eq("status", "completed")
      .gte("created_at", currentWeekStart.toISOString())
      .lte("created_at", currentWeekEnd.toISOString())
      .not("stylist_id", "is", null);

    if (stylistsError) {
      console.error("❌ Error fetching stylist performance:", stylistsError);
    }

    // Process stylist performance data
    const stylistPerformance = new Map<
      string,
      WeeklyMetrics["topStylists"][number]
    >();

    if (topStylistsData) {
      topStylistsData.forEach((booking) => {
        const stylistId = booking.stylist_id;
        const name = booking.profiles?.full_name || "Unknown Stylist";

        if (!stylistPerformance.has(stylistId)) {
          stylistPerformance.set(stylistId, {
            name,
            bookingsCount: 0,
            totalEarnings: 0,
            averageRating: 0,
          });
        }

        const stylistData = stylistPerformance.get(stylistId);
        if (stylistData) {
          stylistData.bookingsCount += 1;
          stylistData.totalEarnings += booking.payments?.stylist_payout || 0;

          if (booking.reviews?.rating) {
            stylistData.averageRating =
              (stylistData.averageRating * stylistData.bookingsCount +
                booking.reviews.rating) /
              (stylistData.bookingsCount + 1);
          }
        }
      });
    }

    const topStylists = Array.from(stylistPerformance.values())
      .sort((a, b) => b.bookingsCount - a.bookingsCount)
      .slice(0, 5);

    console.log("🏆 Top stylists calculated");

    // 4. Get popular service categories
    const { data: popularServicesData, error: servicesError } = await supabase
      .from("booking_services")
      .select(`
        service_id,
        services (
          price,
          service_service_categories (
            category_id,
            service_categories (
              name
            )
          )
        ),
        bookings!inner (
          created_at
        )
      `)
      .gte("bookings.created_at", currentWeekStart.toISOString())
      .lte("bookings.created_at", currentWeekEnd.toISOString());

    if (servicesError) {
      console.error("❌ Error fetching service popularity:", servicesError);
    }

    // Process service popularity
    const serviceCategories = new Map<
      string,
      { bookingsCount: number; totalPrice: number }
    >();

    if (popularServicesData) {
      popularServicesData.forEach((bookingService) => {
        const service = bookingService.services;
        const categories = service?.service_service_categories || [];

        categories.forEach((categoryRelation) => {
          const categoryName = categoryRelation.service_categories?.name ||
            "Unknown";

          if (!serviceCategories.has(categoryName)) {
            serviceCategories.set(categoryName, {
              bookingsCount: 0,
              totalPrice: 0,
            });
          }

          const categoryData = serviceCategories.get(categoryName)!;
          categoryData.bookingsCount += 1;
          categoryData.totalPrice += service?.price || 0;
        });
      });
    }

    const popularServices: WeeklyMetrics["popularServices"] = Array.from(
      serviceCategories.entries(),
    )
      .map(([categoryName, data]) => ({
        categoryName,
        bookingsCount: data.bookingsCount,
        averagePrice: data.bookingsCount > 0
          ? data.totalPrice / data.bookingsCount
          : 0,
      }))
      .sort((a, b) => b.bookingsCount - a.bookingsCount)
      .slice(0, 5);

    console.log("✨ Popular services calculated");

    // 5. Get application statistics
    const [
      currentWeekApplications,
      pendingApplications,
      weekApproved,
      weekRejected,
    ] = await Promise.all([
      supabase
        .from("applications")
        .select("id")
        .gte("created_at", currentWeekStart.toISOString())
        .lte("created_at", currentWeekEnd.toISOString()),

      supabase
        .from("applications")
        .select("id")
        .eq("status", "pending_info"),

      supabase
        .from("applications")
        .select("id")
        .eq("status", "approved")
        .gte("updated_at", currentWeekStart.toISOString())
        .lte("updated_at", currentWeekEnd.toISOString()),

      supabase
        .from("applications")
        .select("id")
        .eq("status", "rejected")
        .gte("updated_at", currentWeekStart.toISOString())
        .lte("updated_at", currentWeekEnd.toISOString()),
    ]);

    const applicationMetrics = {
      newApplications: currentWeekApplications.data?.length || 0,
      pendingReview: pendingApplications.data?.length || 0,
      approved: weekApproved.data?.length || 0,
      rejected: weekRejected.data?.length || 0,
    };

    console.log("📋 Application metrics calculated");

    // 6. Get engagement statistics
    const [weeklyReviews, weeklyChatMessages] = await Promise.all([
      supabase
        .from("reviews")
        .select("id")
        .gte("created_at", currentWeekStart.toISOString())
        .lte("created_at", currentWeekEnd.toISOString()),

      supabase
        .from("chat_messages")
        .select("id, created_at")
        .gte("created_at", currentWeekStart.toISOString())
        .lte("created_at", currentWeekEnd.toISOString()),
    ]);

    const engagementMetrics = {
      reviewsLeft: weeklyReviews.data?.length || 0,
      chatMessages: weeklyChatMessages.data?.length || 0,
    };

    console.log("💬 Engagement metrics calculated");

    // Compile all metrics
    const metrics: WeeklyMetrics = {
      newUsers: {
        ...newUsersThisWeek,
        previousWeek: newUsersPreviousWeek,
      },
      totalUsers: totalUsersCount,
      bookings: bookingMetrics,
      revenue: revenueMetrics,
      topStylists,
      popularServices,
      applications: applicationMetrics,
      engagement: engagementMetrics,
    };

    console.log("📊 All metrics compiled, sending emails...");

    // Format dates for email
    const weekStart = currentWeekStart.toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const weekEnd = currentWeekEnd.toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Send emails to all admin users
    const emailPromises = adminUsers.map(async (admin) => {
      try {
        const { error } = await sendEmail({
          to: [admin.email!],
          subject: `Ukentlig sammendrag (${weekStart} - ${weekEnd})`,
          react: AdminWeeklyDigestEmail({
            logoUrl: getNabostylistenLogoUrl(),
            weekStart,
            weekEnd,
            metrics,
          }),
        });

        if (error) {
          console.error(`❌ Failed to send email to ${admin.email}:`, error);
          return { success: false, email: admin.email, error };
        }

        console.log(`✅ Email sent successfully to ${admin.email}`);
        return { success: true, email: admin.email };
      } catch (error) {
        console.error(`❌ Error sending email to ${admin.email}:`, error);
        return { success: false, email: admin.email, error };
      }
    });

    const emailResults = await Promise.all(emailPromises);
    const successfulSends =
      emailResults.filter((result) => result.success).length;
    const failedSends = emailResults.filter((result) => !result.success);

    console.log(
      `✅ Weekly analytics report completed: ${successfulSends}/${adminUsers.length} emails sent successfully`,
    );

    if (failedSends.length > 0) {
      console.error("❌ Failed sends:", failedSends);
    }

    return NextResponse.json({
      success: true,
      message:
        `Weekly analytics report sent to ${successfulSends}/${adminUsers.length} admin users`,
      metrics: {
        newUsers: metrics.newUsers.total,
        totalBookings: metrics.bookings.total,
        totalRevenue: metrics.revenue.totalBookingsValue,
        emailsSent: successfulSends,
      },
      failedSends: failedSends.length > 0 ? failedSends : undefined,
    });
  } catch (error) {
    console.error("❌ Error in weekly analytics report:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
