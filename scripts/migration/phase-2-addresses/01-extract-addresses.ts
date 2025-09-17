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

    // Read Phase 1 results - load auth users created to get email → supabase_user_id mapping
    const tempDir = join(process.cwd(), 'scripts', 'migration', 'temp');
    const authUsersPath = join(tempDir, 'auth-users-created.json');

    logger.info('Loading auth users created from Phase 1...');
    const authUsersData = JSON.parse(readFileSync(authUsersPath, 'utf-8'));

    // Create email → supabase_user_id mapping for successful users only
    const emailToUserIdMapping: Record<string, string> = {};
    const successfulUsers = authUsersData.results.filter((result: any) => result.success);

    successfulUsers.forEach((user: any) => {
      emailToUserIdMapping[user.email.toLowerCase()] = user.supabase_user_id;
    });

    logger.info(`Loaded email mapping for ${Object.keys(emailToUserIdMapping).length} successfully created users`);

    // We also need the consolidated users data to get emails for MySQL IDs
    const consolidatedUsersPath = join(tempDir, 'consolidated-users.json');
    const consolidatedData = JSON.parse(readFileSync(consolidatedUsersPath, 'utf-8'));

    // Create MySQL ID → email mapping
    const mysqlIdToEmailMapping: Record<string, string> = {};
    consolidatedData.users.forEach((user: any) => {
      mysqlIdToEmailMapping[user.id] = user.email.toLowerCase();
    });

    logger.info(`Loaded MySQL ID to email mapping for ${Object.keys(mysqlIdToEmailMapping).length} users`);


    // Initialize MySQL parser
    const parser = new MySQLParser(database.getDumpFilePath(), logger);

    // Extract address records
    logger.info('Extracting address records from MySQL dump...');
    const addresses = await extractAddresses(parser);

    // Debug: Log all addresses found
    logger.debug('=== ALL EXTRACTED ADDRESSES ===');
    addresses.forEach((addr, index) => {
      logger.debug(`Address ${index + 1}: ID=${addr.id}, buyer_id=${addr.buyer_id}, stylist_id=${addr.stylist_id}, salon_id=${addr.salon_id}, deleted_at=${addr.deleted_at}, street_name=${addr.street_name}, formatted_address=${addr.formatted_address}, city=${addr.city}`);
    });

    // Filter out soft-deleted and salon addresses
    const activeAddresses = addresses.filter(addr =>
      !addr.deleted_at && !addr.salon_id
    );

    logger.debug('=== ACTIVE ADDRESSES (after filtering) ===');
    activeAddresses.forEach((addr, index) => {
      logger.debug(`Active Address ${index + 1}: ID=${addr.id}, buyer_id=${addr.buyer_id}, stylist_id=${addr.stylist_id}, street_name=${addr.street_name}, formatted_address=${addr.formatted_address}, city=${addr.city}`);
    });

    logger.info(`Found ${addresses.length} total addresses, ${activeAddresses.length} active (excluded ${addresses.length - activeAddresses.length} soft-deleted/salon)`);

    // Process addresses
    logger.info('Processing address data...');
    const processedAddresses: ProcessedAddress[] = [];
    const skippedAddresses: Array<{
      address: MySQLAddress;
      reason: string;
    }> = [];

    // First pass: Process addresses and convert basic data
    logger.debug('=== PROCESSING ADDRESSES ===');
    for (const address of activeAddresses) {
      try {
        logger.debug(`Processing address ${address.id}: buyer_id=${address.buyer_id}, stylist_id=${address.stylist_id}`);

        // Debug: Check if user mapping exists via email lookup
        if (address.buyer_id && mysqlIdToEmailMapping[address.buyer_id]) {
          const email = mysqlIdToEmailMapping[address.buyer_id];
          if (emailToUserIdMapping[email]) {
            logger.debug(`✓ Found user mapping for buyer_id ${address.buyer_id} → email ${email} → ${emailToUserIdMapping[email]}`);
          } else {
            logger.debug(`✗ Found email ${email} for buyer_id ${address.buyer_id}, but no Supabase user found`);
          }
        } else if (address.buyer_id) {
          logger.debug(`✗ No email mapping found for buyer_id ${address.buyer_id}`);
        }

        if (address.stylist_id && mysqlIdToEmailMapping[address.stylist_id]) {
          const email = mysqlIdToEmailMapping[address.stylist_id];
          if (emailToUserIdMapping[email]) {
            logger.debug(`✓ Found user mapping for stylist_id ${address.stylist_id} → email ${email} → ${emailToUserIdMapping[email]}`);
          } else {
            logger.debug(`✗ Found email ${email} for stylist_id ${address.stylist_id}, but no Supabase user found`);
          }
        } else if (address.stylist_id) {
          logger.debug(`✗ No email mapping found for stylist_id ${address.stylist_id}`);
        }

        const processed = await processAddress(address, mysqlIdToEmailMapping, emailToUserIdMapping, logger);
        if (processed) {
          logger.debug(`✓ Successfully processed address ${address.id} → user ${processed.user_id}`);
          processedAddresses.push(processed);
        } else {
          logger.debug(`✗ Failed to process address ${address.id}: No valid user mapping found`);
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

    // Note: Geography coordinates will be added later by a separate Mapbox integration script

    // Validate processed addresses
    logger.info('Validating processed addresses...');
    const validationErrors = validateAddresses(processedAddresses, logger);
    
    if (validationErrors.length > 0) {
      logger.validation(validationErrors);
    }

    // Statistics without geocoding
    const geocodingStats = {
      enabled: false,
      requestCount: 0,
      failedGeocodes: 0
    };

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

    // Debug: Log skipped addresses with details
    if (skippedAddresses.length > 0) {
      logger.debug('=== SKIPPED ADDRESSES DETAILS ===');
      skippedAddresses.forEach((skipped, index) => {
        logger.debug(`Skipped Address ${index + 1}: ID=${skipped.address.id}, buyer_id=${skipped.address.buyer_id}, stylist_id=${skipped.address.stylist_id}, reason="${skipped.reason}"`);
        logger.debug(`  → street_name: ${skipped.address.street_name}`);
        logger.debug(`  → formatted_address: ${skipped.address.formatted_address}`);
        logger.debug(`  → city: ${skipped.address.city}`);
        logger.debug(`  → zipcode: ${skipped.address.zipcode}`);
      });
    }

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
      'Mapbox Geocoding': '⚠️ Deferred to separate script',
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
  mysqlIdToEmailMapping: Record<string, string>,
  emailToUserIdMapping: Record<string, string>,
  logger: MigrationLogger
): Promise<ProcessedAddress | null> {
  // Determine user ID from polymorphic relationship via email lookup
  let userId: string | null = null;
  let sourceTable: 'buyer' | 'stylist';

  if (address.buyer_id && mysqlIdToEmailMapping[address.buyer_id]) {
    const email = mysqlIdToEmailMapping[address.buyer_id];
    if (emailToUserIdMapping[email]) {
      userId = emailToUserIdMapping[email];
      sourceTable = 'buyer';
    }
  } else if (address.stylist_id && mysqlIdToEmailMapping[address.stylist_id]) {
    const email = mysqlIdToEmailMapping[address.stylist_id];
    if (emailToUserIdMapping[email]) {
      userId = emailToUserIdMapping[email];
      sourceTable = 'stylist';
    }
  }

  if (!userId) {
    return null;
  }

  // Skip coordinate parsing - will be handled by separate Mapbox script
  const location: string | null = null;
  const geocodingConfidence: 'high' | 'medium' | 'low' | 'none' = 'none';

  // Build address components
  const streetAddress = [address.street_name, address.street_no]
    .filter(Boolean)
    .join(' ') || address.formatted_address || null;

  const nickname = [address.short_address, address.tag]
    .filter(Boolean)
    .join(' - ') || null;

  // Use city and postal code from MySQL, preserving empty strings as valid data
  let city = address.city; // Keep as-is from MySQL (could be empty string)
  let postalCode = address.zipcode; // Keep as-is from MySQL (could be empty string)

  const country = address.country || 'Norway';
  const countryCode = deriveCountryCode(country);

  // Location will be set to NULL initially, populated later by separate script

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