import {
  addDays,
  endOfDay,
  endOfMonth,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import { getDateGrouper, TimePeriod } from "./time-periods";

export interface CustomDateRange {
  startDate: Date;
  endDate: Date;
}

export function getDateRange(
  period: TimePeriod,
  customRange?: CustomDateRange,
) {
  const now = new Date();

  if (period === "custom" && customRange) {
    return {
      startDate: startOfDay(customRange.startDate),
      endDate: endOfDay(customRange.endDate),
    };
  }

  switch (period) {
    case "last_7_days":
      return {
        startDate: startOfDay(subDays(now, 6)),
        endDate: endOfDay(now),
      };
    case "last_30_days":
      return {
        startDate: startOfDay(subDays(now, 29)),
        endDate: endOfDay(now),
      };
    case "last_3_months":
      return {
        startDate: startOfDay(subMonths(now, 3)),
        endDate: endOfDay(now),
      };
    case "last_6_months":
      return {
        startDate: startOfDay(subMonths(now, 6)),
        endDate: endOfDay(now),
      };
    case "last_year":
      return {
        startDate: startOfDay(subYears(now, 1)),
        endDate: endOfDay(now),
      };
    case "this_month":
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };
    case "this_year":
      return {
        startDate: startOfYear(now),
        endDate: endOfYear(now),
      };
    default:
      return {
        startDate: startOfDay(subDays(now, 29)),
        endDate: endOfDay(now),
      };
  }
}

export function groupDataByPeriod<T>(
  data: T[],
  dateField: keyof T,
  period: TimePeriod,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aggregator: (items: T[]) => any,
) {
  const grouper = getDateGrouper(period);
  const grouped = new Map<string, T[]>();

  data.forEach((item) => {
    const date = new Date(item[dateField] as string);
    const key = grouper(date);

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)?.push(item);
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => ({
      date,
      ...aggregator(items),
    }));
}

export function fillMissingPeriods<T extends { date: string }>(
  data: T[],
  period: TimePeriod,
  defaultValue: Omit<T, "date">,
  endDate: Date = new Date(),
): T[] {
  const { startDate } = getDateRange(period);
  const grouper = getDateGrouper(period);
  const filledData: T[] = [];
  const dataMap = new Map(data.map((item) => [item.date, item]));

  let currentDate = startDate;
  while (currentDate <= endDate) {
    const key = grouper(currentDate);
    filledData.push(
      dataMap.get(key) || ({
        date: key,
        ...defaultValue,
      } as T),
    );

    // Increment based on period
    if (
      period === "last_7_days" || period === "last_30_days" ||
      period === "this_month"
    ) {
      currentDate = addDays(currentDate, 1);
    } else if (period === "last_3_months" || period === "last_6_months") {
      currentDate = addDays(currentDate, 7); // Weekly
    } else {
      currentDate = addDays(currentDate, 30); // Monthly approximation
    }
  }

  return filledData;
}

export function calculateTrend<T>(
  data: T[],
  valueField: keyof T,
): { value: number; isPositive: boolean } | null {
  if (data.length < 2) return null;

  const midpoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midpoint);
  const secondHalf = data.slice(midpoint);

  const firstAvg =
    firstHalf.reduce((sum, item) => sum + Number(item[valueField]), 0) /
    firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, item) => sum + Number(item[valueField]), 0) /
    secondHalf.length;

  if (firstAvg === 0) return null;

  const percentageChange = ((secondAvg - firstAvg) / firstAvg) * 100;

  return {
    value: Math.abs(percentageChange),
    isPositive: percentageChange > 0,
  };
}
