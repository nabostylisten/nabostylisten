"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type DayOfWeek = Database["public"]["Enums"]["day_of_week"];

export async function getAvailabilityRules(stylistId: string) {
  const supabase = await createClient();

  return await supabase
    .from("stylist_availability_rules")
    .select("*")
    .eq("stylist_id", stylistId)
    .order("day_of_week");
}

export async function updateAvailabilityRules(
  stylistId: string,
  workDays: DayOfWeek[],
  startTime: string,
  endTime: string,
) {
  const supabase = await createClient();

  // First, delete existing rules
  const { error: deleteError } = await supabase
    .from("stylist_availability_rules")
    .delete()
    .eq("stylist_id", stylistId);

  if (deleteError) {
    console.error("Error deleting availability rules:", deleteError);
    return { error: deleteError, data: null };
  }

  // Then insert new rules
  const rules = workDays.map((day) => ({
    stylist_id: stylistId,
    day_of_week: day,
    start_time: `${startTime}:00`,
    end_time: `${endTime}:00`,
  }));

  return await supabase
    .from("stylist_availability_rules")
    .insert(rules)
    .select();
}

export async function getUnavailability(stylistId: string) {
  const supabase = await createClient();

  // Get unavailability from 1 month ago to 3 months ahead
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 3);

  return await supabase
    .from("stylist_unavailability")
    .select("*")
    .eq("stylist_id", stylistId)
    .gte("end_time", startDate.toISOString())
    .lte("start_time", endDate.toISOString())
    .order("start_time");
}

export async function addUnavailability(
  stylistId: string,
  startTime: Date,
  endTime: Date,
  reason?: string,
) {
  const supabase = await createClient();

  return await supabase
    .from("stylist_unavailability")
    .insert({
      stylist_id: stylistId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      reason,
    })
    .select()
    .single();
}

export async function removeUnavailability(id: string) {
  const supabase = await createClient();

  return await supabase
    .from("stylist_unavailability")
    .delete()
    .eq("id", id);
}

export async function getRecurringUnavailability(stylistId: string) {
  const supabase = await createClient();

  return await supabase
    .from("stylist_recurring_unavailability")
    .select("*")
    .eq("stylist_id", stylistId)
    .order("series_start_date");
}

export async function getRecurringUnavailabilityWithExceptions(stylistId: string) {
  const supabase = await createClient();

  // Get all recurring unavailability for the stylist
  const { data: recurring, error: recurringError } = await supabase
    .from("stylist_recurring_unavailability")
    .select("*")
    .eq("stylist_id", stylistId)
    .order("series_start_date");

  if (recurringError || !recurring) {
    return { data: null, error: recurringError };
  }

  // Get all exceptions for these series
  const seriesIds = recurring.map(r => r.id);
  const { data: exceptions, error: exceptionsError } = seriesIds.length > 0 
    ? await supabase
        .from("recurring_unavailability_exceptions")
        .select("*")
        .in("series_id", seriesIds)
        .order("original_start_time")
    : { data: [], error: null };

  if (exceptionsError) {
    return { data: null, error: exceptionsError };
  }

  // Combine the data
  const recurringWithExceptions = recurring.map(series => ({
    ...series,
    exceptions: exceptions?.filter(ex => ex.series_id === series.id) || []
  }));

  return { data: recurringWithExceptions, error: null };
}

export async function addRecurringUnavailability(
  stylistId: string,
  data: {
    title: string;
    startTime: string;
    endTime: string;
    rrule: string;
    startDate: Date;
    endDate?: Date;
  },
) {
  const supabase = await createClient();

  return await supabase
    .from("stylist_recurring_unavailability")
    .insert({
      stylist_id: stylistId,
      title: data.title,
      start_time: `${data.startTime}:00`,
      end_time: `${data.endTime}:00`,
      rrule: data.rrule,
      series_start_date: data.startDate.toISOString().split("T")[0],
      series_end_date: data.endDate?.toISOString().split("T")[0] || null,
    })
    .select()
    .single();
}

export async function removeRecurringUnavailability(id: string) {
  const supabase = await createClient();

  return await supabase
    .from("stylist_recurring_unavailability")
    .delete()
    .eq("id", id);
}

export async function getRecurringExceptions(seriesId?: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from("recurring_unavailability_exceptions")
    .select("*")
    .order("original_start_time");
    
  if (seriesId) {
    query = query.eq("series_id", seriesId);
  }
  
  return await query;
}

export async function addRecurringException(
  seriesId: string,
  originalStartTime: Date,
  newStartTime?: Date,
  newEndTime?: Date,
) {
  const supabase = await createClient();

  return await supabase
    .from("recurring_unavailability_exceptions")
    .insert({
      series_id: seriesId,
      original_start_time: originalStartTime.toISOString(),
      new_start_time: newStartTime?.toISOString() || null,
      new_end_time: newEndTime?.toISOString() || null,
    })
    .select()
    .single();
}

export async function removeRecurringException(id: string) {
  const supabase = await createClient();

  return await supabase
    .from("recurring_unavailability_exceptions")
    .delete()
    .eq("id", id);
}

export async function updateRecurringException(
  id: string,
  newStartTime?: Date,
  newEndTime?: Date,
) {
  const supabase = await createClient();

  return await supabase
    .from("recurring_unavailability_exceptions")
    .update({
      new_start_time: newStartTime?.toISOString() || null,
      new_end_time: newEndTime?.toISOString() || null,
    })
    .eq("id", id)
    .select()
    .single();
}

export async function getAvailableTimeSlots(
  stylistId: string,
  date: Date,
  serviceDurationMinutes: number,
) {
  const supabase = await createClient();

  // Get availability rules for the day
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase() as DayOfWeek;

  const { data: rules } = await supabase
    .from("stylist_availability_rules")
    .select("*")
    .eq("stylist_id", stylistId)
    .eq("day_of_week", dayOfWeek)
    .single();

  if (!rules) {
    return { data: [], error: null };
  }

  // Get unavailability for the specific date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: unavailability } = await supabase
    .from("stylist_unavailability")
    .select("*")
    .eq("stylist_id", stylistId)
    .gte("start_time", startOfDay.toISOString())
    .lte("end_time", endOfDay.toISOString());

  // Get existing bookings for the date
  const { data: bookings } = await supabase
    .from("bookings")
    .select("start_time, end_time")
    .eq("stylist_id", stylistId)
    .gte("start_time", startOfDay.toISOString())
    .lte("end_time", endOfDay.toISOString())
    .in("status", ["confirmed", "pending"]);

  // Generate available time slots
  const slots: { start: Date; end: Date }[] = [];
  const [startHour, startMinute] = rules.start_time.split(":").map(Number);
  const [endHour, endMinute] = rules.end_time.split(":").map(Number);

  const workStart = new Date(date);
  workStart.setHours(startHour, startMinute, 0, 0);
  const workEnd = new Date(date);
  workEnd.setHours(endHour, endMinute, 0, 0);

  // Generate 30-minute slots
  const slotDuration = 30; // minutes
  const currentSlot = new Date(workStart);

  while (currentSlot < workEnd) {
    const slotEnd = new Date(currentSlot);
    slotEnd.setMinutes(slotEnd.getMinutes() + serviceDurationMinutes);

    if (slotEnd <= workEnd) {
      // Check if slot overlaps with unavailability or bookings
      const isUnavailable = unavailability?.some((u) => {
        const unavailStart = new Date(u.start_time);
        const unavailEnd = new Date(u.end_time);
        return currentSlot < unavailEnd && slotEnd > unavailStart;
      });

      const isBooked = bookings?.some((b) => {
        const bookingStart = new Date(b.start_time);
        const bookingEnd = new Date(b.end_time);
        return currentSlot < bookingEnd && slotEnd > bookingStart;
      });

      if (!isUnavailable && !isBooked) {
        slots.push({
          start: new Date(currentSlot),
          end: new Date(slotEnd),
        });
      }
    }

    currentSlot.setMinutes(currentSlot.getMinutes() + slotDuration);
  }

  return { data: slots, error: null };
}
