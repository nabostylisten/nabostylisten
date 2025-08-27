import { MigrationLogger } from '../shared/logger';
import { MigrationDatabase } from '../shared/database';
import type { Database } from '../../../types/database.types';
import fs from 'fs/promises';
import path from 'path';

// Hard-coded parent categories from MySQL dump
const PARENT_CATEGORIES = [
  { id: '1f81ebf7-4f92-4829-b8a7-374b4f460c10', name: 'Makeup', description: '' },
  { id: '3df149ce-600c-42d6-9c1d-a7052863e598', name: 'Lashes', description: '' },
  { id: '61134b7c-d0ec-4bf0-b07c-dbed6626a19a', name: 'Brows', description: '' },
  { id: '8b22a2a4-4976-486b-8352-db92daf894c7', name: 'Nails', description: '' },
  { id: '939ba099-f641-42a8-9dc4-1a61081993a5', name: 'Hair', description: '' },
];

interface CategoryCreationResult {
  original_id: string;
  supabase_id: string;
  name: string;
  success: boolean;
  error?: string;
}

export async function createParentCategories(): Promise<void> {
  const logger = new MigrationLogger('create-parent-categories');
  const db = new MigrationDatabase(logger);
  
  try {
    logger.info('Starting Phase 3 Step 0: Create Parent Categories');
    logger.info(`Creating ${PARENT_CATEGORIES.length} parent categories...`);
    
    const results: CategoryCreationResult[] = [];
    
    // Create parent categories
    for (const category of PARENT_CATEGORIES) {
      try {
        const categoryData: Database["public"]["Tables"]["service_categories"]["Insert"] = {
          id: category.id,
          name: category.name,
          description: category.description || null,
          parent_category_id: null, // These are top-level categories
        };
        
        const createResult = await db.createServiceCategory(categoryData);
        
        if (createResult.success) {
          results.push({
            original_id: category.id,
            supabase_id: category.id,
            name: category.name,
            success: true,
          });
          logger.info(`✅ Created parent category: ${category.name}`);
        } else {
          results.push({
            original_id: category.id,
            supabase_id: category.id,
            name: category.name,
            success: false,
            error: createResult.error,
          });
          logger.error(`❌ Failed to create parent category ${category.name}: ${createResult.error}`);
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          original_id: category.id,
          supabase_id: category.id,
          name: category.name,
          success: false,
          error: errorMessage,
        });
        logger.error(`❌ Exception creating parent category ${category.name}:`, error);
      }
    }
    
    // Calculate statistics
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    // Save results
    const tempDir = path.join(process.cwd(), 'scripts/migration/temp');
    await fs.writeFile(
      path.join(tempDir, 'parent-categories-created.json'),
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
    
    logger.success(`✅ Parent categories created successfully!`);
    logger.info(`📊 Creation Summary:`);
    logger.info(`   - Total processed: ${results.length}`);
    logger.info(`   - Successfully created: ${successful}`);
    logger.info(`   - Failed: ${failed}`);
    
    if (failed > 0) {
      logger.warn(`⚠️  ${failed} parent categories failed to create. Check logs for details.`);
    }
    
    // Verify database state
    const finalCount = await db.getServiceCategoryCount();
    logger.info(`🔢 Final database count: ${finalCount} service categories`);
    
  } catch (error) {
    logger.error('❌ Parent category creation failed:', error);
    throw error;
  }
}

if (require.main === module) {
  createParentCategories()
    .then(() => {
      console.log('🎉 Phase 3 Step 0 completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Phase 3 Step 0 failed:', error);
      process.exit(1);
    });
}