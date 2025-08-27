#!/usr/bin/env bun
/**
 * Phase 6 Migration Runner: Communication System
 * 
 * Orchestrates the complete migration of the communication system from MySQL to PostgreSQL.
 * This includes chats and messages with proper relationship mapping and validation.
 * 
 * Steps:
 * 1. Extract chats and messages from MySQL dump
 * 2. Create chats and messages in Supabase
 * 3. Validate migration integrity
 * 
 * Usage: bun scripts/migration/run-phase-6.ts
 */

import fs from "fs/promises";
import path from "path";
import { MigrationLogger } from "./shared/logger";
import { extractChats, type ExtractionResult } from "./phase-6-communication/01-extract-chats";
import { createChats, type CreationResult } from "./phase-6-communication/02-create-chats";
import { validateChats, type ValidationResult } from "./phase-6-communication/03-validate-chats";

interface Phase6Stats {
  phase: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  success: boolean;
  steps: {
    extraction: {
      success: boolean;
      duration_ms: number;
      total_mysql_chats: number;
      total_mysql_messages: number;
      processed_chats: number;
      processed_messages: number;
      skipped_chats: number;
      skipped_messages: number;
      active_chats: number;
      image_messages: number;
      error?: string;
    };
    creation: {
      success: boolean;
      duration_ms: number;
      total_chats_to_create: number;
      total_messages_to_create: number;
      successful_chat_creations: number;
      successful_message_creations: number;
      successful_media_creations: number;
      failed_chat_creations: number;
      failed_message_creations: number;
      error?: string;
    };
    validation: {
      success: boolean;
      is_valid: boolean;
      total_mysql_chats: number;
      total_mysql_messages: number;
      total_pg_chats: number;
      total_pg_messages: number;
      missing_chats: number;
      missing_messages: number;
      orphaned_chats: number;
      orphaned_messages: number;
      chat_booking_mismatches: number;
      message_sender_mismatches: number;
      validation_errors: number;
      error?: string;
    };
  };
  error?: string;
}

async function runPhase6(): Promise<Phase6Stats> {
  const logger = new MigrationLogger();
  const startTime = Date.now();
  const tempDir = path.join(__dirname, "temp");
  
  await fs.mkdir(tempDir, { recursive: true });

  logger.info("🚀 Starting Phase 6: Communication System Migration");
  logger.info("=" .repeat(60));

  const stats: Phase6Stats = {
    phase: "Phase 6: Communication System",
    started_at: new Date().toISOString(),
    success: false,
    steps: {
      extraction: {
        success: false,
        duration_ms: 0,
        total_mysql_chats: 0,
        total_mysql_messages: 0,
        processed_chats: 0,
        processed_messages: 0,
        skipped_chats: 0,
        skipped_messages: 0,
        active_chats: 0,
        image_messages: 0,
      },
      creation: {
        success: false,
        duration_ms: 0,
        total_chats_to_create: 0,
        total_messages_to_create: 0,
        successful_chat_creations: 0,
        successful_message_creations: 0,
        successful_media_creations: 0,
        failed_chat_creations: 0,
        failed_message_creations: 0,
      },
      validation: {
        success: false,
        is_valid: false,
        total_mysql_chats: 0,
        total_mysql_messages: 0,
        total_pg_chats: 0,
        total_pg_messages: 0,
        missing_chats: 0,
        missing_messages: 0,
        orphaned_chats: 0,
        orphaned_messages: 0,
        chat_booking_mismatches: 0,
        message_sender_mismatches: 0,
        validation_errors: 0,
      },
    },
  };

  try {
    // Step 1: Extract chats and messages
    logger.info("📤 Step 1: Extracting chats and messages from MySQL...");
    logger.info("-".repeat(50));
    
    try {
      const extractionResult: ExtractionResult = await extractChats();
      
      stats.steps.extraction = {
        success: true,
        duration_ms: 0, // Not tracked in extraction
        total_mysql_chats: extractionResult.metadata.total_mysql_chats,
        total_mysql_messages: extractionResult.metadata.total_mysql_messages,
        processed_chats: extractionResult.metadata.processed_chats,
        processed_messages: extractionResult.metadata.processed_messages,
        skipped_chats: extractionResult.metadata.skipped_chats,
        skipped_messages: extractionResult.metadata.skipped_messages,
        active_chats: extractionResult.metadata.active_chats,
        image_messages: extractionResult.metadata.image_messages,
      };

      logger.info("✅ Chat and message extraction completed successfully");
      logger.info(`   📊 MySQL chats: ${extractionResult.metadata.total_mysql_chats} (${extractionResult.metadata.active_chats} active)`);
      logger.info(`   📊 MySQL messages: ${extractionResult.metadata.total_mysql_messages}`);
      logger.info(`   ✨ Processed chats: ${extractionResult.metadata.processed_chats}`);
      logger.info(`   ✨ Processed messages: ${extractionResult.metadata.processed_messages}`);
      logger.info(`   🖼️  Image messages: ${extractionResult.metadata.image_messages}`);

      if (extractionResult.metadata.skipped_chats > 0 || extractionResult.metadata.skipped_messages > 0) {
        logger.warn(`   ⚠️  Skipped chats: ${extractionResult.metadata.skipped_chats}`);
        logger.warn(`   ⚠️  Skipped messages: ${extractionResult.metadata.skipped_messages}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("❌ Chat and message extraction failed:", error);
      stats.steps.extraction.error = errorMessage;
      throw error;
    }

    // Step 2: Create chats and messages in Supabase
    logger.info("\n📥 Step 2: Creating chats and messages in Supabase...");
    logger.info("-".repeat(50));

    try {
      const creationResult: CreationResult = await createChats();
      
      stats.steps.creation = {
        success: true,
        duration_ms: creationResult.metadata.duration_ms,
        total_chats_to_create: creationResult.metadata.total_chats_to_create,
        total_messages_to_create: creationResult.metadata.total_messages_to_create,
        successful_chat_creations: creationResult.metadata.successful_chat_creations,
        successful_message_creations: creationResult.metadata.successful_message_creations,
        successful_media_creations: creationResult.metadata.successful_media_creations,
        failed_chat_creations: creationResult.metadata.failed_chat_creations,
        failed_message_creations: creationResult.metadata.failed_message_creations,
      };

      logger.info("✅ Chat and message creation completed successfully");
      logger.info(`   📊 Chats created: ${creationResult.metadata.successful_chat_creations}/${creationResult.metadata.total_chats_to_create}`);
      logger.info(`   📊 Messages created: ${creationResult.metadata.successful_message_creations}/${creationResult.metadata.total_messages_to_create}`);
      logger.info(`   📊 Media records created: ${creationResult.metadata.successful_media_creations}`);
      logger.info(`   ⏱️  Duration: ${(creationResult.metadata.duration_ms / 1000).toFixed(2)}s`);

      if (creationResult.metadata.failed_chat_creations > 0 || creationResult.metadata.failed_message_creations > 0) {
        logger.warn(`   ⚠️  Failed chat creations: ${creationResult.metadata.failed_chat_creations}`);
        logger.warn(`   ⚠️  Failed message creations: ${creationResult.metadata.failed_message_creations}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("❌ Chat and message creation failed:", error);
      stats.steps.creation.error = errorMessage;
      throw error;
    }

    // Step 3: Validate migration
    logger.info("\n🔍 Step 3: Validating migration integrity...");
    logger.info("-".repeat(50));

    try {
      const validationResult: ValidationResult = await validateChats();
      
      stats.steps.validation = {
        success: true,
        is_valid: validationResult.is_valid,
        total_mysql_chats: validationResult.total_mysql_chats,
        total_mysql_messages: validationResult.total_mysql_messages,
        total_pg_chats: validationResult.total_pg_chats,
        total_pg_messages: validationResult.total_pg_messages,
        missing_chats: validationResult.missing_chats.length,
        missing_messages: validationResult.missing_messages.length,
        orphaned_chats: validationResult.orphaned_chats.length,
        orphaned_messages: validationResult.orphaned_messages.length,
        chat_booking_mismatches: validationResult.chat_booking_mismatches,
        message_sender_mismatches: validationResult.message_sender_mismatches.length,
        validation_errors: validationResult.validation_errors.length,
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

      logger.info(`   📊 MySQL chats → PostgreSQL chats: ${validationResult.total_mysql_chats} → ${validationResult.total_pg_chats}`);
      logger.info(`   📊 MySQL messages → PostgreSQL messages: ${validationResult.total_mysql_messages} → ${validationResult.total_pg_messages}`);
      
      if (validationResult.missing_chats.length > 0 || validationResult.missing_messages.length > 0) {
        logger.warn(`   ⚠️  Missing chats: ${validationResult.missing_chats.length}`);
        logger.warn(`   ⚠️  Missing messages: ${validationResult.missing_messages.length}`);
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
    logger.info("🎉 Phase 6 Migration Completed Successfully!");
    logger.info("=".repeat(60));
    
    // Calculate success rates
    const chatSuccessRate = stats.steps.creation.total_chats_to_create > 0 
      ? ((stats.steps.creation.successful_chat_creations / stats.steps.creation.total_chats_to_create) * 100).toFixed(2)
      : "0";
    
    const messageSuccessRate = stats.steps.creation.total_messages_to_create > 0
      ? ((stats.steps.creation.successful_message_creations / stats.steps.creation.total_messages_to_create) * 100).toFixed(2)
      : "0";

    logger.info(`📊 MIGRATION SUMMARY:`);
    logger.info(`   • Total duration: ${stats.duration_seconds}s`);
    logger.info(`   • MySQL chats processed: ${stats.steps.extraction.processed_chats} (from ${stats.steps.extraction.total_mysql_chats} total, ${stats.steps.extraction.active_chats} active)`);
    logger.info(`   • MySQL messages processed: ${stats.steps.extraction.processed_messages} (from ${stats.steps.extraction.total_mysql_messages} total)`);
    logger.info(`   • PostgreSQL chats created: ${stats.steps.creation.successful_chat_creations}/${stats.steps.creation.total_chats_to_create} (${chatSuccessRate}%)`);
    logger.info(`   • PostgreSQL messages created: ${stats.steps.creation.successful_message_creations}/${stats.steps.creation.total_messages_to_create} (${messageSuccessRate}%)`);
    logger.info(`   • Media records created: ${stats.steps.creation.successful_media_creations}`);
    logger.info(`   • Migration validation: ${stats.steps.validation.is_valid ? '✅ PASSED' : '⚠️ ISSUES FOUND'}`);

    if (stats.steps.extraction.skipped_chats > 0 || stats.steps.extraction.skipped_messages > 0) {
      logger.info(`📋 SKIPPED DATA:`);
      logger.info(`   • Inactive chats: ${stats.steps.extraction.skipped_chats}`);
      logger.info(`   • Invalid messages: ${stats.steps.extraction.skipped_messages}`);
    }

    if (stats.steps.creation.failed_chat_creations > 0 || stats.steps.creation.failed_message_creations > 0) {
      logger.warn(`⚠️  CREATION FAILURES:`);
      logger.warn(`   • Failed chat creations: ${stats.steps.creation.failed_chat_creations}`);
      logger.warn(`   • Failed message creations: ${stats.steps.creation.failed_message_creations}`);
    }

  } catch (error) {
    stats.success = false;
    stats.error = error instanceof Error ? error.message : String(error);
    
    const duration = Date.now() - startTime;
    stats.completed_at = new Date().toISOString();
    stats.duration_seconds = Math.round(duration / 1000);

    logger.error("\n" + "=".repeat(60));
    logger.error("❌ Phase 6 Migration Failed!");
    logger.error("=".repeat(60));
    logger.error(`💥 Error: ${stats.error}`);
    logger.error(`⏱️  Failed after: ${stats.duration_seconds}s`);
  }

  // Save comprehensive stats
  try {
    await fs.writeFile(
      path.join(tempDir, "phase-6-migration-stats.json"),
      JSON.stringify(stats, null, 2)
    );
    logger.info(`📄 Detailed statistics saved to: ${path.join(tempDir, "phase-6-migration-stats.json")}`);
  } catch (error) {
    logger.warn("Failed to save migration statistics:", error);
  }

  return stats;
}

// Execute if run directly
if (require.main === module) {
  runPhase6()
    .then((stats) => {
      process.exit(stats.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Phase 6 migration failed:", error);
      process.exit(1);
    });
}

export { runPhase6, type Phase6Stats };