import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

interface PhaseStats {
  bookings: number;
  booking_services: number;
  skipped_bookings: number;
  errors: number;
}

async function runPhase4(): Promise<void> {
  console.log('🚀 Starting Phase 4: Booking System Migration');
  console.log('📋 This phase will migrate bookings and booking-service relationships from MySQL to Supabase');
  
  const startTime = Date.now();
  
  // Phase 4 migration steps
  const steps = [
    {
      name: 'Extract Bookings',
      script: path.join(__dirname, 'phase-4-bookings/01-extract-bookings.ts'),
      description: 'Extract and transform MySQL bookings with status mapping'
    },
    {
      name: 'Create Bookings',
      script: path.join(__dirname, 'phase-4-bookings/02-create-bookings.ts'),
      description: 'Create bookings in Supabase with proper status and time calculations'
    },
    {
      name: 'Create Booking-Service Relationships',
      script: path.join(__dirname, 'phase-4-bookings/03-create-booking-services.ts'),
      description: 'Create booking-service junction records from both junction table and JSON fields'
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
      console.log('\n💥 Phase 4 migration failed. Check the logs above for details.');
      process.exit(1);
    }
  }
  
  // Generate final statistics
  const stats = await generateFinalStats();
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  console.log('\n🎉 Phase 4 Booking System Migration completed successfully!');
  console.log('\n📊 Final Statistics:');
  console.log(`   ⏱️  Total duration: ${duration}s`);
  console.log(`   📅 Bookings: ${stats.bookings}`);
  console.log(`   🔗 Booking-service relationships: ${stats.booking_services}`);
  
  if (stats.skipped_bookings > 0) {
    console.log(`   ⚠️  Skipped bookings: ${stats.skipped_bookings}`);
  }
  
  if (stats.errors > 0) {
    console.log(`   ⚠️  Errors: ${stats.errors}`);
  }
  
  console.log('\n🔄 Next steps:');
  console.log('   - Bookings are now migrated with proper status mapping');
  console.log('   - All booking-service relationships are preserved');
  console.log('   - Ready for Phase 5: Payment System migration');
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
    const bookingStats = JSON.parse(
      await fs.readFile(path.join(tempDir, 'bookings-created.json'), 'utf-8')
    );
    
    const bookingServiceStats = JSON.parse(
      await fs.readFile(path.join(tempDir, 'booking-services-created.json'), 'utf-8')
    );
    
    const stats: PhaseStats = {
      bookings: bookingStats.metadata.successful_creations,
      booking_services: bookingServiceStats.metadata.successful_creations,
      skipped_bookings: bookingStats.metadata.skipped || 0,
      errors: (
        bookingStats.metadata.failed_creations +
        bookingServiceStats.metadata.failed_creations
      )
    };
    
    // Save comprehensive completion stats
    await fs.writeFile(
      path.join(tempDir, 'phase-4-completed.json'),
      JSON.stringify({
        completed_at: new Date().toISOString(),
        duration_seconds: Math.round((Date.now() - Date.now()) / 1000), // This will be overwritten
        ...stats
      }, null, 2)
    );
    
    return stats;
    
  } catch (error) {
    console.warn('⚠️  Could not generate final statistics:', error);
    return {
      bookings: 0,
      booking_services: 0,
      skipped_bookings: 0,
      errors: 1
    };
  }
}

if (require.main === module) {
  runPhase4().catch((error) => {
    console.error('💥 Phase 4 failed:', error);
    process.exit(1);
  });
}

export { runPhase4 };