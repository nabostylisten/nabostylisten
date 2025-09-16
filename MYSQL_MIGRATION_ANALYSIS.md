# MySQL Production Database Migration Analysis

## Database Structure Overview

### Core Tables Identified:
1. **address** - Polymorphic addresses (buyer_id, stylist_id, salon_id)
2. **booking** - Main booking records with JSON service field
3. **booking_services_service** - Junction table for booking-service relationships
4. **buyer** - Customer users with verification fields
5. **category** & **subcategory** - Service categorization
6. **chat** & **message** - Communication system
7. **favourite** - User favorites (NOT MIGRATED)
8. **image** & **service_images_image** - Media management
9. **payment** - Complex payment tracking with salon splits
10. **promocode** - Old discount system (NOT MIGRATED - new system)
11. **rating** - Reviews mapped to PostgreSQL
12. **salon** - Business model removed (NOT MIGRATED)
13. **service** - Services with subcategory references
14. **stripe_webhook_event** - Handled by Supabase (NOT MIGRATED)
15. **stylist** - Stylist users with salon references

## Key Migration Findings

### ✅ Migration Scripts Correctly Aligned

**Phase 1: Users** - ✅ CORRECT
- MySQL `buyer` + `stylist` → PostgreSQL `profiles` + `stylist_details`
- Handles ID consolidation, role mapping, verification flags
- Creates user_preferences with notification settings

**Phase 2: Addresses** - ✅ CORRECT + ENHANCEMENT NEEDED
- MySQL `address` → PostgreSQL `addresses` with PostGIS
- **CRITICAL**: Must use Mapbox integration from `lib/mapbox.ts`
- Handle polymorphic relationships (buyer_id, stylist_id, salon_id)
- Convert MySQL POINT coordinates to PostGIS geography

**Phase 3: Services** - ✅ CORRECT
- MySQL `category`/`subcategory` → PostgreSQL `service_categories`
- MySQL `service` → PostgreSQL `services` with trial session defaults
- Junction table for service-category relationships

**Phase 4: Bookings** - ✅ CORRECT + ENHANCED
- MySQL `booking` → PostgreSQL `bookings` with new tracking fields
- Handle JSON `service` field parsing for older bookings
- Enhanced with payment processing, trial session, reschedule fields

**Phase 5: Payments** - ✅ CORRECT + ENHANCED
- MySQL `payment` → PostgreSQL `payments`
- Map complex salon/platform splits to new structure
- Enhanced with affiliate integration fields

**Phase 6: Communication** - ✅ CORRECT
- MySQL `chat` + `message` → PostgreSQL `chats` + `chat_messages`
- Handle booking-based chat relationships

**Phase 7: Reviews** - ✅ CORRECT
- MySQL `rating` → PostgreSQL `reviews`
- Direct mapping with booking relationships

### 🚨 Critical Migration Requirements

#### Address Migration Enhancement Required:
```typescript
// Current address extraction needs Mapbox enhancement
import { getGeometryFromAddressComponents } from '@/lib/mapbox';

// For each address record:
const geometry = await getGeometryFromAddressComponents({
  streetAddress: address.street_name + ' ' + address.street_no,
  city: address.city,
  postalCode: address.zipcode,
  country: address.country
});

// Insert with PostGIS geography:
const postgresAddress = {
  // ... other fields
  location: geometry ? `POINT(${geometry[0]} ${geometry[1]})` : null
};
```

### ❌ Tables NOT Migrated (Correct Decisions):

1. **salon** - Business model removed
2. **favourite** - Not migrated (can be re-implemented)
3. **promocode** - Replaced with new discount system
4. **stripe_webhook_event** - Handled by Supabase Edge Functions

### 📊 Data Volume Estimates (from INSERT samples):
- **Addresses**: 1000+ records with complex geographic data
- **Users**: Substantial buyer/stylist base needing consolidation
- **Bookings**: Active booking history with JSON service fields
- **Services**: Multiple services per stylist with subcategory links

### 🔧 Migration Script Verification Status:

✅ **All 7 phases correctly structured**
✅ **New schema fields properly defaulted**
✅ **Logging to scripts/migration/logs/**
✅ **Polymorphic relationship handling**
✅ **JSON field parsing in bookings**
✅ **Enhanced payment/booking tracking**

### ⚠️ Key Risks Identified:

1. **Address Coordinates**: MySQL binary POINT data needs proper PostGIS conversion
2. **User ID Collisions**: buyer/stylist consolidation requires careful mapping
3. **Booking JSON Services**: Older bookings use JSON field vs junction table
4. **Payment Complexity**: salon splits and platform fees need careful calculation
5. **Geographic Data**: Must use Mapbox for address validation/geocoding

### 🎯 Immediate Actions:

1. **Enhance Address Migration**: Integrate Mapbox geocoding for accurate PostGIS data
2. **Verify Coordinate Conversion**: Test MySQL POINT → PostGIS geography transformation
3. **Validate User Consolidation**: Ensure no ID collisions in buyer/stylist merge
4. **Test JSON Parsing**: Verify booking service JSON extraction works correctly

### 💡 Migration Success Indicators:

- All user types consolidated without ID conflicts
- Geographic queries work correctly with PostGIS
- Booking-service relationships preserved (JSON + junction)
- Payment totals match between old/new systems
- Enhanced features (trial sessions, payment tracking) properly initialized

**CONCLUSION**: Migration scripts are well-aligned with production data structure. Primary enhancement needed is Mapbox integration for address geocoding during migration to ensure accurate PostGIS geography data.