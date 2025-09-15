"use server";

import { createClient } from "@/lib/supabase/server";
import {
  addressesInsertSchema,
  addressesUpdateSchema,
} from "@/schemas/database.schema";
import type { Database } from "@/types/database.types";
import {
  deleteStripeCustomerAddressAction,
  updateStripeCustomerAction,
} from "./stripe.actions";
import { createServiceClient } from "@/lib/supabase/service";

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
  const supabaseServiceClient = await createServiceClient();

  const { data, error } = await supabaseServiceClient
    .from("addresses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { data, error: null };
}

/**
 * Create a new address for the current user
 */
export async function createAddress(
  data: Omit<AddressInsert, "user_id" | "id" | "created_at" | "updated_at">,
) {
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

  // Check if user has any existing addresses
  const { data: existingAddresses } = await supabase
    .from("addresses")
    .select("id")
    .eq("user_id", user.id);

  const isFirstAddress = !existingAddresses || existingAddresses.length === 0;

  // If this is the first address, automatically set it as primary
  // If this is set as primary, unset other primary addresses
  if (data.is_primary || isFirstAddress) {
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
      is_primary: data.is_primary || isFirstAddress,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  // Update Stripe customer address if this is now the primary address
  if ((data.is_primary || isFirstAddress) && newAddress) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_customer_id, full_name, email, phone_number")
        .eq("id", user.id)
        .single();

      if (profile?.stripe_customer_id) {
        const stripeAddress = convertAddressToStripeFormat(newAddress);
        await updateStripeCustomerAction({
          customerId: profile.stripe_customer_id,
          updateParams: {
            address: stripeAddress,
            name: profile.full_name || undefined,
            email: profile.email || undefined,
            phone: profile.phone_number || undefined,
          },
        }).catch((error) => {
          console.error(
            "[CREATE_ADDRESS] Failed to update Stripe customer address:",
            error,
          );
          // Don't fail the whole operation if Stripe update fails
        });
      }
    } catch (error) {
      console.error(
        "[CREATE_ADDRESS] Error updating Stripe customer address:",
        error,
      );
      // Don't fail the whole operation if Stripe update fails
    }
  }

  return { data: newAddress, error: null };
}

/**
 * Update an existing address
 */
export async function updateAddress(
  id: string,
  data: Omit<AddressUpdate, "id" | "user_id" | "created_at" | "updated_at">,
) {
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
  if (
    !location &&
    (data.street_address || data.city || data.postal_code || data.country)
  ) {
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

  const updateData: AddressUpdate = {
    ...validationResult.data,
  };

  if (location) {
    updateData.location = location;
  }

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

  // Update Stripe customer address if this is now the primary address
  if (data.is_primary && updatedAddress) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", user.id)
        .single();

      if (profile?.stripe_customer_id) {
        const stripeAddress = convertAddressToStripeFormat(updatedAddress);
        await updateStripeCustomerAction({
          customerId: profile.stripe_customer_id,
          updateParams: {
            address: stripeAddress,
          },
        }).catch((error) => {
          console.error(
            "[UPDATE_ADDRESS] Failed to update Stripe customer address:",
            error,
          );
          // Don't fail the whole operation if Stripe update fails
        });
      }
    } catch (error) {
      console.error(
        "[UPDATE_ADDRESS] Error updating Stripe customer address:",
        error,
      );
      // Don't fail the whole operation if Stripe update fails
    }
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

  // First, check if this is the primary address being deleted
  const { data: addressToDelete } = await supabase
    .from("addresses")
    .select("is_primary")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message, data: null };
  }

  // If we deleted the primary address, clear the Stripe customer address
  if (addressToDelete?.is_primary) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_customer_id, full_name, email, phone_number")
        .eq("id", user.id)
        .single();

      if (profile?.stripe_customer_id) {
        await deleteStripeCustomerAddressAction({
          customerId: profile.stripe_customer_id,
        }).catch((error) => {
          console.error(
            "[DELETE_ADDRESS] Failed to clear Stripe customer address:",
            error,
          );
          // Don't fail the whole operation if Stripe update fails
        });
      }
    } catch (error) {
      console.error(
        "[DELETE_ADDRESS] Error clearing Stripe customer address:",
        error,
      );
      // Don't fail the whole operation if Stripe update fails
    }
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

  // Update Stripe customer address if user has a Stripe customer ID
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profile?.stripe_customer_id && data) {
      const stripeAddress = convertAddressToStripeFormat(data);
      await updateStripeCustomerAction({
        customerId: profile.stripe_customer_id,
        updateParams: {
          address: stripeAddress,
        },
      }).catch((error) => {
        console.error(
          "[SET_PRIMARY_ADDRESS] Failed to update Stripe customer address:",
          error,
        );
        // Don't fail the whole operation if Stripe update fails
      });
    }
  } catch (error) {
    console.error(
      "[SET_PRIMARY_ADDRESS] Error updating Stripe customer address:",
      error,
    );
    // Don't fail the whole operation if Stripe update fails
  }

  return { data, error: null };
}

/**
 * Convert database address format to Stripe address format
 */
function convertAddressToStripeFormat(
  address: Database["public"]["Tables"]["addresses"]["Row"],
) {
  // Convert country code to 2-letter ISO format for Stripe
  let countryCode = address.country_code?.toUpperCase();

  // If no country_code, try to map from country name
  if (!countryCode) {
    const countryMappings: Record<string, string> = {
      "norway": "NO",
      "norge": "NO",
      "sweden": "SE",
      "sverige": "SE",
      "denmark": "DK",
      "danmark": "DK",
    };
    countryCode = countryMappings[address.country.toLowerCase()] || "NO"; // Default to Norway
  }

  return {
    line1: address.street_address,
    line2: undefined,
    city: address.city,
    postal_code: address.postal_code,
    country: countryCode,
    state: address.city,
  };
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
    country:
      country.toLowerCase() === "norge" || country.toLowerCase() === "norway"
        ? "no"
        : country,
    types: "address",
    limit: "1",
  });

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${
        encodeURIComponent(query)
      }.json?${params}`,
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
