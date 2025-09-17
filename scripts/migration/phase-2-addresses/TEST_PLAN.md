# Phase 2 Address Migration Test Plan

## Overview

This test plan provides step-by-step validation procedures for each script in the Phase 2 Address Migration process. Phase 2 depends on completed Phase 1 (User Migration) and migrates address data from MySQL to Supabase with PostGIS geography support.

## Prerequisites

- **Phase 1 Completed**: User migration must be successfully completed
- **Required Files**: `user-id-mapping.json` and `consolidated-users.json` from Phase 1
- **MySQL dump file**: `/Users/magnusrodseth/dev/personal/nabostylisten/nabostylisten_prod.sql`
- **Supabase local database**: Running with Phase 1 data
- **PostGIS Extension**: Enabled in Supabase for geography data types

## Environment Variables

Set these before running any scripts:

```bash
export HEAD_LIMIT=10  # Start with small batch for testing
```

---

## Step 1: Extract Addresses (`01-extract-addresses.ts`)

### Purpose

Extracts address records from MySQL dump, resolves polymorphic relationships (buyer_id/stylist_id → user_id), processes address data, and converts MySQL POINT coordinates to PostGIS format.

### Input Validation

1. **Verify MySQL dump has address table:**

   ```bash
   grep -c "CREATE TABLE \`address\`" nabostylisten_prod.sql  # Should return 1
   grep -c "INSERT INTO \`address\`" nabostylisten_prod.sql  # Should return > 0
   ```

2. **Verify Phase 1 dependencies exist:**

   ```bash
   ls scripts/migration/temp/user-id-mapping.json  # Should exist
   ls scripts/migration/temp/consolidated-users.json  # Should exist
   ```

### Expected MySQL Address Table Structure

**Address table columns:**

- id (varchar 36)
- buyer_id, stylist_id, salon_id (varchar 255) - polymorphic relationships
- coordinates (MySQL POINT) - spatial data
- formatted_address, short_address, tag (varchar 255)
- street_name, street_no, city, zipcode, country (text)
- created_at, updated_at, deleted_at (datetime)

### Run the Script

```bash
bun run scripts/migration/phase-2-addresses/01-extract-addresses.ts
```

### Output Files to Validate

#### 1. `temp/processed-addresses.json`

**Expected Structure:**

```json
{
  "metadata": {
    "extracted_at": "ISO date string",
    "stats": {
      "total_addresses": number,
      "active_addresses": number,
      "processed_addresses": number,
      "skipped_addresses": number,
      "addresses_with_coordinates": number,
      "buyer_addresses": number,
      "stylist_addresses": number,
      "geocoding_stats": {
        "enabled": false,
        "requests_made": 0,
        "failed_geocodes": 0,
        "high_confidence": number,
        "medium_confidence": number,
        "low_confidence": number,
        "no_geocoding": number
      }
    }
  },
  "addresses": [
    {
      "id": "UUID from MySQL",
      "user_id": "Supabase user UUID",
      "street_address": "string or null",
      "city": "string or null",
      "postal_code": "string or null",
      "country": "string or null",
      "country_code": "string or null",
      "nickname": "string or null",
      "entry_instructions": "string or null",
      "location": "PostGIS POINT string or null",
      "is_primary": false,
      "created_at": "ISO date",
      "updated_at": "ISO date",
      "source_table": "buyer|stylist",
      "original_id": "MySQL UUID",
      "geocoding_confidence": "high|medium|low|none"
    }
  ]
}
```

**Validation Checks:**

- [ ] All addresses have valid UUID in `id`
- [ ] All addresses have valid `user_id` mapping to Phase 1 users
- [ ] Source table is either "buyer" or "stylist"
- [ ] No salon addresses included (salon_id should be filtered out)
- [ ] Country defaults to "Norway" if null
- [ ] Geocoding confidence is "none" (geocoding deferred)
- [ ] Primary flag is false (will be set in Step 3)

#### 2. `temp/skipped-addresses.json`

**Expected Structure:**

```json
{
  "metadata": {
    "extracted_at": "ISO date",
    "count": number
  },
  "skipped": [
    {
      "address": {
        // MySQL address record
      },
      "reason": "No valid user mapping found|Other error"
    }
  ]
}
```

#### 3. `temp/address-migration-stats.json`

**Validation:**

- [ ] All counts are non-negative integers
- [ ] active_addresses <= total_addresses
- [ ] processed_addresses + skipped_addresses <= active_addresses
- [ ] buyer_addresses + stylist_addresses = processed_addresses

### Common Issues & Solutions (Step 1)

| Issue                        | Solution                                         |
| ---------------------------- | ------------------------------------------------ |
| "No user mapping found"      | Ensure Phase 1 completed successfully            |
| Missing coordinates          | Expected - geocoding deferred to separate script |
| High skipped count           | Check user mapping file integrity                |
| Polymorphic resolution fails | Verify buyer_id/stylist_id exist in user mapping |

---

## Step 2: Enhance Addresses with Mapbox Geocoding (Manual Step)

### Purpose (Step 2)

Enhances processed addresses with accurate geography data using Mapbox Geocoding API. This step converts address strings to precise coordinates and validates location data before database insertion.

### Prerequisites (Step 2)

- **Mapbox Token**: Environment variable `MAPBOX_TOKEN` or `NEXT_PUBLIC_MAPBOX_TOKEN` must be set
- **Input File**: `temp/processed-addresses.json` from Step 1
- **Rate Limiting**: Mapbox has API rate limits (consider batch processing)

### Mapbox Environment Setup

```bash
export MAPBOX_TOKEN="your_mapbox_token_here"
# or
export NEXT_PUBLIC_MAPBOX_TOKEN="your_mapbox_token_here"
```

### Geocoding Process

This step should be implemented using the `MapboxGeocoder` class from `scripts/migration/shared/mapbox-helper.ts`:

#### Implementation Example

```typescript
import { MapboxGeocoder } from "../shared/mapbox-helper";
import { MigrationLogger } from "../shared/logger";

const logger = new MigrationLogger();
const geocoder = new MapboxGeocoder(logger);

// Load processed addresses
const addresses = loadProcessedAddresses();

// Batch geocode with rate limiting
const enhancedAddresses = await geocoder.batchGeocode(addresses, {
  batchSize: 10,
  delayMs: 100,
  onProgress: (current, total) => {
    logger.progress({
      phase: "Phase 2 Geocoding",
      step: "Mapbox Enhancement",
      current,
      total,
      percentage: (current / total) * 100,
      start_time: new Date().toISOString(),
      errors: [],
    });
  },
});

// Save enhanced addresses back to processed-addresses.json
```

### Expected Enhancements

For each address, the geocoding should:

1. **Validate Existing Coordinates**: Check if MySQL coordinates are already valid
2. **Geocode Missing Coordinates**: Use street address, city, postal code to get coordinates
3. **Enhance Country Codes**: Get ISO country codes from Mapbox context
4. **Set Confidence Levels**:
   - `high`: Exact address match with coordinates
   - `medium`: Approximate address match
   - `low`: City/postal code level match
   - `none`: No geocoding possible

### Output Validation

After geocoding, `temp/processed-addresses.json` should be updated with:

```json
{
  "addresses": [
    {
      "location": "POINT(10.7522 59.9139)", // Oslo coordinates example
      "country_code": "NO", // Enhanced from Mapbox
      "geocoding_confidence": "high" // Updated confidence
      // ... other fields unchanged
    }
  ]
}
```

**Validation Checks:**

- [ ] All valid addresses have `location` in `POINT(lng lat)` format
- [ ] Coordinates are within Nordic region bounds (lng: -10 to 35, lat: 50 to 75)
- [ ] `country_code` is set where available (e.g., "NO", "SE", "DK")
- [ ] `geocoding_confidence` reflects actual geocoding success
- [ ] Failed geocodes are logged with reasons

### Geocoding Statistics

Track and log these metrics:

- Total Mapbox API requests made
- Successful geocodes by confidence level
- Failed geocodes with addresses
- Rate limiting delays applied
- Enhanced country codes count

### Common Issues & Solutions (Step 2)

| Issue                | Solution                                |
| -------------------- | --------------------------------------- |
| Rate limit exceeded  | Increase `delayMs` between batches      |
| Invalid coordinates  | Validate Nordic region bounds           |
| API token not found  | Set MAPBOX_TOKEN environment variable   |
| Geocoding failures   | Log failed addresses for manual review  |
| Incomplete addresses | Use city/postal code fallback geocoding |

### Manual Alternative

If Mapbox token is not available:

1. Keep original `geocoding_confidence: "none"`
2. Proceed to Step 3 with limited location data
3. Consider manual coordinate entry for critical addresses

---

## Step 3: Create Addresses (`02-create-addresses.ts`)

### Purpose (Step 3)

Creates address records in Supabase database with PostGIS geography support, handling coordinate data conversion from MySQL POINT to PostGIS format.

### Input Requirements (Step 3)

- `temp/processed-addresses.json` (enhanced from Step 2 geocoding)
- `temp/address-migration-stats.json` (from Step 1)

### Run the Script (Step 3)

```bash
bun run scripts/migration/phase-2-addresses/02-create-addresses.ts
```

### Output Files to Validate (Step 3)

#### 1. `temp/addresses-created.json`

**Expected Structure:**

```json
{
  "metadata": {
    "created_at": "ISO date",
    "total_processed": number,
    "successful": number,
    "errors": number,
    "addresses_with_coordinates": number,
    "geocoding_confidence_distribution": {
      "high": number,
      "medium": number,
      "low": number,
      "none": number
    }
  },
  "results": [
    {
      "original_id": "MySQL UUID",
      "supabase_id": "same as original_id",
      "user_id": "Supabase user UUID",
      "city": "string or null",
      "has_coordinates": boolean,
      "geocoding_confidence": "high|medium|low|none",
      "success": boolean,
      "error": "error message"  // Only if success=false
    }
  ]
}
```

**Validation Checks:**

- [ ] All successful results created in database
- [ ] Error count matches failed entries
- [ ] Total processed = successful + errors
- [ ] Coordinate validation (Nordic region: lng -10 to 35, lat 50 to 75)

### Database Validation (Step 3)

```sql
-- Check addresses table
SELECT COUNT(*) FROM addresses;  -- Should match successful count

-- Verify address data integrity
SELECT
  COUNT(*) as total,
  COUNT(DISTINCT id) as unique_ids,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(CASE WHEN location IS NOT NULL THEN 1 ELSE 0 END) as with_coordinates,
  SUM(CASE WHEN is_primary = true THEN 1 ELSE 0 END) as primary_addresses
FROM addresses;

-- Check user relationships
SELECT COUNT(*)
FROM addresses a
LEFT JOIN profiles p ON a.user_id = p.id
WHERE p.id IS NULL;  -- Should be 0

-- Validate PostGIS geography data
SELECT COUNT(*)
FROM addresses
WHERE location IS NOT NULL
AND ST_IsValid(location::geometry) = false;  -- Should be 0
```

### Common Issues & Solutions (Step 3)

| Issue                     | Solution                               |
| ------------------------- | -------------------------------------- |
| PostGIS validation errors | Check coordinate format and ranges     |
| Foreign key violations    | Ensure user exists from Phase 1        |
| Geography type errors     | Verify PostGIS extension enabled       |
| Batch insert failures     | Check individual address data validity |

---

## Step 4: Update Primary Addresses (`03-update-primary-addresses.ts`)

### Purpose (Step 4)

Updates `is_primary` flags for addresses based on `default_address_id` references from MySQL buyer and stylist tables.

### Input Requirements (Step 4)

- `temp/consolidated-users.json` (from Phase 1)
- `temp/addresses-created.json` (from Step 3)
- `temp/address-migration-stats.json` (from Step 3)
- Access to MySQL dump for default_address_id extraction

### Run the Script (Step 4)

```bash
bun run scripts/migration/phase-2-addresses/03-update-primary-addresses.ts
```

### Output Files to Validate (Step 4)

#### 1. `temp/primary-addresses-updated.json`

**Expected Structure:**

```json
{
  "metadata": {
    "updated_at": "ISO date",
    "total_updates": number,
    "successful_updates": number,
    "errors": number
  },
  "updates": [
    {
      "user_id": "Supabase user UUID",
      "address_id": "Address UUID",
      "user_email": "user email",
      "success": boolean,
      "error": "error message"  // Only if success=false
    }
  ]
}
```

**Validation Checks:**

- [ ] Updates only addresses that were successfully created in Step 3
- [ ] Each user has at most one primary address
- [ ] All updated addresses exist in database

### Database Validation (Step 4)

```sql
-- Check primary addresses
SELECT COUNT(*) FROM addresses WHERE is_primary = true;  -- Should match successful updates

-- Verify no user has multiple primary addresses
SELECT user_id, COUNT(*) as primary_count
FROM addresses
WHERE is_primary = true
GROUP BY user_id
HAVING COUNT(*) > 1;  -- Should return no rows

-- Check address update integrity
SELECT
  COUNT(*) as total_addresses,
  SUM(CASE WHEN is_primary = true THEN 1 ELSE 0 END) as primary_addresses,
  COUNT(DISTINCT user_id) as users_with_addresses
FROM addresses;
```

### Common Issues & Solutions (Step 4)

| Issue                      | Solution                                    |
| -------------------------- | ------------------------------------------- |
| No primary updates needed  | Normal if few users have default_address_id |
| Multiple primary addresses | Check for duplicate address references      |
| Primary address not found  | Verify address was created in Step 3        |
| Update failures            | Check address ID validity and constraints   |

---

## Final Phase 2 Validation

### Complete Database State Check

```sql
-- Final verification queries
SELECT
  'Total Addresses' as metric, COUNT(*) as count FROM addresses
UNION ALL
SELECT
  'Addresses with Coordinates', COUNT(*) FROM addresses WHERE location IS NOT NULL
UNION ALL
SELECT
  'Primary Addresses', COUNT(*) FROM addresses WHERE is_primary = true
UNION ALL
SELECT
  'Users with Addresses', COUNT(DISTINCT user_id) FROM addresses;

-- Verify no orphaned addresses
SELECT COUNT(*)
FROM addresses a
LEFT JOIN profiles p ON a.user_id = p.id
WHERE p.id IS NULL;  -- Should be 0

-- Geography data validation
SELECT COUNT(*)
FROM addresses
WHERE location IS NOT NULL
AND ST_Within(location::geometry, ST_MakeEnvelope(-10, 50, 35, 75, 4326)) = false;  -- Should be 0 (Nordic region)
```

### Success Criteria

Phase 2 is considered successful when:

- ✅ All 4 steps complete without critical errors (including Mapbox geocoding)
- ✅ Address count matches processed addresses from Step 1
- ✅ All addresses link to valid users from Phase 1
- ✅ PostGIS geography data is valid
- ✅ Primary address flags correctly set
- ✅ No orphaned or duplicate records

---

## Rollback Procedure

If any step fails critically:

1. **Clean address data:**

   ```sql
   DELETE FROM addresses;
   ```

2. **Reset temp files:**

   ```bash
   rm -f scripts/migration/temp/processed-addresses.json
   rm -f scripts/migration/temp/addresses-created.json
   rm -f scripts/migration/temp/primary-addresses-updated.json
   rm -f scripts/migration/temp/address-migration-stats.json
   rm -f scripts/migration/temp/skipped-addresses.json
   ```

3. **Fix identified issues**

4. **Re-run from Step 1**

**Note**: If only geocoding fails, you can restart from Step 2 (Mapbox geocoding) without re-extracting addresses.

---

## Next Steps

After successful Phase 2 completion, proceed to Phase 3 (Services Migration) or other data migration phases.
