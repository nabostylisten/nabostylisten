#!/usr/bin/env bun
/**
 * Phase 2 Step 1: Extract and validate address data from MySQL dump
 * 
 * This script:
 * 1. Reads consolidated user data and user ID mapping from Phase 1
 * 2. Extracts address records from MySQL dump
 * 3. Resolves polymorphic relationships (buyer_id/stylist_id → user_id)
 * 4. Converts MySQL POINT coordinates to PostGIS format
 * 5. Validates address data structure
 * 6. Saves processed address data for next steps
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { MigrationLogger } from '../shared/logger';
import { MigrationDatabase } from '../shared/database';
import { MySQLParser, type MySQLAddress } from '../phase-1-users/utils/mysql-parser';
import { MapboxGeocoder } from '../shared/mapbox-helper';
import type { AddressMigrationStats } from '../shared/types';

// Processed address for Supabase
interface ProcessedAddress {
  id: string;
  user_id: string;
  street_address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  country_code: string | null;
  nickname: string | null;
  entry_instructions: string | null;
  location: string | null; // PostGIS POINT format
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  source_table: 'buyer' | 'stylist';
  original_id: string;
  geocoding_confidence: 'high' | 'medium' | 'low' | 'none';
}

async function main() {
  const logger = new MigrationLogger();
  const database = new MigrationDatabase(logger);

  logger.info('=== Phase 2 Step 1: Extract Address Data ===');

  try {
    // Test database connection
    const isConnected = await database.testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Read Phase 1 results
    const tempDir = join(process.cwd(), 'scripts', 'migration', 'temp');
    const userMappingPath = join(tempDir, 'user-id-mapping.json');

    logger.info('Loading user ID mapping from Phase 1...');
    const mappingData = JSON.parse(readFileSync(userMappingPath, 'utf-8'));
    const userMapping: Record<string, string> = mappingData.mapping;

    logger.info(`Loaded mapping for ${Object.keys(userMapping).length} users`);

    // Initialize Mapbox geocoder
    logger.info('Initializing Mapbox geocoder for address enhancement...');
    const geocoder = new MapboxGeocoder(logger);

    // Initialize MySQL parser
    const parser = new MySQLParser(database.getDumpFilePath(), logger);

    // Extract address records
    logger.info('Extracting address records from MySQL dump...');
    const addresses = await extractAddresses(parser);

    // Filter out soft-deleted and salon addresses
    const activeAddresses = addresses.filter(addr =>
      !addr.deleted_at && !addr.salon_id
    );

    logger.info(`Found ${addresses.length} total addresses, ${activeAddresses.length} active (excluded ${addresses.length - activeAddresses.length} soft-deleted/salon)`);

    // Process addresses
    logger.info('Processing address data...');
    const processedAddresses: ProcessedAddress[] = [];
    const skippedAddresses: Array<{
      address: MySQLAddress;
      reason: string;
    }> = [];

    // First pass: Process addresses and convert basic data
    for (const address of activeAddresses) {
      try {
        const processed = await processAddress(address, userMapping, logger, geocoder);
        if (processed) {
          processedAddresses.push(processed);
        } else {
          skippedAddresses.push({
            address,
            reason: 'No valid user mapping found'
          });
        }
      } catch (error) {
        logger.error(`Failed to process address ${address.id}`, error);
        skippedAddresses.push({
          address,
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Second pass: Batch geocoding for addresses without coordinates
    const addressesToGeocode = processedAddresses.filter(addr =>
      !addr.location || addr.geocoding_confidence === 'none'
    );

    if (addressesToGeocode.length > 0) {
      logger.info(`Geocoding ${addressesToGeocode.length} addresses using Mapbox...`);

      const geocodedAddresses = await geocoder.batchGeocode(addressesToGeocode, {
        batchSize: 10,
        delayMs: 100,
        onProgress: (current, total) => {
          logger.progress({
            phase: 'Address Geocoding',
            step: 'Mapbox API',
            current,
            total,
            percentage: (current / total) * 100,
            errors: []
          });
        }
      });

      // Update the processed addresses with geocoded data
      geocodedAddresses.forEach((geocoded, index) => {
        const originalIndex = processedAddresses.findIndex(addr => addr.id === geocoded.id);
        if (originalIndex !== -1) {
          processedAddresses[originalIndex] = geocoded as ProcessedAddress;
        }
      });
    }

    // Validate processed addresses
    logger.info('Validating processed addresses...');
    const validationErrors = validateAddresses(processedAddresses, logger);
    
    if (validationErrors.length > 0) {
      logger.validation(validationErrors);
    }

    // Get geocoding statistics
    const geocodingStats = geocoder.getStats();

    // Generate migration statistics
    const stats: AddressMigrationStats = {
      total_addresses: addresses.length,
      active_addresses: activeAddresses.length,
      processed_addresses: processedAddresses.length,
      skipped_addresses: skippedAddresses.length,
      addresses_with_coordinates: processedAddresses.filter(a => a.location).length,
      buyer_addresses: processedAddresses.filter(a => a.source_table === 'buyer').length,
      stylist_addresses: processedAddresses.filter(a => a.source_table === 'stylist').length,
      created_addresses: 0, // Will be updated in next step
      primary_address_updates: 0, // Will be updated in step 3
      errors: validationErrors.length + skippedAddresses.length,
      geocoding_stats: {
        enabled: geocodingStats.enabled,
        requests_made: geocodingStats.requestCount,
        failed_geocodes: geocodingStats.failedGeocodes,
        high_confidence: processedAddresses.filter(a => a.geocoding_confidence === 'high').length,
        medium_confidence: processedAddresses.filter(a => a.geocoding_confidence === 'medium').length,
        low_confidence: processedAddresses.filter(a => a.geocoding_confidence === 'low').length,
        no_geocoding: processedAddresses.filter(a => a.geocoding_confidence === 'none').length
      }
    };

    // Save processed data
    const processedAddressesPath = join(tempDir, 'processed-addresses.json');
    writeFileSync(processedAddressesPath, JSON.stringify({
      metadata: {
        extracted_at: new Date().toISOString(),
        stats
      },
      addresses: processedAddresses
    }, null, 2));

    // Save skipped addresses for review
    const skippedAddressesPath = join(tempDir, 'skipped-addresses.json');
    writeFileSync(skippedAddressesPath, JSON.stringify({
      metadata: {
        extracted_at: new Date().toISOString(),
        count: skippedAddresses.length
      },
      skipped: skippedAddresses
    }, null, 2));

    // Save migration stats
    const addressStatsPath = join(tempDir, 'address-migration-stats.json');
    writeFileSync(addressStatsPath, JSON.stringify(stats, null, 2));

    // Summary
    logger.stats('Address Extraction Summary', {
      'Total MySQL Addresses': addresses.length,
      'Active Addresses': activeAddresses.length,
      'Successfully Processed': processedAddresses.length,
      'Skipped (No User/Error)': skippedAddresses.length,
      'With Coordinates': stats.addresses_with_coordinates,
      'Buyer Addresses': stats.buyer_addresses,
      'Stylist Addresses': stats.stylist_addresses,
      'Validation Errors': validationErrors.length,
      'Mapbox Geocoding': geocodingStats.enabled ? `✅ Enabled (${geocodingStats.requestCount} requests)` : '⚠️  Disabled',
      'Geocoding Confidence': `High: ${stats.geocoding_stats.high_confidence}, Med: ${stats.geocoding_stats.medium_confidence}, Low: ${stats.geocoding_stats.low_confidence}`,
      'Status': validationErrors.length === 0 ? '✅ SUCCESS' : '⚠️  SUCCESS WITH WARNINGS'
    });

    logger.success('Phase 2 Step 1 completed successfully', {
      processed_addresses_file: processedAddressesPath,
      skipped_addresses_file: skippedAddressesPath,
      stats_file: addressStatsPath
    });

  } catch (error) {
    logger.error('Phase 2 Step 1 failed', error);
    process.exit(1);
  }
}

/**
 * Extract address records from MySQL dump
 */
async function extractAddresses(parser: MySQLParser): Promise<MySQLAddress[]> {
  return await parser.extractAddresses();
}

/**
 * Process a single address record
 */
async function processAddress(
  address: MySQLAddress,
  userMapping: Record<string, string>,
  logger: MigrationLogger,
  geocoder: MapboxGeocoder
): Promise<ProcessedAddress | null> {
  // Determine user ID from polymorphic relationship
  let userId: string | null = null;
  let sourceTable: 'buyer' | 'stylist';

  if (address.buyer_id && userMapping[address.buyer_id]) {
    userId = userMapping[address.buyer_id];
    sourceTable = 'buyer';
  } else if (address.stylist_id && userMapping[address.stylist_id]) {
    userId = userMapping[address.stylist_id];
    sourceTable = 'stylist';
  }

  if (!userId) {
    return null;
  }

  // Try to parse MySQL binary POINT coordinates
  let location = parseMySQLBinaryPoint(address.coordinates, logger);
  let geocodingConfidence: 'high' | 'medium' | 'low' | 'none' = location ? 'high' : 'none';

  // Build address components
  const streetAddress = [address.street_name, address.street_no]
    .filter(Boolean)
    .join(' ') || address.formatted_address || null;

  const nickname = [address.short_address, address.tag]
    .filter(Boolean)
    .join(' - ') || null;

  // Parse city, postal code from formatted address if not provided
  let city = address.city || null;
  let postalCode = address.zipcode || null;

  // If city or postal code is empty, try to parse from formatted_address
  if ((!city || !postalCode) && address.formatted_address) {
    const parsedAddress = parseFormattedAddress(address.formatted_address);
    city = city || parsedAddress.city;
    postalCode = postalCode || parsedAddress.postalCode;
  }

  const country = address.country || 'Norway';
  const countryCode = deriveCountryCode(country);

  // If we don't have coordinates from MySQL, prepare for geocoding
  // (Geocoding will be done in batch in the main function)
  if (!location) {
    geocodingConfidence = 'none';
  }

  return {
    id: address.id,
    user_id: userId,
    street_address: streetAddress,
    city,
    postal_code: postalCode,
    country,
    country_code: countryCode,
    nickname,
    entry_instructions: null, // Default empty
    location,
    is_primary: false, // Will be updated in step 3
    created_at: new Date(address.created_at).toISOString(),
    updated_at: new Date(address.updated_at).toISOString(),
    source_table: sourceTable,
    original_id: address.id,
    geocoding_confidence: geocodingConfidence
  };
}

/**
 * Parse MySQL binary POINT data
 * MySQL stores POINT as binary data in the dump. The dump shows it as escaped binary.
 * Format: _binary '\0\0\0\0\0\0...' where the data contains WKB (Well-Known Binary) format
 */
function parseMySQLBinaryPoint(coordinates: any, logger: MigrationLogger): string | null {
  if (!coordinates) return null;

  try {
    // If it's already a string in POINT format, just validate and return it
    if (typeof coordinates === 'string' && coordinates.startsWith('POINT(')) {
      const match = coordinates.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
      if (match) {
        const lng = parseFloat(match[1]);
        const lat = parseFloat(match[2]);

        // Validate coordinates are reasonable for Norway/Nordic region
        if (lng >= -10 && lng <= 35 && lat >= 50 && lat <= 75) {
          return `POINT(${lng} ${lat})`;
        }
      }
    }

    // For now, we'll return null for binary data and rely on Mapbox geocoding
    // The binary format in MySQL dumps is complex and would require WKB parsing
    // It's more reliable to geocode from address components
    logger.debug('Binary POINT data detected, will geocode from address');
    return null;

  } catch (error) {
    logger.debug(`Could not parse MySQL coordinates, will geocode`, error);
    return null;
  }
}

/**
 * Parse formatted address to extract city and postal code
 */
function parseFormattedAddress(formattedAddress: string): { city: string | null; postalCode: string | null } {
  if (!formattedAddress) {
    return { city: null, postalCode: null };
  }

  // Norwegian address format: "Street, PostalCode City, Country"
  // Example: "Nadderudveien 88d, 1362 Hosle, Norway"
  const parts = formattedAddress.split(',').map(s => s.trim());

  let city = null;
  let postalCode = null;

  // Try to find postal code and city (usually in the second part)
  for (const part of parts) {
    const postalMatch = part.match(/^(\d{4})\s+(.+)$/);
    if (postalMatch) {
      postalCode = postalMatch[1];
      city = postalMatch[2];
      break;
    }
  }

  return { city, postalCode };
}

/**
 * Derive country code from country name
 */
function deriveCountryCode(country: string | null): string | null {
  if (!country) return null;
  
  const countryMapping: Record<string, string> = {
    'Norway': 'NO',
    'Norge': 'NO',
    'Sweden': 'SE',
    'Sverige': 'SE',
    'Denmark': 'DK',
    'Danmark': 'DK',
    'Finland': 'FI',
    'Suomi': 'FI'
  };
  
  return countryMapping[country] || null;
}

/**
 * Validate processed addresses
 */
function validateAddresses(addresses: ProcessedAddress[], logger: MigrationLogger): string[] {
  const errors: string[] = [];

  addresses.forEach((address, index) => {
    // Required fields validation
    if (!address.user_id) {
      errors.push(`Address ${index}: Missing user_id`);
    }

    // Location validation
    if (address.location) {
      const locationMatch = address.location.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
      if (!locationMatch) {
        errors.push(`Address ${index}: Invalid location format: ${address.location}`);
      }
    }

    // At least one address component should exist
    if (!address.street_address && !address.city && !address.postal_code) {
      errors.push(`Address ${index}: No address components provided`);
    }
  });

  return errors;
}

// Run the script if called directly
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});