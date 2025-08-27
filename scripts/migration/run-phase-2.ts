#!/usr/bin/env bun
/**
 * Phase 2 Migration Runner: Address & Geographic Data
 * 
 * This script orchestrates the complete Phase 2 migration:
 * 1. Extract addresses from MySQL dump
 * 2. Create address records in Supabase
 * 3. Update primary address flags
 * 
 * Dependencies: Requires Phase 1 (users) to be completed
 */

import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { MigrationLogger } from './shared/logger';
import { MigrationDatabase } from './shared/database';

async function main() {
  const logger = new MigrationLogger();
  const database = new MigrationDatabase(logger);
  const startTime = Date.now();

  logger.info('🏠 === PHASE 2: ADDRESS & GEOGRAPHIC DATA MIGRATION STARTED ===');
  logger.info('Migrating addresses with polymorphic relationship resolution');

  try {
    // Verify prerequisites
    logger.info('Verifying prerequisites...');
    
    // Check if Phase 1 is completed
    const tempDir = join(process.cwd(), 'scripts', 'migration', 'temp');
    const phase1CompletionMarker = join(tempDir, 'phase-1-completed.json');
    
    if (!existsSync(phase1CompletionMarker)) {
      throw new Error('Phase 1 must be completed before running Phase 2. Run Phase 1 first.');
    }
    logger.success('Phase 1 completion verified ✅');

    // Check if MySQL dump file exists
    const dumpPath = database.getDumpFilePath();
    if (!existsSync(dumpPath)) {
      throw new Error(`MySQL dump file not found: ${dumpPath}`);
    }
    logger.success(`Found MySQL dump file: ${dumpPath}`);

    // Test database connection
    const isConnected = await database.testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Ensure temp directory exists
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
      logger.info(`Created temp directory: ${tempDir}`);
    }

    // Get initial database state
    const initialCounts = await database.getCurrentCounts();
    logger.stats('Initial Database State', initialCounts);

    // Phase 2 Steps
    const steps = [
      {
        name: 'Step 1: Extract Addresses',
        script: 'phase-2-addresses/01-extract-addresses.ts',
        description: 'Extract and process address data from MySQL dump'
      },
      {
        name: 'Step 2: Create Addresses',
        script: 'phase-2-addresses/02-create-addresses.ts',
        description: 'Create address records in Supabase database'
      },
      {
        name: 'Step 3: Update Primary Flags',
        script: 'phase-2-addresses/03-update-primary-addresses.ts',
        description: 'Set primary address flags based on user defaults'
      }
    ];

    // Execute each step
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepStartTime = Date.now();
      
      logger.info(`\n🔄 Executing ${step.name}...`);
      logger.info(`📝 ${step.description}`);
      
      try {
        // Run the step script
        await runScript(`scripts/migration/${step.script}`);
        
        const stepDuration = Date.now() - stepStartTime;
        logger.success(`✅ ${step.name} completed in ${Math.round(stepDuration / 1000)}s`);
        
      } catch (error) {
        logger.error(`❌ ${step.name} failed`, error);
        throw error;
      }
    }

    // Get final database state
    const finalCounts = await database.getCurrentCounts();
    const totalDuration = Date.now() - startTime;

    // Create completion marker
    const completionMarkerPath = join(tempDir, 'phase-2-completed.json');
    const fs = await import('fs');
    fs.writeFileSync(completionMarkerPath, JSON.stringify({
      completed_at: new Date().toISOString(),
      duration_seconds: Math.round(totalDuration / 1000),
      initial_counts: initialCounts,
      final_counts: finalCounts,
      addresses_migrated: finalCounts.addresses - initialCounts.addresses
    }, null, 2));

    // Final summary
    logger.info('🏠 === PHASE 2: ADDRESS MIGRATION COMPLETE ===');
    logger.stats('=== FINAL STATISTICS ===', {
      'Addresses Before': initialCounts.addresses,
      'Addresses After': finalCounts.addresses,
      'New Addresses Created': finalCounts.addresses - initialCounts.addresses
    });

    logger.stats('=== DATABASE VERIFICATION ===', {
      'Total Addresses': finalCounts.addresses,
      'Primary Address Count': await database.getPrimaryAddressCount()
    });

    const addressStatsPath = join(tempDir, 'address-migration-stats.json');
    let migrationStats = { errors: 0 };
    if (existsSync(addressStatsPath)) {
      const fs = await import('fs');
      migrationStats = JSON.parse(fs.readFileSync(addressStatsPath, 'utf-8'));
    }

    logger.stats('=== MIGRATION STATUS ===', {
      'Total Errors': migrationStats.errors || 0,
      'Duration': `${Math.round(totalDuration / 1000)}s`,
      'Overall Status': (migrationStats.errors || 0) === 0 ? '✅ SUCCESS' : '⚠️  SUCCESS WITH WARNINGS'
    });

    logger.success('🎉 Phase 2 Address Migration completed successfully!', {
      completion_marker: completionMarkerPath,
      duration: `${Math.round(totalDuration / 1000)}s`,
      addresses_created: finalCounts.addresses - initialCounts.addresses
    });

    logger.info('Next steps: Users now have properly migrated addresses with primary flags set');

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Phase 2 migration failed after ${Math.round(duration / 1000)}s`, error);
    logger.error('🚨 Phase 2 Address Migration failed - check logs for details');
    process.exit(1);
  }
}

/**
 * Run a migration script
 */
function runScript(scriptPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const childProcess = spawn('bun', [scriptPath], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script ${scriptPath} exited with code ${code}`));
      }
    });

    childProcess.on('error', (error) => {
      reject(error);
    });
  });
}

// Run the script if called directly
main().catch(error => {
  console.error('Migration runner failed:', error);
  process.exit(1);
});