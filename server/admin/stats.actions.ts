"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "./middleware";
import {
  CustomDateRange,
  fillMissingPeriods,
  getDateRange,
  groupDataByPeriod,
} from "@/lib/charts/date-utils";
import { TimePeriod } from "@/lib/charts/time-periods";
import { subDays } from "date-fns";

// ==================== OVERVIEW TAB ACTIONS ====================

export async function getPlatformKPIs() {
  await requireAdmin();
  const supabase = await createClient();

  try {
    // Get total users by role
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("role")
      .order("created_at", { ascending: false });

    if (usersError) throw usersError;

    const userCounts = {
      total: users?.length || 0,
      customers: users?.filter((u) => u.role === "customer").length || 0,
      stylists: users?.filter((u) => u.role === "stylist").length || 0,
      admins: users?.filter((u) => u.role === "admin").length || 0,
    };

    // Get active bookings this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, status, total_price")
      .gte("created_at", startOfMonth.toISOString())
      .in("status", ["pending", "confirmed"]);

    if (bookingsError) throw bookingsError;

    // Get revenue this month
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("final_amount")
      .gte("created_at", startOfMonth.toISOString())
      .eq("status", "succeeded");

    if (paymentsError) throw paymentsError;

    const revenueThisMonth = payments?.reduce((sum, p) =>
      sum + (p.final_amount || 0), 0) || 0;

    // Get pending applications
    const { data: applications, error: applicationsError } = await supabase
      .from("applications")
      .select("id")
      .in("status", ["applied", "pending_info"]);

    if (applicationsError) throw applicationsError;

    return {
      users: userCounts,
      activeBookingsThisMonth: bookings?.length || 0,
      revenueThisMonth: revenueThisMonth, // Already in NOK (not øre)
      pendingApplications: applications?.length || 0,
    };
  } catch (error) {
    console.error("Error fetching platform KPIs:", error);
    throw error;
  }
}

export async function getUserGrowthTrends(
  period: TimePeriod = "last_30_days",
  customRange?: CustomDateRange,
) {
  await requireAdmin();
  const supabase = await createClient();

  try {
    const { startDate, endDate } = getDateRange(period, customRange);

    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, created_at, role")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;

    const grouped = groupDataByPeriod(
      users || [],
      "created_at",
      period,
      (items) => ({
        total: items.length,
        customers: items.filter((u) => u.role === "customer").length,
        stylists: items.filter((u) => u.role === "stylist").length,
      }),
    );

    return fillMissingPeriods(
      grouped,
      period,
      { total: 0, customers: 0, stylists: 0 },
      endDate,
    );
  } catch (error) {
    console.error("Error fetching user growth trends:", error);
    throw error;
  }
}

export async function getBookingVolumeTrends(
  period: TimePeriod = "last_30_days",
  customRange?: CustomDateRange,
) {
  await requireAdmin();
  const supabase = await createClient();

  try {
    const { startDate, endDate } = getDateRange(period, customRange);

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("id, created_at, status, total_price")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;

    const grouped = groupDataByPeriod(
      bookings || [],
      "created_at",
      period,
      (items) => ({
        total: items.length,
        confirmed: items.filter((b) => b.status === "confirmed").length,
        pending: items.filter((b) => b.status === "pending").length,
        cancelled: items.filter((b) => b.status === "cancelled").length,
        completed: items.filter((b) => b.status === "completed").length,
      }),
    );

    return fillMissingPeriods(
      grouped,
      period,
      { total: 0, confirmed: 0, pending: 0, cancelled: 0, completed: 0 },
      endDate,
    );
  } catch (error) {
    console.error("Error fetching booking volume trends:", error);
    throw error;
  }
}

export async function getRevenueOverview(
  period: TimePeriod = "last_30_days",
  customRange?: CustomDateRange,
) {
  await requireAdmin();
  const supabase = await createClient();

  try {
    const { startDate, endDate } = getDateRange(period, customRange);

    const { data: payments, error } = await supabase
      .from("payments")
      .select(
        "id, created_at, final_amount, platform_fee, stylist_payout, status",
      )
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;

    const grouped = groupDataByPeriod(
      payments || [],
      "created_at",
      period,
      (items) => ({
        totalRevenue: items
          .filter((p) => p.status === "succeeded")
          .reduce((sum, p) => sum + (p.final_amount || 0), 0),
        platformFees: items
          .filter((p) => p.status === "succeeded")
          .reduce((sum, p) => sum + (p.platform_fee || 0), 0),
        stylistPayouts: items
          .filter((p) => p.status === "succeeded")
          .reduce((sum, p) => sum + (p.stylist_payout || 0), 0),
      }),
    );

    return fillMissingPeriods(
      grouped,
      period,
      { totalRevenue: 0, platformFees: 0, stylistPayouts: 0 },
      endDate,
    );
  } catch (error) {
    console.error("Error fetching revenue overview:", error);
    throw error;
  }
}

export async function getRecentActivity(limit: number = 10) {
  await requireAdmin();
  const supabase = await createClient();

  try {
    // Get recent bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        id,
        created_at,
        status,
        total_price,
        customer:profiles!bookings_customer_id_fkey(full_name),
        stylist:profiles!bookings_stylist_id_fkey(full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (bookingsError) throw bookingsError;

    // Get recent user registrations
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, created_at, full_name, role")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (usersError) throw usersError;

    // Get recent applications
    const { data: applications, error: applicationsError } = await supabase
      .from("applications")
      .select("id, created_at, full_name, status")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (applicationsError) throw applicationsError;

    // Combine and sort all activities by created_at
    const activities = [
      ...(bookings || []).map((b) => ({
        id: b.id,
        type: "booking" as const,
        created_at: b.created_at,
        description:
          `Ny booking fra ${b.customer?.full_name} til ${b.stylist?.full_name}`,
        status: b.status,
        amount: b.total_price,
      })),
      ...(users || []).map((u) => ({
        id: u.id,
        type: "user" as const,
        created_at: u.created_at,
        description: `Ny ${
          u.role === "stylist" ? "stylist" : "kunde"
        } registrert: ${u.full_name}`,
        status: "active",
        amount: null,
      })),
      ...(applications || []).map((a) => ({
        id: a.id,
        type: "application" as const,
        created_at: a.created_at,
        description: `Ny s�knad fra ${a.full_name}`,
        status: a.status,
        amount: null,
      })),
    ]
      .sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, limit);

    return activities;
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    throw error;
  }
}

// ==================== USERS TAB ACTIONS ====================

export async function getCustomerStats() {
  await requireAdmin();
  const supabase = await createClient();

  try {
    const { data: customers, error } = await supabase
      .from("profiles")
      .select(`
        id,
        created_at,
        full_name,
        email,
        phone_number,
        bookings!bookings_customer_id_fkey(
          id,
          total_price,
          status,
          created_at
        )
      `)
      .eq("role", "customer");

    if (error) throw error;

    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    const stats = {
      totalCustomers: customers?.length || 0,
      newCustomersLast30Days: customers?.filter((c) =>
        new Date(c.created_at) >= thirtyDaysAgo
      ).length || 0,
      activeCustomers: customers?.filter((c) =>
        c.bookings && c.bookings.length > 0
      ).length || 0,
      averageLifetimeValue: 0,
    };

    // Calculate average lifetime value
    if (customers && customers.length > 0) {
      const totalValue = customers.reduce((sum, c) => {
        const customerTotal = (c.bookings || [])
          .filter((b) => b.status === "completed")
          .reduce((bSum, b) => bSum + (b.total_price || 0), 0);
        return sum + customerTotal;
      }, 0);
      stats.averageLifetimeValue = totalValue / customers.length;
    }

    return stats;
  } catch (error) {
    console.error("Error fetching customer stats:", error);
    throw error;
  }
}

export async function getStylistStats() {
  await requireAdmin();
  const supabase = await createClient();

  try {
    const { data: stylists, error } = await supabase
      .from("profiles")
      .select(`
        id,
        created_at,
        full_name,
        email,
        stylist_details(
          bio,
          can_travel,
          has_own_place
        ),
        services(id, is_published),
        bookings!bookings_stylist_id_fkey(
          id,
          status,
          total_price
        ),
        reviews!reviews_stylist_id_fkey(rating)
      `)
      .eq("role", "stylist");

    if (error) throw error;

    const stylistsWithStats = (stylists || []).map((s) => {
      const totalBookings = s.bookings?.length || 0;
      const completedBookings = s.bookings?.filter((b) =>
        b.status === "completed"
      ).length || 0;
      const revenue = s.bookings
        ?.filter((b) => b.status === "completed")
        .reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;
      const avgRating = s.reviews && s.reviews.length > 0
        ? s.reviews.reduce((sum, r) => sum + r.rating, 0) / s.reviews.length
        : 0;

      return {
        id: s.id,
        full_name: s.full_name,
        email: s.email,
        servicesCount: s.services?.filter((svc) => svc.is_published).length ||
          0,
        totalBookings,
        completedBookings,
        revenue,
        averageRating: avgRating,
        canTravel: s.stylist_details?.can_travel || false,
        hasOwnPlace: s.stylist_details?.has_own_place || false,
      };
    });

    return stylistsWithStats;
  } catch (error) {
    console.error("Error fetching stylist stats:", error);
    throw error;
  }
}

// ==================== BOOKINGS TAB ACTIONS ====================

export async function getBookingStats(
  period: TimePeriod = "last_30_days",
  customRange?: CustomDateRange,
) {
  await requireAdmin();
  const supabase = await createClient();

  try {
    const { startDate, endDate } = getDateRange(period, customRange);

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (error) throw error;

    const stats = {
      totalBookings: bookings?.length || 0,
      pendingBookings: bookings?.filter((b) => b.status === "pending").length ||
        0,
      confirmedBookings: bookings?.filter((b) =>
        b.status === "confirmed"
      ).length || 0,
      completedBookings: bookings?.filter((b) =>
        b.status === "completed"
      ).length || 0,
      cancelledBookings:
        bookings?.filter((b) => b.status === "cancelled").length || 0,
      averageBookingValue: 0,
      cancellationRate: 0,
    };

    if (bookings && bookings.length > 0) {
      const totalValue = bookings.reduce(
        (sum, b) => sum + (b.total_price || 0),
        0,
      );
      stats.averageBookingValue = totalValue / bookings.length;
      stats.cancellationRate = (stats.cancelledBookings / stats.totalBookings) *
        100;
    }

    return stats;
  } catch (error) {
    console.error("Error fetching booking stats:", error);
    throw error;
  }
}

export async function getBookingsByServiceCategory() {
  await requireAdmin();
  const supabase = await createClient();

  try {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id,
        booking_services(
          services(
            title,
            service_service_categories(
              service_categories(name)
            )
          )
        )
      `);

    if (error) throw error;

    // Count bookings by category
    const categoryCount: Record<string, number> = {};

    bookings?.forEach((booking) => {
      booking.booking_services?.forEach((bs) => {
        bs.services?.service_service_categories?.forEach((ssc) => {
          const categoryName = ssc.service_categories?.name;
          if (categoryName) {
            categoryCount[categoryName] = (categoryCount[categoryName] || 0) +
              1;
          }
        });
      });
    });

    return Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error("Error fetching bookings by category:", error);
    throw error;
  }
}

// ==================== SERVICES TAB ACTIONS ====================

export async function getServiceStats() {
  await requireAdmin();
  const supabase = await createClient();

  try {
    const { data: services, error } = await supabase
      .from("services")
      .select(`
        id,
        title,
        price,
        duration_minutes,
        is_published,
        at_customer_place,
        at_stylist_place,
        stylist_id,
        profiles!services_stylist_id_fkey(full_name),
        service_service_categories(
          service_categories(name)
        ),
        booking_services(id)
      `);

    if (error) throw error;

    const stats = {
      totalServices: services?.length || 0,
      publishedServices: services?.filter((s) => s.is_published).length || 0,
      averagePrice: 0,
      servicesAtCustomer: services?.filter((s) => s.at_customer_place).length ||
        0,
      servicesAtStylist: services?.filter((s) => s.at_stylist_place).length ||
        0,
      categoriesCount: new Set(
        services?.flatMap((s) =>
          s.service_service_categories?.map((ssc) =>
            ssc.service_categories?.name
          ) || []
        ),
      ).size,
    };

    if (services && services.length > 0) {
      const totalPrice = services.reduce(
        (sum, s) => sum + (Number(s.price) || 0),
        0,
      );
      stats.averagePrice = totalPrice / services.length;
    }

    return stats;
  } catch (error) {
    console.error("Error fetching service stats:", error);
    throw error;
  }
}

export async function getTopServices(limit: number = 10) {
  await requireAdmin();
  const supabase = await createClient();

  try {
    const { data: services, error } = await supabase
      .from("services")
      .select(`
        id,
        title,
        price,
        profiles!services_stylist_id_fkey(full_name),
        booking_services(id)
      `)
      .eq("is_published", true);

    if (error) throw error;

    const servicesWithBookingCount = (services || [])
      .map((s) => ({
        id: s.id,
        title: s.title,
        stylistName: s.profiles?.full_name || "Unknown",
        price: Number(s.price) || 0,
        bookingCount: s.booking_services?.length || 0,
      }))
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, limit);

    return servicesWithBookingCount;
  } catch (error) {
    console.error("Error fetching top services:", error);
    throw error;
  }
}
