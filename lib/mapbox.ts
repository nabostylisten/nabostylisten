import type { MapboxSuggestion } from "@/types";

interface MapboxSearchParams {
  query: string;
  country?: string;
  types?: string;
  language?: string;
  limit?: number;
  autocomplete?: boolean;
}

interface ParsedMapboxResponse {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  countryCode?: string; // ISO country code from Mapbox context
  geometry: [number, number]; // [lng, lat]
}

/**
 * Search addresses using Mapbox Geocoding API
 */
export async function searchMapboxAddresses({
  query,
  country = "no",
  types = "place,postcode,locality,neighborhood,address",
  language = "no",
  limit = 6,
  autocomplete = true,
}: MapboxSearchParams): Promise<MapboxSuggestion[]> {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN;
  
  if (!accessToken) {
    throw new Error("Mapbox access token not configured");
  }

  if (!query || query.length < 3) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      access_token: accessToken,
      country,
      types,
      language,
      limit: limit.toString(),
      autocomplete: autocomplete.toString(),
    });

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error("Error searching addresses:", error);
    throw error;
  }
}

/**
 * Parse Mapbox suggestion into structured address data
 */
export function parseMapboxResponse(suggestion: MapboxSuggestion): ParsedMapboxResponse {
  const placeNameParts = suggestion.place_name
    .split(",")
    .map((s: string) => s.trim());
  const context = suggestion.context || [];

  // Extract components from context
  let postalCode = "";
  let city = "";
  let country = "Norge";
  let countryCode: string | undefined;

  for (const item of context) {
    if (item.id.startsWith("postcode")) {
      postalCode = item.text;
    } else if (item.id.startsWith("place")) {
      city = item.text;
    } else if (item.id.startsWith("country")) {
      country = item.text;
      // Extract ISO country code if available, normalize to uppercase
      countryCode = item.short_code?.toUpperCase();
    }
  }

  // Construct the full street address: street name + house number
  let street = suggestion.text;
  if (suggestion.address) {
    street = `${suggestion.text} ${suggestion.address}`;
  }

  // Fallback to first part of place_name if no proper street/address fields
  if (!street) {
    street = placeNameParts[0] || "";
  }

  // Fallback to parsing from place_name if context doesn't have all info
  if (!city && placeNameParts.length > 1) {
    // Try to find city from place_name
    const possibleCity = placeNameParts.find(
      (part: string) =>
        !part.match(/^\d{4}/) && part !== street && part !== country
    );
    if (possibleCity) city = possibleCity;
  }

  if (!postalCode && placeNameParts.length > 1) {
    // Look for 4-digit postal code
    const possiblePostal = placeNameParts.find((part: string) =>
      part.match(/^\d{4}/)
    );
    if (possiblePostal) postalCode = possiblePostal;
  }

  return {
    street,
    city,
    postalCode,
    country,
    countryCode, // ISO country code from Mapbox (e.g., "NO" for Norway)
    geometry: suggestion.center, // [lng, lat]
  };
}

/**
 * Get geometry coordinates from an address string using Mapbox
 */
export async function getAddressGeometry(address: string): Promise<[number, number] | null> {
  try {
    const suggestions = await searchMapboxAddresses({ 
      query: address,
      limit: 1 
    });
    
    if (suggestions.length > 0) {
      const parsed = parseMapboxResponse(suggestions[0]);
      return parsed.geometry;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting address geometry:", error);
    return null;
  }
}

/**
 * Get geometry from combined address components
 */
export async function getGeometryFromAddressComponents({
  streetAddress,
  city,
  postalCode,
  country = "Norge",
}: {
  streetAddress: string;
  city: string;
  postalCode: string;
  country?: string;
}): Promise<[number, number] | null> {
  const fullAddress = `${streetAddress}, ${postalCode} ${city}, ${country}`;
  return await getAddressGeometry(fullAddress);
}