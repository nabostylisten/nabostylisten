/**
 * Mapbox integration helper for address migration
 * Provides geocoding and validation for addresses during migration
 */

import { MigrationLogger } from "./logger";

interface MapboxSuggestion {
  id: string;
  type: string;
  place_type: string[];
  relevance: number;
  properties: {
    accuracy?: string;
    address?: string;
    category?: string;
    maki?: string;
    wikidata?: string;
    short_code?: string;
  };
  text: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  address?: string;
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
    wikidata?: string;
  }>;
}

interface MapboxSearchParams {
  query: string;
  country?: string;
  types?: string;
  language?: string;
  limit?: number;
  autocomplete?: boolean;
}

export interface ParsedMapboxResponse {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  countryCode?: string; // ISO country code from Mapbox context
  geometry: [number, number]; // [lng, lat]
}

export class MapboxGeocoder {
  private accessToken: string | undefined;
  private logger: MigrationLogger;
  private requestCount = 0;
  private failedGeocodes: string[] = [];

  constructor(logger: MigrationLogger) {
    this.logger = logger;
    // Try both environment variables
    this.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
      process.env.MAPBOX_TOKEN;

    if (!this.accessToken) {
      logger.warn(
        "⚠️  Mapbox access token not configured. Geocoding will be skipped.",
      );
      logger.warn(
        "   Please set MAPBOX_TOKEN environment variable for accurate address migration.",
      );
    } else {
      logger.info("✅ Mapbox geocoder initialized successfully");
    }
  }

  /**
   * Search addresses using Mapbox Geocoding API
   */
  async searchMapboxAddresses({
    query,
    country = "no",
    types = "place,postcode,locality,neighborhood,address",
    language = "no",
    limit = 6,
    autocomplete = true,
  }: MapboxSearchParams): Promise<MapboxSuggestion[]> {
    if (!this.accessToken) {
      return [];
    }

    if (!query || query.length < 3) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        access_token: this.accessToken,
        country,
        types,
        language,
        limit: limit.toString(),
        autocomplete: autocomplete.toString(),
      });

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${
        encodeURIComponent(query)
      }.json?${params}`;

      const response = await fetch(url);
      this.requestCount++;

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }

      const data = await response.json();
      return data.features || [];
    } catch (error) {
      this.logger.error("Error searching addresses:", error);
      this.failedGeocodes.push(query);
      return [];
    }
  }

  /**
   * Parse Mapbox suggestion into structured address data
   */
  parseMapboxResponse(suggestion: MapboxSuggestion): ParsedMapboxResponse {
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
          !part.match(/^\d{4}/) && part !== street && part !== country,
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
  async getAddressGeometry(address: string): Promise<[number, number] | null> {
    if (!this.accessToken) {
      return null;
    }

    try {
      const suggestions = await this.searchMapboxAddresses({
        query: address,
        limit: 1,
      });

      if (suggestions.length > 0) {
        const parsed = this.parseMapboxResponse(suggestions[0]);
        return parsed.geometry;
      }

      return null;
    } catch (error) {
      this.logger.error("Error getting address geometry:", error);
      this.failedGeocodes.push(address);
      return null;
    }
  }

  /**
   * Get geometry from combined address components
   */
  async getGeometryFromAddressComponents({
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
    return await this.getAddressGeometry(fullAddress);
  }

  /**
   * Enhance address with geocoding data
   * Returns enhanced address with validated coordinates and country code
   */
  async enhanceAddressWithGeocoding(address: {
    street_address: string | null;
    city: string | null;
    postal_code: string | null;
    country: string | null;
    location: string | null;
    country_code: string | null;
  }): Promise<{
    location: string | null;
    country_code: string | null;
    geocoding_confidence: "high" | "medium" | "low" | "none";
  }> {
    // If we already have valid coordinates from MySQL, keep them
    if (address.location && this.isValidPostGISPoint(address.location)) {
      return {
        location: address.location,
        country_code: address.country_code,
        geocoding_confidence: "high",
      };
    }

    // If Mapbox is not configured, return original data
    if (!this.accessToken) {
      return {
        location: address.location,
        country_code: address.country_code,
        geocoding_confidence: "none",
      };
    }

    // Try to geocode using address components
    if (address.street_address || (address.city && address.postal_code)) {
      const geometry = await this.getGeometryFromAddressComponents({
        streetAddress: address.street_address || "",
        city: address.city || "",
        postalCode: address.postal_code || "",
        country: address.country || "Norge",
      });

      if (geometry) {
        // Also try to get better structured data
        const fullAddress = [
          address.street_address,
          address.postal_code,
          address.city,
          address.country,
        ].filter(Boolean).join(", ");

        const suggestions = await this.searchMapboxAddresses({
          query: fullAddress,
          limit: 1,
        });

        if (suggestions.length > 0) {
          const parsed = this.parseMapboxResponse(suggestions[0]);

          return {
            location: `POINT(${geometry[0]} ${geometry[1]})`,
            country_code: parsed.countryCode || address.country_code,
            geocoding_confidence: "high",
          };
        }

        // Fallback to just geometry
        return {
          location: `POINT(${geometry[0]} ${geometry[1]})`,
          country_code: address.country_code,
          geocoding_confidence: "medium",
        };
      }
    }

    // Could not geocode
    return {
      location: null,
      country_code: address.country_code,
      geocoding_confidence: "low",
    };
  }

  /**
   * Validate PostGIS POINT format
   */
  private isValidPostGISPoint(location: string): boolean {
    const match = location.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
    if (!match) return false;

    const lng = parseFloat(match[1]);
    const lat = parseFloat(match[2]);

    // Basic validation for Nordic region coordinates
    return lng >= -10 && lng <= 35 && lat >= 50 && lat <= 75;
  }

  /**
   * Get geocoding statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      failedGeocodes: this.failedGeocodes.length,
      failedAddresses: this.failedGeocodes,
      enabled: !!this.accessToken,
    };
  }

  /**
   * Batch geocode addresses with rate limiting
   */
  async batchGeocode<
    T extends {
      street_address: string | null;
      city: string | null;
      postal_code: string | null;
      country: string | null;
      location: string | null;
      country_code: string | null;
    },
  >(
    addresses: T[],
    options: {
      batchSize?: number;
      delayMs?: number;
      onProgress?: (current: number, total: number) => void;
    } = {},
  ): Promise<
    Array<
      T & {
        location: string | null;
        country_code: string | null;
        geocoding_confidence: "high" | "medium" | "low" | "none";
      }
    >
  > {
    const { batchSize = 10, delayMs = 100, onProgress } = options;
    const results = [];

    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (address) => {
          const enhanced = await this.enhanceAddressWithGeocoding(address);
          return {
            ...address,
            ...enhanced,
          };
        }),
      );

      results.push(...batchResults);

      if (onProgress) {
        onProgress(Math.min(i + batchSize, addresses.length), addresses.length);
      }

      // Rate limiting
      if (i + batchSize < addresses.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }
}
