#!/usr/bin/env bun
/**
 * Phase 2 Step 2: Create address records in Supabase
 *
 * This script:
 * 1. Reads processed address data from Step 1
 * 2. Creates address records in Supabase database
 * 3. Handles PostGIS geography data insertion
 * 4. Tracks creation success/failures
 * 5. Updates migration statistics
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { MigrationLogger } from "../shared/logger";
import { MigrationDatabase } from "../shared/database";
import type { AddressMigrationStats, MigrationProgress } from "../shared/types";
import type { Database } from "@/types/database.types";

// Processed address from Step 1 (enhanced with geocoding)
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
  source_table: "buyer" | "stylist";
  original_id: string;
  geocoding_confidence: "high" | "medium" | "low" | "none";
}

async function main() {
  const logger = new MigrationLogger();
  const database = new MigrationDatabase(logger);

  logger.info("=== Phase 2 Step 2: Create Address Records ===");

  try {
    // Test database connection
    const isConnected = await database.testConnection();
    if (!isConnected) {
      throw new Error("Database connection failed");
    }

    // Read processed address data from Step 1
    const tempDir = join(process.cwd(), "scripts", "migration", "temp");
    const processedAddressesPath = join(tempDir, "processed-addresses.json");
    const addressStatsPath = join(tempDir, "address-migration-stats.json");

    logger.info("Loading processed address data...");
    const processedData = JSON.parse(
      readFileSync(processedAddressesPath, "utf-8"),
    );
    const stats: AddressMigrationStats = JSON.parse(
      readFileSync(addressStatsPath, "utf-8"),
    );

    const addresses: ProcessedAddress[] = processedData.addresses;
    logger.info(`Loaded ${addresses.length} addresses to create`);

    if (addresses.length === 0) {
      logger.warn("No addresses to create");

      // Still create empty results file for next step
      const tempDir = join(process.cwd(), "scripts", "migration", "temp");
      const addressResultsPath = join(tempDir, "addresses-created.json");
      const addressStatsPath = join(tempDir, "address-migration-stats.json");

      writeFileSync(
        addressResultsPath,
        JSON.stringify(
          {
            metadata: {
              created_at: new Date().toISOString(),
              total_processed: 0,
              successful: 0,
              errors: 0,
              addresses_with_coordinates: 0,
              geocoding_confidence_distribution: {
                high: 0,
                medium: 0,
                low: 0,
                none: 0,
              },
            },
            results: [],
          },
          null,
          2,
        ),
      );

      // Load and update stats
      const stats: AddressMigrationStats = JSON.parse(
        readFileSync(addressStatsPath, "utf-8"),
      );
      stats.created_addresses = 0;
      writeFileSync(addressStatsPath, JSON.stringify(stats, null, 2));

      logger.success("Phase 2 Step 2 completed (no addresses to process)");
      return;
    }

    // Track results
    const results: Array<{
      original_id: string;
      supabase_id: string;
      user_id: string;
      city: string | null;
      has_coordinates: boolean;
      geocoding_confidence: string;
      success: boolean;
      error?: string;
    }> = [];

    let created = 0;
    let errors = 0;
    let coordinated = 0; // Addresses with coordinates
    const geocodingStats = {
      high: 0,
      medium: 0,
      low: 0,
      none: 0,
    };

    // Process addresses in batches
    const batchSize = 50;
    const totalBatches = Math.ceil(addresses.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * batchSize;
      const endIdx = Math.min(startIdx + batchSize, addresses.length);
      const batch = addresses.slice(startIdx, endIdx);

      // Update progress
      const progress: MigrationProgress = {
        phase: "Phase 2 Step 2",
        step: "Creating Address Records",
        current: endIdx,
        total: addresses.length,
        percentage: (endIdx / addresses.length) * 100,
        start_time: new Date().toISOString(),
        errors: [],
      };
      logger.progress(progress);

      // Prepare batch of address records with PostGIS geography
      const addressBatch:
        Database["public"]["Tables"]["addresses"]["Insert"][] = batch.map(
          (address) => ({
            id: address.id,
            user_id: address.user_id,
            street_address: address.street_address ?? "",
            // Use MySQL data as-is, providing minimal defaults only when absolutely necessary
            city: address.city || "", // Empty string if null (MySQL NOT NULL behavior)
            postal_code: address.postal_code || "", // Empty string if null (MySQL NOT NULL behavior)
            country: address.country ?? "",
            country_code: address.country_code,
            nickname: address.nickname,
            entry_instructions: address.entry_instructions,
            location: null,
            is_primary: address.is_primary,
            created_at: address.created_at,
            updated_at: address.updated_at,
          }),
        );

      try {
        // Use batch create for efficiency
        const batchResult = await database.batchCreate(
          "addresses",
          addressBatch as Record<string, unknown>[],
        );

        if (batchResult.success) {
          logger.debug(
            `Successfully created batch ${
              batchIndex + 1
            }/${totalBatches}: ${batchResult.inserted} addresses`,
          );

          // Mark all in this batch as successful
          batch.forEach((address) => {
            results.push({
              original_id: address.original_id,
              supabase_id: address.id,
              user_id: address.user_id,
              city: address.city,
              has_coordinates: !!address.location,
              geocoding_confidence: address.geocoding_confidence,
              success: true,
            });

            // Track statistics
            if (address.location) coordinated++;
            geocodingStats[address.geocoding_confidence]++;
          });

          created += batchResult.inserted;
        } else {
          logger.warn(
            `Batch ${batchIndex + 1} had errors: ${
              batchResult.errors.join("; ")
            }}`,
          );

          // Try individual inserts for this batch to identify specific failures
          for (const address of batch) {
            const addressRecord:
              Database["public"]["Tables"]["addresses"]["Insert"] = {
                id: address.id,
                user_id: address.user_id,
                street_address: address.street_address ?? "",
                // Use MySQL data as-is, providing minimal defaults only when absolutely necessary
                city: address.city || "", // Empty string if null (MySQL NOT NULL behavior)
                postal_code: address.postal_code || "", // Empty string if null (MySQL NOT NULL behavior)
                country: address.country ?? "",
                country_code: address.country_code,
                nickname: address.nickname,
                entry_instructions: address.entry_instructions,
                location: null,
                is_primary: address.is_primary,
                created_at: address.created_at,
                updated_at: address.updated_at,
              };

            const individualResult = await database.createAddress(
              addressRecord,
            );

            if (individualResult.success) {
              results.push({
                original_id: address.original_id,
                supabase_id: address.id,
                user_id: address.user_id,
                city: address.city,
                has_coordinates: !!address.location,
                geocoding_confidence: address.geocoding_confidence,
                success: true,
              });

              // Track statistics
              if (address.location) coordinated++;
              geocodingStats[address.geocoding_confidence]++;
              created++;
            } else {
              logger.error(
                `Failed to create address for user ${address.user_id}`,
                individualResult.error,
              );
              results.push({
                original_id: address.original_id,
                supabase_id: address.id,
                user_id: address.user_id,
                city: address.city,
                has_coordinates: !!address.location,
                geocoding_confidence: address.geocoding_confidence,
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
        batch.forEach((address) => {
          results.push({
            original_id: address.original_id,
            supabase_id: address.id,
            user_id: address.user_id,
            city: address.city,
            has_coordinates: !!address.location,
            geocoding_confidence: address.geocoding_confidence,
            success: false,
            error: errorMessage,
          });
        });

        errors += batch.length;
      }

      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Update migration stats
    stats.created_addresses = created;
    stats.errors += errors;

    // Save results
    const addressResultsPath = join(tempDir, "addresses-created.json");
    writeFileSync(
      addressResultsPath,
      JSON.stringify(
        {
          metadata: {
            created_at: new Date().toISOString(),
            total_processed: addresses.length,
            successful: created,
            errors,
            addresses_with_coordinates: coordinated,
            geocoding_confidence_distribution: geocodingStats,
          },
          results,
        },
        null,
        2,
      ),
    );

    // Save updated stats
    writeFileSync(addressStatsPath, JSON.stringify(stats, null, 2));

    // Get final database counts for verification
    const counts = await database.getCurrentCounts();

    // Generate geocoding summary
    const geocodingPercentage = coordinated > 0
      ? Math.round((coordinated / created) * 100)
      : 0;
    const geocodingSummary =
      `${geocodingStats.high} high, ${geocodingStats.medium} medium, ${geocodingStats.low} low, ${geocodingStats.none} none`;

    // Log summary
    logger.stats("Address Creation Summary", {
      "Total Addresses to Create": addresses.length,
      "Successfully Created": created,
      "Addresses with Coordinates": `${coordinated} (${geocodingPercentage}%)`,
      "Geocoding Confidence": geocodingSummary,
      "Mapbox Enhanced": geocodingStats.high + geocodingStats.medium > 0
        ? "✅ Yes"
        : "⚠️  No coordinates found",
      "Errors": errors,
      "Success Rate": addresses.length > 0
        ? `${Math.round((created / addresses.length) * 100)}%`
        : "0%",
      "Database Address Count": counts.addresses,
      "Status": errors === 0
        ? "✅ SUCCESS"
        : (created > 0 ? "⚠️  PARTIAL SUCCESS" : "❌ FAILED"),
    });

    logger.success("Phase 2 Step 2 completed", {
      address_results_file: addressResultsPath,
      updated_stats_file: addressStatsPath,
      addresses_in_database: counts.addresses,
    });
  } catch (error) {
    logger.error("Phase 2 Step 2 failed", error);
    process.exit(1);
  }
}

// Run the script if called directly
main().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
