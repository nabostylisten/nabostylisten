"use server";

import { createClient } from "@/lib/supabase/server";
import { addressesInsertSchema, addressesUpdateSchema } from "@/schemas/database.schema";
import type { Database } from "@/types/database.types";

type AddressInsert = Database["public"]["Tables"]["addresses"]["Insert"];
type AddressUpdate = Database["public"]["Tables"]["addresses"]["Update"];

/**
 * Get all addresses for the current user
 */
export async function getUserAddresses() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated", data: null };
  }

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, data: null };
  }

  return { data, error: null };
}

/**
 * Get a single address by ID
 */
export async function getAddress(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated", data: null };
  }

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { data, error: null };
}

/**
 * Create a new address for the current user
 */
export async function createAddress(data: Omit<AddressInsert, "user_id" | "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated", data: null };
  }

  // Validate the data
  const validationResult = addressesInsertSchema.safeParse({
    ...data,
    user_id: user.id,
  });

  if (!validationResult.success) {
    return { error: "Invalid data", data: null };
  }

  // If this is set as primary, unset other primary addresses
  if (data.is_primary) {
    await supabase
      .from("addresses")
      .update({ is_primary: false })
      .eq("user_id", user.id);
  }

  // Get coordinates from Mapbox if we have an address
  let location = data.location;
  if (!location && data.street_address && data.city && data.country) {
    const coords = await geocodeAddress({
      street: data.street_address,
      city: data.city,
      postalCode: data.postal_code,
      country: data.country,
    });
    if (coords) {
      // PostGIS expects POINT(longitude latitude)
      location = `POINT(${coords.lng} ${coords.lat})`;
    }
  }

  const { data: newAddress, error } = await supabase
    .from("addresses")
    .insert({
      ...validationResult.data,
      location,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { data: newAddress, error: null };
}

/**
 * Update an existing address
 */
export async function updateAddress(id: string, data: Omit<AddressUpdate, "id" | "user_id" | "created_at" | "updated_at">) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated", data: null };
  }

  // Validate the data
  const validationResult = addressesUpdateSchema.safeParse(data);

  if (!validationResult.success) {
    return { error: "Invalid data", data: null };
  }

  // If this is set as primary, unset other primary addresses
  if (data.is_primary) {
    await supabase
      .from("addresses")
      .update({ is_primary: false })
      .eq("user_id", user.id)
      .neq("id", id);
  }

  // Update coordinates if address changed
  let location = data.location;
  if (!location && (data.street_address || data.city || data.postal_code || data.country)) {
    // First get the existing address to fill in any missing fields
    const { data: existingAddress } = await supabase
      .from("addresses")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (existingAddress) {
      const coords = await geocodeAddress({
        street: data.street_address || existingAddress.street_address,
        city: data.city || existingAddress.city,
        postalCode: data.postal_code || existingAddress.postal_code,
        country: data.country || existingAddress.country,
      });
      if (coords) {
        location = `POINT(${coords.lng} ${coords.lat})`;
      }
    }
  }

  const updateData = {
    ...validationResult.data,
    ...(location && { location }),
  } as AddressUpdate;

  const { data: updatedAddress, error } = await supabase
    .from("addresses")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { data: updatedAddress, error: null };
}

/**
 * Delete an address
 */
export async function deleteAddress(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated", data: null };
  }

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message, data: null };
  }

  return { data: { success: true }, error: null };
}

/**
 * Set an address as primary
 */
export async function setPrimaryAddress(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated", data: null };
  }

  // First, unset all other primary addresses
  await supabase
    .from("addresses")
    .update({ is_primary: false })
    .eq("user_id", user.id);

  // Then set this one as primary
  const { data, error } = await supabase
    .from("addresses")
    .update({ is_primary: true })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { data, error: null };
}

/**
 * Geocode an address using Mapbox API
 */
async function geocodeAddress({ street, city, postalCode, country }: {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}): Promise<{ lat: number; lng: number } | null> {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!accessToken) {
    console.warn("No Mapbox token available for geocoding");
    return null;
  }

  const query = `${street}, ${postalCode} ${city}, ${country}`;
  const params = new URLSearchParams({
    access_token: accessToken,
    country: country.toLowerCase() === "norge" || country.toLowerCase() === "norway" ? "no" : country,
    types: "address",
    limit: "1",
  });

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`
    );

    if (!response.ok) {
      console.error("Mapbox geocoding failed:", response.status);
      return null;
    }

    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
  } catch (error) {
    console.error("Error geocoding address:", error);
  }

  return null;
}