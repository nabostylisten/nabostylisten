#!/usr/bin/env bun
/**
 * Phase 7 - Step 3: Validate Review Migration
 *
 * This script validates that reviews have been correctly migrated
 * and that all relationships are intact.
 */

import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { MySQLParser } from "../phase-1-users/utils/mysql-parser";
import { MigrationLogger } from "../shared/logger";
import type { Database } from "../../../types/database.types";

interface ValidationResult {
  is_valid: boolean;
  total_mysql_ratings: number;
  total_pg_reviews: number;
  missing_reviews: string[];
  orphaned_reviews: string[];
  booking_review_mismatches: number;
  rating_discrepancies: Array<{
    review_id: string;
    mysql_rating: number;
    pg_rating: number;
  }>;
  customer_mismatches: Array<{
    review_id: string;
    mysql_customer: string;
    pg_customer: string;
  }>;
  stylist_mismatches: Array<{
    review_id: string;
    mysql_stylist: string;
    pg_stylist: string;
  }>;
  validation_errors: string[];
  rating_distribution: Record<number, number>;
  average_rating: number;
  reviews_with_comments: number;
  reviews_without_comments: number;
}

async function validateReviews(): Promise<ValidationResult> {
  const tempDir = path.join(__dirname, "..", "temp");
  const logger = new MigrationLogger();

  logger.info("Starting review migration validation...");

  try {
    // Connect to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Load MySQL dump
    const dumpPath = path.join(process.cwd(), "nabostylisten_dump.sql");
    const parser = new MySQLParser(dumpPath, logger);

    logger.info("Connected to both data sources");

    const validation_errors: string[] = [];
    const rating_discrepancies: ValidationResult["rating_discrepancies"] = [];
    const customer_mismatches: ValidationResult["customer_mismatches"] = [];
    const stylist_mismatches: ValidationResult["stylist_mismatches"] = [];

    // 1. Get MySQL data
    const mysqlRatings = await parser.parseTable<{
      id: string;
      buyer_id: string;
      stylist_id: string;
      booking_id: string;
      rating: string;
      review: string | null;
    }>("rating");

    const totalMysqlRatings = mysqlRatings.length;
    logger.info(`MySQL: ${totalMysqlRatings} ratings`);

    // 2. Count PostgreSQL reviews
    const { count: totalPgReviews, error: countError } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true });

    if (countError) {
      validation_errors.push(
        `Failed to count PostgreSQL reviews: ${countError.message}`,
      );
    }

    logger.info(`PostgreSQL: ${totalPgReviews || 0} reviews`);

    // 3. Fetch all PostgreSQL reviews for detailed validation
    const { data: pgReviews, error: fetchError } = await supabase
      .from("reviews")
      .select("id, booking_id, customer_id, stylist_id, rating, comment");

    if (fetchError) {
      validation_errors.push(
        `Failed to fetch PostgreSQL reviews: ${fetchError.message}`,
      );
    }

    // 4. Check for missing reviews
    const pgReviewIds = new Set(pgReviews?.map((r) => r.id) || []);
    const missing_reviews = mysqlRatings
      .map((r) => r.id.toLowerCase())
      .filter((id) => !pgReviewIds.has(id));

    if (missing_reviews.length > 0) {
      validation_errors.push(
        `${missing_reviews.length} reviews missing in PostgreSQL`,
      );
      logger.warn(`Found ${missing_reviews.length} missing reviews`);
    }

    // 5. Check for orphaned reviews (no corresponding booking)
    const { data: orphanedReviews, error: orphanError } = await supabase
      .from("reviews")
      .select("id, booking_id")
      .is("booking_id", null);

    if (orphanError) {
      validation_errors.push(
        `Failed to check for orphaned reviews: ${orphanError.message}`,
      );
    }

    const orphaned_reviews = orphanedReviews?.map((r) => r.id) || [];
    if (orphaned_reviews.length > 0) {
      validation_errors.push(
        `${orphaned_reviews.length} reviews have no associated booking`,
      );
    }

    // 6. Validate booking-review relationships
    const { data: bookingsWithReviews, error: bookingError } = await supabase
      .from("bookings")
      .select("id")
      .in("id", pgReviews?.map(r => r.booking_id) || []);

    if (bookingError) {
      validation_errors.push(
        `Failed to validate booking-review relationships: ${bookingError.message}`,
      );
    }

    const existingBookingIds = new Set(bookingsWithReviews?.map(b => b.id) || []);
    const reviewsWithMissingBookings = pgReviews?.filter(r => 
      r.booking_id && !existingBookingIds.has(r.booking_id)
    ) || [];

    const booking_review_mismatches = reviewsWithMissingBookings.length;
    if (booking_review_mismatches > 0) {
      validation_errors.push(
        `${booking_review_mismatches} reviews reference non-existent bookings`,
      );
    }

    // 7. Validate review data (ratings, customers, stylists)
    const sampleSize = Math.min(100, pgReviews?.length || 0);
    if (pgReviews && sampleSize > 0) {
      logger.info(`Validating review data for ${sampleSize} sample reviews...`);

      for (let i = 0; i < sampleSize; i++) {
        const pgReview = pgReviews[i];
        const mysqlRating = mysqlRatings.find((r) =>
          r.id.toLowerCase() === pgReview.id
        );

        if (mysqlRating) {
          // Check rating values
          const mysqlRatingValue = parseInt(mysqlRating.rating);
          if (mysqlRatingValue !== pgReview.rating) {
            rating_discrepancies.push({
              review_id: pgReview.id,
              mysql_rating: mysqlRatingValue,
              pg_rating: pgReview.rating,
            });
          }

          // Check customer mapping
          if (mysqlRating.buyer_id !== pgReview.customer_id) {
            customer_mismatches.push({
              review_id: pgReview.id,
              mysql_customer: mysqlRating.buyer_id,
              pg_customer: pgReview.customer_id,
            });
          }

          // Check stylist mapping
          if (mysqlRating.stylist_id !== pgReview.stylist_id) {
            stylist_mismatches.push({
              review_id: pgReview.id,
              mysql_stylist: mysqlRating.stylist_id,
              pg_stylist: pgReview.stylist_id,
            });
          }
        }
      }

      if (rating_discrepancies.length > 0) {
        validation_errors.push(
          `${rating_discrepancies.length} reviews have rating discrepancies`,
        );
      }

      if (customer_mismatches.length > 0) {
        validation_errors.push(
          `${customer_mismatches.length} reviews have customer mapping errors`,
        );
      }

      if (stylist_mismatches.length > 0) {
        validation_errors.push(
          `${stylist_mismatches.length} reviews have stylist mapping errors`,
        );
      }
    }

    // 8. Calculate rating statistics
    let rating_distribution: Record<number, number> = {};
    let average_rating = 0;
    let reviews_with_comments = 0;
    let reviews_without_comments = 0;

    if (pgReviews && pgReviews.length > 0) {
      // Rating distribution
      rating_distribution = pgReviews.reduce((acc, review) => {
        acc[review.rating] = (acc[review.rating] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      // Average rating
      const totalRating = pgReviews.reduce((sum, review) => sum + review.rating, 0);
      average_rating = totalRating / pgReviews.length;

      // Comment statistics
      reviews_with_comments = pgReviews.filter(r => r.comment && r.comment.trim().length > 0).length;
      reviews_without_comments = pgReviews.length - reviews_with_comments;

      logger.info("Review statistics:");
      logger.info(`  - Average rating: ${average_rating.toFixed(2)}`);
      logger.info(`  - Reviews with comments: ${reviews_with_comments}`);
      logger.info(`  - Reviews without comments: ${reviews_without_comments}`);
      
      logger.info("Rating distribution:");
      for (let i = 1; i <= 5; i++) {
        const count = rating_distribution[i] || 0;
        const percentage = pgReviews.length > 0 ? ((count / pgReviews.length) * 100).toFixed(1) : "0.0";
        logger.info(`  - ${i} star${i !== 1 ? 's' : ''}: ${count} (${percentage}%)`);
      }
    }

    const is_valid = validation_errors.length === 0 &&
      missing_reviews.length === 0 &&
      orphaned_reviews.length === 0 &&
      rating_discrepancies.length === 0 &&
      customer_mismatches.length === 0 &&
      stylist_mismatches.length === 0;

    const result: ValidationResult = {
      is_valid,
      total_mysql_ratings: totalMysqlRatings,
      total_pg_reviews: totalPgReviews || 0,
      missing_reviews,
      orphaned_reviews,
      booking_review_mismatches,
      rating_discrepancies,
      customer_mismatches,
      stylist_mismatches,
      validation_errors,
      rating_distribution,
      average_rating,
      reviews_with_comments,
      reviews_without_comments,
    };

    // Save validation results
    await fs.writeFile(
      path.join(tempDir, "review-validation-results.json"),
      JSON.stringify(
        {
          validated_at: new Date().toISOString(),
          ...result,
        },
        null,
        2,
      ),
    );

    // Log summary
    if (is_valid) {
      logger.info("✅ Review migration validation PASSED");
    } else {
      logger.error("❌ Review migration validation FAILED");
      if (validation_errors.length > 0) {
        logger.error("Validation errors:");
        validation_errors.forEach((error) => logger.error(`  - ${error}`));
      }
    }

    logger.info("Validation summary:");
    logger.info(`  - Total MySQL ratings: ${totalMysqlRatings}`);
    logger.info(`  - Total PostgreSQL reviews: ${totalPgReviews || 0}`);
    logger.info(`  - Missing reviews: ${missing_reviews.length}`);
    logger.info(`  - Orphaned reviews: ${orphaned_reviews.length}`);
    logger.info(`  - Booking-review mismatches: ${booking_review_mismatches}`);
    logger.info(`  - Rating discrepancies: ${rating_discrepancies.length}`);
    logger.info(`  - Customer mismatches: ${customer_mismatches.length}`);
    logger.info(`  - Stylist mismatches: ${stylist_mismatches.length}`);

    return result;
  } catch (error) {
    logger.error("Review validation failed:", error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  validateReviews()
    .then((result) => {
      if (result.is_valid) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { validateReviews, type ValidationResult };