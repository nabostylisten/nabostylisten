#!/usr/bin/env bun
/**
 * Phase 1 Step 5: Create user preferences records
 *
 * This script:
 * 1. Reads consolidated user data and profile creation results
 * 2. Creates user_preferences records for all successfully created profiles
 * 3. Maps notification preferences from MySQL to Supabase schema
 * 4. Updates migration statistics and completes Phase 1
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { MigrationLogger } from "../shared/logger";
import { MigrationDatabase } from "../shared/database";
import type {
  ConsolidatedUser,
  MigrationProgress,
  UserMigrationStats,
} from "../shared/types";
import type { Database } from "@/types/database.types";

async function main() {
  const logger = new MigrationLogger();
  const database = new MigrationDatabase(logger);

  logger.info("=== Phase 1 Step 5: Create User Preferences Records ===");

  try {
    // Test database connection
    const isConnected = await database.testConnection();
    if (!isConnected) {
      throw new Error("Database connection failed");
    }

    // Read required data files
    const tempDir = join(process.cwd(), "scripts", "migration", "temp");
    const consolidatedUsersPath = join(tempDir, "consolidated-users.json");
    // const profileResultsPath = join(tempDir, "profiles-created.json");
    const userMappingPath = join(tempDir, "user-id-mapping.json");
    const statsPath = join(tempDir, "user-migration-stats.json");

    logger.info("Loading data files...");
    const consolidatedData = JSON.parse(
      readFileSync(consolidatedUsersPath, "utf-8"),
    );
    // const profileResults = JSON.parse(
    //   readFileSync(profileResultsPath, "utf-8"),
    // );
    const mappingData = JSON.parse(readFileSync(userMappingPath, "utf-8"));
    const stats: UserMigrationStats = JSON.parse(
      readFileSync(statsPath, "utf-8"),
    );

    const users: ConsolidatedUser[] = consolidatedData.users;
    const userMapping: Record<string, string> = mappingData.mapping;
    // const successfulProfiles = new Set(
    //   profileResults.results
    //     .filter((r: { success: boolean }) => r.success)
    //     .map((r: { original_id: string }) => r.original_id),
    // );

    // Get list of existing profiles from database to verify successful creation
    const existingProfileIds = new Set(
      await database.getExistingProfileIds(Object.values(userMapping)),
    );

    // Filter for users with successful profile creation (check database instead of results file)
    const usersToProcess = users.filter((user) =>
      userMapping[user.original_id] &&
      existingProfileIds.has(userMapping[user.original_id])
    );

    const skippedUsers = users.length - usersToProcess.length;

    logger.info(
      `Processing ${usersToProcess.length} users for preferences (skipped ${skippedUsers})`,
    );

    if (usersToProcess.length === 0) {
      logger.warn("No users to process for user preferences");
      return;
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
    const batchSize = 100;
    const totalBatches = Math.ceil(usersToProcess.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * batchSize;
      const endIdx = Math.min(startIdx + batchSize, usersToProcess.length);
      const batch = usersToProcess.slice(startIdx, endIdx);

      // Update progress
      const progress: MigrationProgress = {
        phase: "Phase 1 Step 5",
        step: "Creating User Preferences",
        current: endIdx,
        total: usersToProcess.length,
        percentage: (endIdx / usersToProcess.length) * 100,
        start_time: new Date().toISOString(),
        errors: [],
      };
      logger.progress(progress);

      // Prepare batch of user preferences
      const preferencesBatch:
        Database["public"]["Tables"]["user_preferences"]["Insert"][] = batch
          .map((user) => {
            const supabaseId = userMapping[user.original_id];
            const prefs = user.user_preferences;

            return {
              user_id: supabaseId,
              newsletter_subscribed: prefs.newsletter_subscribed,
              marketing_emails: prefs.marketing_emails,
              promotional_sms: prefs.promotional_sms,
              booking_confirmations: prefs.booking_confirmations,
              booking_reminders: prefs.booking_reminders,
              booking_cancellations: prefs.booking_cancellations,
              booking_status_updates: prefs.booking_status_updates,
              chat_messages: prefs.chat_messages,
              new_booking_requests: prefs.new_booking_requests,
              review_notifications: prefs.review_notifications,
              payment_notifications: prefs.payment_notifications,
              application_status_updates: prefs.application_status_updates,
              email_delivery: prefs.email_delivery,
              sms_delivery: prefs.sms_delivery,
              push_notifications: prefs.push_notifications,
              created_at: user.created_at,
              updated_at: user.updated_at,
            };
          });

      try {
        // Use batch create for efficiency
        const batchResult = await database.batchCreate(
          "user_preferences",
          preferencesBatch as Record<string, unknown>[],
        );

        if (batchResult.success) {
          logger.debug(
            `Successfully created batch ${
              batchIndex + 1
            }/${totalBatches}: ${batchResult.inserted} user preferences`,
          );

          // Mark all in this batch as successful
          batch.forEach((user) => {
            results.push({
              original_id: user.original_id,
              supabase_id: userMapping[user.original_id],
              email: user.email,
              role: user.role,
              success: true,
            });
          });

          created += batchResult.inserted;
        } else {
          logger.warn(
            `Batch ${batchIndex + 1} had errors: ${
              batchResult.errors.join("; ")
            }`,
          );

          // Try individual inserts for this batch to identify specific failures
          for (const user of batch) {
            const supabaseId = userMapping[user.original_id];
            const prefs = user.user_preferences;

            const userPreferences:
              Database["public"]["Tables"]["user_preferences"]["Insert"] = {
                user_id: supabaseId,
                newsletter_subscribed: prefs.newsletter_subscribed,
                marketing_emails: prefs.marketing_emails,
                promotional_sms: prefs.promotional_sms,
                booking_confirmations: prefs.booking_confirmations,
                booking_reminders: prefs.booking_reminders,
                booking_cancellations: prefs.booking_cancellations,
                booking_status_updates: prefs.booking_status_updates,
                chat_messages: prefs.chat_messages,
                new_booking_requests: prefs.new_booking_requests,
                review_notifications: prefs.review_notifications,
                payment_notifications: prefs.payment_notifications,
                application_status_updates: prefs.application_status_updates,
                email_delivery: prefs.email_delivery,
                sms_delivery: prefs.sms_delivery,
                push_notifications: prefs.push_notifications,
                created_at: user.created_at,
                updated_at: user.updated_at,
              };

            const individualResult = await database.createUserPreferences(
              userPreferences,
            );

            if (individualResult.success) {
              results.push({
                original_id: user.original_id,
                supabase_id: supabaseId,
                email: user.email,
                role: user.role,
                success: true,
              });
              created++;
            } else {
              logger.error(
                `Failed to create user preferences for ${user.email}`,
                individualResult.error,
              );
              results.push({
                original_id: user.original_id,
                supabase_id: supabaseId,
                email: user.email,
                role: user.role,
                success: false,
                error: individualResult.error,
              });
              errors++;
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : "Unknown error";
        logger.error(`Batch ${batchIndex + 1} failed completely`, error);

        // Mark all in this batch as failed
        batch.forEach((user) => {
          results.push({
            original_id: user.original_id,
            supabase_id: userMapping[user.original_id],
            email: user.email,
            role: user.role,
            success: false,
            error: errorMessage,
          });
        });

        errors += batch.length;
      }

      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Update migration stats
    stats.created_user_preferences = created;
    stats.errors += errors;

    // Save results
    const preferencesResultsPath = join(
      tempDir,
      "user-preferences-created.json",
    );
    writeFileSync(
      preferencesResultsPath,
      JSON.stringify(
        {
          metadata: {
            created_at: new Date().toISOString(),
            total_processed: usersToProcess.length,
            successful: created,
            errors,
          },
          results,
        },
        null,
        2,
      ),
    );

    // Save final stats
    writeFileSync(statsPath, JSON.stringify(stats, null, 2));

    // Get final database counts for verification
    const counts = await database.getCurrentCounts();

    // Log Phase 1 completion summary
    logger.stats("Phase 1 User Migration COMPLETE", {
      "=== FINAL STATISTICS ===": "",
      "Original Buyers": stats.total_buyers,
      "Original Stylists": stats.total_stylists,
      "Active Users Processed": stats.active_buyers + stats.active_stylists,
      "Duplicate Emails Resolved": stats.duplicate_emails,
      "": "",
      "=== SUPABASE RECORDS CREATED ===": "",
      "Auth Users Created": stats.created_auth_users,
      "Profiles Created": stats.created_profiles,
      "Stylist Details Created": stats.created_stylist_details,
      "User Preferences Created": stats.created_user_preferences,
      " ": "",
      "=== DATABASE VERIFICATION ===": "",
      "Profiles in Database": counts.profiles,
      "Stylist Details in Database": counts.stylist_details,
      "User Preferences in Database": counts.user_preferences,
      "  ": "",
      "=== MIGRATION STATUS ===": "",
      "Total Errors": stats.errors,
      "Success Rate": stats.created_auth_users > 0
        ? `${
          Math.round((stats.created_profiles / stats.created_auth_users) * 100)
        }%`
        : "0%",
      "Overall Status": stats.errors === 0
        ? "✅ SUCCESS"
        : (stats.created_profiles > 0 ? "⚠️  PARTIAL SUCCESS" : "❌ FAILED"),
    });

    // Save Phase 1 completion marker
    const completionMarkerPath = join(tempDir, "phase-1-completed.json");
    writeFileSync(
      completionMarkerPath,
      JSON.stringify(
        {
          phase: "Phase 1 - User Migration",
          completed_at: new Date().toISOString(),
          status: stats.errors === 0 ? "success" : "partial_success",
          final_stats: stats,
          database_counts: counts,
        },
        null,
        2,
      ),
    );

    logger.success("🎉 Phase 1 User Migration completed successfully!", {
      preferences_results_file: preferencesResultsPath,
      final_stats_file: statsPath,
      completion_marker: completionMarkerPath,
    });

    logger.info(
      "Next steps: Users can now login using OTP with their existing emails",
    );
  } catch (error) {
    logger.error("Phase 1 Step 5 failed", error);
    process.exit(1);
  }
}

// Run the script if called directly
main().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
