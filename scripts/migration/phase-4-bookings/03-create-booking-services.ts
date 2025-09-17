import { MigrationLogger } from "../shared/logger";
import { MigrationDatabase } from "../shared/database";
import { MySQLParser } from "../phase-1-users/utils/mysql-parser";
import type { Database } from "../../../types/database.types";
import fs from "fs/promises";
import path from "path";

interface MySQLBookingServiceJunction {
  booking_id: string;
  service_id: string;
}

interface BookingServiceRelationship {
  booking_id: string;
  service_id: string;
  source: "json" | "junction_table";
}

interface BookingServiceCreationResult {
  booking_id: string;
  service_id: string;
  success: boolean;
  error?: string;
}

interface BookingServiceStats {
  total_relationships: number;
  from_json_fields: number;
  from_junction_table: number;
  successful_creations: number;
  failed_creations: number;
  duplicate_relationships: number;
}

export async function createBookingServices(): Promise<void> {
  const logger = new MigrationLogger("create-booking-services");
  const db = new MigrationDatabase(logger);

  try {
    logger.info(
      "Starting Phase 4 Step 3: Create Booking-Service Relationships",
    );

    // Load extracted booking data to get JSON service relationships
    const tempDir = path.join(process.cwd(), "scripts/migration/temp");
    const extractedData = JSON.parse(
      await fs.readFile(path.join(tempDir, "bookings-extracted.json"), "utf-8"),
    );

    const bookings = extractedData.bookings;
    const relationships: BookingServiceRelationship[] = [];
    let fromJsonFields = 0;

    // Extract relationships from JSON service fields in bookings
    for (const booking of bookings) {
      if (booking.service_ids && booking.service_ids.length > 0) {
        for (const serviceId of booking.service_ids) {
          relationships.push({
            booking_id: booking.id,
            service_id: serviceId,
            source: "json",
          });
          fromJsonFields++;
        }
        logger.debug(
          `Found ${booking.service_ids.length} services from JSON for booking ${booking.id}`,
        );
      }
    }

    logger.info(
      `Found ${fromJsonFields} booking-service relationships from JSON fields`,
    );

    // Parse MySQL dump for booking_services_service junction table
    const dumpPath = process.env.MYSQL_DUMP_PATH ||
      path.join(process.cwd(), "nabostylisten_prod.sql");
    const parser = new MySQLParser(dumpPath, logger);

    logger.info(
      "Parsing booking_services_service junction table from MySQL dump...",
    );
    const junctionRecords = await parser.parseTable<
      MySQLBookingServiceJunction
    >("booking_services_service");
    logger.info(
      `Found ${junctionRecords.length} records in booking_services_service table`,
    );

    if (junctionRecords.length > 0) {
      logger.debug("Sample junction record:", junctionRecords[0]);
    }

    // Load service ID mapping from Phase 3 to map MySQL service IDs
    const serviceIdMapping: Record<string, string> = {};
    try {
      const serviceData = JSON.parse(
        await fs.readFile(path.join(tempDir, "services-created.json"), "utf-8"),
      );

      // Create mapping from MySQL service IDs to Supabase service IDs
      for (const result of serviceData.results || []) {
        if (result.success && result.original_id && result.supabase_id) {
          serviceIdMapping[result.original_id] = result.supabase_id;
        }
      }
      logger.info(
        `Loaded ${
          Object.keys(serviceIdMapping).length
        } service ID mappings from Phase 3`,
      );
    } catch (error) {
      logger.warn(
        "Could not load service ID mapping from Phase 3, skipping junction table processing",
      );
    }

    // Extract relationships from junction table
    let fromJunctionTable = 0;
    const junctionRelationships: BookingServiceRelationship[] = [];

    for (const junctionRecord of junctionRecords) {
      // Map MySQL service ID to Supabase service ID
      const mappedServiceId = serviceIdMapping[junctionRecord.service_id];

      if (!mappedServiceId) {
        logger.warn(
          `Skipping junction record: MySQL service ID ${junctionRecord.service_id} not found in Phase 3 mapping`,
        );
        continue;
      }

      junctionRelationships.push({
        booking_id: junctionRecord.booking_id,
        service_id: mappedServiceId,
        source: "junction_table",
      });
      fromJunctionTable++;
    }

    logger.info(
      `Found ${fromJunctionTable} booking-service relationships from junction table`,
    );

    // Combine relationships and remove duplicates
    const allRelationships = [...relationships, ...junctionRelationships];
    const uniqueRelationships = new Map<string, BookingServiceRelationship>();
    let duplicates = 0;

    for (const relationship of allRelationships) {
      const key = `${relationship.booking_id}-${relationship.service_id}`;
      if (uniqueRelationships.has(key)) {
        duplicates++;
        logger.debug(
          `Duplicate relationship found: ${key} (${relationship.source})`,
        );
      } else {
        uniqueRelationships.set(key, relationship);
      }
    }

    const finalRelationships = Array.from(uniqueRelationships.values());
    logger.info(
      `Final ${finalRelationships.length} unique booking-service relationships to create (${duplicates} duplicates removed)`,
    );

    // Create booking-service relationships in Supabase
    const results: BookingServiceCreationResult[] = [];

    for (const relationship of finalRelationships) {
      try {
        const bookingServiceData:
          Database["public"]["Tables"]["booking_services"]["Insert"] = {
            booking_id: relationship.booking_id,
            service_id: relationship.service_id,
          };

        const createResult = await db.createBookingService(bookingServiceData);

        if (createResult.success) {
          results.push({
            booking_id: relationship.booking_id,
            service_id: relationship.service_id,
            success: true,
          });
          logger.debug(
            `✅ Created booking-service relationship: ${relationship.booking_id} -> ${relationship.service_id} (${relationship.source})`,
          );
        } else {
          results.push({
            booking_id: relationship.booking_id,
            service_id: relationship.service_id,
            success: false,
            error: createResult.error,
          });
          logger.error(
            `❌ Failed to create booking-service relationship ${relationship.booking_id} -> ${relationship.service_id}: ${createResult.error}`,
          );
        }
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : "Unknown error";
        results.push({
          booking_id: relationship.booking_id,
          service_id: relationship.service_id,
          success: false,
          error: errorMessage,
        });
        logger.error(
          `❌ Exception creating booking-service relationship ${relationship.booking_id} -> ${relationship.service_id}:`,
          error,
        );
      }
    }

    // Calculate statistics
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    const stats: BookingServiceStats = {
      total_relationships: finalRelationships.length,
      from_json_fields: fromJsonFields,
      from_junction_table: fromJunctionTable,
      successful_creations: successful,
      failed_creations: failed,
      duplicate_relationships: duplicates,
    };

    // Save creation results
    await fs.writeFile(
      path.join(tempDir, "booking-services-created.json"),
      JSON.stringify(
        {
          metadata: {
            created_at: new Date().toISOString(),
            total_processed: results.length,
            successful_creations: successful,
            failed_creations: failed,
          },
          results,
        },
        null,
        2,
      ),
    );

    // Save creation statistics
    await fs.writeFile(
      path.join(tempDir, "booking-services-stats.json"),
      JSON.stringify(stats, null, 2),
    );

    logger.success(`✅ Booking-service relationships created successfully!`);
    logger.info(`📊 Creation Summary:`);
    logger.info(`   - Total relationships: ${stats.total_relationships}`);
    logger.info(`   - From JSON fields: ${stats.from_json_fields}`);
    logger.info(`   - From junction table: ${stats.from_junction_table}`);
    logger.info(`   - Successfully created: ${stats.successful_creations}`);
    logger.info(`   - Failed: ${stats.failed_creations}`);
    logger.info(`   - Duplicates removed: ${stats.duplicate_relationships}`);

    if (failed > 0) {
      logger.warn(
        `⚠️  ${failed} booking-service relationships failed to create. Check logs for details.`,
      );
    }
  } catch (error) {
    logger.error("❌ Booking-service relationship creation failed:", error);
    throw error;
  }
}

if (require.main === module) {
  createBookingServices()
    .then(() => {
      console.log("🎉 Phase 4 Step 3 completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Phase 4 Step 3 failed:", error);
      process.exit(1);
    });
}
