#!/usr/bin/env bun
/**
 * Phase 7 Migration Runner: Reviews & Ratings
 * 
 * Orchestrates the complete migration of reviews and ratings from MySQL to PostgreSQL.
 * This includes customer reviews with ratings and comments.
 * 
 * Steps:
 * 1. Extract reviews from MySQL dump
 * 2. Create reviews in Supabase
 * 3. Validate migration integrity
 * 
 * Usage: bun scripts/migration/run-phase-7.ts
 */

import fs from "fs/promises";
import path from "path";
import { MigrationLogger } from "./shared/logger";
import { extractReviews, type ExtractionResult } from "./phase-7-reviews/01-extract-reviews";
import { createReviews, type CreationResult } from "./phase-7-reviews/02-create-reviews";
import { validateReviews, type ValidationResult } from "./phase-7-reviews/03-validate-reviews";

interface Phase7Stats {
  phase: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  success: boolean;
  steps: {
    extraction: {
      success: boolean;
      total_mysql_ratings: number;
      processed_reviews: number;
      skipped_reviews: number;
      rating_distribution: Record<number, number>;
      reviews_with_comments: number;
      reviews_without_comments: number;
      error?: string;
    };
    creation: {
      success: boolean;
      duration_ms: number;
      total_to_create: number;
      successful_creations: number;
      failed_creations: number;
      error?: string;
    };
    validation: {
      success: boolean;
      is_valid: boolean;
      total_mysql_ratings: number;
      total_pg_reviews: number;
      missing_reviews: number;
      orphaned_reviews: number;
      booking_review_mismatches: number;
      rating_discrepancies: number;
      customer_mismatches: number;
      stylist_mismatches: number;
      validation_errors: number;
      average_rating: number;
      reviews_with_comments: number;
      error?: string;
    };
  };
  error?: string;
}

async function runPhase7(): Promise<Phase7Stats> {
  const logger = new MigrationLogger();
  const startTime = Date.now();
  const tempDir = path.join(__dirname, "temp");
  
  await fs.mkdir(tempDir, { recursive: true });

  logger.info("🚀 Starting Phase 7: Reviews & Ratings Migration");
  logger.info("=" .repeat(60));

  const stats: Phase7Stats = {
    phase: "Phase 7: Reviews & Ratings",
    started_at: new Date().toISOString(),
    success: false,
    steps: {
      extraction: {
        success: false,
        total_mysql_ratings: 0,
        processed_reviews: 0,
        skipped_reviews: 0,
        rating_distribution: {},
        reviews_with_comments: 0,
        reviews_without_comments: 0,
      },
      creation: {
        success: false,
        duration_ms: 0,
        total_to_create: 0,
        successful_creations: 0,
        failed_creations: 0,
      },
      validation: {
        success: false,
        is_valid: false,
        total_mysql_ratings: 0,
        total_pg_reviews: 0,
        missing_reviews: 0,
        orphaned_reviews: 0,
        booking_review_mismatches: 0,
        rating_discrepancies: 0,
        customer_mismatches: 0,
        stylist_mismatches: 0,
        validation_errors: 0,
        average_rating: 0,
        reviews_with_comments: 0,
      },
    },
  };

  try {
    // Step 1: Extract reviews
    logger.info("📤 Step 1: Extracting reviews from MySQL...");
    logger.info("-".repeat(50));
    
    try {
      const extractionResult: ExtractionResult = await extractReviews();
      
      stats.steps.extraction = {
        success: true,
        total_mysql_ratings: extractionResult.metadata.total_mysql_ratings,
        processed_reviews: extractionResult.metadata.processed_reviews,
        skipped_reviews: extractionResult.metadata.skipped_reviews,
        rating_distribution: extractionResult.metadata.rating_distribution,
        reviews_with_comments: extractionResult.metadata.reviews_with_comments,
        reviews_without_comments: extractionResult.metadata.reviews_without_comments,
      };

      logger.info("✅ Review extraction completed successfully");
      logger.info(`   📊 MySQL ratings: ${extractionResult.metadata.total_mysql_ratings}`);
      logger.info(`   ✨ Processed reviews: ${extractionResult.metadata.processed_reviews}`);
      logger.info(`   💬 With comments: ${extractionResult.metadata.reviews_with_comments}`);
      logger.info(`   📝 Without comments: ${extractionResult.metadata.reviews_without_comments}`);

      if (extractionResult.metadata.skipped_reviews > 0) {
        logger.warn(`   ⚠️  Skipped reviews: ${extractionResult.metadata.skipped_reviews}`);
      }

      // Log rating distribution
      logger.info("   ⭐ Rating distribution:");
      for (let i = 1; i <= 5; i++) {
        const count = extractionResult.metadata.rating_distribution[i] || 0;
        logger.info(`      ${i} star${i !== 1 ? 's' : ''}: ${count}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("❌ Review extraction failed:", error);
      stats.steps.extraction.error = errorMessage;
      throw error;
    }

    // Step 2: Create reviews in Supabase
    logger.info("\n📥 Step 2: Creating reviews in Supabase...");
    logger.info("-".repeat(50));

    try {
      const creationResult: CreationResult = await createReviews();
      
      stats.steps.creation = {
        success: true,
        duration_ms: creationResult.metadata.duration_ms,
        total_to_create: creationResult.metadata.total_to_create,
        successful_creations: creationResult.metadata.successful_creations,
        failed_creations: creationResult.metadata.failed_creations,
      };

      logger.info("✅ Review creation completed successfully");
      logger.info(`   📊 Reviews created: ${creationResult.metadata.successful_creations}/${creationResult.metadata.total_to_create}`);
      logger.info(`   ⏱️  Duration: ${(creationResult.metadata.duration_ms / 1000).toFixed(2)}s`);

      if (creationResult.metadata.failed_creations > 0) {
        logger.warn(`   ⚠️  Failed creations: ${creationResult.metadata.failed_creations}`);
      }

      // Log created reviews statistics
      const createdRatingStats = creationResult.created_reviews.reduce((acc, review) => {
        acc[review.rating] = (acc[review.rating] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      logger.info("   ⭐ Created reviews rating distribution:");
      for (let i = 1; i <= 5; i++) {
        const count = createdRatingStats[i] || 0;
        logger.info(`      ${i} star${i !== 1 ? 's' : ''}: ${count}`);
      }

      const withComments = creationResult.created_reviews.filter(r => r.has_comment).length;
      const withoutComments = creationResult.created_reviews.length - withComments;
      logger.info(`   💬 With comments: ${withComments}`);
      logger.info(`   📝 Without comments: ${withoutComments}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("❌ Review creation failed:", error);
      stats.steps.creation.error = errorMessage;
      throw error;
    }

    // Step 3: Validate migration
    logger.info("\n🔍 Step 3: Validating migration integrity...");
    logger.info("-".repeat(50));

    try {
      const validationResult: ValidationResult = await validateReviews();
      
      stats.steps.validation = {
        success: true,
        is_valid: validationResult.is_valid,
        total_mysql_ratings: validationResult.total_mysql_ratings,
        total_pg_reviews: validationResult.total_pg_reviews,
        missing_reviews: validationResult.missing_reviews.length,
        orphaned_reviews: validationResult.orphaned_reviews.length,
        booking_review_mismatches: validationResult.booking_review_mismatches,
        rating_discrepancies: validationResult.rating_discrepancies.length,
        customer_mismatches: validationResult.customer_mismatches.length,
        stylist_mismatches: validationResult.stylist_mismatches.length,
        validation_errors: validationResult.validation_errors.length,
        average_rating: validationResult.average_rating,
        reviews_with_comments: validationResult.reviews_with_comments,
      };

      if (validationResult.is_valid) {
        logger.info("✅ Migration validation PASSED");
      } else {
        logger.warn("⚠️  Migration validation found issues");
        if (validationResult.validation_errors.length > 0) {
          logger.warn("   Validation errors:");
          validationResult.validation_errors.forEach(error => 
            logger.warn(`   - ${error}`)
          );
        }
      }

      logger.info(`   📊 MySQL ratings → PostgreSQL reviews: ${validationResult.total_mysql_ratings} → ${validationResult.total_pg_reviews}`);
      logger.info(`   ⭐ Average rating: ${validationResult.average_rating.toFixed(2)}`);
      logger.info(`   💬 Reviews with comments: ${validationResult.reviews_with_comments}`);
      
      if (validationResult.missing_reviews.length > 0) {
        logger.warn(`   ⚠️  Missing reviews: ${validationResult.missing_reviews.length}`);
      }

      if (validationResult.rating_discrepancies.length > 0 || 
          validationResult.customer_mismatches.length > 0 || 
          validationResult.stylist_mismatches.length > 0) {
        logger.warn(`   ⚠️  Rating discrepancies: ${validationResult.rating_discrepancies.length}`);
        logger.warn(`   ⚠️  Customer mismatches: ${validationResult.customer_mismatches.length}`);
        logger.warn(`   ⚠️  Stylist mismatches: ${validationResult.stylist_mismatches.length}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("❌ Migration validation failed:", error);
      stats.steps.validation.error = errorMessage;
      throw error;
    }

    // Mark as successful
    stats.success = true;
    
    const duration = Date.now() - startTime;
    stats.completed_at = new Date().toISOString();
    stats.duration_seconds = Math.round(duration / 1000);

    // Final summary
    logger.info("\n" + "=".repeat(60));
    logger.info("🎉 Phase 7 Migration Completed Successfully!");
    logger.info("=".repeat(60));
    
    // Calculate success rate
    const successRate = stats.steps.creation.total_to_create > 0 
      ? ((stats.steps.creation.successful_creations / stats.steps.creation.total_to_create) * 100).toFixed(2)
      : "0";

    logger.info(`📊 MIGRATION SUMMARY:`);
    logger.info(`   • Total duration: ${stats.duration_seconds}s`);
    logger.info(`   • MySQL ratings processed: ${stats.steps.extraction.processed_reviews} (from ${stats.steps.extraction.total_mysql_ratings} total)`);
    logger.info(`   • PostgreSQL reviews created: ${stats.steps.creation.successful_creations}/${stats.steps.creation.total_to_create} (${successRate}%)`);
    logger.info(`   • Average rating: ${stats.steps.validation.average_rating.toFixed(2)} stars`);
    logger.info(`   • Reviews with comments: ${stats.steps.validation.reviews_with_comments}`);
    logger.info(`   • Migration validation: ${stats.steps.validation.is_valid ? '✅ PASSED' : '⚠️ ISSUES FOUND'}`);

    if (stats.steps.extraction.skipped_reviews > 0) {
      logger.info(`📋 SKIPPED DATA:`);
      logger.info(`   • Skipped reviews: ${stats.steps.extraction.skipped_reviews}`);
    }

    if (stats.steps.creation.failed_creations > 0) {
      logger.warn(`⚠️  CREATION FAILURES:`);
      logger.warn(`   • Failed review creations: ${stats.steps.creation.failed_creations}`);
    }

    // Final rating distribution
    logger.info(`⭐ FINAL RATING DISTRIBUTION:`);
    for (let i = 1; i <= 5; i++) {
      const count = stats.steps.extraction.rating_distribution[i] || 0;
      const percentage = stats.steps.extraction.processed_reviews > 0 
        ? ((count / stats.steps.extraction.processed_reviews) * 100).toFixed(1) 
        : "0.0";
      logger.info(`   • ${i} star${i !== 1 ? 's' : ''}: ${count} (${percentage}%)`);
    }

  } catch (error) {
    stats.success = false;
    stats.error = error instanceof Error ? error.message : String(error);
    
    const duration = Date.now() - startTime;
    stats.completed_at = new Date().toISOString();
    stats.duration_seconds = Math.round(duration / 1000);

    logger.error("\n" + "=".repeat(60));
    logger.error("❌ Phase 7 Migration Failed!");
    logger.error("=".repeat(60));
    logger.error(`💥 Error: ${stats.error}`);
    logger.error(`⏱️  Failed after: ${stats.duration_seconds}s`);
  }

  // Save comprehensive stats
  try {
    await fs.writeFile(
      path.join(tempDir, "phase-7-migration-stats.json"),
      JSON.stringify(stats, null, 2)
    );
    logger.info(`📄 Detailed statistics saved to: ${path.join(tempDir, "phase-7-migration-stats.json")}`);
  } catch (error) {
    logger.warn("Failed to save migration statistics:", error);
  }

  return stats;
}

// Execute if run directly
if (require.main === module) {
  runPhase7()
    .then((stats) => {
      process.exit(stats.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Phase 7 migration failed:", error);
      process.exit(1);
    });
}

export { runPhase7, type Phase7Stats };