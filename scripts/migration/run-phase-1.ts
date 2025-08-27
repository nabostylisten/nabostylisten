#!/usr/bin/env bun
/**
 * Phase 1 Runner: Complete User Migration from MySQL to Supabase
 * 
 * This script orchestrates the entire Phase 1 user migration process:
 * 1. Extract and validate user data from MySQL dump
 * 2. Create Supabase Auth users with email confirmed
 * 3. Create profile records in the database
 * 4. Create stylist_details for stylists
 * 5. Create user_preferences for all users
 * 
 * After completion, existing users can login with OTP using their original emails.
 */

import { execSync } from 'child_process';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { MigrationLogger } from './shared/logger';
import { MigrationDatabase } from './shared/database';

async function main() {
  const logger = new MigrationLogger();
  const database = new MigrationDatabase(logger);
  const startTime = Date.now();

  logger.info('🚀 === PHASE 1: USER MIGRATION STARTED ===');
  logger.info('Migrating users from MySQL to Supabase with OTP authentication');

  try {
    // Verify prerequisites
    logger.info('Verifying prerequisites...');
    
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
    const tempDir = join(process.cwd(), 'scripts', 'migration', 'temp');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
      logger.info(`Created temp directory: ${tempDir}`);
    }

    // Get initial database state
    const initialCounts = await database.getCurrentCounts();
    logger.stats('Initial Database State', initialCounts);

    // Phase 1 Steps
    const steps = [
      {
        name: 'Step 1: Extract Users',
        script: 'phase-1-users/01-extract-users.ts',
        description: 'Extract and validate user data from MySQL dump'
      },
      {
        name: 'Step 2: Create Auth Users',
        script: 'phase-1-users/02-create-auth-users.ts',
        description: 'Create Supabase Auth users with confirmed emails'
      },
      {
        name: 'Step 3: Create Profiles',
        script: 'phase-1-users/03-create-profiles.ts',
        description: 'Create profile records in database'
      },
      {
        name: 'Step 4: Create Stylist Details',
        script: 'phase-1-users/04-create-stylist-details.ts',
        description: 'Create stylist-specific data records'
      },
      {
        name: 'Step 5: Create User Preferences',
        script: 'phase-1-users/05-create-user-preferences.ts',
        description: 'Create notification preferences for all users'
      }
    ];

    // Execute each step
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepStartTime = Date.now();
      
      logger.info(`\n📋 ${step.name}: ${step.description}`);
      
      try {
        const scriptPath = join(process.cwd(), 'scripts', 'migration', step.script);
        
        // Execute the TypeScript script using bun
        logger.info(`Executing: bun ${scriptPath}`);
        execSync(`bun ${scriptPath}`, { 
          stdio: 'inherit',
          cwd: process.cwd(),
          env: {
            ...process.env,
            // Ensure the scripts can find the dump file
            MYSQL_DUMP_PATH: dumpPath
          }
        });
        
        const stepDuration = Date.now() - stepStartTime;
        logger.success(`✅ ${step.name} completed in ${Math.round(stepDuration / 1000)}s`);
        
      } catch (error) {
        logger.error(`❌ ${step.name} failed`, error);
        
        // Show what to do next
        logger.warn('Migration stopped due to error. To resume:');
        logger.info(`1. Fix the error in ${step.script}`);
        logger.info('2. Re-run this script - it will continue from where it left off');
        logger.info('3. Or run individual scripts manually for debugging');
        
        throw error;
      }
    }

    // Get final database state
    const finalCounts = await database.getCurrentCounts();
    
    // Calculate migration summary
    const totalTime = Date.now() - startTime;
    const created = {
      profiles: finalCounts.profiles - initialCounts.profiles,
      stylist_details: finalCounts.stylist_details - initialCounts.stylist_details,
      user_preferences: finalCounts.user_preferences - initialCounts.user_preferences
    };

    logger.info('\n🎉 === PHASE 1: USER MIGRATION COMPLETED SUCCESSFULLY ===');
    
    logger.stats('Migration Summary', {
      'Total Duration': `${Math.round(totalTime / 1000)}s`,
      'Profiles Created': created.profiles,
      'Stylist Details Created': created.stylist_details,
      'User Preferences Created': created.user_preferences,
      'Final Profile Count': finalCounts.profiles,
      'Final Stylist Details Count': finalCounts.stylist_details,
      'Final User Preferences Count': finalCounts.user_preferences
    });

    logger.success('✅ Users can now login with OTP using their original email addresses');
    
    logger.info('\nNext Steps:');
    logger.info('1. Test user login with OTP authentication');
    logger.info('2. Verify user data in the Supabase dashboard');
    logger.info('3. Begin Phase 2: Address and Service data migration');
    
    // Show test instructions
    logger.info('\nTo test user login:');
    logger.info('1. Go to your application login page');
    logger.info('2. Use any email from the original MySQL database');
    logger.info('3. Check that OTP email is sent and login works');
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    logger.error(`❌ Phase 1 migration failed after ${Math.round(totalTime / 1000)}s`, error);
    
    logger.info('\nTroubleshooting:');
    logger.info('1. Check the error logs above');
    logger.info('2. Verify database connection and credentials');
    logger.info('3. Check that the MySQL dump file exists and is readable');
    logger.info('4. Run individual scripts to isolate the issue');
    
    process.exit(1);
  }
}

// Show usage information
function showUsage() {
  console.log(`
Usage: bun scripts/migration/run-phase-1.ts

Environment Variables Required:
  NEXT_PUBLIC_SUPABASE_URL      - Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY     - Supabase service role key
  MYSQL_DUMP_PATH               - Path to MySQL dump file (default: ./nabostylisten_dump.sql)

Example:
  NEXT_PUBLIC_SUPABASE_URL="https://xyz.supabase.co" \\
  SUPABASE_SERVICE_ROLE_KEY="your-service-key" \\
  MYSQL_DUMP_PATH="./nabostylisten_dump.sql" \\
  bun scripts/migration/run-phase-1.ts

Prerequisites:
  1. MySQL dump file must exist at specified path
  2. Supabase database must be running with latest schema
  3. Database should be reset (no existing data): bun supabase:db:reset:no-seed
`);
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showUsage();
  process.exit(0);
}

// Run the migration
main().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});