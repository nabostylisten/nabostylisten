#!/usr/bin/env bun
/**
 * Phase 1 Step 4: Create stylist details records
 * 
 * This script:
 * 1. Reads consolidated user data and profile creation results
 * 2. Creates stylist_details records for users with role='stylist'
 * 3. Maps stylist-specific data from MySQL to Supabase schema
 * 4. Updates migration statistics
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { MigrationLogger } from '../shared/logger';
import { MigrationDatabase } from '../shared/database';
import { processDatabaseBatches, getOptimalBatchSize } from '../shared/batch-processor';
import type { ConsolidatedUser, UserMigrationStats, MigrationProgress } from '../shared/types';
import type { Database } from '@/types/database.types';

async function main() {
  const logger = new MigrationLogger();
  const database = new MigrationDatabase(logger);
  
  logger.info('=== Phase 1 Step 4: Create Stylist Details Records ===');

  try {
    // Test database connection
    const isConnected = await database.testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Read required data files
    const tempDir = join(process.cwd(), 'scripts', 'migration', 'temp');
    const consolidatedUsersPath = join(tempDir, 'consolidated-users.json');
    // const profileResultsPath = join(tempDir, 'profiles-created.json');
    const userMappingPath = join(tempDir, 'user-id-mapping.json');
    const statsPath = join(tempDir, 'user-migration-stats.json');

    logger.info('Loading data files...');
    const consolidatedData = JSON.parse(readFileSync(consolidatedUsersPath, 'utf-8'));
    // const profileResults = JSON.parse(readFileSync(profileResultsPath, 'utf-8'));
    const mappingData = JSON.parse(readFileSync(userMappingPath, 'utf-8'));
    const stats: UserMigrationStats = JSON.parse(readFileSync(statsPath, 'utf-8'));
    
    let users: ConsolidatedUser[] = consolidatedData.users;
    const userMapping: Record<string, string> = mappingData.mapping;

    // Process all users (HEAD_LIMIT logic removed for production migration)

    // Get list of existing profiles from database to verify successful creation
    const existingProfileIds = new Set(
      await database.getExistingProfileIds(Object.values(userMapping))
    );

    // Filter for stylists with successful profile creation (check database instead of results file)
    const stylistsToProcess = users.filter(user => 
      user.role === 'stylist' && 
      user.stylist_details && 
      userMapping[user.original_id] &&
      existingProfileIds.has(userMapping[user.original_id])
    );

    const totalStylists = users.filter(u => u.role === 'stylist').length;
    const skippedStylists = totalStylists - stylistsToProcess.length;

    logger.info(`Processing ${stylistsToProcess.length} stylists (skipped ${skippedStylists})`);

    if (stylistsToProcess.length === 0) {
      logger.warn('No stylists to process for stylist_details');
      return;
    }

    // Convert user data to stylist details format
    const createStylistDetailsRecord = (user: ConsolidatedUser): Database['public']['Tables']['stylist_details']['Insert'] => {
      const supabaseId = userMapping[user.original_id];
      const details = user.stylist_details!;

      return {
        profile_id: supabaseId, // Links to profiles table
        bio: details.bio,
        can_travel: details.can_travel,
        has_own_place: details.has_own_place,
        travel_distance_km: details.travel_distance_km,
        instagram_profile: details.instagram_profile,
        facebook_profile: details.facebook_profile,
        tiktok_profile: details.tiktok_profile,
        youtube_profile: details.youtube_profile,
        snapchat_profile: details.snapchat_profile,
        other_social_media_urls: details.other_social_media_urls,
        stripe_account_id: details.stripe_account_id,
        created_at: user.created_at,
        updated_at: user.updated_at
      };
    };

    // Process using optimized batch processing with database batch operations
    const batchSize = getOptimalBatchSize('profiles', stylistsToProcess.length);
    logger.info(`Processing ${stylistsToProcess.length} stylists in batches of ${batchSize}`);

    interface StylistResult {
      original_id: string;
      supabase_id: string;
      email: string;
      success: boolean;
      error?: string;
    }

    const batchResult = await processDatabaseBatches<ConsolidatedUser, StylistResult>(
      stylistsToProcess,
      // Individual processor (fallback for failed batches)
      async (user: ConsolidatedUser): Promise<StylistResult> => {
        const supabaseId = userMapping[user.original_id];
        const stylistDetails = createStylistDetailsRecord(user);

        const result = await database.createStylistDetails(stylistDetails);

        return {
          original_id: user.original_id,
          supabase_id: supabaseId,
          email: user.email,
          success: result.success,
          error: result.error
        };
      },
      // Batch processor (preferred for efficiency)
      async (users: ConsolidatedUser[]): Promise<StylistResult[]> => {
        const stylistDetailsBatch = users.map(createStylistDetailsRecord);

        const batchResult = await database.batchCreate(
          'stylist_details',
          stylistDetailsBatch as Record<string, unknown>[]
        );

        if (batchResult.success) {
          // Return success results for all users in the batch
          return users.map(user => ({
            original_id: user.original_id,
            supabase_id: userMapping[user.original_id],
            email: user.email,
            success: true
          }));
        } else {
          // Batch failed - will be handled by fallback to individual processing
          throw new Error(`Batch insert failed: ${batchResult.errors.join('; ')}`);
        }
      },
      {
        batchSize,
        delayBetweenBatches: 200,
        canBatch: true, // Stylist details CAN be batch inserted
        fallbackToIndividual: true, // Fall back to individual inserts on batch failure
        progressCallback: (current, total) => {
          const progress: MigrationProgress = {
            phase: 'Phase 1 Step 4',
            step: 'Creating Stylist Details',
            current,
            total,
            percentage: (current / total) * 100,
            start_time: new Date().toISOString(),
            errors: []
          };
          logger.progress(progress);
        }
      },
      logger
    );

    // Extract results from batch processing
    const results = batchResult.successful;
    const created = results.filter(r => r.success).length;
    const errors = batchResult.errorCount + results.filter(r => !r.success).length;

    // Update migration stats
    stats.created_stylist_details = created;
    stats.errors += errors;

    // Save results
    const stylistDetailsResultsPath = join(tempDir, 'stylist-details-created.json');
    writeFileSync(stylistDetailsResultsPath, JSON.stringify({
      metadata: {
        created_at: new Date().toISOString(),
        total_processed: stylistsToProcess.length,
        successful: created,
        errors
      },
      results
    }, null, 2));

    // Save updated stats
    writeFileSync(statsPath, JSON.stringify(stats, null, 2));

    // Get final database counts for verification
    const counts = await database.getCurrentCounts();

    // Log summary
    logger.stats('Stylist Details Creation Summary', {
      'Total Stylists to Process': stylistsToProcess.length,
      'Skipped (No Profile/Missing Data)': skippedStylists,
      'Successfully Created': created,
      'Errors': errors,
      'Success Rate': stylistsToProcess.length > 0 ? `${Math.round((created / stylistsToProcess.length) * 100)}%` : '0%',
      'Database Stylist Details Count': counts.stylist_details,
      'Status': errors === 0 ? '✅ SUCCESS' : (created > 0 ? '⚠️  PARTIAL SUCCESS' : '❌ FAILED')
    });

    logger.success('Phase 1 Step 4 completed', {
      stylist_details_results_file: stylistDetailsResultsPath,
      updated_stats_file: statsPath,
      stylist_details_in_database: counts.stylist_details
    });

  } catch (error) {
    logger.error('Phase 1 Step 4 failed', error);
    process.exit(1);
  }
}

// Run the script if called directly
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});