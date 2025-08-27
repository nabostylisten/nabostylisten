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

    // Initialize MySQL parser
    const parser = new MySQLParser(logger, database.getDumpFilePath());
    
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

    for (const address of activeAddresses) {
      try {
        const processed = await processAddress(address, userMapping, logger);
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

    // Validate processed addresses
    logger.info('Validating processed addresses...');
    const validationErrors = validateAddresses(processedAddresses, logger);
    
    if (validationErrors.length > 0) {
      logger.validation(validationErrors);
    }

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
      errors: validationErrors.length + skippedAddresses.length
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
  logger: MigrationLogger
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

  // Convert MySQL POINT to PostGIS format
  const location = convertCoordinates(address.coordinates, logger);

  // Build address components
  const streetAddress = [address.street_name, address.street_no]
    .filter(Boolean)
    .join(' ') || null;

  const nickname = [address.short_address, address.tag]
    .filter(Boolean)
    .join(' - ') || null;

  return {
    id: address.id,
    user_id: userId,
    street_address: streetAddress,
    city: address.city,
    postal_code: address.zipcode,
    country: address.country,
    country_code: deriveCountryCode(address.country),
    nickname,
    entry_instructions: null, // Default empty
    location,
    is_primary: false, // Will be updated in step 3
    created_at: new Date(address.created_at).toISOString(),
    updated_at: new Date(address.updated_at).toISOString(),
    source_table: sourceTable,
    original_id: address.id
  };
}

/**
 * Convert MySQL POINT coordinates to PostGIS format
 */
function convertCoordinates(mysqlPoint: string | null, logger: MigrationLogger): string | null {
  if (!mysqlPoint) return null;

  try {
    // MySQL POINT format: "POINT(longitude latitude)"
    const match = mysqlPoint.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
    if (!match) {
      logger.warn(`Invalid POINT format: ${mysqlPoint}`);
      return null;
    }

    const lng = parseFloat(match[1]);
    const lat = parseFloat(match[2]);

    // Validate coordinates are reasonable for Norway/Europe
    if (lng < -10 || lng > 30 || lat < 50 || lat > 80) {
      logger.warn(`Coordinates seem invalid: lng=${lng}, lat=${lat}`);
    }

    // Return PostGIS POINT format
    return `POINT(${lng} ${lat})`;
  } catch (error) {
    logger.warn(`Failed to convert coordinates: ${mysqlPoint}`, error);
    return null;
  }
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