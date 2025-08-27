import { MigrationLogger } from '../shared/logger';
import { MigrationDatabase } from '../shared/database';
import type { Database } from '../../../types/database.types';
import fs from 'fs/promises';
import path from 'path';

interface ServiceCategory {
  service_id: string;
  category_id: string;
}

interface JunctionCreationResult {
  service_id: string;
  category_id: string;
  success: boolean;
  error?: string;
}

export async function createServiceCategories(): Promise<void> {
  const logger = new MigrationLogger('create-service-categories');
  const db = new MigrationDatabase(logger);
  
  try {
    logger.info('Starting Phase 3 Step 5: Create Service-Category Relationships');
    
    // Read extracted service categories
    const tempDir = path.join(process.cwd(), 'scripts/migration/temp');
    const extractedData = JSON.parse(
      await fs.readFile(path.join(tempDir, 'service-categories-extracted.json'), 'utf-8')
    );
    
    const serviceCategories: ServiceCategory[] = extractedData.service_categories;
    logger.info(`Creating ${serviceCategories.length} service-category relationships...`);
    
    const results: JunctionCreationResult[] = [];
    
    // Create service-category junction records
    for (const junction of serviceCategories) {
      try {
        const junctionData: Database["public"]["Tables"]["service_service_categories"]["Insert"] = {
          service_id: junction.service_id,
          category_id: junction.category_id,
        };
        
        const createResult = await db.createServiceCategoryJunction(junctionData);
        
        if (createResult.success) {
          results.push({
            service_id: junction.service_id,
            category_id: junction.category_id,
            success: true,
          });
          logger.debug(`✅ Created service-category link: ${junction.service_id} -> ${junction.category_id}`);
        } else {
          results.push({
            service_id: junction.service_id,
            category_id: junction.category_id,
            success: false,
            error: createResult.error,
          });
          logger.error(`❌ Failed to create service-category link ${junction.service_id} -> ${junction.category_id}: ${createResult.error}`);
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          service_id: junction.service_id,
          category_id: junction.category_id,
          success: false,
          error: errorMessage,
        });
        logger.error(`❌ Exception creating service-category link ${junction.service_id} -> ${junction.category_id}:`, error);
      }
    }
    
    // Calculate statistics
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    // Save results
    await fs.writeFile(
      path.join(tempDir, 'service-categories-created.json'),
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
    
    logger.success(`✅ Service-category relationships created successfully!`);
    logger.info(`📊 Creation Summary:`);
    logger.info(`   - Total processed: ${results.length}`);
    logger.info(`   - Successfully created: ${successful}`);
    logger.info(`   - Failed: ${failed}`);
    
    if (failed > 0) {
      logger.warn(`⚠️  ${failed} service-category links failed to create. Check logs for details.`);
    }
    
  } catch (error) {
    logger.error('❌ Service-category relationship creation failed:', error);
    throw error;
  }
}

if (require.main === module) {
  createServiceCategories()
    .then(() => {
      console.log('🎉 Phase 3 Step 5 completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Phase 3 Step 5 failed:', error);
      process.exit(1);
    });
}