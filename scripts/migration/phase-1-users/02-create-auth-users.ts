#!/usr/bin/env bun
/**
 * Phase 1 Step 2: Create Supabase Auth users
 *
 * This script:
 * 1. Reads consolidated user data from JSON file
 * 2. Creates Supabase Auth users with email already confirmed
 * 3. Handles duplicate emails gracefully
 * 4. Updates migration stats
 * 5. Prepares user ID mapping for profile creation
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { MigrationLogger } from "../shared/logger";
import { MigrationDatabase } from "../shared/database";
import {
  getOptimalBatchSize,
  processBatchesWithResults,
} from "../shared/batch-processor";
import type {
  ConsolidatedUser,
  MigrationProgress,
  UserMigrationStats,
} from "../shared/types";

async function main() {
  const logger = new MigrationLogger();
  const database = new MigrationDatabase(logger);

  logger.info("=== Phase 1 Step 2: Create Supabase Auth Users ===");

  try {
    // Test database connection
    const isConnected = await database.testConnection();
    if (!isConnected) {
      throw new Error("Database connection failed");
    }

    // Read consolidated user data
    const tempDir = join(process.cwd(), "scripts", "migration", "temp");
    const consolidatedUsersPath = join(tempDir, "consolidated-users.json");
    const statsPath = join(tempDir, "user-migration-stats.json");

    logger.info("Loading consolidated user data...");
    const consolidatedData = JSON.parse(
      readFileSync(consolidatedUsersPath, "utf-8"),
    );
    const stats: UserMigrationStats = JSON.parse(
      readFileSync(statsPath, "utf-8"),
    );

    const users: ConsolidatedUser[] = consolidatedData.users;

    logger.info(`Processing ${users.length} consolidated users`);

    // Track progress and results
    interface AuthUserResult {
      original_id: string;
      email: string;
      success: boolean;
      supabase_user_id?: string;
      error?: string;
      skipped?: boolean;
      skip_reason?: string;
    }

    // Process users using optimized batch processing
    // Auth user creation CANNOT be batched - each call is individual to Supabase Auth API
    const batchSize = getOptimalBatchSize("auth_users", users.length);
    logger.info(`Processing ${users.length} users in batches of ${batchSize}`);

    const batchResult = await processBatchesWithResults<
      ConsolidatedUser,
      AuthUserResult
    >(
      users,
      async (user: ConsolidatedUser): Promise<AuthUserResult> => {
        try {
          // Check if email already exists
          const emailExists = await database.emailExists(user.email);

          if (emailExists) {
            logger.warn(`Email already exists in Supabase: ${user.email}`, {
              original_id: user.original_id,
              role: user.role,
            });

            return {
              original_id: user.original_id,
              email: user.email,
              success: false,
              skipped: true,
              skip_reason: "Email already exists in Supabase",
            };
          }

          // Create Supabase Auth user
          const authResult = await database.createAuthUser({
            email: user.email,
            email_confirm: true, // Auto-confirm for migration
            user_metadata: {
              full_name: user.full_name || undefined,
              phone_number: user.phone_number || undefined,
              role: user.role,
              migration_source: user.source_table === "buyer"
                ? "mysql_buyer"
                : "mysql_stylist",
              original_id: user.original_id,
            },
          });

          if (authResult.success) {
            logger.debug(`Created auth user: ${user.email}`, {
              supabase_id: authResult.user_id,
              original_id: user.original_id,
              role: user.role,
            });

            return {
              original_id: user.original_id,
              email: user.email,
              success: true,
              supabase_user_id: authResult.user_id,
            };
          } else {
            logger.error(
              `Failed to create auth user: ${user.email}`,
              authResult.error,
            );

            return {
              original_id: user.original_id,
              email: user.email,
              success: false,
              error: authResult.error,
            };
          }
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : "Unknown error";
          logger.error(`Error processing user ${user.email}`, error);

          return {
            original_id: user.original_id,
            email: user.email,
            success: false,
            error: errorMessage,
          };
        }
      },
      {
        batchSize,
        delayBetweenBatches: 200, // Reduced delay for faster processing
        progressCallback: (current, total) => {
          const progress: MigrationProgress = {
            phase: "Phase 1 Step 2",
            step: "Creating Auth Users",
            current,
            total,
            percentage: (current / total) * 100,
            start_time: new Date().toISOString(),
            errors: [],
          };
          logger.progress(progress);
        },
      },
      logger,
    );

    // Extract results from batch processing
    const results = batchResult.successful;
    const created = results.filter((r) => r.success && !r.skipped).length;
    const skipped = results.filter((r) => r.skipped).length;
    const errors = batchResult.errorCount +
      results.filter((r) => !r.success && !r.skipped).length;

    // Update migration stats
    stats.created_auth_users = created;
    stats.errors += errors;

    // Save results
    const authResultsPath = join(tempDir, "auth-users-created.json");
    writeFileSync(
      authResultsPath,
      JSON.stringify(
        {
          metadata: {
            created_at: new Date().toISOString(),
            total_processed: users.length,
            successful: created,
            skipped,
            errors,
          },
          results,
        },
        null,
        2,
      ),
    );

    // Save updated stats
    writeFileSync(statsPath, JSON.stringify(stats, null, 2));

    // Create user ID mapping for next step
    const successfulResults = results.filter((r) =>
      r.success && r.supabase_user_id
    );
    const userMapping: Record<string, string> = {};

    successfulResults.forEach((result) => {
      userMapping[result.original_id] = result.supabase_user_id!;
    });

    const mappingPath = join(tempDir, "user-id-mapping.json");
    writeFileSync(
      mappingPath,
      JSON.stringify(
        {
          metadata: {
            created_at: new Date().toISOString(),
            total_mappings: Object.keys(userMapping).length,
          },
          mapping: userMapping,
        },
        null,
        2,
      ),
    );

    // Log summary
    logger.stats("Auth User Creation Summary", {
      "Total Processed": users.length,
      "Successfully Created": created,
      "Skipped (Already Exists)": skipped,
      "Errors": errors,
      "Success Rate": `${
        Math.round((created / (users.length - skipped)) * 100)
      }%`,
      "Status": errors === 0
        ? "✅ SUCCESS"
        : (created > 0 ? "⚠️  PARTIAL SUCCESS" : "❌ FAILED"),
    });

    if (created === 0 && errors > 0) {
      throw new Error("No auth users were created successfully");
    }

    logger.success("Phase 1 Step 2 completed", {
      auth_results_file: authResultsPath,
      user_mapping_file: mappingPath,
      updated_stats_file: statsPath,
    });
  } catch (error) {
    logger.error("Phase 1 Step 2 failed", error);
    process.exit(1);
  }
}

// Run the script if called directly
main().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
