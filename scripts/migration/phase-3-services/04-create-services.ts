import { MigrationLogger } from '../shared/logger';
import { MigrationDatabase } from '../shared/database';
import type { Database } from '../../../types/database.types';
import fs from 'fs/promises';
import path from 'path';

interface TransformedService {
  id: string;
  stylist_id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  duration_minutes: number;
  is_published: boolean;
  at_customer_place: boolean;
  at_stylist_place: boolean;
  includes: string[];
  requirements: string[];
}

interface ServiceCreationResult {
  original_id: string;
  supabase_id: string;
  title: string;
  stylist_id: string;
  success: boolean;
  error?: string;
}

export async function createServices(): Promise<void> {
  const logger = new MigrationLogger('create-services');
  const db = new MigrationDatabase(logger);
  
  try {
    logger.info('Starting Phase 3 Step 4: Create Services');
    
    // Read extracted services
    const tempDir = path.join(process.cwd(), 'scripts/migration/temp');
    const extractedData = JSON.parse(
      await fs.readFile(path.join(tempDir, 'services-extracted.json'), 'utf-8')
    );
    
    const services: TransformedService[] = extractedData.services;
    logger.info(`Creating ${services.length} services...`);
    
    const results: ServiceCreationResult[] = [];
    
    // Create services
    for (const service of services) {
      try {
        const serviceData: Database["public"]["Tables"]["services"]["Insert"] = {
          id: service.id,
          stylist_id: service.stylist_id,
          title: service.title,
          description: service.description,
          price: service.price,
          currency: service.currency,
          duration_minutes: service.duration_minutes,
          is_published: service.is_published,
          at_customer_place: service.at_customer_place,
          at_stylist_place: service.at_stylist_place,
          includes: service.includes,
          requirements: service.requirements,
        };
        
        const createResult = await db.createService(serviceData);
        
        if (createResult.success) {
          results.push({
            original_id: service.id,
            supabase_id: service.id,
            title: service.title,
            stylist_id: service.stylist_id,
            success: true,
          });
          logger.info(`✅ Created service: ${service.title} (${service.id})`);
        } else {
          results.push({
            original_id: service.id,
            supabase_id: service.id,
            title: service.title,
            stylist_id: service.stylist_id,
            success: false,
            error: createResult.error,
          });
          logger.error(`❌ Failed to create service ${service.title}: ${createResult.error}`);
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          original_id: service.id,
          supabase_id: service.id,
          title: service.title,
          stylist_id: service.stylist_id,
          success: false,
          error: errorMessage,
        });
        logger.error(`❌ Exception creating service ${service.title}:`, error);
      }
    }
    
    // Calculate statistics
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    // Save results
    await fs.writeFile(
      path.join(tempDir, 'services-created.json'),
      JSON.stringify({
        metadata: {
          created_at: new Date().toISOString(),
          total_processed: results.length,
          successful_creations: successful,
          failed_creations: failed,
        },
        results,
      }, null, 2)
    );
    
    logger.success(`✅ Services created successfully!`);
    logger.info(`📊 Creation Summary:`);
    logger.info(`   - Total processed: ${results.length}`);
    logger.info(`   - Successfully created: ${successful}`);
    logger.info(`   - Failed: ${failed}`);
    
    if (failed > 0) {
      logger.warn(`⚠️  ${failed} services failed to create. Check logs for details.`);
    }
    
    // Verify database state
    const finalCount = await db.getServiceCount();
    logger.info(`🔢 Final database count: ${finalCount} services`);
    
  } catch (error) {
    logger.error('❌ Service creation failed:', error);
    throw error;
  }
}

if (require.main === module) {
  createServices()
    .then(() => {
      console.log('🎉 Phase 3 Step 4 completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Phase 3 Step 4 failed:', error);
      process.exit(1);
    });
}