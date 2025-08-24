/**
 * Country code utilities for Stripe integration
 */

// Map of common Norwegian country names to ISO 3166-1 alpha-2 codes
const COUNTRY_NAME_TO_CODE_MAP: Record<string, string> = {
  "Norge": "NO",
  "Norway": "NO",
  "Danmark": "DK", 
  "Denmark": "DK",
  "Sverige": "SE",
  "Sweden": "SE",
  "Finland": "FI",
  "Island": "IS",
  "Iceland": "IS",
  "USA": "US",
  "United States": "US",
  "Storbritannia": "GB",
  "United Kingdom": "GB",
  "Tyskland": "DE",
  "Germany": "DE",
  "Frankrike": "FR",
  "France": "FR",
  "Spania": "ES",
  "Spain": "ES",
  "Italia": "IT",
  "Italy": "IT",
  "Nederland": "NL",
  "Netherlands": "NL",
  "Belgia": "BE",
  "Belgium": "BE",
  "Østerrike": "AT",
  "Austria": "AT",
  "Sveits": "CH",
  "Switzerland": "CH",
};

/**
 * Convert a country name to ISO 3166-1 alpha-2 country code
 * Falls back to "NO" (Norway) if country is not recognized
 */
export function getCountryCode(countryName: string): string {
  // If it's already a 2-character code, return as-is
  if (countryName.length === 2 && countryName.match(/^[A-Z]{2}$/)) {
    return countryName;
  }
  
  // Look up in our mapping
  const code = COUNTRY_NAME_TO_CODE_MAP[countryName];
  if (code) {
    return code;
  }
  
  // Fallback to Norway since that's our primary market
  console.warn(`Unknown country name: "${countryName}", falling back to "NO"`);
  return "NO";
}

/**
 * Get the display name for a country code
 */
export function getCountryDisplayName(countryCode: string): string {
  const codeToName: Record<string, string> = {
    "NO": "Norge",
    "DK": "Danmark", 
    "SE": "Sverige",
    "FI": "Finland",
    "IS": "Island",
    "US": "USA",
    "GB": "Storbritannia",
    "DE": "Tyskland",
    "FR": "Frankrike",
    "ES": "Spania",
    "IT": "Italia",
    "NL": "Nederland",
    "BE": "Belgia",
    "AT": "Østerrike",
    "CH": "Sveits",
  };
  
  return codeToName[countryCode] || countryCode;
}