import { MigrationLogger } from '../shared/logger';
import { MigrationDatabase } from '../shared/database';
import type { Database } from '../../../types/database.types';
import fs from 'fs/promises';
import path from 'path';

interface TransformedBooking {
  id: string;
  customer_id: string;
  stylist_id: string;
  start_time: string;
  end_time: string;
  message_to_stylist: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  cancelled_at: string | null;
  cancellation_reason: string | null;
  address_id: string | null;
  total_price: number;
  total_duration_minutes: number;
  service_ids: string[];
}

interface BookingCreationResult {
  id: string;
  success: boolean;
  error?: string;
}

interface BookingCreationStats {
  total_bookings: number;
  successful_creations: number;
  failed_creations: number;
  status_distribution: Record<string, number>;
  price_range: { min: number; max: number; avg: number };
}

export async function createBookings(): Promise<void> {
  const logger = new MigrationLogger('create-bookings');
  const db = new MigrationDatabase(logger);
  
  try {
    logger.info('Starting Phase 4 Step 2: Create Bookings in Supabase');
    
    // Read extracted booking data
    const tempDir = path.join(process.cwd(), 'scripts/migration/temp');
    const extractedData = JSON.parse(
      await fs.readFile(path.join(tempDir, 'bookings-extracted.json'), 'utf-8')
    );
    
    const bookings: TransformedBooking[] = extractedData.bookings;
    logger.info(`Creating ${bookings.length} bookings in Supabase...`);
    
    const results: BookingCreationResult[] = [];
    const statusDistribution: Record<string, number> = {};
    const prices: number[] = [];
    
    // Create bookings in Supabase
    for (const booking of bookings) {
      try {
        // Prepare booking data for insertion
        // Note: address_id set to null temporarily - will be updated after Phase 2 address migration
        const bookingData: Database["public"]["Tables"]["bookings"]["Insert"] = {
          id: booking.id,
          customer_id: booking.customer_id,
          stylist_id: booking.stylist_id,
          start_time: booking.start_time,
          end_time: booking.end_time,
          message_to_stylist: booking.message_to_stylist,
          status: booking.status,
          cancelled_at: booking.cancelled_at,
          cancellation_reason: booking.cancellation_reason,
          address_id: null, // Temporarily null - addresses not migrated yet
          total_price: booking.total_price,
          total_duration_minutes: booking.total_duration_minutes,
        };
        
        const createResult = await db.createBooking(bookingData);
        
        if (createResult.success) {
          results.push({
            id: booking.id,
            success: true,
          });
          
          // Track statistics
          statusDistribution[booking.status] = (statusDistribution[booking.status] || 0) + 1;
          prices.push(booking.total_price);
          
          logger.debug(`✅ Created booking: ${booking.id} (${booking.status}, ${booking.total_price} NOK)`);
          
        } else {
          results.push({
            id: booking.id,
            success: false,
            error: createResult.error,
          });
          logger.error(`❌ Failed to create booking ${booking.id}: ${createResult.error}`);
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          id: booking.id,
          success: false,
          error: errorMessage,
        });
        logger.error(`❌ Exception creating booking ${booking.id}:`, error);
      }
    }
    
    // Calculate statistics
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const priceStats = prices.length > 0 ? {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length)
    } : { min: 0, max: 0, avg: 0 };
    
    const stats: BookingCreationStats = {
      total_bookings: bookings.length,
      successful_creations: successful,
      failed_creations: failed,
      status_distribution: statusDistribution,
      price_range: priceStats
    };
    
    // Save creation results
    await fs.writeFile(
      path.join(tempDir, 'bookings-created.json'),
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
    
    // Save creation statistics
    await fs.writeFile(
      path.join(tempDir, 'booking-creation-stats.json'),
      JSON.stringify(stats, null, 2)
    );
    
    logger.success(`✅ Bookings created successfully!`);
    logger.info(`📊 Creation Summary:`);
    logger.info(`   - Total bookings: ${stats.total_bookings}`);
    logger.info(`   - Successfully created: ${stats.successful_creations}`);
    logger.info(`   - Failed: ${stats.failed_creations}`);
    logger.info(`   - Status distribution:`, stats.status_distribution);
    logger.info(`   - Price range: ${stats.price_range.min}-${stats.price_range.max} NOK (avg: ${stats.price_range.avg})`);
    
    if (failed > 0) {
      logger.warn(`⚠️  ${failed} bookings failed to create. Check logs for details.`);
    }
    
  } catch (error) {
    logger.error('❌ Booking creation failed:', error);
    throw error;
  }
}

if (require.main === module) {
  createBookings()
    .then(() => {
      console.log('🎉 Phase 4 Step 2 completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Phase 4 Step 2 failed:', error);
      process.exit(1);
    });
}