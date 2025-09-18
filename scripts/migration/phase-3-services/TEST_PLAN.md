# Phase 3 Services Migration Test Plan

## Overview

This test plan provides step-by-step validation procedures for each script in the Phase 3 Services Migration process. This phase migrates the service catalog system from MySQL's category/subcategory + service structure to PostgreSQL's hierarchical service_categories + services structure.

## Prerequisites

- MySQL dump file: `/Users/magnusrodseth/dev/personal/nabostylisten/nabostylisten_prod.sql`
- Supabase local database running
- All dependencies installed (`bun install`)
- **Phase 1 User Migration completed successfully** (required for stylist_id references)

## Step 1: Extract Categories (`01-extract-categories.ts`)

### Purpose

Parses MySQL dump to extract category and subcategory records, handling the MySQL category → subcategory hierarchy and preparing it for PostgreSQL's self-referential structure.

### Input Validation

1. **Verify MySQL dump has required tables:**

   ```bash
   grep -c "CREATE TABLE \`category\`" nabostylisten_prod.sql  # Should return 1
   grep -c "CREATE TABLE \`subcategory\`" nabostylisten_prod.sql  # Should return 1
   ```

2. **Check for INSERT statements:**

   ```bash
   grep -c "INSERT INTO \`category\`" nabostylisten_prod.sql  # Should return > 0
   grep -c "INSERT INTO \`subcategory\`" nabostylisten_prod.sql  # Should return > 0
   ```

### Expected MySQL Table Structure

**Category table columns:**

- id (varchar 36)
- name (varchar 255)
- description (text)
- created_at, updated_at (datetime)

**Subcategory table columns:**

- id (varchar 36)
- name (varchar 255)
- description (text)
- category_id (varchar 36) - foreign key to category.id
- created_at, updated_at (datetime)

### Run the Script

```bash
bun run scripts/migration/phase-3-services/01-extract-categories.ts
```

### Output Files to Validate

#### 1. `temp/extracted-categories.json`

**Expected Structure:**

```json
{
  "metadata": {
    "extracted_at": "ISO date string",
    "source_dump": "path to dump file",
    "stats": {
      "total_categories": number,
      "total_subcategories": number,
      "parent_categories_found": number,
      "subcategories_with_parent": number,
      "orphaned_subcategories": number,
      "errors": number
    }
  },
  "parent_categories": [
    {
      "id": "UUID from MySQL category table",
      "name": "string",
      "description": "string or null",
      "created_at": "ISO date",
      "updated_at": "ISO date"
    }
  ],
  "subcategories": [
    {
      "id": "UUID from MySQL subcategory table",
      "name": "string",
      "description": "string or null",
      "parent_category_id": "UUID referencing parent category",
      "created_at": "ISO date",
      "updated_at": "ISO date"
    }
  ]
}
```

**Validation Checks:**

- [ ] All categories have valid UUID in `id`
- [ ] All subcategories have valid `parent_category_id`
- [ ] No orphaned subcategories (parent_category_id references existing category)
- [ ] All dates are valid ISO strings
- [ ] Category names are unique within each level
- [ ] Stats match actual array lengths

#### 2. `temp/category-migration-stats.json`

**Expected Structure:**

```json
{
  "extraction_stats": {
    "categories_extracted": number,
    "subcategories_extracted": number,
    "total_extracted": number,
    "errors": number
  },
  "data_quality": {
    "valid_categories": number,
    "valid_subcategories": number,
    "invalid_records": number,
    "missing_parents": number
  }
}
```

### Common Issues & Solutions

| Issue                        | Solution                                   |
| ---------------------------- | ------------------------------------------ |
| "Failed to parse MySQL dump" | Check dump file exists and is readable     |
| "Orphaned subcategories"     | Review subcategory.category_id references  |
| "Invalid UUID format"        | Check MySQL UUID format consistency        |
| "Missing parent categories"  | Verify category table has required records |

---

## Step 2: Create Categories (`02-create-categories.ts`)

### Purpose

Creates service category records in PostgreSQL based on extracted MySQL categories and subcategories, establishing the hierarchical relationship. This step also creates the hard-coded parent categories (Hair, Makeup, Nails, Lashes, Brows) first.

### Input Requirements

- `temp/extracted-categories.json` (from Step 1)

### Run the Script

```bash
bun run scripts/migration/phase-3-services/02-create-categories.ts
```

### Output Files to Validate

#### `temp/categories-created.json`

**Expected Structure:**

```json
{
  "metadata": {
    "created_at": "ISO date",
    "total_processed": number,
    "successful": number,
    "errors": number,
    "skipped": number
  },
  "results": [
    {
      "original_id": "MySQL UUID",
      "name": "category name",
      "type": "parent_category|subcategory",
      "success": boolean,
      "error": "error message",  // Only if success=false
      "skipped": boolean,        // If already exists
      "skip_reason": "string"    // If skipped=true
    }
  ]
}
```

### Database Validation

```sql
-- Check total category count
SELECT COUNT(*) FROM service_categories;
-- Should equal: 5 (parents) + successful subcategories

-- Verify hierarchy structure
SELECT
  parent.name as parent_name,
  COUNT(child.id) as subcategory_count
FROM service_categories parent
LEFT JOIN service_categories child ON parent.id = child.parent_category_id
WHERE parent.parent_category_id IS NULL
GROUP BY parent.id, parent.name
ORDER BY parent.name;

-- Check for orphaned subcategories
SELECT COUNT(*)
FROM service_categories child
LEFT JOIN service_categories parent ON child.parent_category_id = parent.id
WHERE child.parent_category_id IS NOT NULL
  AND parent.id IS NULL;  -- Should be 0

-- Verify data integrity
SELECT
  COUNT(*) as total,
  COUNT(DISTINCT id) as unique_ids,
  COUNT(DISTINCT name) as unique_names,
  SUM(CASE WHEN parent_category_id IS NULL THEN 1 ELSE 0 END) as parents,
  SUM(CASE WHEN parent_category_id IS NOT NULL THEN 1 ELSE 0 END) as subcategories
FROM service_categories;
```

### Success Criteria

- [ ] All parent categories (5) + extracted subcategories created
- [ ] No orphaned subcategories
- [ ] All parent categories have `parent_category_id = NULL`
- [ ] All subcategories have valid `parent_category_id`
- [ ] No duplicate category names within same level
- [ ] Error rate < 5%

### Common Issues & Solutions

| Issue                       | Solution                                      |
| --------------------------- | --------------------------------------------- |
| "Parent category not found" | Ensure Step 1 completed successfully          |
| "Duplicate category name"   | Check for name conflicts in MySQL data        |
| "Foreign key violation"     | Verify parent_category_id references exist    |
| "UUID constraint error"     | Check for ID conflicts with parent categories |

---

## Step 3: Extract Services (`03-extract-services.ts`)

### Purpose

Parses MySQL dump to extract service records, handling complex description parsing, price/duration extraction, and category relationships.

### Input Validation

1. **Verify MySQL dump has service table:**

   ```bash
   grep -c "CREATE TABLE \`service\`" nabostylisten_prod.sql  # Should return 1
   grep -c "INSERT INTO \`service\`" nabostylisten_prod.sql  # Should return > 0
   ```

### Expected MySQL Service Table Structure

**Service table columns:**

- id (varchar 36)
- stylist_id (varchar 36)
- subcategory_id (varchar 36)
- description (text) - Contains both title and description
- duration (int) - Duration in minutes
- amount (decimal/int) - Price
- currency (varchar)
- is_published (tinyint)
- created_at, updated_at (datetime)
- deleted_at (datetime) - For soft deletes

### Run the Script

```bash
bun run scripts/migration/phase-3-services/03-extract-services.ts
```

### Output Files to Validate

#### 1. `temp/extracted-services.json`

**Expected Structure:**

```json
{
  "metadata": {
    "extracted_at": "ISO date string",
    "source_dump": "path to dump file",
    "stats": {
      "total_services": number,
      "active_services": number,
      "deleted_services": number,
      "services_with_valid_stylist": number,
      "services_with_valid_category": number,
      "parsing_errors": number,
      "validation_errors": number
    }
  },
  "services": [
    {
      "original_id": "UUID from MySQL",
      "stylist_id": "UUID (MySQL stylist ID)",
      "subcategory_id": "UUID (MySQL subcategory ID)",
      "title": "Extracted title (first line or up to 100 chars)",
      "description": "Remaining description content",
      "duration_minutes": number,
      "price": number,
      "currency": "NOK",
      "is_published": boolean,
      "created_at": "ISO date",
      "updated_at": "ISO date"
    }
  ]
}
```

**Validation Checks:**

- [ ] All services have valid UUID in `original_id`
- [ ] All `stylist_id` values exist in migrated profiles (role='stylist')
- [ ] All `subcategory_id` values exist in extracted categories
- [ ] `title` is not empty and <= 100 characters
- [ ] `duration_minutes` > 0
- [ ] `price` >= 0
- [ ] All dates are valid ISO strings
- [ ] Only active services (deleted_at IS NULL) are included

#### 2. `temp/service-parsing-errors.json`

**Expected Structure:**

```json
{
  "metadata": {
    "extracted_at": "ISO date",
    "total_errors": number
  },
  "errors": [
    {
      "service_id": "UUID",
      "error_type": "description_parsing|invalid_duration|invalid_price|missing_stylist|missing_category",
      "error_message": "Detailed error description",
      "raw_data": {
        "description": "original description",
        "duration": "original duration",
        "amount": "original amount",
        // ... other problematic fields
      }
    }
  ]
}
```

#### 3. `temp/service-migration-stats.json`

**Validation:**

- [ ] All counts are non-negative integers
- [ ] active_services + deleted_services = total_services
- [ ] services_with_valid_stylist <= active_services
- [ ] parsing_errors + validation_errors = total error count

### Common Issues & Solutions

| Issue                        | Solution                                            |
| ---------------------------- | --------------------------------------------------- |
| "Stylist not found"          | Verify Phase 1 migration completed for all stylists |
| "Category not found"         | Ensure Step 2 completed successfully                |
| "Description parsing failed" | Review MySQL description format edge cases          |
| "Invalid duration/price"     | Check for NULL or negative values in MySQL          |

### Important Note: Orphaned Services

⚠️ **Expected Behavior**: The migration will correctly skip services that reference stylists who no longer exist in the MySQL `stylist` table. This is intentional data integrity protection.

**Background**: In the old MySQL system, some stylists were deleted without cascading the delete to their services, resulting in orphaned service records. The migration system identifies these orphaned services and excludes them to maintain referential integrity in the new PostgreSQL database.

**Typical Impact**:
- Approximately 25-30 services may be skipped due to missing stylist references
- This represents ~10-15% of total services depending on the dataset
- These services cannot be migrated as they lack valid ownership

**Validation**: Check the `temp/services-created.json` output for skipped services with `skip_reason: "Stylist not found in user mapping"`

---

## Step 4: Create Services (`04-create-services.ts`)

### Purpose

Creates service records in PostgreSQL services table with proper foreign key relationships to profiles and service_categories.

### Input Requirements

- `temp/extracted-services.json` (from Step 4)
- User ID mapping from Phase 1 (`temp/user-id-mapping.json`)
- Categories in database (from Steps 1-3)

### Run the Script

```bash
bun run scripts/migration/phase-3-services/04-create-services.ts
```

### Output Files to Validate

#### `temp/services-created.json`

**Expected Structure:**

```json
{
  "metadata": {
    "created_at": "ISO date",
    "total_processed": number,
    "successful": number,
    "errors": number,
    "skipped": number
  },
  "results": [
    {
      "original_id": "MySQL UUID",
      "mysql_stylist_id": "MySQL stylist UUID",
      "postgres_stylist_id": "PostgreSQL stylist UUID",
      "title": "Service title",
      "success": boolean,
      "error": "error message",  // Only if success=false
      "skipped": boolean,        // If stylist not found
      "skip_reason": "string"    // If skipped=true
    }
  ],
  "service_id_mapping": {
    "mysql-service-uuid-1": "postgres-service-uuid-1",
    "mysql-service-uuid-2": "postgres-service-uuid-2"
  }
}
```

### Database Validation

```sql
-- Check services table
SELECT COUNT(*) FROM services;  -- Should match successful count

-- Verify service data integrity
SELECT
  COUNT(*) as total,
  COUNT(DISTINCT id) as unique_ids,
  COUNT(DISTINCT stylist_id) as unique_stylists,
  AVG(duration_minutes) as avg_duration,
  AVG(price) as avg_price,
  SUM(CASE WHEN is_published = true THEN 1 ELSE 0 END) as published_services
FROM services;

-- Check foreign key relationships
SELECT COUNT(*)
FROM services s
LEFT JOIN profiles p ON s.stylist_id = p.id
WHERE p.id IS NULL;  -- Should be 0

-- Verify stylist role constraint
SELECT COUNT(*)
FROM services s
JOIN profiles p ON s.stylist_id = p.id
WHERE p.role != 'stylist';  -- Should be 0

-- Check price and duration constraints
SELECT COUNT(*) FROM services WHERE price < 0;  -- Should be 0
SELECT COUNT(*) FROM services WHERE duration_minutes <= 0;  -- Should be 0
```

### Success Criteria

- [ ] All services with valid stylists created
- [ ] Service count matches successful extractions
- [ ] All foreign key relationships valid
- [ ] No services with invalid durations or prices
- [ ] Service ID mapping created for junction table creation
- [ ] Error rate < 5%

### Common Issues & Solutions

| Issue                          | Solution                                   |
| ------------------------------ | ------------------------------------------ |
| "Stylist not found in mapping" | Check Phase 1 user migration completeness  |
| "Foreign key violation"        | Ensure stylist profiles exist in database  |
| "Price constraint error"       | Verify price validation in extraction step |
| "Duration constraint error"    | Check duration parsing in extraction step  |

---

## Step 5: Create Service Categories Junction (`05-create-service-categories.ts`)

### Purpose

Creates the many-to-many relationship between services and categories in the service_service_categories junction table.

### Input Requirements

- `temp/services-created.json` (from Step 4)
- `temp/extracted-services.json` (from Step 3)
- Categories in database (from Steps 1-2)

### Run the Script

```bash
bun run scripts/migration/phase-3-services/05-create-service-categories.ts
```

### Output Files to Validate

#### 1. `temp/service-categories-created.json`

**Expected Structure:**

```json
{
  "metadata": {
    "created_at": "ISO date",
    "total_processed": number,
    "successful": number,
    "errors": number,
    "skipped": number
  },
  "results": [
    {
      "service_id": "PostgreSQL service UUID",
      "category_id": "PostgreSQL category UUID",
      "original_service_id": "MySQL service UUID",
      "original_subcategory_id": "MySQL subcategory UUID",
      "success": boolean,
      "error": "error message",  // Only if success=false
      "skipped": boolean,        // If service or category not found
      "skip_reason": "string"    // If skipped=true
    }
  ]
}
```

#### 2. `temp/phase-3-completed.json`

**Expected Structure:**

```json
{
  "phase": "Phase 3 - Services Migration",
  "completed_at": "ISO date",
  "status": "success|partial_success",
  "final_stats": {
    "parent_categories_created": 5,
    "subcategories_created": number,
    "services_created": number,
    "service_category_associations": number,
    "total_errors": number,
    "error_rate_percentage": number
  },
  "database_counts": {
    "service_categories": number,
    "services": number,
    "service_service_categories": number
  }
}
```

### Database Validation

```sql
-- Final verification queries
SELECT
  'service_categories' as table_name, COUNT(*) as count FROM service_categories
UNION ALL
SELECT
  'services', COUNT(*) FROM services
UNION ALL
SELECT
  'service_service_categories', COUNT(*) FROM service_service_categories;

-- Verify all services have category associations
SELECT COUNT(*)
FROM services s
LEFT JOIN service_service_categories ssc ON s.id = ssc.service_id
WHERE ssc.service_id IS NULL;  -- Should be 0

-- Check category distribution
SELECT
  sc.name as category_name,
  COUNT(ssc.service_id) as service_count
FROM service_categories sc
LEFT JOIN service_service_categories ssc ON sc.id = ssc.category_id
WHERE sc.parent_category_id IS NULL  -- Only parent categories
GROUP BY sc.id, sc.name
ORDER BY service_count DESC;

-- Verify subcategory relationships
SELECT
  parent.name as parent_category,
  child.name as subcategory,
  COUNT(ssc.service_id) as service_count
FROM service_categories parent
JOIN service_categories child ON parent.id = child.parent_category_id
LEFT JOIN service_service_categories ssc ON child.id = ssc.category_id
GROUP BY parent.id, parent.name, child.id, child.name
ORDER BY parent.name, child.name;
```

### Final Phase 3 Validation Checklist

- [ ] Exactly 5 parent categories exist (Hair, Makeup, Nails, Lashes, Brows)
- [ ] All subcategories have valid parent references
- [ ] All services have valid stylist references
- [ ] All services have at least one category association
- [ ] No orphaned records in any table
- [ ] Migration stats show acceptable error rate (<5%)
- [ ] Service search and filtering works in application

---

## Rollback Procedure

If any step fails critically:

1. **Reset database tables:**

   ```sql
   -- Clear service-related tables in reverse dependency order
   DELETE FROM service_service_categories;
   DELETE FROM services;
   DELETE FROM service_categories;
   ```

2. **Clean temp files:**

   ```bash
   rm -rf scripts/migration/temp/extracted-categories.json
   rm -rf scripts/migration/temp/categories-created.json
   rm -rf scripts/migration/temp/extracted-services.json
   rm -rf scripts/migration/temp/services-created.json
   rm -rf scripts/migration/temp/service-categories-created.json
   rm -rf scripts/migration/temp/category-migration-stats.json
   rm -rf scripts/migration/temp/service-*-stats.json
   rm -rf scripts/migration/temp/phase-3-completed.json
   ```

3. **Fix identified issues**

4. **Re-run from Step 1**

---

## Success Criteria

Phase 3 is considered successful when:

- ✅ All 5 steps complete without critical errors
- ✅ Error rate is below 5% of total records
- ✅ All database integrity checks pass
- ✅ Service catalog is searchable and filterable
- ✅ All services have valid category associations
- ✅ `phase-3-completed.json` shows status: "success"

## Integration Testing

After successful Phase 3 completion:

1. **Test service discovery:**

   - Search by category works
   - Filter by price range works
   - Filter by duration works
   - Geographic search includes services

2. **Test service details:**

   - Service pages load correctly
   - Stylist information displays
   - Booking flow works with migrated services

3. **Test admin functionality:**
   - Category management works
   - Service approval flow functions
   - Analytics show correct service counts

## Next Steps

After successful Phase 3 completion, proceed to Phase 4 (Booking System Migration).

---

## Performance Considerations

### Batch Processing

- Process services in batches of 100-500 for production
- Monitor memory usage during large service migrations

### Index Creation

After migration, ensure these indexes exist:

```sql
-- Service search optimization
CREATE INDEX IF NOT EXISTS idx_services_stylist_published
ON services(stylist_id, is_published);

CREATE INDEX IF NOT EXISTS idx_services_category_search
ON service_service_categories(category_id);

-- Category hierarchy optimization
CREATE INDEX IF NOT EXISTS idx_categories_parent
ON service_categories(parent_category_id);

-- Full-text search preparation
CREATE INDEX IF NOT EXISTS idx_services_title_search
ON services USING gin(to_tsvector('norwegian', title));

CREATE INDEX IF NOT EXISTS idx_services_description_search
ON services USING gin(to_tsvector('norwegian', description));
```

### Data Volume Estimates

Based on typical service marketplace data:

- **Categories**: ~50-100 subcategories total
- **Services**: ~1000-5000 services (10-50 per active stylist)
- **Junction records**: Same as service count (1:1 ratio typically)

---

## Risk Assessment

### High Risk Areas

1. **Category Mapping**

   - Risk: MySQL category hierarchy doesn't map cleanly
   - Mitigation: Manual review of category structure before migration

2. **Service Title/Description Parsing**

   - Risk: Complex descriptions cause parsing failures
   - Mitigation: Robust parsing with fallback to full description as title

3. **Stylist Reference Validation**
   - Risk: Services reference non-migrated stylists
   - Mitigation: Validate against Phase 1 user migration results

### Data Quality Checks

1. **Before Migration:**

   - Verify all referenced stylists exist in Phase 1 output
   - Check for reasonable price/duration ranges
   - Validate category hierarchy completeness

2. **During Migration:**

   - Monitor error rates per step
   - Log all parsing failures for manual review
   - Validate foreign key relationships before insertion

3. **After Migration:**
   - Run comprehensive data integrity checks
   - Test representative service samples in application
   - Compare service counts against MySQL totals

---

## Monitoring & Observability

### Key Metrics to Track

1. **Migration Progress:**

   - Records processed per minute
   - Success/error rates per step
   - Memory usage during processing

2. **Data Quality:**

   - Percentage of services with valid stylists
   - Percentage of services with valid categories
   - Average parsing success rate

3. **Business Impact:**
   - Total services available post-migration
   - Service distribution across categories
   - Price range validation

### Alerting Thresholds

- Error rate > 10% → Stop migration and investigate
- Memory usage > 80% → Reduce batch size
- Processing time > 2x expected → Check query performance

This comprehensive test plan ensures the Phase 3 Services Migration maintains data integrity while successfully transforming the MySQL service catalog into the new PostgreSQL structure.
