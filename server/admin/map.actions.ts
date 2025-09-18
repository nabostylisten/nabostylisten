"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "./middleware";
import { fetchAllRows, fetchAllRowsFromRPC } from "@/lib/supabase/utils";

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

    // Use the RPC function with pagination to get all addresses
    const result = await fetchAllRowsFromRPC<"get_map_addresses", MapAddress>(
      supabase,
      "get_map_addresses",
      {},
    );

    return result;
  } catch (error) {
    console.error("Error in getAllAddressesForMap:", error);
    return { data: [], error: "Failed to fetch addresses" };
  }
}

export async function getUserCountsByRole() {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Use fetchAllRows to get all addresses with coordinates (not limited to 1000)
    const result = await fetchAllRows<{ profiles: { role: string } }>(async (
      offset,
      limit,
    ) =>
      await supabase
        .from("addresses")
        .select(`
          profiles!inner(role)
        `)
        .not("location", "is", null)
        .range(offset, offset + limit - 1)
    );

    if (result.error) {
      console.error("Error fetching user stats:", result.error);
      return { data: null, error: result.error };
    }

    // Calculate statistics from the database query
    const stats = result.data.reduce(
      (acc, item) => {
        const role = item.profiles.role;
        acc.total++;
        if (role === "customer") acc.customers++;
        else if (role === "stylist") acc.stylists++;
        else if (role === "admin") acc.admins++;
        return acc;
      },
      { total: 0, customers: 0, stylists: 0, admins: 0 },
    );

    return { data: stats, error: null };
  } catch (error) {
    console.error("Error in getUserCountsByRole:", error);
    return { data: null, error: "Failed to fetch user counts" };
  }
}
