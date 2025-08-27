import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

interface PhaseStats {
  service_categories: number;
  services: number;
  service_category_relationships: number;
  errors: number;
}

async function runPhase3(): Promise<void> {
  console.log('🚀 Starting Phase 3: Service System Migration');
  console.log('📋 This phase will migrate service categories and services from MySQL to Supabase');
  
  const startTime = Date.now();
  
  // Phase 3 migration steps
  const steps = [
    {
      name: 'Extract Categories',
      script: path.join(__dirname, 'phase-3-services/01-extract-categories.ts'),
      description: 'Extract MySQL categories and subcategories'
    },
    {
      name: 'Create Service Categories',
      script: path.join(__dirname, 'phase-3-services/02-create-categories.ts'),
      description: 'Create unified service categories in Supabase'
    },
    {
      name: 'Extract Services',
      script: path.join(__dirname, 'phase-3-services/03-extract-services.ts'),
      description: 'Extract and transform MySQL services'
    },
    {
      name: 'Create Services',
      script: path.join(__dirname, 'phase-3-services/04-create-services.ts'),
      description: 'Create services in Supabase'
    },
    {
      name: 'Create Service-Category Relationships',
      script: path.join(__dirname, 'phase-3-services/05-create-service-categories.ts'),
      description: 'Create service-category junction records'
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
      console.log('\n💥 Phase 3 migration failed. Check the logs above for details.');
      process.exit(1);
    }
  }
  
  // Generate final statistics
  const stats = await generateFinalStats();
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  console.log('\n🎉 Phase 3 Service System Migration completed successfully!');
  console.log('\n📊 Final Statistics:');
  console.log(`   ⏱️  Total duration: ${duration}s`);
  console.log(`   📁 Service categories: ${stats.service_categories}`);
  console.log(`   🎯 Services: ${stats.services}`);
  console.log(`   🔗 Service-category relationships: ${stats.service_category_relationships}`);
  
  if (stats.errors > 0) {
    console.log(`   ⚠️  Errors: ${stats.errors}`);
  }
  
  console.log('\n🔄 Next steps:');
  console.log('   - Services are now available in Supabase');
  console.log('   - Service categories are hierarchically organized');
  console.log('   - Ready for Phase 4: Booking System migration');
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
    const categoryStats = JSON.parse(
      await fs.readFile(path.join(tempDir, 'categories-created.json'), 'utf-8')
    );
    
    const serviceStats = JSON.parse(
      await fs.readFile(path.join(tempDir, 'services-created.json'), 'utf-8')
    );
    
    const junctionStats = JSON.parse(
      await fs.readFile(path.join(tempDir, 'service-categories-created.json'), 'utf-8')
    );
    
    const stats: PhaseStats = {
      service_categories: categoryStats.metadata.successful_creations,
      services: serviceStats.metadata.successful_creations,
      service_category_relationships: junctionStats.metadata.successful_creations,
      errors: (
        categoryStats.metadata.failed_creations +
        serviceStats.metadata.failed_creations +
        junctionStats.metadata.failed_creations
      )
    };
    
    // Save comprehensive completion stats
    await fs.writeFile(
      path.join(tempDir, 'phase-3-completed.json'),
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
      service_categories: 0,
      services: 0,
      service_category_relationships: 0,
      errors: 1
    };
  }
}

if (require.main === module) {
  runPhase3().catch((error) => {
    console.error('💥 Phase 3 failed:', error);
    process.exit(1);
  });
}

export { runPhase3 };