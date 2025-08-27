#!/usr/bin/env bun
/**
 * Phase 1 Step 3: Create profile records
 * 
 * This script:
 * 1. Reads consolidated user data and auth user mappings
 * 2. Creates profile records in the profiles table
 * 3. Maps MySQL user IDs to Supabase Auth user IDs
 * 4. Handles errors and retries gracefully
 * 5. Updates migration statistics
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { MigrationLogger } from '../shared/logger';
import { MigrationDatabase } from '../shared/database';
import type { ConsolidatedUser, UserMigrationStats, MigrationProgress } from '../shared/types';
import type { Database } from '@/types/database.types';

async function main() {
  const logger = new MigrationLogger();
  const database = new MigrationDatabase(logger);
  
  logger.info('=== Phase 1 Step 3: Create Profile Records ===');

  try {
    // Test database connection
    const isConnected = await database.testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Read required data files
    const tempDir = join(process.cwd(), 'scripts', 'migration', 'temp');
    const consolidatedUsersPath = join(tempDir, 'consolidated-users.json');
    const userMappingPath = join(tempDir, 'user-id-mapping.json');
    const statsPath = join(tempDir, 'user-migration-stats.json');

    logger.info('Loading data files...');
    const consolidatedData = JSON.parse(readFileSync(consolidatedUsersPath, 'utf-8'));
    const mappingData = JSON.parse(readFileSync(userMappingPath, 'utf-8'));
    const stats: UserMigrationStats = JSON.parse(readFileSync(statsPath, 'utf-8'));
    
    const users: ConsolidatedUser[] = consolidatedData.users;
    const userMapping: Record<string, string> = mappingData.mapping;

    logger.info(`Loaded ${users.length} users and ${Object.keys(userMapping).length} ID mappings`);

    // Filter users that have successful auth mappings
    const usersToProcess = users.filter(user => userMapping[user.original_id]);
    const skippedUsers = users.length - usersToProcess.length;

    if (skippedUsers > 0) {
      logger.warn(`Skipping ${skippedUsers} users without auth mappings`);
    }

    // Track results
    const results: Array<{
      original_id: string;
      supabase_id: string;
      email: string;
      role: string;
      success: boolean;
      error?: string;
    }> = [];

    let created = 0;
    let errors = 0;

    // Process users in batches
    const batchSize = 50;
    const totalBatches = Math.ceil(usersToProcess.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * batchSize;
      const endIdx = Math.min(startIdx + batchSize, usersToProcess.length);
      const batch = usersToProcess.slice(startIdx, endIdx);

      // Update progress
      const progress: MigrationProgress = {
        phase: 'Phase 1 Step 3',
        step: 'Creating Profiles',
        current: endIdx,
        total: usersToProcess.length,
        percentage: (endIdx / usersToProcess.length) * 100,
        start_time: new Date().toISOString(),
        errors: []
      };
      logger.progress(progress);

      // Prepare batch of profiles
      const profileBatch: Database['public']['Tables']['profiles']['Insert'][] = batch.map(user => {
        const supabaseId = userMapping[user.original_id];
        
        return {
          id: supabaseId, // Use Supabase Auth user ID
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number,
          bankid_verified: user.bankid_verified,
          role: user.role,
          stripe_customer_id: user.stripe_customer_id,
          created_at: user.created_at,
          updated_at: user.updated_at
        };
      });

      try {
        // Use batch create for efficiency
        const batchResult = await database.batchCreate('profiles', profileBatch as Record<string, unknown>[]);

        if (batchResult.success) {
          logger.debug(`Successfully created batch ${batchIndex + 1}/${totalBatches}: ${batchResult.inserted} profiles`);
          
          // Mark all in this batch as successful
          batch.forEach(user => {
            results.push({
              original_id: user.original_id,
              supabase_id: userMapping[user.original_id],
              email: user.email,
              role: user.role,
              success: true
            });
          });

          created += batchResult.inserted;
        } else {
          logger.warn(`Batch ${batchIndex + 1} had errors: ${batchResult.errors.join('; ')}`);
          
          // Try individual inserts for this batch to identify specific failures
          for (const user of batch) {
            const supabaseId = userMapping[user.original_id];
            
            const profile: Database['public']['Tables']['profiles']['Insert'] = {
              id: supabaseId,
              full_name: user.full_name,
              email: user.email,
              phone_number: user.phone_number,
              bankid_verified: user.bankid_verified,
              role: user.role,
              stripe_customer_id: user.stripe_customer_id,
              created_at: user.created_at,
              updated_at: user.updated_at
            };

            const individualResult = await database.createProfile(profile);

            if (individualResult.success) {
              results.push({
                original_id: user.original_id,
                supabase_id: supabaseId,
                email: user.email,
                role: user.role,
                success: true
              });
              created++;
            } else {
              logger.error(`Failed to create profile for ${user.email}`, individualResult.error);
              results.push({
                original_id: user.original_id,
                supabase_id: supabaseId,
                email: user.email,
                role: user.role,
                success: false,
                error: individualResult.error
              });
              errors++;
            }
          }
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Batch ${batchIndex + 1} failed completely`, error);

        // Mark all in this batch as failed
        batch.forEach(user => {
          results.push({
            original_id: user.original_id,
            supabase_id: userMapping[user.original_id],
            email: user.email,
            role: user.role,
            success: false,
            error: errorMessage
          });
        });

        errors += batch.length;
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Update migration stats
    stats.created_profiles = created;
    stats.errors += errors;

    // Save results
    const profileResultsPath = join(tempDir, 'profiles-created.json');
    writeFileSync(profileResultsPath, JSON.stringify({
      metadata: {
        created_at: new Date().toISOString(),
        total_processed: usersToProcess.length,
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
    logger.stats('Profile Creation Summary', {
      'Total Users to Process': usersToProcess.length,
      'Skipped (No Auth Mapping)': skippedUsers,
      'Successfully Created': created,
      'Errors': errors,
      'Success Rate': usersToProcess.length > 0 ? `${Math.round((created / usersToProcess.length) * 100)}%` : '0%',
      'Database Profile Count': counts.profiles,
      'Status': errors === 0 ? '✅ SUCCESS' : (created > 0 ? '⚠️  PARTIAL SUCCESS' : '❌ FAILED')
    });

    if (created === 0 && errors > 0) {
      throw new Error('No profiles were created successfully');
    }

    logger.success('Phase 1 Step 3 completed', {
      profile_results_file: profileResultsPath,
      updated_stats_file: statsPath,
      profiles_in_database: counts.profiles
    });

  } catch (error) {
    logger.error('Phase 1 Step 3 failed', error);
    process.exit(1);
  }
}

// Run the script if called directly
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});