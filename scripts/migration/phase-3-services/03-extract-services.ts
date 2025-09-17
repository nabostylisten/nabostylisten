import { MigrationLogger } from '../shared/logger';
import { MySQLParser } from '../phase-1-users/utils/mysql-parser';
import fs from 'fs/promises';
import path from 'path';

interface MySQLService {
  id: string;
  stylist_id: string;
  subcategory_id: string;
  duration: number;
  amount: string; // MySQL stores as decimal string
  currency: string;
  is_published: number; // MySQL boolean as integer
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  description: string;
}

interface ServiceCategory {
  service_id: string;
  category_id: string; // This will be the subcategory_id from MySQL
}

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
  // Trial session fields (not in old MySQL system - will be set to defaults)
  has_trial_session: boolean;
  trial_session_price: number | null;
  trial_session_duration_minutes: number | null;
  trial_session_description: string | null;
}

interface ServiceMigrationStats {
  total_services: number;
  active_services: number;
  deleted_services: number;
  processed_services: number;
  skipped_services: number;
  services_with_categories: number;
  errors: number;
}

function splitDescription(description: string): { title: string; description: string | null } {
  if (!description || description.trim().length === 0) {
    return { title: 'Service', description: null };
  }
  
  // Split on first line break or limit title to 100 characters
  const lines = description.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length === 0) {
    return { title: 'Service', description: null };
  }
  
  if (lines.length === 1) {
    const text = lines[0];
    if (text.length <= 100) {
      return { title: text, description: null };
    } else {
      return { 
        title: text.substring(0, 97) + '...', 
        description: text 
      };
    }
  }
  
  // Multiple lines: first line as title, rest as description
  const title = lines[0].length <= 100 ? lines[0] : lines[0].substring(0, 97) + '...';
  const remainingDescription = lines.slice(1).join('\n');
  
  return { title, description: remainingDescription.length > 0 ? remainingDescription : null };
}

export async function extractServices(): Promise<void> {
  const logger = new MigrationLogger('extract-services');
  
  try {
    logger.info('Starting Phase 3 Step 3: Extract Services');
    
    // Load user ID mapping from Phase 1
    const tempDir = path.join(process.cwd(), 'scripts/migration/temp');
    const mappingData = JSON.parse(
      await fs.readFile(path.join(tempDir, 'user-id-mapping.json'), 'utf-8')
    );
    const userIdMapping: Record<string, string> = mappingData.mapping;
    logger.info(`Loaded ${Object.keys(userIdMapping).length} user ID mappings`);
    
    // Parse MySQL dump for service data
    const dumpPath = process.env.MYSQL_DUMP_PATH || path.join(process.cwd(), 'nabostylisten_prod.sql');
    const parser = new MySQLParser(dumpPath, logger);
    
    logger.info('Parsing services from MySQL dump...');
    const services = await parser.parseTable<MySQLService>('service');
    logger.info(`Found ${services.length} services`);
    
    // Filter out soft-deleted services
    const activeServices = services.filter(service => service.deleted_at === null);
    const deletedServices = services.filter(service => service.deleted_at !== null);
    
    logger.info(`Active services: ${activeServices.length}`);
    logger.info(`Deleted services (skipped): ${deletedServices.length}`);
    
    // Transform services
    logger.info('Transforming services...');
    const transformedServices: TransformedService[] = [];
    const serviceCategories: ServiceCategory[] = [];
    let skippedServices = 0;
    
    for (const service of activeServices) {
      try {
        // Map the stylist_id using the user ID mapping from Phase 1
        const mappedStylistId = userIdMapping[service.stylist_id];
        if (!mappedStylistId) {
          logger.warn(`Skipping service ${service.id}: stylist_id ${service.stylist_id} not found in user mapping`);
          skippedServices++;
          continue;
        }
        
        const { title, description: processedDescription } = splitDescription(service.description);
        
        const transformedService: TransformedService = {
          id: service.id,
          stylist_id: mappedStylistId, // Use mapped ID instead of original ID
          title,
          description: processedDescription,
          price: parseFloat(service.amount),
          currency: service.currency,
          duration_minutes: parseInt(service.duration.toString(), 10),
          is_published: service.is_published === 1,
          at_customer_place: false, // Default value for new field
          at_stylist_place: true,   // Default value for new field
          includes: [],             // Default empty array for new field
          requirements: [],         // Default empty array for new field
          // Trial session fields (not in old MySQL system - set to defaults)
          has_trial_session: false, // Default false for migrated services
          trial_session_price: null, // Default null
          trial_session_duration_minutes: null, // Default null
          trial_session_description: null, // Default null
        };
        
        transformedServices.push(transformedService);
        
        // Create service-category relationship
        serviceCategories.push({
          service_id: service.id,
          category_id: service.subcategory_id, // MySQL subcategory becomes our category
        });
        
        logger.debug(`✓ Transformed service: ${title} (${service.id})`);
        
      } catch (error) {
        logger.error(`❌ Failed to transform service ${service.id}:`, error);
      }
    }
    
    // Generate migration statistics
    const stats: ServiceMigrationStats = {
      total_services: services.length,
      active_services: activeServices.length,
      deleted_services: deletedServices.length,
      processed_services: transformedServices.length,
      skipped_services: skippedServices,
      services_with_categories: serviceCategories.length,
      errors: skippedServices,
    };
    
    // Save extracted data
    await fs.writeFile(
      path.join(tempDir, 'services-extracted.json'),
      JSON.stringify({
        metadata: {
          extracted_at: new Date().toISOString(),
          total_services: transformedServices.length,
          total_category_relationships: serviceCategories.length,
        },
        services: transformedServices,
      }, null, 2)
    );
    
    await fs.writeFile(
      path.join(tempDir, 'service-categories-extracted.json'),
      JSON.stringify({
        metadata: {
          extracted_at: new Date().toISOString(),
          total_relationships: serviceCategories.length,
        },
        service_categories: serviceCategories,
      }, null, 2)
    );
    
    // Save statistics
    await fs.writeFile(
      path.join(tempDir, 'service-migration-stats.json'),
      JSON.stringify(stats, null, 2)
    );
    
    logger.success(`✅ Services extracted successfully!`);
    logger.info(`📊 Statistics:`);
    logger.info(`   - Total services found: ${stats.total_services}`);
    logger.info(`   - Active services: ${stats.active_services}`);
    logger.info(`   - Services to migrate: ${stats.processed_services}`);
    logger.info(`   - Service-category relationships: ${stats.services_with_categories}`);
    logger.info(`   - Skipped (deleted): ${stats.deleted_services}`);
    logger.info(`   - Skipped (no stylist mapping): ${stats.skipped_services}`);
    logger.info(`   - Errors: ${stats.errors}`);
    
  } catch (error) {
    logger.error('❌ Service extraction failed:', error);
    throw error;
  }
}

if (require.main === module) {
  extractServices()
    .then(() => {
      console.log('🎉 Phase 3 Step 3 completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Phase 3 Step 3 failed:', error);
      process.exit(1);
    });
}