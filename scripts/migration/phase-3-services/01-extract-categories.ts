import { MigrationLogger } from '../shared/logger';
import { MySQLParser } from '../phase-1-users/utils/mysql-parser';
import fs from 'fs/promises';
import path from 'path';

interface MySQLCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface MySQLSubcategory {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
  created_at: string;
  updated_at: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  description: string | null;
  parent_category_id: string | null;
}

interface CategoryMigrationStats {
  total_categories: number;
  total_subcategories: number;
  processed_categories: number;
  processed_subcategories: number;
  skipped_categories: number;
  errors: number;
}

export async function extractCategories(): Promise<void> {
  const logger = new MigrationLogger('extract-categories');
  
  try {
    logger.info('Starting Phase 3 Step 1: Extract Categories');
    
    // Parse MySQL dump for category and subcategory data
    const dumpPath = path.join(process.cwd(), 'nabostylisten_dump.sql');
    const parser = new MySQLParser(dumpPath, logger);
    
    logger.info('Parsing categories from MySQL dump...');
    const categories = await parser.parseTable<MySQLCategory>('category');
    logger.info(`Found ${categories.length} categories`);
    
    logger.info('Parsing subcategories from MySQL dump...');
    const subcategories = await parser.parseTable<MySQLSubcategory>('subcategory');
    logger.info(`Found ${subcategories.length} subcategories`);
    
    // Transform to unified structure
    logger.info('Transforming categories to unified structure...');
    const serviceCategories: ServiceCategory[] = [];
    
    // Process top-level categories first (parent_category_id = null)
    for (const category of categories) {
      serviceCategories.push({
        id: category.id,
        name: category.name,
        description: category.description,
        parent_category_id: null, // Top-level categories have no parent
      });
    }
    
    // Process subcategories (parent_category_id = category.id)
    for (const subcategory of subcategories) {
      serviceCategories.push({
        id: subcategory.id,
        name: subcategory.name,
        description: subcategory.description,
        parent_category_id: subcategory.category_id, // Reference to parent category
      });
    }
    
    // Generate migration statistics
    const stats: CategoryMigrationStats = {
      total_categories: categories.length,
      total_subcategories: subcategories.length,
      processed_categories: categories.length,
      processed_subcategories: subcategories.length,
      skipped_categories: 0,
      errors: 0,
    };
    
    // Save extracted data
    const tempDir = path.join(process.cwd(), 'scripts/migration/temp');
    await fs.writeFile(
      path.join(tempDir, 'categories-extracted.json'),
      JSON.stringify({
        metadata: {
          extracted_at: new Date().toISOString(),
          total_service_categories: serviceCategories.length,
          top_level_categories: categories.length,
          subcategories: subcategories.length,
        },
        service_categories: serviceCategories,
      }, null, 2)
    );
    
    // Save statistics
    await fs.writeFile(
      path.join(tempDir, 'category-migration-stats.json'),
      JSON.stringify(stats, null, 2)
    );
    
    logger.success(`✅ Categories extracted successfully!`);
    logger.info(`📊 Statistics:`);
    logger.info(`   - Top-level categories: ${stats.total_categories}`);
    logger.info(`   - Subcategories: ${stats.total_subcategories}`);
    logger.info(`   - Total service categories to create: ${serviceCategories.length}`);
    
  } catch (error) {
    logger.error('❌ Category extraction failed:', error);
    throw error;
  }
}

if (require.main === module) {
  extractCategories()
    .then(() => {
      console.log('🎉 Phase 3 Step 1 completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Phase 3 Step 1 failed:', error);
      process.exit(1);
    });
}