"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "./middleware";

export interface MapAddress {
  id: string;
  user_id: string;
  nickname: string | null;
  street_address: string;
  city: string;
  postal_code: string;
  country: string;
  latitude: number;
  longitude: number;
  user_role: "customer" | "stylist" | "admin";
  user_name: string | null;
  user_email: string | null;
  is_primary: boolean;
}

export async function getAllAddressesForMap() {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Query to get all addresses with their associated user data
    // Using PostGIS functions to extract lat/lng from geography column
    const { data: addresses, error } = await supabase.rpc('get_map_addresses');

    if (error) {
      console.error("Error fetching addresses for map:", error);
      return { data: null, error: error.message };
    }

    return { data: addresses || [], error: null };
  } catch (error) {
    console.error("Error in getAllAddressesForMap:", error);
    return { data: null, error: "Failed to fetch addresses" };
  }
}

export async function getUserCountsByRole() {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Query to get user role counts from addresses with coordinates
    const { data: statsData, error: statsError } = await supabase
      .from('addresses')
      .select(`
        profiles!inner(role)
      `)
      .not('location', 'is', null);

    if (statsError) {
      console.error("Error fetching user stats:", statsError);
      return { data: null, error: statsError.message };
    }

    // Calculate statistics from the database query
    const stats = statsData.reduce(
      (acc, item) => {
        const role = item.profiles.role;
        acc.total++;
        if (role === 'customer') acc.customers++;
        else if (role === 'stylist') acc.stylists++;
        else if (role === 'admin') acc.admins++;
        return acc;
      },
      { total: 0, customers: 0, stylists: 0, admins: 0 }
    );

    return { data: stats, error: null };
  } catch (error) {
    console.error("Error in getUserCountsByRole:", error);
    return { data: null, error: "Failed to fetch user counts" };
  }
}