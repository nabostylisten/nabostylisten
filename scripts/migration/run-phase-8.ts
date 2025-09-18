#!/usr/bin/env bun
/**
 * Phase 8 Migration Runner: Media Migration
 *
 * Orchestrates the complete migration of media files from S3 backup to Supabase Storage.
 * This includes profile images, service images, and media record creation with compression.
 *
 * Steps:
 * 1. Extract media inventory from S3 backup
 * 2. Validate user and service mappings
 * 3. Migrate profile images to Supabase Storage
 * 4. Migrate service images to Supabase Storage
 * 5. Create media records in database
 * 6. Validate migration integrity
 *
 * Usage: bun scripts/migration/run-phase-8.ts
 */

import fs from "fs/promises";
import path from "path";
import { MigrationLogger } from "./shared/logger";

// Import all phase 8 steps
import { extractMediaInventory, type ExtractionResult } from "./phase-8-media/01-extract-media-inventory";
import { validateMappings, type ValidationResult } from "./phase-8-media/02-validate-mappings";
import { migrateProfileImages, type ProfileMigrationResult } from "./phase-8-media/03-migrate-profile-images";
import { migrateServiceImages, type ServiceMigrationResult } from "./phase-8-media/04-migrate-service-images";
import { createMediaRecords, type MediaRecordsResult } from "./phase-8-media/05-create-media-records";
import { validateMediaMigration, type FinalValidationResult } from "./phase-8-media/06-validate-media-migration";

interface Phase8Stats {
  phase: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  success: boolean;
  steps: {
    extraction: {
      success: boolean;
      duration_ms: number;
      total_files_scanned: number;
      migratable_files: number;
      total_size_mb: number;
      migratable_size_mb: number;
      profile_pics: number;
      service_images: number;
      chat_images: number;
      error?: string;
    };
    validation: {
      success: boolean;
      duration_ms: number;
      total_validated: number;
      valid_mappings: number;
      invalid_mappings: number;
      readiness_score: number;
      user_mappings_loaded: number;
      service_mappings_loaded: number;
      error?: string;
    };
    profile_migration: {
      success: boolean;
      duration_ms: number;
      total_profile_images: number;
      successful_uploads: number;
      failed_uploads: number;
      average_compression_ratio: number;
      total_size_saved_mb: number;
      error?: string;
    };
    service_migration: {
      success: boolean;
      duration_ms: number;
      total_service_images: number;
      total_services: number;
      successful_uploads: number;
      failed_uploads: number;
      average_compression_ratio: number;
      total_size_saved_mb: number;
      services_with_preview: number;
      error?: string;
    };
    media_records: {
      success: boolean;
      duration_ms: number;
      total_records: number;
      successful_records: number;
      failed_records: number;
      profile_records: number;
      service_records: number;
      preview_images_set: number;
      error?: string;
    };
    final_validation: {
      success: boolean;
      duration_ms: number;
      is_valid: boolean;
      overall_score: number;
      migration_status: string;
      total_files_migrated: number;
      total_records_created: number;
      storage_accessibility_rate: number;
      compression_ratio: number;
      success_rate: number;
      error?: string;
    };
  };
  error?: string;
}

async function runPhase8(): Promise<Phase8Stats> {
  const logger = new MigrationLogger();
  const startTime = Date.now();
  const tempDir = path.join(__dirname, "phase-8-media", "temp");

  await fs.mkdir(tempDir, { recursive: true });

  logger.info("🚀 Starting Phase 8: Media Migration");
  logger.info("=" .repeat(60));

  const stats: Phase8Stats = {
    phase: "Phase 8: Media Migration",
    started_at: new Date().toISOString(),
    success: false,
    steps: {
      extraction: {
        success: false,
        duration_ms: 0,
        total_files_scanned: 0,
        migratable_files: 0,
        total_size_mb: 0,
        migratable_size_mb: 0,
        profile_pics: 0,
        service_images: 0,
        chat_images: 0,
      },
      validation: {
        success: false,
        duration_ms: 0,
        total_validated: 0,
        valid_mappings: 0,
        invalid_mappings: 0,
        readiness_score: 0,
        user_mappings_loaded: 0,
        service_mappings_loaded: 0,
      },
      profile_migration: {
        success: false,
        duration_ms: 0,
        total_profile_images: 0,
        successful_uploads: 0,
        failed_uploads: 0,
        average_compression_ratio: 0,
        total_size_saved_mb: 0,
      },
      service_migration: {
        success: false,
        duration_ms: 0,
        total_service_images: 0,
        total_services: 0,
        successful_uploads: 0,
        failed_uploads: 0,
        average_compression_ratio: 0,
        total_size_saved_mb: 0,
        services_with_preview: 0,
      },
      media_records: {
        success: false,
        duration_ms: 0,
        total_records: 0,
        successful_records: 0,
        failed_records: 0,
        profile_records: 0,
        service_records: 0,
        preview_images_set: 0,
      },
      final_validation: {
        success: false,
        duration_ms: 0,
        is_valid: false,
        overall_score: 0,
        migration_status: "failed",
        total_files_migrated: 0,
        total_records_created: 0,
        storage_accessibility_rate: 0,
        compression_ratio: 0,
        success_rate: 0,
      },
    },
  };

  try {
    // Step 1: Extract media inventory
    logger.info("📤 Step 1: Extracting media inventory from S3 backup...");
    logger.info("-".repeat(50));

    try {
      const stepStart = Date.now();
      const extractionResult: ExtractionResult = await extractMediaInventory();
      const stepDuration = Date.now() - stepStart;

      stats.steps.extraction = {
        success: true,
        duration_ms: stepDuration,
        total_files_scanned: extractionResult.metadata.total_files,
        migratable_files: extractionResult.metadata.migratable_files,
        total_size_mb: Math.round(extractionResult.metadata.total_size_bytes / 1024 / 1024),
        migratable_size_mb: Math.round(extractionResult.metadata.migratable_size_bytes / 1024 / 1024),
        profile_pics: extractionResult.metadata.summary.profile_pics.total,
        service_images: extractionResult.metadata.summary.service_images.total,
        chat_images: extractionResult.metadata.summary.chat_images.total,
      };

      logger.info("✅ Media inventory extraction completed successfully");
      logger.info(`   📊 Total files scanned: ${extractionResult.metadata.total_files} (${stats.steps.extraction.total_size_mb} MB)`);
      logger.info(`   ✨ Migratable files: ${extractionResult.metadata.migratable_files} (${stats.steps.extraction.migratable_size_mb} MB)`);
      logger.info(`   👤 Profile pictures: ${extractionResult.metadata.summary.profile_pics.total}`);
      logger.info(`   🖼️  Service images: ${extractionResult.metadata.summary.service_images.total}`);
      logger.info(`   💬 Chat images: ${extractionResult.metadata.summary.chat_images.total}`);
      logger.info(`   ⏱️  Duration: ${(stepDuration / 1000).toFixed(2)}s`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("❌ Media inventory extraction failed:", error);
      stats.steps.extraction.error = errorMessage;
      throw error;
    }

    // Step 2: Validate mappings
    logger.info("\n🔍 Step 2: Validating user and service mappings...");
    logger.info("-".repeat(50));

    try {
      const stepStart = Date.now();
      const validationResult: ValidationResult = await validateMappings();
      const stepDuration = Date.now() - stepStart;

      stats.steps.validation = {
        success: true,
        duration_ms: stepDuration,
        total_validated: validationResult.metadata.total_validated,
        valid_mappings: validationResult.metadata.valid_mappings,
        invalid_mappings: validationResult.metadata.invalid_mappings,
        readiness_score: (validationResult.metadata.valid_mappings / validationResult.metadata.total_validated) * 100,
        user_mappings_loaded: validationResult.metadata.user_mappings_loaded,
        service_mappings_loaded: validationResult.metadata.service_mappings_loaded,
      };

      logger.info("✅ Mapping validation completed successfully");
      logger.info(`   📊 Total validated: ${validationResult.metadata.total_validated}`);
      logger.info(`   ✅ Valid mappings: ${validationResult.metadata.valid_mappings}`);
      logger.info(`   ❌ Invalid mappings: ${validationResult.metadata.invalid_mappings}`);
      logger.info(`   📈 Readiness score: ${stats.steps.validation.readiness_score.toFixed(1)}%`);
      logger.info(`   👥 User mappings loaded: ${validationResult.metadata.user_mappings_loaded}`);
      logger.info(`   🎯 Service mappings loaded: ${validationResult.metadata.service_mappings_loaded}`);
      logger.info(`   ⏱️  Duration: ${(stepDuration / 1000).toFixed(2)}s`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("❌ Mapping validation failed:", error);
      stats.steps.validation.error = errorMessage;
      throw error;
    }

    // Step 3: Migrate profile images
    logger.info("\n👤 Step 3: Migrating profile images to Supabase Storage...");
    logger.info("-".repeat(50));

    try {
      const stepStart = Date.now();
      const profileResult: ProfileMigrationResult = await migrateProfileImages();
      const stepDuration = Date.now() - stepStart;

      stats.steps.profile_migration = {
        success: true,
        duration_ms: stepDuration,
        total_profile_images: profileResult.metadata.total_profile_images,
        successful_uploads: profileResult.metadata.successful_uploads,
        failed_uploads: profileResult.metadata.failed_uploads,
        average_compression_ratio: profileResult.metadata.average_compression_ratio,
        total_size_saved_mb: Math.round(profileResult.metadata.total_size_saved_bytes / 1024 / 1024),
      };

      logger.info("✅ Profile image migration completed successfully");
      logger.info(`   📊 Profile images processed: ${profileResult.metadata.total_profile_images}`);
      logger.info(`   ✅ Successful uploads: ${profileResult.metadata.successful_uploads}`);
      logger.info(`   ❌ Failed uploads: ${profileResult.metadata.failed_uploads}`);
      logger.info(`   🗜️  Compression ratio: ${profileResult.metadata.average_compression_ratio.toFixed(1)}%`);
      logger.info(`   💾 Size saved: ${stats.steps.profile_migration.total_size_saved_mb} MB`);
      logger.info(`   ⏱️  Duration: ${(stepDuration / 1000).toFixed(2)}s`);

      if (profileResult.metadata.failed_uploads > 0) {
        logger.warn(`   ⚠️  Failed uploads: ${profileResult.metadata.failed_uploads}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("❌ Profile image migration failed:", error);
      stats.steps.profile_migration.error = errorMessage;
      throw error;
    }

    // Step 4: Migrate service images
    logger.info("\n🖼️  Step 4: Migrating service images to Supabase Storage...");
    logger.info("-".repeat(50));

    try {
      const stepStart = Date.now();
      const serviceResult: ServiceMigrationResult = await migrateServiceImages();
      const stepDuration = Date.now() - stepStart;

      stats.steps.service_migration = {
        success: true,
        duration_ms: stepDuration,
        total_service_images: serviceResult.metadata.total_service_images,
        total_services: serviceResult.metadata.total_services,
        successful_uploads: serviceResult.metadata.successful_uploads,
        failed_uploads: serviceResult.metadata.failed_uploads,
        average_compression_ratio: serviceResult.metadata.average_compression_ratio,
        total_size_saved_mb: Math.round(serviceResult.metadata.total_size_saved_bytes / 1024 / 1024),
        services_with_preview: serviceResult.metadata.services_with_preview,
      };

      logger.info("✅ Service image migration completed successfully");
      logger.info(`   📊 Service images processed: ${serviceResult.metadata.total_service_images} across ${serviceResult.metadata.total_services} services`);
      logger.info(`   ✅ Successful uploads: ${serviceResult.metadata.successful_uploads}`);
      logger.info(`   ❌ Failed uploads: ${serviceResult.metadata.failed_uploads}`);
      logger.info(`   🗜️  Compression ratio: ${serviceResult.metadata.average_compression_ratio.toFixed(1)}%`);
      logger.info(`   💾 Size saved: ${stats.steps.service_migration.total_size_saved_mb} MB`);
      logger.info(`   🎯 Services with preview: ${serviceResult.metadata.services_with_preview}`);
      logger.info(`   ⏱️  Duration: ${(stepDuration / 1000).toFixed(2)}s`);

      if (serviceResult.metadata.failed_uploads > 0) {
        logger.warn(`   ⚠️  Failed uploads: ${serviceResult.metadata.failed_uploads}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("❌ Service image migration failed:", error);
      stats.steps.service_migration.error = errorMessage;
      throw error;
    }

    // Step 5: Create media records
    logger.info("\n📝 Step 5: Creating media records in database...");
    logger.info("-".repeat(50));

    try {
      const stepStart = Date.now();
      const recordsResult: MediaRecordsResult = await createMediaRecords();
      const stepDuration = Date.now() - stepStart;

      stats.steps.media_records = {
        success: true,
        duration_ms: stepDuration,
        total_records: recordsResult.metadata.total_records,
        successful_records: recordsResult.metadata.successful_records,
        failed_records: recordsResult.metadata.failed_records,
        profile_records: recordsResult.metadata.profile_records,
        service_records: recordsResult.metadata.service_records,
        preview_images_set: recordsResult.metadata.preview_images_set,
      };

      logger.info("✅ Media record creation completed successfully");
      logger.info(`   📊 Total records processed: ${recordsResult.metadata.total_records}`);
      logger.info(`   ✅ Successful records: ${recordsResult.metadata.successful_records}`);
      logger.info(`   ❌ Failed records: ${recordsResult.metadata.failed_records}`);
      logger.info(`   👤 Profile records: ${recordsResult.metadata.profile_records}`);
      logger.info(`   🖼️  Service records: ${recordsResult.metadata.service_records}`);
      logger.info(`   🎯 Preview images set: ${recordsResult.metadata.preview_images_set}`);
      logger.info(`   ⏱️  Duration: ${(stepDuration / 1000).toFixed(2)}s`);

      if (recordsResult.metadata.failed_records > 0) {
        logger.warn(`   ⚠️  Failed records: ${recordsResult.metadata.failed_records}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("❌ Media record creation failed:", error);
      stats.steps.media_records.error = errorMessage;
      throw error;
    }

    // Step 6: Final validation
    logger.info("\n🔍 Step 6: Validating migration integrity...");
    logger.info("-".repeat(50));

    try {
      const stepStart = Date.now();
      const finalResult: FinalValidationResult = await validateMediaMigration();
      const stepDuration = Date.now() - stepStart;

      stats.steps.final_validation = {
        success: true,
        duration_ms: stepDuration,
        is_valid: finalResult.is_valid,
        overall_score: finalResult.overall_score,
        migration_status: finalResult.migration_status,
        total_files_migrated: finalResult.summary.total_files_migrated,
        total_records_created: finalResult.summary.total_records_created,
        storage_accessibility_rate: finalResult.summary.storage_accessibility_rate,
        compression_ratio: finalResult.summary.compression_ratio,
        success_rate: finalResult.summary.success_rate,
      };

      if (finalResult.is_valid) {
        logger.info("✅ Migration validation PASSED");
      } else {
        logger.warn("⚠️  Migration validation found issues");
      }

      logger.info(`   📊 Overall score: ${finalResult.overall_score}/100`);
      logger.info(`   📈 Migration status: ${finalResult.migration_status.toUpperCase()}`);
      logger.info(`   📁 Files migrated: ${finalResult.summary.total_files_migrated}`);
      logger.info(`   📝 Records created: ${finalResult.summary.total_records_created}`);
      logger.info(`   🌐 Storage accessibility: ${finalResult.summary.storage_accessibility_rate.toFixed(1)}%`);
      logger.info(`   🗜️  Compression ratio: ${finalResult.summary.compression_ratio.toFixed(1)}%`);
      logger.info(`   ✅ Success rate: ${finalResult.summary.success_rate.toFixed(1)}%`);
      logger.info(`   ⏱️  Duration: ${(stepDuration / 1000).toFixed(2)}s`);

      // Show validation checks
      if (finalResult.validation_checks && finalResult.validation_checks.length > 0) {
        logger.info("   🔍 Validation checks:");
        finalResult.validation_checks.forEach(check => {
          const icon = check.status === 'passed' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
          logger.info(`      ${icon} ${check.name}: ${check.message}`);
        });
      }

      // Show recommendations
      if (finalResult.recommendations && finalResult.recommendations.length > 0) {
        logger.info("   💡 Recommendations:");
        finalResult.recommendations.forEach(rec => {
          logger.info(`      • ${rec}`);
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("❌ Migration validation failed:", error);
      stats.steps.final_validation.error = errorMessage;
      throw error;
    }

    // Mark as successful
    stats.success = true;

    const duration = Date.now() - startTime;
    stats.completed_at = new Date().toISOString();
    stats.duration_seconds = Math.round(duration / 1000);

    // Final summary
    logger.info("\n" + "=".repeat(60));
    logger.info("🎉 Phase 8 Migration Completed Successfully!");
    logger.info("=".repeat(60));

    logger.info(`📊 MIGRATION SUMMARY:`);
    logger.info(`   • Total duration: ${stats.duration_seconds}s (${(stats.duration_seconds / 60).toFixed(1)} minutes)`);
    logger.info(`   • Files scanned: ${stats.steps.extraction.total_files_scanned} (${stats.steps.extraction.total_size_mb} MB)`);
    logger.info(`   • Files migrated: ${stats.steps.final_validation.total_files_migrated}`);
    logger.info(`   • Database records: ${stats.steps.final_validation.total_records_created}`);
    logger.info(`   • Overall score: ${stats.steps.final_validation.overall_score}/100`);
    logger.info(`   • Migration status: ${stats.steps.final_validation.migration_status.toUpperCase()}`);

    logger.info(`🗜️  COMPRESSION PERFORMANCE:`);
    const totalSizeSaved = stats.steps.profile_migration.total_size_saved_mb + stats.steps.service_migration.total_size_saved_mb;
    logger.info(`   • Profile images: ${stats.steps.profile_migration.average_compression_ratio.toFixed(1)}% compression`);
    logger.info(`   • Service images: ${stats.steps.service_migration.average_compression_ratio.toFixed(1)}% compression`);
    logger.info(`   • Total space saved: ${totalSizeSaved} MB`);
    logger.info(`   • Overall compression: ${stats.steps.final_validation.compression_ratio.toFixed(1)}%`);

    logger.info(`✅ SUCCESS RATES:`);
    logger.info(`   • Profile uploads: ${stats.steps.profile_migration.successful_uploads}/${stats.steps.profile_migration.total_profile_images} (${stats.steps.profile_migration.total_profile_images > 0 ? ((stats.steps.profile_migration.successful_uploads / stats.steps.profile_migration.total_profile_images) * 100).toFixed(1) : '0'}%)`);
    logger.info(`   • Service uploads: ${stats.steps.service_migration.successful_uploads}/${stats.steps.service_migration.total_service_images} (${stats.steps.service_migration.total_service_images > 0 ? ((stats.steps.service_migration.successful_uploads / stats.steps.service_migration.total_service_images) * 100).toFixed(1) : '0'}%)`);
    logger.info(`   • Database records: ${stats.steps.media_records.successful_records}/${stats.steps.media_records.total_records} (${stats.steps.media_records.total_records > 0 ? ((stats.steps.media_records.successful_records / stats.steps.media_records.total_records) * 100).toFixed(1) : '0'}%)`);
    logger.info(`   • Overall success: ${stats.steps.final_validation.success_rate.toFixed(1)}%`);

    if (stats.steps.service_migration.services_with_preview > 0) {
      logger.info(`🎯 BUSINESS LOGIC:`);
      logger.info(`   • Services with preview images: ${stats.steps.service_migration.services_with_preview}/${stats.steps.service_migration.total_services}`);
    }

  } catch (error) {
    stats.success = false;
    stats.error = error instanceof Error ? error.message : String(error);

    const duration = Date.now() - startTime;
    stats.completed_at = new Date().toISOString();
    stats.duration_seconds = Math.round(duration / 1000);

    logger.error("\n" + "=".repeat(60));
    logger.error("❌ Phase 8 Migration Failed!");
    logger.error("=".repeat(60));
    logger.error(`💥 Error: ${stats.error}`);
    logger.error(`⏱️  Failed after: ${stats.duration_seconds}s`);
  }

  // Save comprehensive stats
  try {
    await fs.writeFile(
      path.join(tempDir, "phase-8-migration-stats.json"),
      JSON.stringify(stats, null, 2)
    );
    logger.info(`📄 Detailed statistics saved to: ${path.join(tempDir, "phase-8-migration-stats.json")}`);
  } catch (error) {
    logger.warn("Failed to save migration statistics:", error);
  }

  return stats;
}

// Execute if run directly
if (require.main === module) {
  runPhase8()
    .then((stats) => {
      process.exit(stats.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Phase 8 migration failed:", error);
      process.exit(1);
    });
}

export { runPhase8, type Phase8Stats };