#!/usr/bin/env bun
/**
 * Phase 2 Step 3: Update primary address flags
 * 
 * This script:
 * 1. Reads consolidated user data from Phase 1
 * 2. Identifies default_address_id references for each user
 * 3. Updates is_primary flag for corresponding addresses
 * 4. Handles cases where default_address_id points to non-existent/filtered addresses
 * 5. Updates migration statistics
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { MigrationLogger } from '../shared/logger';
import { MigrationDatabase } from '../shared/database';
import type { AddressMigrationStats, ConsolidatedUser } from '../shared/types';

async function main() {
  const logger = new MigrationLogger();
  const database = new MigrationDatabase(logger);
  
  logger.info('=== Phase 2 Step 3: Update Primary Address Flags ===');

  try {
    // Test database connection
    const isConnected = await database.testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Read required data files
    const tempDir = join(process.cwd(), 'scripts', 'migration', 'temp');
    const consolidatedUsersPath = join(tempDir, 'consolidated-users.json');
    const addressResultsPath = join(tempDir, 'addresses-created.json');
    const addressStatsPath = join(tempDir, 'address-migration-stats.json');
    
    logger.info('Loading required data files...');
    
    const consolidatedData = JSON.parse(readFileSync(consolidatedUsersPath, 'utf-8'));
    const addressResults = JSON.parse(readFileSync(addressResultsPath, 'utf-8'));
    const stats: AddressMigrationStats = JSON.parse(readFileSync(addressStatsPath, 'utf-8'));
    
    const users: ConsolidatedUser[] = consolidatedData.users;
    const createdAddresses = new Set(
      addressResults.results
        .filter((r: any) => r.success)
        .map((r: any) => r.original_id)
    );

    logger.info(`Processing ${users.length} users for primary address updates`);

    // Find users with default_address_id that maps to created addresses
    const primaryAddressUpdates: Array<{
      user_id: string;
      address_id: string;
      user_email: string;
      source_table: string;
      default_address_id: string;
    }> = [];

    // We need to get the original user data to find default_address_id
    // This information isn't stored in ConsolidatedUser, so we need to get it from the MySQL dump
    const { MySQLParser } = await import('../phase-1-users/utils/mysql-parser');
    const parser = new MySQLParser(database.getDumpFilePath(), logger);
    
    logger.info('Extracting default_address_id references from MySQL data...');
    const [buyers, stylists] = await Promise.all([
      parser.extractBuyers(),
      parser.extractStylists()
    ]);

    // Read user ID mapping
    const userMappingPath = join(tempDir, 'user-id-mapping.json');
    const mappingData = JSON.parse(readFileSync(userMappingPath, 'utf-8'));
    const userMapping: Record<string, string> = mappingData.mapping;

    // Process buyers
    for (const buyer of buyers) {
      if (buyer.is_deleted || !buyer.default_address_id || !userMapping[buyer.id]) {
        continue;
      }

      if (createdAddresses.has(buyer.default_address_id)) {
        primaryAddressUpdates.push({
          user_id: userMapping[buyer.id],
          address_id: buyer.default_address_id,
          user_email: buyer.email || 'unknown',
          source_table: 'buyer',
          default_address_id: buyer.default_address_id
        });
      }
    }

    // Process stylists
    for (const stylist of stylists) {
      if (stylist.is_deleted || !stylist.default_address_id || !userMapping[stylist.id]) {
        continue;
      }

      if (createdAddresses.has(stylist.default_address_id)) {
        primaryAddressUpdates.push({
          user_id: userMapping[stylist.id],
          address_id: stylist.default_address_id,
          user_email: stylist.email || 'unknown',
          source_table: 'stylist',
          default_address_id: stylist.default_address_id
        });
      }
    }

    logger.info(`Found ${primaryAddressUpdates.length} primary address updates to perform`);

    if (primaryAddressUpdates.length === 0) {
      logger.warn('No primary address updates needed');
      
      // Still save completion marker
      const completionPath = join(tempDir, 'primary-addresses-updated.json');
      writeFileSync(completionPath, JSON.stringify({
        metadata: {
          updated_at: new Date().toISOString(),
          total_updates: 0,
          successful_updates: 0,
          errors: 0
        },
        updates: []
      }, null, 2));

      return;
    }

    // Perform primary address updates
    const results: Array<{
      user_id: string;
      address_id: string;
      user_email: string;
      success: boolean;
      error?: string;
    }> = [];

    let successful = 0;
    let errors = 0;

    for (const update of primaryAddressUpdates) {
      try {
        const result = await database.updateAddressPrimary(update.address_id, true);
        
        if (result.success) {
          results.push({
            user_id: update.user_id,
            address_id: update.address_id,
            user_email: update.user_email,
            success: true
          });
          successful++;
          logger.debug(`Set primary address for ${update.user_email}: ${update.address_id}`);
        } else {
          results.push({
            user_id: update.user_id,
            address_id: update.address_id,
            user_email: update.user_email,
            success: false,
            error: result.error
          });
          errors++;
          logger.error(`Failed to set primary address for ${update.user_email}`, result.error);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          user_id: update.user_id,
          address_id: update.address_id,
          user_email: update.user_email,
          success: false,
          error: errorMessage
        });
        errors++;
        logger.error(`Exception setting primary address for ${update.user_email}`, error);
      }

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Update migration stats
    stats.primary_address_updates = successful;
    stats.errors += errors;

    // Save results
    const primaryAddressResultsPath = join(tempDir, 'primary-addresses-updated.json');
    writeFileSync(primaryAddressResultsPath, JSON.stringify({
      metadata: {
        updated_at: new Date().toISOString(),
        total_updates: primaryAddressUpdates.length,
        successful_updates: successful,
        errors
      },
      updates: results
    }, null, 2));

    // Save updated stats
    writeFileSync(addressStatsPath, JSON.stringify(stats, null, 2));

    // Get final database counts for verification
    const counts = await database.getCurrentCounts();
    const primaryCount = await database.getPrimaryAddressCount();

    // Log summary
    logger.stats('Primary Address Update Summary', {
      'Total Updates Needed': primaryAddressUpdates.length,
      'Successfully Updated': successful,
      'Errors': errors,
      'Success Rate': primaryAddressUpdates.length > 0 ? `${Math.round((successful / primaryAddressUpdates.length) * 100)}%` : '0%',
      'Primary Addresses in Database': primaryCount,
      'Total Addresses': counts.addresses,
      'Status': errors === 0 ? '✅ SUCCESS' : (successful > 0 ? '⚠️  PARTIAL SUCCESS' : '❌ FAILED')
    });

    logger.success('Phase 2 Step 3 completed', {
      primary_address_results_file: primaryAddressResultsPath,
      updated_stats_file: addressStatsPath,
      primary_addresses_count: primaryCount,
      total_addresses: counts.addresses
    });

  } catch (error) {
    logger.error('Phase 2 Step 3 failed', error);
    process.exit(1);
  }
}

// Run the script if called directly
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});