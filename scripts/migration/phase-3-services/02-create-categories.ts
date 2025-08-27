import { MigrationLogger } from '../shared/logger';
import { MigrationDatabase } from '../shared/database';
import type { Database } from '../../../types/database.types';
import fs from 'fs/promises';
import path from 'path';

interface ServiceCategory {
  id: string;
  name: string;
  description: string | null;
  parent_category_id: string | null;
}

interface CategoryCreationResult {
  original_id: string;
  supabase_id: string;
  name: string;
  is_top_level: boolean;
  success: boolean;
  error?: string;
}

export async function createCategories(): Promise<void> {
  const logger = new MigrationLogger('create-categories');
  const db = new MigrationDatabase(logger);
  
  try {
    logger.info('Starting Phase 3 Step 2: Create Service Categories');
    
    // Read extracted categories
    const tempDir = path.join(process.cwd(), 'scripts/migration/temp');
    const extractedData = JSON.parse(
      await fs.readFile(path.join(tempDir, 'categories-extracted.json'), 'utf-8')
    );
    
    const serviceCategories: ServiceCategory[] = extractedData.service_categories;
    logger.info(`Creating ${serviceCategories.length} service categories...`);
    
    // Separate top-level categories and subcategories for proper insertion order
    const topLevelCategories = serviceCategories.filter(cat => cat.parent_category_id === null);
    const subcategories = serviceCategories.filter(cat => cat.parent_category_id !== null);
    
    logger.info(`Processing ${topLevelCategories.length} top-level categories first...`);
    
    const results: CategoryCreationResult[] = [];
    
    // Create top-level categories first
    for (const category of topLevelCategories) {
      try {
        const categoryData: Database["public"]["Tables"]["service_categories"]["Insert"] = {
          id: category.id,
          name: category.name,
          description: category.description,
          parent_category_id: null,
        };
        
        const createResult = await db.createServiceCategory(categoryData);
        
        if (createResult.success) {
          results.push({
            original_id: category.id,
            supabase_id: category.id,
            name: category.name,
            is_top_level: true,
            success: true,
          });
          logger.info(`✅ Created top-level category: ${category.name}`);
        } else {
          results.push({
            original_id: category.id,
            supabase_id: category.id,
            name: category.name,
            is_top_level: true,
            success: false,
            error: createResult.error,
          });
          logger.error(`❌ Failed to create top-level category ${category.name}: ${createResult.error}`);
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          original_id: category.id,
          supabase_id: category.id,
          name: category.name,
          is_top_level: true,
          success: false,
          error: errorMessage,
        });
        logger.error(`❌ Exception creating top-level category ${category.name}:`, error);
      }
    }
    
    logger.info(`Processing ${subcategories.length} subcategories...`);
    
    // Create subcategories (now that parent categories exist)
    for (const category of subcategories) {
      try {
        const categoryData: Database["public"]["Tables"]["service_categories"]["Insert"] = {
          id: category.id,
          name: category.name,
          description: category.description,
          parent_category_id: category.parent_category_id,
        };
        
        const createResult = await db.createServiceCategory(categoryData);
        
        if (createResult.success) {
          results.push({
            original_id: category.id,
            supabase_id: category.id,
            name: category.name,
            is_top_level: false,
            success: true,
          });
          logger.info(`✅ Created subcategory: ${category.name}`);
        } else {
          results.push({
            original_id: category.id,
            supabase_id: category.id,
            name: category.name,
            is_top_level: false,
            success: false,
            error: createResult.error,
          });
          logger.error(`❌ Failed to create subcategory ${category.name}: ${createResult.error}`);
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          original_id: category.id,
          supabase_id: category.id,
          name: category.name,
          is_top_level: false,
          success: false,
          error: errorMessage,
        });
        logger.error(`❌ Exception creating subcategory ${category.name}:`, error);
      }
    }
    
    // Calculate statistics
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const topLevelCreated = results.filter(r => r.success && r.is_top_level).length;
    const subcategoriesCreated = results.filter(r => r.success && !r.is_top_level).length;
    
    // Save results
    await fs.writeFile(
      path.join(tempDir, 'categories-created.json'),
      JSON.stringify({
        metadata: {
          created_at: new Date().toISOString(),
          total_processed: results.length,
          successful_creations: successful,
          failed_creations: failed,
          top_level_categories_created: topLevelCreated,
          subcategories_created: subcategoriesCreated,
        },
        results,
      }, null, 2)
    );
    
    logger.success(`✅ Service categories created successfully!`);
    logger.info(`📊 Creation Summary:`);
    logger.info(`   - Total processed: ${results.length}`);
    logger.info(`   - Successfully created: ${successful}`);
    logger.info(`   - Failed: ${failed}`);
    logger.info(`   - Top-level categories: ${topLevelCreated}`);
    logger.info(`   - Subcategories: ${subcategoriesCreated}`);
    
    if (failed > 0) {
      logger.warn(`⚠️  ${failed} categories failed to create. Check logs for details.`);
    }
    
    // Verify database state
    const finalCount = await db.getServiceCategoryCount();
    logger.info(`🔢 Final database count: ${finalCount} service categories`);
    
  } catch (error) {
    logger.error('❌ Category creation failed:', error);
    throw error;
  }
}

if (require.main === module) {
  createCategories()
    .then(() => {
      console.log('🎉 Phase 3 Step 2 completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Phase 3 Step 2 failed:', error);
      process.exit(1);
    });
}