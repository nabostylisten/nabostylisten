#!/usr/bin/env bun
/**
 * Reliable Phase Runner with Production Dump Integration
 *
 * This script allows you to run any migration phase with a specified SQL dump file.
 * It automatically sets up the environment and validates prerequisites before execution.
 *
 * Usage:
 *   bun scripts/migration/run-phase-with-dump.ts <phase_number> <dump_file_path>
 *
 * Examples:
 *   bun scripts/migration/run-phase-with-dump.ts 1 ./nabostylisten_prod.sql
 *   bun scripts/migration/run-phase-with-dump.ts 2 ./nabostylisten_prod.sql
 */

import { execSync } from "child_process";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { MigrationLogger } from "./shared/logger";
import { MigrationDatabase } from "./shared/database";

async function main() {
  const logger = new MigrationLogger();
  const startTime = Date.now();

  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length < 2 || args.length > 4) {
    showUsage();
    process.exit(1);
  }

  const [phaseNumber, dumpFilePath] = args;

  //  logic removed for production migration

  // Validate phase number
  const phase = parseInt(phaseNumber, 10);
  if (isNaN(phase) || phase < 1 || phase > 7) {
    logger.error("Invalid phase number. Must be between 1 and 7.");
    showUsage();
    process.exit(1);
  }

  // Validate dump file exists
  if (!existsSync(dumpFilePath)) {
    logger.error(`SQL dump file not found: ${dumpFilePath}`);
    process.exit(1);
  }

  logger.info(`🚀 === RUNNING PHASE ${phase} WITH DUMP: ${dumpFilePath} ===`);
  logger.info("🎯 Running with FULL dataset (no limits)");

  try {
    // Set up environment with dump file path
    const env = {
      ...process.env,
      MYSQL_DUMP_PATH: dumpFilePath,
    };

    // Initialize database connection for validation
    const database = new MigrationDatabase(logger);

    logger.info("Verifying prerequisites...");

    // Test database connection
    const isConnected = await database.testConnection();
    if (!isConnected) {
      throw new Error("Database connection failed");
    }
    logger.success("Database connection verified");

    // Ensure temp directory exists
    const tempDir = join(process.cwd(), "scripts", "migration", "temp");
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
      logger.info(`Created temp directory: ${tempDir}`);
    }

    // Get initial database state
    const initialCounts = await database.getCurrentCounts();
    logger.stats("Initial Database State", initialCounts);

    // Determine the script path
    const scriptPath = join(
      process.cwd(),
      "scripts",
      "migration",
      `run-phase-${phase}.ts`,
    );

    if (!existsSync(scriptPath)) {
      throw new Error(`Phase ${phase} script not found: ${scriptPath}`);
    }

    logger.info(`\n📋 Executing Phase ${phase} Migration`);
    logger.info(`Script: ${scriptPath}`);
    logger.info(`Dump file: ${dumpFilePath}`);

    // Execute the phase script
    const phaseStartTime = Date.now();

    logger.info(`Running: bun ${scriptPath}`);
    execSync(`bun ${scriptPath}`, {
      stdio: "inherit",
      cwd: process.cwd(),
      env,
    });

    const phaseDuration = Date.now() - phaseStartTime;
    logger.success(
      `✅ Phase ${phase} completed in ${Math.round(phaseDuration / 1000)}s`,
    );

    // Get final database state
    const finalCounts = await database.getCurrentCounts();

    // Calculate changes
    const changes: Record<string, number> = {};
    Object.keys(finalCounts).forEach((table) => {
      const initial = initialCounts[table] || 0;
      const final = finalCounts[table] || 0;
      const change = final - initial;
      if (change !== 0) {
        changes[table] = change;
      }
    });

    const totalTime = Date.now() - startTime;

    logger.info(`\n🎉 === PHASE ${phase} COMPLETED SUCCESSFULLY ===`);

    logger.stats("Migration Summary", {
      "Phase": phase,
      "Dump File": dumpFilePath,
      "Total Duration": `${Math.round(totalTime / 1000)}s`,
      ...Object.entries(changes).reduce((acc, [table, change]) => {
        acc[`${table} (${change > 0 ? "+" : ""}${change})`] =
          finalCounts[table];
        return acc;
      }, {} as Record<string, unknown>),
    });

    logger.success(`✅ Phase ${phase} migration completed successfully`);

    logger.info("\nNext Steps:");
    if (phase < 7) {
      logger.info(`1. Review the migrated data in your database`);
      logger.info(
        `2. Run the next phase: bun scripts/migration/run-phase-with-dump.ts ${
          phase + 1
        } ${dumpFilePath}`,
      );
    } else {
      logger.info(
        "1. All phases complete! Review your fully migrated database",
      );
      logger.info("2. Test your application with the migrated data");
    }
  } catch (error) {
    const totalTime = Date.now() - startTime;
    logger.error(
      `❌ Phase ${phase} migration failed after ${
        Math.round(totalTime / 1000)
      }s`,
      error,
    );

    logger.info("\nTroubleshooting:");
    logger.info("1. Check the error logs above");
    logger.info("2. Verify database connection and credentials");
    logger.info("3. Check that the SQL dump file exists and is readable");
    logger.info("4. Ensure the database schema is up to date");
    logger.info("5. Run individual migration scripts for debugging");

    process.exit(1);
  }
}

function showUsage() {
  console.log(`
🚀 Reliable Phase Runner with Production Dump Integration

Usage:
  bun scripts/migration/run-phase-with-dump.ts <phase_number> <dump_file_path> [--head <limit>]

Arguments:
  phase_number     Phase to run (1-7)
  dump_file_path   Path to MySQL dump file

Options:
  --head <limit>   Limit processing to first N users (useful for testing)

Examples:
  bun scripts/migration/run-phase-with-dump.ts 1 ./nabostylisten_prod.sql
  bun scripts/migration/run-phase-with-dump.ts 1 ./nabostylisten_prod.sql --head 500
  bun scripts/migration/run-phase-with-dump.ts 2 ./custom_dump.sql --head 100

Available Phases:
  Phase 1: Users (profiles, stylist_details, user_preferences)
  Phase 2: Addresses (with PostGIS location data)
  Phase 3: Services (categories and services)
  Phase 4: Bookings (booking records)
  Phase 5: Payments (payment tracking)
  Phase 6: Communication (chats and messages)
  Phase 7: Reviews (rating system)

Environment Variables Required:
  NEXT_PUBLIC_SUPABASE_URL      - Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY     - Supabase service role key

Prerequisites:
  1. SQL dump file must exist at specified path
  2. Supabase database must be running with latest schema
  3. Database should be reset for clean migration: bun supabase:db:reset:no-seed
`);
}

// Handle help flag
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  showUsage();
  process.exit(0);
}

// Run the migration
main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
