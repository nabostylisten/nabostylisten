#!/usr/bin/env bun
/**
 * Phase 7 - Step 2: Create Reviews in Supabase
 *
 * This script takes the extracted reviews and creates them in Supabase.
 * Each review is uniquely associated with a booking.
 */

import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { MigrationLogger } from "../shared/logger";
import type { Database } from "../../../types/database.types";
import type { ProcessedReview } from "./01-extract-reviews";

interface CreationResult {
  created_reviews: Array<{
    id: string;
    booking_id: string;
    customer_id: string;
    stylist_id: string;
    rating: number;
    has_comment: boolean;
  }>;
  failed_reviews: Array<{
    review: ProcessedReview;
    error: string;
  }>;
  metadata: {
    total_to_create: number;
    successful_creations: number;
    failed_creations: number;
    duration_ms: number;
  };
}

async function createReviews(): Promise<CreationResult> {
  const tempDir = path.join(__dirname, "..", "temp");
  const startTime = Date.now();
  const logger = new MigrationLogger();

  logger.info("Starting review creation in Supabase...");

  try {
    // Load extracted reviews
    const extractedData = JSON.parse(
      await fs.readFile(path.join(tempDir, "reviews-extracted.json"), "utf-8"),
    );
    const reviews: ProcessedReview[] = extractedData.processedReviews;

    logger.info(`Loaded ${reviews.length} reviews to create`);

    // Connect to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
    logger.info("Connected to Supabase");

    const created_reviews: CreationResult["created_reviews"] = [];
    const failed_reviews: CreationResult["failed_reviews"] = [];

    // Process in batches to avoid overwhelming the database
    const BATCH_SIZE = 50;

    for (let i = 0; i < reviews.length; i += BATCH_SIZE) {
      const batch = reviews.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(reviews.length / BATCH_SIZE);

      logger.info(
        `Processing batch ${batchNumber}/${totalBatches} (${batch.length} reviews)`,
      );

      // Process each review in the batch
      const batchPromises = batch.map(async (review) => {
        try {
          // Check if review already exists for this booking
          const { data: existingReview, error: checkError } = await supabase
            .from("reviews")
            .select("id")
            .eq("booking_id", review.booking_id)
            .single();

          if (checkError && checkError.code !== "PGRST116") {
            logger.error(
              `Failed to check if review already exists: ${checkError}`,
            );
          }

          if (existingReview) {
            logger.warn(
              `Review already exists for booking ${review.booking_id}, skipping`,
            );
            return;
          }

          // Create the review
          const { data: createdReview, error: createError } = await supabase
            .from("reviews")
            .insert({
              id: review.id,
              booking_id: review.booking_id,
              customer_id: review.customer_id,
              stylist_id: review.stylist_id,
              rating: review.rating,
              comment: review.comment,
              created_at: review.created_at,
            })
            .select("id, booking_id, customer_id, stylist_id, rating, comment")
            .single();

          if (createError) {
            throw createError;
          }

          if (createdReview) {
            created_reviews.push({
              id: createdReview.id,
              booking_id: createdReview.booking_id,
              customer_id: createdReview.customer_id,
              stylist_id: createdReview.stylist_id,
              rating: createdReview.rating,
              has_comment: createdReview.comment !== null,
            });

            logger.debug(`✓ Created review: ${review.id} for booking: ${review.booking_id} (${review.rating} stars)`);
          }
        } catch (error) {
          logger.error(`Failed to create review ${review.id}:`, error);
          failed_reviews.push({
            review,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

      // Wait for batch to complete
      await Promise.all(batchPromises);

      logger.info(
        `Batch ${batchNumber} completed: ${created_reviews.length} created, ${failed_reviews.length} failed`,
      );
    }

    const duration = Date.now() - startTime;

    const result: CreationResult = {
      created_reviews,
      failed_reviews,
      metadata: {
        total_to_create: reviews.length,
        successful_creations: created_reviews.length,
        failed_creations: failed_reviews.length,
        duration_ms: duration,
      },
    };

    // Save results
    await fs.writeFile(
      path.join(tempDir, "reviews-created.json"),
      JSON.stringify(
        {
          created_at: new Date().toISOString(),
          created_reviews,
          metadata: result.metadata,
        },
        null,
        2,
      ),
    );

    if (failed_reviews.length > 0) {
      await fs.writeFile(
        path.join(tempDir, "failed-reviews-creation.json"),
        JSON.stringify(
          {
            failed_at: new Date().toISOString(),
            failed_reviews,
          },
          null,
          2,
        ),
      );
    }

    // Save migration statistics
    await fs.writeFile(
      path.join(tempDir, "review-creation-stats.json"),
      JSON.stringify(
        {
          completed_at: new Date().toISOString(),
          duration_seconds: Math.round(duration / 1000),
          total_reviews: reviews.length,
          successfully_created: created_reviews.length,
          failed_creations: failed_reviews.length,
          success_rate: `${
            ((created_reviews.length / reviews.length) * 100).toFixed(2)
          }%`,
          rating_distribution: created_reviews.reduce((acc, review) => {
            acc[review.rating] = (acc[review.rating] || 0) + 1;
            return acc;
          }, {} as Record<number, number>),
          reviews_with_comments: created_reviews.filter(r => r.has_comment).length,
          reviews_without_comments: created_reviews.filter(r => !r.has_comment).length,
        },
        null,
        2,
      ),
    );

    // Log summary
    logger.info("Review creation completed:");
    logger.info(`  - Total to create: ${result.metadata.total_to_create}`);
    logger.info(`  - Successfully created: ${result.metadata.successful_creations}`);
    logger.info(`  - Failed creations: ${result.metadata.failed_creations}`);
    logger.info(`  - Duration: ${(duration / 1000).toFixed(2)}s`);
    logger.info(
      `  - Success rate: ${
        ((created_reviews.length / reviews.length) * 100).toFixed(2)
      }%`,
    );

    // Log rating distribution
    const ratingStats = created_reviews.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    logger.info("Created reviews rating distribution:");
    for (let i = 1; i <= 5; i++) {
      const count = ratingStats[i] || 0;
      logger.info(`  - ${i} star${i !== 1 ? 's' : ''}: ${count}`);
    }

    logger.info(`  - Reviews with comments: ${created_reviews.filter(r => r.has_comment).length}`);
    logger.info(`  - Reviews without comments: ${created_reviews.filter(r => !r.has_comment).length}`);

    return result;
  } catch (error) {
    logger.error("Review creation failed:", error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  createReviews()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { createReviews, type CreationResult };