import { MigrationLogger } from '../shared/logger';
import { MySQLParser } from '../phase-1-users/utils/mysql-parser';
import fs from 'fs/promises';
import path from 'path';

interface MySQLBooking {
  id: string;
  buyer_id: string;
  stylist_id: string;
  date_time: string;
  amount: string; // MySQL decimal as string
  status: string;
  additional_notes: string | null;
  address_id: string | null;
  created_at: string;
  updated_at: string;
  service: string | null; // JSON field for older bookings
}

interface TransformedBooking {
  id: string;
  customer_id: string; // Mapped from buyer_id
  stylist_id: string;   // Mapped via user mapping
  start_time: string;
  end_time: string;     // Calculated from start_time + total_duration
  message_to_stylist: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  cancelled_at: string | null;
  cancellation_reason: string | null;
  address_id: string | null;
  total_price: number;
  total_duration_minutes: number;
  service_ids: string[]; // Parsed from JSON or will be from junction table
  // New fields (not in old MySQL system - set to defaults)
  needs_destination_update: boolean;
  payment_captured_at: string | null;
  payout_processed_at: string | null;
  customer_receipt_email_sent_at: string | null;
  stylist_notification_email_sent_at: string | null;
  payout_email_sent_at: string | null;
  rescheduled_from: string | null;
  rescheduled_at: string | null;
  reschedule_reason: string | null;
  is_trial_session: boolean;
  main_booking_id: string | null;
  trial_booking_id: string | null;
}

interface BookingMigrationStats {
  total_bookings: number;
  processed_bookings: number;
  skipped_bookings: number;
  status_mappings: Record<string, number>;
  bookings_with_json_services: number;
  bookings_missing_user_mapping: number;
  errors: number;
}

// Parse booking.service JSON field for older bookings
const parseBookingServices = (bookingService: string | null): string[] => {
  if (!bookingService) return [];
  
  try {
    const parsed = JSON.parse(bookingService);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
};

// Map MySQL booking statuses to PostgreSQL booking statuses
const mapBookingStatus = (mysqlStatus: string): {
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  cancellation_reason: string | null;
} => {
  switch (mysqlStatus) {
    case 'payment_pending':
    case 'needs_confirmation':
      return { status: 'pending', cancellation_reason: null };
    
    case 'confirmed':
      return { status: 'confirmed', cancellation_reason: null };
    
    case 'cancelled':
      return { status: 'cancelled', cancellation_reason: null };
    
    case 'completed':
      return { status: 'completed', cancellation_reason: null };
    
    case 'rejected':
      return { status: 'cancelled', cancellation_reason: 'Rejected by stylist' };
    
    case 'system_cancel':
      return { status: 'cancelled', cancellation_reason: 'System cancellation' };
    
    case 'expired':
      return { status: 'cancelled', cancellation_reason: 'Booking expired' };
    
    case 'failed':
      return { status: 'cancelled', cancellation_reason: 'Payment failed' };
    
    default:
      return { status: 'pending', cancellation_reason: null };
  }
};

// Calculate end_time based on service durations (placeholder - will be refined)
const calculateEndTime = (startTime: string, serviceIds: string[]): { endTime: string; totalDuration: number } => {
  // For now, default to 60 minutes per service until we can look up actual service durations
  const defaultDurationPerService = 60;
  const totalDuration = serviceIds.length > 0 ? serviceIds.length * defaultDurationPerService : defaultDurationPerService;
  
  const startDate = new Date(startTime);
  const endDate = new Date(startDate.getTime() + totalDuration * 60 * 1000);
  
  return {
    endTime: endDate.toISOString(),
    totalDuration
  };
};

export async function extractBookings(): Promise<void> {
  const logger = new MigrationLogger('extract-bookings');
  
  try {
    logger.info('Starting Phase 4 Step 1: Extract Bookings');
    
    // Load user ID mapping from Phase 1
    const tempDir = path.join(process.cwd(), 'scripts/migration/temp');
    const mappingData = JSON.parse(
      await fs.readFile(path.join(tempDir, 'user-id-mapping.json'), 'utf-8')
    );
    const userIdMapping: Record<string, string> = mappingData.mapping;
    logger.info(`Loaded ${Object.keys(userIdMapping).length} user ID mappings`);
    
    // Parse MySQL dump for booking data
    const dumpPath = path.join(process.cwd(), 'nabostylisten_dump.sql');
    const parser = new MySQLParser(dumpPath, logger);
    
    logger.info('Parsing bookings from MySQL dump...');
    const bookings = await parser.parseTable<MySQLBooking>('booking');
    logger.info(`Found ${bookings.length} bookings`);
    
    // Transform bookings
    logger.info('Transforming bookings...');
    const transformedBookings: TransformedBooking[] = [];
    let skippedBookings = 0;
    const statusMappings: Record<string, number> = {};
    let bookingsWithJsonServices = 0;
    let bookingsMissingUserMapping = 0;
    
    for (const booking of bookings) {
      try {
        // Map buyer_id and stylist_id using Phase 1 user mapping
        const mappedCustomerId = userIdMapping[booking.buyer_id];
        const mappedStylistId = userIdMapping[booking.stylist_id];
        
        if (!mappedCustomerId || !mappedStylistId) {
          logger.warn(`Skipping booking ${booking.id}: missing user mapping (customer: ${!mappedCustomerId ? booking.buyer_id : 'OK'}, stylist: ${!mappedStylistId ? booking.stylist_id : 'OK'})`);
          skippedBookings++;
          bookingsMissingUserMapping++;
          continue;
        }
        
        // Parse service IDs from JSON field
        const serviceIds = parseBookingServices(booking.service);
        if (booking.service && serviceIds.length > 0) {
          bookingsWithJsonServices++;
        }
        
        // Map booking status
        const { status, cancellation_reason } = mapBookingStatus(booking.status);
        statusMappings[booking.status] = (statusMappings[booking.status] || 0) + 1;
        
        // Calculate end time and duration
        const { endTime, totalDuration } = calculateEndTime(booking.date_time, serviceIds);
        
        // Determine cancelled_at timestamp
        const cancelledAt = ['cancelled', 'rejected', 'system_cancel', 'expired', 'failed'].includes(booking.status)
          ? booking.updated_at
          : null;
        
        const transformedBooking: TransformedBooking = {
          id: booking.id,
          customer_id: mappedCustomerId,
          stylist_id: mappedStylistId,
          start_time: booking.date_time,
          end_time: endTime,
          message_to_stylist: booking.additional_notes,
          status,
          cancelled_at: cancelledAt,
          cancellation_reason,
          address_id: booking.address_id, // Will need Phase 2 mapping if addresses migrated
          total_price: parseFloat(booking.amount),
          total_duration_minutes: totalDuration,
          service_ids: serviceIds,
          // New fields (not in old MySQL system - set to defaults)
          needs_destination_update: false, // Default false for migrated bookings
          payment_captured_at: null, // Default null - will be set by automated payment processing
          payout_processed_at: null, // Default null - will be set by automated payout processing
          customer_receipt_email_sent_at: null, // Default null - email tracking starts post-migration
          stylist_notification_email_sent_at: null, // Default null
          payout_email_sent_at: null, // Default null
          rescheduled_from: null, // Default null - reschedule tracking starts post-migration
          rescheduled_at: null, // Default null
          reschedule_reason: null, // Default null
          is_trial_session: false, // Default false - trial sessions are new functionality
          main_booking_id: null, // Default null - trial session linking is new
          trial_booking_id: null, // Default null
        };
        
        transformedBookings.push(transformedBooking);
        
        logger.debug(`✓ Transformed booking: ${booking.id} (${booking.status} → ${status})`);
        
      } catch (error) {
        logger.error(`❌ Failed to transform booking ${booking.id}:`, error);
        skippedBookings++;
      }
    }
    
    // Generate migration statistics
    const stats: BookingMigrationStats = {
      total_bookings: bookings.length,
      processed_bookings: transformedBookings.length,
      skipped_bookings: skippedBookings,
      status_mappings: statusMappings,
      bookings_with_json_services: bookingsWithJsonServices,
      bookings_missing_user_mapping: bookingsMissingUserMapping,
      errors: skippedBookings
    };
    
    // Save extracted data
    await fs.writeFile(
      path.join(tempDir, 'bookings-extracted.json'),
      JSON.stringify({
        metadata: {
          extracted_at: new Date().toISOString(),
          total_bookings: transformedBookings.length,
        },
        bookings: transformedBookings,
      }, null, 2)
    );
    
    // Save statistics
    await fs.writeFile(
      path.join(tempDir, 'booking-migration-stats.json'),
      JSON.stringify(stats, null, 2)
    );
    
    logger.success(`✅ Bookings extracted successfully!`);
    logger.info(`📊 Statistics:`);
    logger.info(`   - Total bookings found: ${stats.total_bookings}`);
    logger.info(`   - Bookings to migrate: ${stats.processed_bookings}`);
    logger.info(`   - Skipped bookings: ${stats.skipped_bookings}`);
    logger.info(`   - Bookings with JSON services: ${stats.bookings_with_json_services}`);
    logger.info(`   - Missing user mapping: ${stats.bookings_missing_user_mapping}`);
    logger.info(`   - Status mappings:`, stats.status_mappings);
    
  } catch (error) {
    logger.error('❌ Booking extraction failed:', error);
    throw error;
  }
}

if (require.main === module) {
  extractBookings()
    .then(() => {
      console.log('🎉 Phase 4 Step 1 completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Phase 4 Step 1 failed:', error);
      process.exit(1);
    });
}