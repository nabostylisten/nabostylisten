#!/usr/bin/env bun
/**
 * Phase 7 - Step 1: Extract Reviews from MySQL
 *
 * This script extracts review data from MySQL dump and transforms it for PostgreSQL.
 * Maps MySQL 'rating' table to PostgreSQL 'reviews' table with direct field mapping.
 */

import fs from "fs/promises";
import path from "path";
import { MySQLParser } from "../phase-1-users/utils/mysql-parser";
import { MigrationLogger } from "../shared/logger";
import type { Database } from "../../../types/database.types";

interface MySQLRating {
  id: string;
  buyer_id: string;
  stylist_id: string;
  booking_id: string;
  rating: string; // "1" to "5"
  review: string | null;
  created_at: string;
}

interface ProcessedReview extends
  Omit<
    Database["public"]["Tables"]["reviews"]["Insert"],
    "created_at"
  > {
  created_at: string;
}

interface ExtractionResult {
  processedReviews: ProcessedReview[];
  skippedReviews: Array<{ review: MySQLRating; reason: string }>;
  metadata: {
    total_mysql_ratings: number;
    processed_reviews: number;
    skipped_reviews: number;
    rating_distribution: Record<number, number>;
    reviews_with_comments: number;
    reviews_without_comments: number;
  };
}

async function extractReviews(): Promise<ExtractionResult> {
  const tempDir = path.join(__dirname, "..", "temp");
  await fs.mkdir(tempDir, { recursive: true });
  const logger = new MigrationLogger();

  logger.info("Starting review extraction from MySQL...");

  try {
    // Load MySQL dump
    const dumpPath = process.env.MYSQL_DUMP_PATH || path.join(process.cwd(), "nabostylisten_prod.sql");
    const parser = new MySQLParser(dumpPath, logger);

    logger.info("Parsing ratings from MySQL dump...");

    // Parse ratings table
    const ratings = await parser.parseTable<MySQLRating>("rating");

    logger.info(`Found ${ratings.length} ratings in MySQL`);

    // Get list of migrated booking IDs from PostgreSQL bookings
    const bookingMappingPath = path.join(tempDir, "bookings-created.json");
    let migratedBookingIds = new Set<string>();

    try {
      const bookingMapping = JSON.parse(
        await fs.readFile(bookingMappingPath, "utf-8"),
      );
      // The file contains booking IDs that were successfully migrated
      if (bookingMapping.results) {
        migratedBookingIds = new Set(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          bookingMapping.results.map((r: any) => r.id),
        );
      }
      logger.info(`Found ${migratedBookingIds.size} migrated booking IDs`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      logger.warn(
        "Could not load booking creation results, will process all reviews",
      );
    }

    // Load user ID mapping from Phase 1
    const userMappingPath = path.join(tempDir, "user-id-mapping.json");
    let userIdMapping: Record<string, string> = {};

    try {
      const userMapping = JSON.parse(
        await fs.readFile(userMappingPath, "utf-8"),
      );
      if (userMapping.mapping) {
        userIdMapping = userMapping.mapping;
      }
      logger.info(`Found ${Object.keys(userIdMapping).length} user ID mappings`);
    } catch (error) {
      logger.error("Could not load user ID mapping from Phase 1:", error);
      throw new Error("User ID mapping is required for review migration");
    }

    const processedReviews: ProcessedReview[] = [];
    const skippedReviews: Array<{ review: MySQLRating; reason: string }> = [];
    const ratingDistribution: Record<number, number> = {};
    let reviewsWithComments = 0;
    let reviewsWithoutComments = 0;

    for (const rating of ratings) {
      try {
        // Check if the booking was successfully migrated to PostgreSQL
        if (migratedBookingIds.size > 0 && !migratedBookingIds.has(rating.booking_id)) {
          skippedReviews.push({
            review: rating,
            reason: "Booking was not migrated to PostgreSQL",
          });
          continue;
        }

        // Validate rating value
        const ratingValue = parseInt(rating.rating);
        if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
          skippedReviews.push({
            review: rating,
            reason: `Invalid rating value: ${rating.rating}`,
          });
          continue;
        }

        // Track rating distribution
        ratingDistribution[ratingValue] = (ratingDistribution[ratingValue] || 0) + 1;

        // Track comment presence
        if (rating.review && rating.review.trim().length > 0) {
          reviewsWithComments++;
        } else {
          reviewsWithoutComments++;
        }

        // Map MySQL user IDs to Supabase user IDs
        const mappedCustomerId = userIdMapping[rating.buyer_id];
        const mappedStylistId = userIdMapping[rating.stylist_id];

        if (!mappedCustomerId) {
          skippedReviews.push({
            review: rating,
            reason: `Customer ID ${rating.buyer_id} not found in user mapping`,
          });
          continue;
        }

        if (!mappedStylistId) {
          skippedReviews.push({
            review: rating,
            reason: `Stylist ID ${rating.stylist_id} not found in user mapping`,
          });
          continue;
        }

        const processedReview: ProcessedReview = {
          id: rating.id.toLowerCase(),
          booking_id: rating.booking_id,
          customer_id: mappedCustomerId,
          stylist_id: mappedStylistId,
          rating: ratingValue,
          comment: rating.review && rating.review.trim().length > 0 ? rating.review : null,
          created_at: rating.created_at,
        };

        processedReviews.push(processedReview);

        logger.debug(
          `✓ Processed review: ${rating.id} -> booking: ${rating.booking_id} (${ratingValue} stars)`,
        );
      } catch (error) {
        logger.error(`Failed to process review ${rating.id}:`, error);
        skippedReviews.push({
          review: rating,
          reason: `Processing error: ${error}`,
        });
      }
    }

    const result: ExtractionResult = {
      processedReviews,
      skippedReviews,
      metadata: {
        total_mysql_ratings: ratings.length,
        processed_reviews: processedReviews.length,
        skipped_reviews: skippedReviews.length,
        rating_distribution: ratingDistribution,
        reviews_with_comments: reviewsWithComments,
        reviews_without_comments: reviewsWithoutComments,
      },
    };

    // Save results to temp files
    await fs.writeFile(
      path.join(tempDir, "reviews-extracted.json"),
      JSON.stringify(
        {
          extracted_at: new Date().toISOString(),
          processedReviews,
          metadata: result.metadata,
        },
        null,
        2,
      ),
    );

    if (skippedReviews.length > 0) {
      await fs.writeFile(
        path.join(tempDir, "skipped-reviews.json"),
        JSON.stringify(
          {
            skipped_at: new Date().toISOString(),
            skipped_reviews: skippedReviews,
          },
          null,
          2,
        ),
      );
    }

    // Log summary
    logger.info("Review extraction completed:");
    logger.info(`  - Total MySQL ratings: ${result.metadata.total_mysql_ratings}`);
    logger.info(`  - Successfully processed: ${result.metadata.processed_reviews}`);
    logger.info(`  - Skipped reviews: ${result.metadata.skipped_reviews}`);
    logger.info(`  - Reviews with comments: ${result.metadata.reviews_with_comments}`);
    logger.info(`  - Reviews without comments: ${result.metadata.reviews_without_comments}`);

    logger.info("Rating distribution:");
    for (let i = 1; i <= 5; i++) {
      const count = ratingDistribution[i] || 0;
      logger.info(`  - ${i} star${i !== 1 ? 's' : ''}: ${count}`);
    }

    if (skippedReviews.length > 0) {
      logger.info("Skipped review reasons:");
      const reasonCounts = skippedReviews.reduce((acc, sr) => {
        acc[sr.reason] = (acc[sr.reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      for (const [reason, count] of Object.entries(reasonCounts)) {
        logger.info(`  - ${reason}: ${count}`);
      }
    }

    return result;
  } catch (error) {
    logger.error("Review extraction failed:", error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  extractReviews()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}

export { type ExtractionResult, extractReviews, type ProcessedReview };