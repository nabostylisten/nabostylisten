"use client";

import { useQuery } from "@tanstack/react-query";
import { TimePeriod, CustomDateRange } from "@/lib/charts/date-utils";
import {
  getPlatformKPIs,
  getUserGrowthTrends,
  getBookingVolumeTrends,
  getRevenueOverview,
  getRecentActivity,
  getCustomerStats,
  getStylistStats,
  getBookingStats,
  getBookingsByServiceCategory,
  getServiceStats,
  getTopServices,
} from "@/server/admin/stats.actions";

const defaultQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: false,
};

// ==================== OVERVIEW TAB HOOKS ====================

export function useOverviewData() {
  const platformKPIs = useQuery({
    queryKey: ["admin", "platform-kpis"],
    queryFn: () => getPlatformKPIs(),
    ...defaultQueryOptions,
  });

  const recentActivity = useQuery({
    queryKey: ["admin", "recent-activity"],
    queryFn: () => getRecentActivity(15),
    ...defaultQueryOptions,
    staleTime: 1 * 60 * 1000, // 1 minute for activity feed
  });

  return {
    platformKPIs,
    recentActivity,
    isLoading: platformKPIs.isLoading || recentActivity.isLoading,
    error: platformKPIs.error || recentActivity.error,
  };
}

export function useUserGrowthTrends(
  period: TimePeriod = "last_30_days",
  customRange?: CustomDateRange
) {
  return useQuery({
    queryKey: ["admin", "user-growth-trends", period, customRange],
    queryFn: () => getUserGrowthTrends(period, customRange),
    ...defaultQueryOptions,
    enabled: !!period,
  });
}

export function useBookingVolumeTrends(
  period: TimePeriod = "last_30_days", 
  customRange?: CustomDateRange
) {
  return useQuery({
    queryKey: ["admin", "booking-volume-trends", period, customRange],
    queryFn: () => getBookingVolumeTrends(period, customRange),
    ...defaultQueryOptions,
    enabled: !!period,
  });
}

export function useRevenueOverview(
  period: TimePeriod = "last_30_days",
  customRange?: CustomDateRange
) {
  return useQuery({
    queryKey: ["admin", "revenue-overview", period, customRange],
    queryFn: () => getRevenueOverview(period, customRange),
    ...defaultQueryOptions,
    enabled: !!period,
  });
}

// ==================== USERS TAB HOOKS ====================

export function useUsersData() {
  const customerStats = useQuery({
    queryKey: ["admin", "customer-stats"],
    queryFn: () => getCustomerStats(),
    ...defaultQueryOptions,
  });

  const stylistStats = useQuery({
    queryKey: ["admin", "stylist-stats"],
    queryFn: () => getStylistStats(),
    ...defaultQueryOptions,
  });

  return {
    customerStats,
    stylistStats,
    isLoading: customerStats.isLoading || stylistStats.isLoading,
    error: customerStats.error || stylistStats.error,
  };
}

// ==================== BOOKINGS TAB HOOKS ====================

export function useBookingsData(
  period: TimePeriod = "last_30_days",
  customRange?: CustomDateRange
) {
  const bookingStats = useQuery({
    queryKey: ["admin", "booking-stats", period, customRange],
    queryFn: () => getBookingStats(period, customRange),
    ...defaultQueryOptions,
    enabled: !!period,
  });

  const bookingsByCategory = useQuery({
    queryKey: ["admin", "bookings-by-category"],
    queryFn: () => getBookingsByServiceCategory(),
    ...defaultQueryOptions,
  });

  return {
    bookingStats,
    bookingsByCategory,
    isLoading: bookingStats.isLoading || bookingsByCategory.isLoading,
    error: bookingStats.error || bookingsByCategory.error,
  };
}

// ==================== SERVICES TAB HOOKS ====================

export function useServicesData() {
  const serviceStats = useQuery({
    queryKey: ["admin", "service-stats"],
    queryFn: () => getServiceStats(),
    ...defaultQueryOptions,
  });

  const topServices = useQuery({
    queryKey: ["admin", "top-services"],
    queryFn: () => getTopServices(15),
    ...defaultQueryOptions,
  });

  return {
    serviceStats,
    topServices,
    isLoading: serviceStats.isLoading || topServices.isLoading,
    error: serviceStats.error || topServices.error,
  };
}