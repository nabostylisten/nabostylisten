#!/usr/bin/env bun
/**
 * Phase 1 Step 1: Extract and validate user data from MySQL dump
 * 
 * This script:
 * 1. Parses the MySQL dump file 
 * 2. Extracts buyer and stylist records
 * 3. Validates the extracted data
 * 4. Identifies duplicate users (same email in both tables)
 * 5. Consolidates users according to deduplication strategy
 * 6. Saves processed data to JSON files for next steps
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { MigrationLogger } from '../shared/logger';
import { MigrationDatabase } from '../shared/database';
import { MySQLParser } from './utils/mysql-parser';
import { UserValidator } from './utils/validation';
import { UserDeduplicator } from './utils/user-deduplication';
import type { UserMigrationStats } from '../shared/types';

async function main() {
  const logger = new MigrationLogger();
  const database = new MigrationDatabase(logger);
  
  logger.info('=== Phase 1 Step 1: Extract Users from MySQL Dump ===');

  try {
    // Initialize utilities
    const parser = new MySQLParser(logger, database.getDumpFilePath());
    const validator = new UserValidator(logger);
    const deduplicator = new UserDeduplicator(logger);

    // Test database connection
    const isConnected = await database.testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Get dump file statistics
    const dumpStats = await parser.getDumpStats();
    logger.stats('MySQL Dump Analysis', {
      'File Size (MB)': Math.round(dumpStats.fileSize / 1024 / 1024),
      'Total Buyers': dumpStats.totalBuyers,
      'Active Buyers': dumpStats.activeBuyers,
      'Total Stylists': dumpStats.totalStylists, 
      'Active Stylists': dumpStats.activeStylists
    });

    // Extract user data
    logger.info('Extracting user data from MySQL dump...');
    const [buyers, stylists] = await Promise.all([
      parser.extractBuyers(),
      parser.extractStylists()
    ]);

    // Filter out soft-deleted records
    const activeBuyers = buyers.filter(buyer => !buyer.deleted_at);
    const activeStylists = stylists.filter(stylist => !stylist.deleted_at);

    logger.info('Filtered active users', {
      active_buyers: activeBuyers.length,
      active_stylists: activeStylists.length,
      filtered_out: (buyers.length - activeBuyers.length) + (stylists.length - activeStylists.length)
    });

    // Validate extracted data
    logger.info('Validating extracted user data...');
    const buyerErrors = validator.validateBuyers(activeBuyers);
    const stylistErrors = validator.validateStylists(activeStylists);

    if (buyerErrors.length > 0) {
      logger.validation(buyerErrors);
    }

    if (stylistErrors.length > 0) {
      logger.validation(stylistErrors);
    }

    const hasValidationErrors = buyerErrors.length > 0 || stylistErrors.length > 0;
    if (hasValidationErrors) {
      logger.warn('Validation errors found, but continuing with migration...');
    }

    // Find and resolve duplicate users
    logger.info('Identifying duplicate users...');
    const duplicates = deduplicator.findDuplicateEmails(activeBuyers, activeStylists);
    
    if (duplicates.length > 0) {
      logger.warn(`Found ${duplicates.length} users with duplicate emails`);
      duplicates.forEach(duplicate => {
        logger.debug('Duplicate user found', {
          email: duplicate.email,
          resolution: duplicate.resolution,
          reason: duplicate.reason
        });
      });
    }

    // Consolidate users
    logger.info('Consolidating user data...');
    const consolidatedUsers = deduplicator.consolidateUsers(activeBuyers, activeStylists, duplicates);

    // Validate consolidated data
    logger.info('Validating consolidated user data...');
    const consolidationErrors = validator.validateConsolidatedUsers(consolidatedUsers);
    
    if (consolidationErrors.length > 0) {
      logger.validation(consolidationErrors);
      throw new Error(`Consolidated user validation failed with ${consolidationErrors.length} errors`);
    }

    // Generate migration statistics
    const stats: UserMigrationStats = {
      total_buyers: buyers.length,
      total_stylists: stylists.length,
      active_buyers: activeBuyers.length,
      active_stylists: activeStylists.length,
      duplicate_emails: duplicates.length,
      merged_accounts: duplicates.filter(d => d.resolution !== 'create_separate').length,
      skipped_records: buyers.length + stylists.length - consolidatedUsers.length,
      created_auth_users: 0, // Will be updated in next step
      created_profiles: 0, // Will be updated in next step
      created_stylist_details: 0, // Will be updated in next step  
      created_user_preferences: 0, // Will be updated in next step
      errors: buyerErrors.length + stylistErrors.length + consolidationErrors.length
    };

    // Save processed data to files
    const outputDir = join(process.cwd(), 'scripts', 'migration', 'temp');
    logger.info(`Saving processed data to ${outputDir}`);

    // Ensure output directory exists
    try {
      const fs = await import('fs');
      await fs.promises.mkdir(outputDir, { recursive: true });
    } catch (error) {
      logger.warn('Failed to create output directory', error);
    }

    // Save consolidated users
    const consolidatedUsersPath = join(outputDir, 'consolidated-users.json');
    writeFileSync(consolidatedUsersPath, JSON.stringify({
      metadata: {
        extracted_at: new Date().toISOString(),
        source_dump: database.getDumpFilePath(),
        stats
      },
      users: consolidatedUsers
    }, null, 2));

    // Save duplicates for reference
    const duplicatesPath = join(outputDir, 'duplicate-users.json');
    writeFileSync(duplicatesPath, JSON.stringify({
      metadata: {
        extracted_at: new Date().toISOString(),
        count: duplicates.length
      },
      duplicates
    }, null, 2));

    // Save migration stats
    const statsPath = join(outputDir, 'user-migration-stats.json');
    writeFileSync(statsPath, JSON.stringify(stats, null, 2));

    // Final summary
    logger.stats('User Extraction Summary', {
      'Total Users Extracted': consolidatedUsers.length,
      'Customers': consolidatedUsers.filter(u => u.role === 'customer').length,
      'Stylists': consolidatedUsers.filter(u => u.role === 'stylist').length,
      'Duplicate Emails Resolved': duplicates.length,
      'Validation Errors': stats.errors,
      'Status': stats.errors === 0 ? '✅ SUCCESS' : '⚠️  SUCCESS WITH WARNINGS'
    });

    logger.success('Phase 1 Step 1 completed successfully', {
      consolidated_users_file: consolidatedUsersPath,
      duplicates_file: duplicatesPath,
      stats_file: statsPath
    });

  } catch (error) {
    logger.error('Phase 1 Step 1 failed', error);
    process.exit(1);
  }
}

// Run the script if called directly
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});