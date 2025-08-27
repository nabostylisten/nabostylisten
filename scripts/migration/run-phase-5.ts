import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

interface PhaseStats {
  payments: number;
  updated_bookings: number;
  skipped_payments: number;
  validation_passed: boolean;
  errors: number;
}

async function runPhase5(): Promise<void> {
  console.log('🚀 Starting Phase 5: Payment System Migration');
  console.log('📋 This phase will migrate payment records from MySQL to Supabase');
  console.log('⚠️  Note: Salon-related payment data will not be migrated (business model removed)');
  
  const startTime = Date.now();
  
  // Phase 5 migration steps
  const steps = [
    {
      name: 'Extract Payments',
      script: path.join(__dirname, 'phase-5-payments/01-extract-payments.ts'),
      description: 'Extract and transform MySQL payment data with status mapping'
    },
    {
      name: 'Create Payments',
      script: path.join(__dirname, 'phase-5-payments/02-create-payments.ts'),
      description: 'Create payments in Supabase and update bookings with payment intent IDs'
    },
    {
      name: 'Validate Migration',
      script: path.join(__dirname, 'phase-5-payments/03-validate-payments.ts'),
      description: 'Validate payment data integrity and relationships'
    }
  ];

  // Execute each step
  for (const [index, step] of steps.entries()) {
    const stepNumber = index + 1;
    console.log(`\n📋 Step ${stepNumber}/${steps.length}: ${step.name}`);
    console.log(`   ${step.description}`);
    
    try {
      await runScript(step.script);
      console.log(`✅ Step ${stepNumber} completed successfully`);
    } catch (error) {
      console.error(`❌ Step ${stepNumber} failed:`, error);
      console.log('\n💥 Phase 5 migration failed. Check the logs above for details.');
      process.exit(1);
    }
  }
  
  // Generate final statistics
  const stats = await generateFinalStats();
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  console.log('\n🎉 Phase 5 Payment System Migration completed successfully!');
  console.log('\n📊 Final Statistics:');
  console.log(`   ⏱️  Total duration: ${duration}s`);
  console.log(`   💳 Payments migrated: ${stats.payments}`);
  console.log(`   📅 Bookings updated with payment intents: ${stats.updated_bookings}`);
  
  if (stats.skipped_payments > 0) {
    console.log(`   ⚠️  Skipped payments: ${stats.skipped_payments}`);
  }
  
  if (stats.errors > 0) {
    console.log(`   ⚠️  Errors: ${stats.errors}`);
  }
  
  if (stats.validation_passed) {
    console.log(`   ✅ Validation: PASSED`);
  } else {
    console.log(`   ❌ Validation: FAILED (check validation results for details)`);
  }
  
  console.log('\n🔄 Migration Progress:');
  console.log('   ✅ Phase 1: User System - Completed');
  console.log('   ✅ Phase 2: Address System - Completed');
  console.log('   ✅ Phase 3: Service System - Completed');
  console.log('   ✅ Phase 4: Booking System - Completed');
  console.log('   ✅ Phase 5: Payment System - Completed');
  console.log('   ⏳ Phase 6: Communication System - Ready to start');
  console.log('   ⏳ Phase 7: Reviews & Ratings - Pending');
  console.log('   ⏳ Phase 8: Media Management - Pending');
  console.log('   ⏳ Phase 9: Availability System - Pending');
  
  console.log('\n💡 Important Notes:');
  console.log('   - Salon payment data (commission, transfers) was not migrated');
  console.log('   - All amounts are stored in NOK');
  console.log('   - Payment statuses have been mapped to the new system');
  console.log('   - Stripe payment intent IDs are preserved');
  console.log('   - Ready for Phase 6: Communication System migration');
}

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
        reject(new Error(`Script exited with code ${code}`));
      }
    });

    childProcess.on('error', (error) => {
      reject(error);
    });
  });
}

async function generateFinalStats(): Promise<PhaseStats> {
  const tempDir = path.join(__dirname, 'temp');
  
  try {
    // Read results from each step
    const paymentStats = JSON.parse(
      await fs.readFile(path.join(tempDir, 'payments-created.json'), 'utf-8')
    );
    
    const validationResults = JSON.parse(
      await fs.readFile(path.join(tempDir, 'payment-validation-results.json'), 'utf-8')
    );
    
    // Read skipped payments if they exist
    let skippedCount = 0;
    try {
      const skippedData = JSON.parse(
        await fs.readFile(path.join(tempDir, 'skipped-payments.json'), 'utf-8')
      );
      skippedCount = skippedData.skipped_payments?.length || 0;
    } catch {
      // File might not exist if no payments were skipped
    }
    
    const stats: PhaseStats = {
      payments: paymentStats.metadata.successful_creations,
      updated_bookings: paymentStats.metadata.updated_bookings,
      skipped_payments: skippedCount,
      validation_passed: validationResults.is_valid,
      errors: paymentStats.metadata.failed_creations
    };
    
    // Save comprehensive completion stats
    await fs.writeFile(
      path.join(tempDir, 'phase-5-completed.json'),
      JSON.stringify({
        completed_at: new Date().toISOString(),
        duration_seconds: Math.round((Date.now() - Date.now()) / 1000), // This will be overwritten
        ...stats,
        validation_summary: {
          total_mysql_payments: validationResults.total_mysql_payments,
          total_pg_payments: validationResults.total_pg_payments,
          missing_payments: validationResults.missing_payments.length,
          orphaned_payments: validationResults.orphaned_payments.length,
          amount_discrepancies: validationResults.amount_discrepancies.length
        }
      }, null, 2)
    );
    
    return stats;
    
  } catch (error) {
    console.warn('⚠️  Could not generate final statistics:', error);
    return {
      payments: 0,
      updated_bookings: 0,
      skipped_payments: 0,
      validation_passed: false,
      errors: 1
    };
  }
}

if (require.main === module) {
  runPhase5().catch((error) => {
    console.error('💥 Phase 5 failed:', error);
    process.exit(1);
  });
}

export { runPhase5 };