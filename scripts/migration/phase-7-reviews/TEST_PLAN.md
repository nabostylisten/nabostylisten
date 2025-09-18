# Phase 7 Reviews Migration Test Plan

## Overview

This test plan provides step-by-step validation procedures for each script in the Phase 7 Reviews Migration process. This phase migrates the reviews and ratings system from MySQL to PostgreSQL, creating one-to-one relationships between bookings and reviews. Phase 7 requires completed Phase 1 (Users) and Phase 4 (Bookings) migrations.

## Prerequisites

- **Phase 1 Completed**: User migration must be successfully completed (user-id-mapping.json required)
- **Phase 4 Completed**: Bookings migration must be successfully completed (bookings-created.json required)
- **Required Files**: `user-id-mapping.json` from Phase 1, `bookings-created.json` from Phase 4
- **MySQL dump file**: `/Users/magnusrodseth/dev/personal/nabostylisten/nabostylisten_prod.sql`
- **Supabase local database**: Running with Phase 1 and Phase 4 data
- **All dependencies installed**: (`bun install`)

## Migration Strategy Overview

Phase 7 implements a **direct field mapping** strategy with **low complexity**:

### MySQL → PostgreSQL Transformation

```sql
-- DIRECT MAPPING
rating.id                                 → reviews.id
rating.buyer_id                           → reviews.customer_id
rating.stylist_id                         → reviews.stylist_id
rating.booking_id                         → reviews.booking_id (UNIQUE)
rating.rating                             → reviews.rating
rating.review                             → reviews.comment
rating.created_at                         → reviews.created_at
```

### Key Business Rules

- **One review per booking**: Each booking can have at most one review
- **Rating scale validation**: Ratings must be integers between 1-5
- **Optional comments**: Reviews can exist without comment text
- **Booking dependency**: Reviews only created for successfully migrated bookings
- **User validation**: Customer and stylist IDs must exist in profiles table

---

## Step 1: Extract Reviews (`01-extract-reviews.ts`)

### Purpose

Extracts review records from MySQL dump, validates rating values (1-5 scale), filters reviews for successfully migrated bookings only, and transforms data for PostgreSQL compatibility.

### Input Validation

1. **Verify MySQL dump has rating table:**

   ```bash
   grep -c "CREATE TABLE \`rating\`" nabostylisten_prod.sql  # Should return 1
   grep -c "INSERT INTO \`rating\`" nabostylisten_prod.sql  # Should return > 0
   ```

2. **Verify Phase 4 dependencies exist:**

   ```bash
   ls scripts/migration/temp/bookings-created.json  # Should exist
   ls scripts/migration/temp/user-id-mapping.json  # Should exist (Phase 1)
   ```

### Expected MySQL Rating Table Structure

**Rating table columns:**

- id (varchar 36)
- buyer_id, stylist_id (varchar 36) - Foreign keys to buyer/stylist tables
- booking_id (varchar 36) - Foreign key to booking table (UNIQUE constraint expected)
- rating (varchar) - "1" to "5" as string
- review (text, nullable) - Optional comment text
- created_at (datetime) - Review creation timestamp

### Run the Script

```bash
bun run scripts/migration/phase-7-reviews/01-extract-reviews.ts
```

### Output Files to Validate

#### 1. `temp/reviews-extracted.json`

**Expected Structure:**

```json
{
  "extracted_at": "ISO date string",
  "processedReviews": [
    {
      "id": "UUID from MySQL (lowercase)",
      "booking_id": "Booking UUID (must exist in Phase 4)",
      "customer_id": "MySQL buyer_id (to be mapped)",
      "stylist_id": "MySQL stylist_id (to be mapped)",
      "rating": 1-5,
      "comment": "string or null",
      "created_at": "ISO date string"
    }
  ],
  "metadata": {
    "total_mysql_ratings": number,
    "processed_reviews": number,
    "skipped_reviews": number,
    "rating_distribution": {
      "1": number,
      "2": number,
      "3": number,
      "4": number,
      "5": number
    },
    "reviews_with_comments": number,
    "reviews_without_comments": number
  }
}
```

**Validation Checks:**

- [ ] All reviews have valid UUID in `id` (lowercase)
- [ ] All `booking_id` values exist in Phase 4 bookings-created.json
- [ ] Rating values are integers between 1-5 (inclusive)
- [ ] `comment` field properly handles null/empty values
- [ ] All dates are valid ISO strings
- [ ] Metadata totals add up correctly
- [ ] Rating distribution covers 1-5 scale appropriately

#### 2. `temp/skipped-reviews.json` (if any skipped)

**Expected Structure:**

```json
{
  "skipped_at": "ISO date string",
  "skipped_reviews": [
    {
      "review": {
        "id": "MySQL rating UUID",
        "buyer_id": "string",
        "stylist_id": "string",
        "booking_id": "string",
        "rating": "string",
        "review": "string or null",
        "created_at": "string"
      },
      "reason": "Booking was not migrated to PostgreSQL|Invalid rating value: X"
    }
  ]
}
```

**Skip Reason Categories:**

- `"Booking was not migrated to PostgreSQL"` - Expected for bookings not in Phase 4
- `"Invalid rating value: X"` - Rating not in 1-5 range
- `"Processing error: X"` - Other processing failures

### Database Cross-Reference Validation

```sql
-- Verify booking IDs exist in bookings table
SELECT COUNT(*) FROM bookings WHERE id IN (
  -- booking_ids from extracted reviews
);

-- Check rating distribution reasonableness (should be skewed toward higher ratings)
-- Typical expected distribution: 5-star (40-60%), 4-star (20-30%), 3-star (10-20%), 1-2 star (5-15%)
```

### Common Issues & Solutions (Step 1)

| Issue                                     | Solution                                            | Impact   |
| ----------------------------------------- | --------------------------------------------------- | -------- |
| "Could not load booking creation results" | Ensure Phase 4 completed successfully               | Warning  |
| "Invalid rating value"                    | Expected for malformed ratings in source data       | Low      |
| High skipped review count                 | Normal if many bookings weren't migrated in Phase 4 | Expected |
| "Booking was not migrated"                | Reviews filtered correctly for missing bookings     | Expected |

---

## Step 2: Create Reviews (`02-create-reviews.ts`)

### Purpose

Creates review records in PostgreSQL reviews table with batched processing, duplicate checking (one review per booking), and comprehensive error handling.

### Input Requirements

- `temp/reviews-extracted.json` (from Step 1)
- Valid bookings in database (from Phase 4)
- Valid user profiles in database (from Phase 1)

### Run the Script

```bash
bun run scripts/migration/phase-7-reviews/02-create-reviews.ts
```

### Output Files to Validate

#### 1. `temp/reviews-created.json`

**Expected Structure:**

```json
{
  "created_at": "ISO date",
  "created_reviews": [
    {
      "id": "Review UUID",
      "booking_id": "Booking UUID",
      "customer_id": "Customer UUID",
      "stylist_id": "Stylist UUID",
      "rating": 1-5,
      "has_comment": boolean
    }
  ],
  "metadata": {
    "total_to_create": number,
    "successful_creations": number,
    "failed_creations": number,
    "duration_ms": number
  }
}
```

**Validation Checks:**

- [ ] All successful results correspond to created database records
- [ ] Total to create = successful + failed creations
- [ ] All IDs are valid UUIDs
- [ ] `has_comment` field accurately reflects comment presence
- [ ] Duration is reasonable for batch size

#### 2. `temp/review-creation-stats.json`

**Expected Structure:**

```json
{
  "completed_at": "ISO date",
  "duration_seconds": number,
  "total_reviews": number,
  "successfully_created": number,
  "failed_creations": number,
  "success_rate": "XX.XX%",
  "rating_distribution": {
    "1": number,
    "2": number,
    "3": number,
    "4": number,
    "5": number
  },
  "reviews_with_comments": number,
  "reviews_without_comments": number
}
```

#### 3. `temp/failed-reviews-creation.json` (if any failures)

**Expected Structure:**

```json
{
  "failed_at": "ISO date",
  "failed_reviews": [
    {
      "review": {
        "id": "Review UUID",
        "booking_id": "Booking UUID",
        "customer_id": "Customer UUID",
        "stylist_id": "Stylist UUID",
        "rating": number,
        "comment": "string or null",
        "created_at": "ISO date"
      },
      "error": "Error message string"
    }
  ]
}
```

### Database Validation (Step 2)

```sql
-- Check reviews table
SELECT COUNT(*) FROM reviews;  -- Should match successful creations count

-- Verify review data integrity
SELECT
  COUNT(*) as total_reviews,
  COUNT(DISTINCT id) as unique_review_ids,
  COUNT(DISTINCT booking_id) as unique_booking_ids,
  AVG(rating) as average_rating,
  MIN(rating) as min_rating,
  MAX(rating) as max_rating
FROM reviews;

-- Check foreign key relationships
SELECT COUNT(*)
FROM reviews r
LEFT JOIN bookings b ON r.booking_id = b.id
WHERE b.id IS NULL;  -- Should be 0

SELECT COUNT(*)
FROM reviews r
LEFT JOIN profiles p_customer ON r.customer_id = p_customer.id
WHERE p_customer.id IS NULL OR p_customer.role != 'customer';  -- Should be 0

SELECT COUNT(*)
FROM reviews r
LEFT JOIN profiles p_stylist ON r.stylist_id = p_stylist.id
WHERE p_stylist.id IS NULL OR p_stylist.role != 'stylist';  -- Should be 0

-- Verify one review per booking constraint
SELECT
  booking_id,
  COUNT(*) as review_count
FROM reviews
GROUP BY booking_id
HAVING COUNT(*) > 1;  -- Should return no rows

-- Check rating distribution
SELECT
  rating,
  COUNT(*) as count,
  ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reviews)), 2) as percentage
FROM reviews
GROUP BY rating
ORDER BY rating;

-- Validate comment presence
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN comment IS NOT NULL AND TRIM(comment) != '' THEN 1 ELSE 0 END) as with_comments,
  SUM(CASE WHEN comment IS NULL OR TRIM(comment) = '' THEN 1 ELSE 0 END) as without_comments
FROM reviews;

-- Check temporal data integrity
SELECT
  DATE_TRUNC('month', created_at) as review_month,
  COUNT(*) as review_count,
  ROUND(AVG(rating), 2) as avg_rating
FROM reviews
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY review_month DESC
LIMIT 12;
```

### Success Criteria (Step 2 - Create Reviews)

- [ ] All extracted reviews with valid relationships created
- [ ] Review count matches successful extractions from Step 1
- [ ] All foreign key relationships valid
- [ ] No duplicate booking_id entries in reviews table
- [ ] Rating values within 1-5 range
- [ ] One review per booking constraint maintained
- [ ] Error rate < 5%

### Common Issues & Solutions (Step 2)

| Issue                               | Solution                                      | Status      |
| ----------------------------------- | --------------------------------------------- | ----------- |
| "Review already exists for booking" | Expected behavior - script handles duplicates | Normal      |
| "Foreign key violation"             | Ensure customer/stylist profiles exist        | Fix         |
| "Check constraint error"            | Verify rating is between 1-5                  | Fix         |
| "Invalid UUID format"               | Check ID format conversion in Step 1          | Fix         |
| High failed creation count          | Review foreign key relationships              | Investigate |

---

## Step 3: Validate Reviews (`03-validate-reviews.ts`)

### Purpose

Comprehensive validation of migrated reviews including data integrity checks, relationship validation, rating distribution analysis, and comparison with MySQL source data.

### Input Requirements

- Completed reviews in PostgreSQL (from Step 2)
- Access to MySQL dump for source comparison
- Valid bookings and profiles in database

### Run the Script

```bash
bun run scripts/migration/phase-7-reviews/03-validate-reviews.ts
```

### Output Files to Validate

#### 1. `temp/review-validation-results.json`

**Expected Structure:**

```json
{
  "validated_at": "ISO date",
  "is_valid": boolean,
  "total_mysql_ratings": number,
  "total_pg_reviews": number,
  "missing_reviews": ["array of review IDs not migrated"],
  "orphaned_reviews": ["array of review IDs with no booking"],
  "booking_review_mismatches": number,
  "rating_discrepancies": [
    {
      "review_id": "UUID",
      "mysql_rating": number,
      "pg_rating": number
    }
  ],
  "customer_mismatches": [
    {
      "review_id": "UUID",
      "mysql_customer": "UUID",
      "pg_customer": "UUID"
    }
  ],
  "stylist_mismatches": [
    {
      "review_id": "UUID",
      "mysql_stylist": "UUID",
      "pg_stylist": "UUID"
    }
  ],
  "validation_errors": ["array of error strings"],
  "rating_distribution": {
    "1": number,
    "2": number,
    "3": number,
    "4": number,
    "5": number
  },
  "average_rating": number,
  "reviews_with_comments": number,
  "reviews_without_comments": number
}
```

### Validation Categories

#### 1. Count Validation

- **Total MySQL ratings vs PostgreSQL reviews**: Expected difference due to booking filtering
- **Missing reviews**: Reviews that should have been migrated but weren't
- **Orphaned reviews**: Reviews without corresponding bookings

#### 2. Relationship Validation

- **Booking-review relationships**: All reviews must reference existing bookings
- **Customer mapping**: Review customer_id must match migrated users
- **Stylist mapping**: Review stylist_id must match migrated users

#### 3. Data Integrity Validation

- **Rating discrepancies**: Rating values must match between MySQL and PostgreSQL
- **Comment preservation**: Comment content should be preserved accurately
- **Timestamp accuracy**: Created dates should match source data

#### 4. Business Logic Validation

- **One review per booking**: No duplicate booking_id in reviews table
- **Rating scale compliance**: All ratings between 1-5
- **Valid user roles**: Customers and stylists have correct roles

### Database Validation Queries (Step 3)

```sql
-- Comprehensive review analysis
SELECT
  COUNT(*) as total_reviews,
  COUNT(DISTINCT booking_id) as unique_bookings_reviewed,
  COUNT(DISTINCT customer_id) as unique_customers,
  COUNT(DISTINCT stylist_id) as unique_stylists,
  ROUND(AVG(rating), 2) as average_rating,
  MIN(created_at) as earliest_review,
  MAX(created_at) as latest_review
FROM reviews;

-- Rating distribution with percentages
SELECT
  rating,
  COUNT(*) as count,
  ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reviews)), 1) as percentage
FROM reviews
GROUP BY rating
ORDER BY rating;

-- Review activity by time period
SELECT
  DATE_TRUNC('year', created_at) as year,
  COUNT(*) as reviews,
  ROUND(AVG(rating), 2) as avg_rating,
  COUNT(DISTINCT customer_id) as unique_reviewers
FROM reviews
GROUP BY DATE_TRUNC('year', created_at)
ORDER BY year;

-- Top reviewed stylists
SELECT
  s.id,
  p.full_name,
  COUNT(r.id) as review_count,
  ROUND(AVG(r.rating), 2) as avg_rating,
  COUNT(CASE WHEN r.comment IS NOT NULL THEN 1 END) as reviews_with_comments
FROM reviews r
JOIN profiles p ON r.stylist_id = p.id
JOIN stylist_details s ON p.id = s.profile_id
GROUP BY s.id, p.full_name
HAVING COUNT(r.id) >= 5
ORDER BY review_count DESC, avg_rating DESC
LIMIT 10;

-- Customer review activity
SELECT
  COUNT(DISTINCT customer_id) as total_reviewers,
  COUNT(*) as total_reviews,
  ROUND(AVG(reviews_per_customer), 2) as avg_reviews_per_customer
FROM (
  SELECT
    customer_id,
    COUNT(*) as reviews_per_customer
  FROM reviews
  GROUP BY customer_id
) customer_stats;

-- Review-booking relationship integrity
SELECT
  b.status,
  COUNT(r.id) as reviews,
  ROUND(AVG(r.rating), 2) as avg_rating
FROM bookings b
LEFT JOIN reviews r ON b.id = r.booking_id
WHERE r.id IS NOT NULL
GROUP BY b.status
ORDER BY reviews DESC;

-- Comment analysis
SELECT
  COUNT(*) as total_reviews,
  COUNT(CASE WHEN comment IS NOT NULL AND TRIM(comment) != '' THEN 1 END) as with_comments,
  COUNT(CASE WHEN comment IS NULL OR TRIM(comment) = '' THEN 1 END) as without_comments,
  ROUND(
    (COUNT(CASE WHEN comment IS NOT NULL AND TRIM(comment) != '' THEN 1 END) * 100.0 / COUNT(*)),
    1
  ) as comment_percentage
FROM reviews;
```

### Success Criteria (Step 3 - Validate Reviews)

- [ ] `is_valid` = true in validation results
- [ ] Zero orphaned reviews
- [ ] Zero rating discrepancies in sample validation
- [ ] Zero customer/stylist mapping errors
- [ ] All reviews reference existing bookings
- [ ] Rating distribution is reasonable (skewed toward positive)
- [ ] Average rating between 3.0-5.0 (typical for marketplace platforms)
- [ ] Comment percentage > 0% (some reviews should have comments)

### Expected Validation Results

#### Typical Success Metrics

- **Migration rate**: 70-90% of MySQL ratings migrated (filtered by booking availability)
- **Data accuracy**: 100% rating/comment preservation for migrated reviews
- **Relationship integrity**: 100% valid foreign key relationships
- **Business logic compliance**: 100% one-review-per-booking adherence

#### Rating Distribution (Expected Range)

- **5 stars**: 40-60% (most satisfied customers)
- **4 stars**: 20-30% (generally satisfied)
- **3 stars**: 10-20% (neutral experiences)
- **2 stars**: 3-10% (dissatisfied)
- **1 star**: 2-7% (very dissatisfied)

### Common Issues & Solutions (Step 3)

| Issue                       | Solution                                 | Severity |
| --------------------------- | ---------------------------------------- | -------- |
| High missing review count   | Expected if many bookings not migrated   | Low      |
| Rating discrepancies        | Check data transformation in Step 1      | High     |
| Customer/stylist mismatches | Verify Phase 1 user mapping completeness | High     |
| Orphaned reviews            | Check foreign key constraint enforcement | Critical |
| Low average rating          | Investigate source data quality          | Medium   |
| Zero comment percentage     | Check comment field extraction logic     | Medium   |

---

## Final Phase 7 Validation Checklist

### Complete Database State Verification

```sql
-- Final verification queries
SELECT
  'reviews' as table_name, COUNT(*) as count FROM reviews
UNION ALL
SELECT
  'unique_booking_reviews', COUNT(DISTINCT booking_id) FROM reviews
UNION ALL
SELECT
  'reviews_with_comments', COUNT(*) FROM reviews
  WHERE comment IS NOT NULL AND TRIM(comment) != '';

-- Verify data consistency across relationships
SELECT
  COUNT(DISTINCT r.id) as total_reviews,
  COUNT(DISTINCT r.booking_id) as unique_bookings_with_reviews,
  COUNT(DISTINCT r.customer_id) as unique_customers_who_reviewed,
  COUNT(DISTINCT r.stylist_id) as unique_stylists_reviewed,
  COUNT(DISTINCT b.id) as total_bookings_available
FROM reviews r
JOIN bookings b ON r.booking_id = b.id;

-- Business logic verification
SELECT
  'total_bookings' as metric, COUNT(*) as value FROM bookings
UNION ALL
SELECT
  'bookings_with_reviews', COUNT(DISTINCT booking_id) FROM reviews
UNION ALL
SELECT
  'review_coverage_percentage',
  ROUND((COUNT(DISTINCT r.booking_id) * 100.0 / COUNT(DISTINCT b.id)), 2)
FROM bookings b
LEFT JOIN reviews r ON b.id = r.booking_id;

-- Quality metrics
SELECT
  rating,
  COUNT(*) as count,
  ROUND(AVG(CASE WHEN comment IS NOT NULL THEN LENGTH(comment) END), 0) as avg_comment_length
FROM reviews
GROUP BY rating
ORDER BY rating DESC;
```

### Success Criteria

Phase 7 is considered successful when:

- ✅ All 3 steps complete without critical errors
- ✅ Validation shows `is_valid: true`
- ✅ Error rate is below 5% of extracted reviews
- ✅ All foreign key relationships are valid
- ✅ One review per booking constraint maintained
- ✅ Rating distribution is reasonable
- ✅ No orphaned or duplicate reviews
- ✅ Comment preservation is accurate

---

## Integration Testing

After successful Phase 7 completion:

1. **Test review display:**

   - Customer review history shows correctly
   - Stylist review showcase displays properly
   - Review ratings appear in service listings
   - Comment text renders properly

2. **Test review functionality:**

   - New reviews can be created (not migrated data)
   - Rating calculations work correctly
   - Review filtering and sorting function
   - Average rating calculations are accurate

3. **Test analytics:**
   - Stylist average ratings calculate properly
   - Review distribution reports work
   - Comment analysis functions correctly
   - Historical review trends display

## Rollback Procedure

If any step fails critically:

1. **Clean review data:**

   ```sql
   -- Clear reviews table
   DELETE FROM reviews;
   ```

2. **Reset temp files:**

   ```bash
   rm -f scripts/migration/temp/reviews-extracted.json
   rm -f scripts/migration/temp/reviews-created.json
   rm -f scripts/migration/temp/review-validation-results.json
   rm -f scripts/migration/temp/skipped-reviews.json
   rm -f scripts/migration/temp/failed-reviews-creation.json
   rm -f scripts/migration/temp/review-creation-stats.json
   ```

3. **Fix identified issues**

4. **Re-run from Step 1**

---

## Performance Considerations

### Batch Processing

- Script uses 50-review batches for optimal performance
- Monitor memory usage during large review migrations
- Consider reducing batch size if encountering timeout issues

### Index Optimization

After migration, ensure these indexes exist for review queries:

```sql
-- Review lookup optimization
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id
ON reviews(booking_id);

CREATE INDEX IF NOT EXISTS idx_reviews_customer_id
ON reviews(customer_id);

CREATE INDEX IF NOT EXISTS idx_reviews_stylist_id
ON reviews(stylist_id);

-- Rating analysis optimization
CREATE INDEX IF NOT EXISTS idx_reviews_stylist_rating
ON reviews(stylist_id, rating);

CREATE INDEX IF NOT EXISTS idx_reviews_created_at
ON reviews(created_at);

-- Comment search optimization (if needed)
CREATE INDEX IF NOT EXISTS idx_reviews_has_comment
ON reviews(stylist_id) WHERE comment IS NOT NULL;
```

---

## Risk Assessment

### High Risk Areas

1. **Booking Dependency**

   - Risk: Reviews reference bookings not migrated in Phase 4
   - Mitigation: Filter reviews by migrated booking IDs only

2. **Rating Scale Validation**

   - Risk: Invalid rating values cause constraint violations
   - Mitigation: Validate 1-5 range before database insertion

3. **User ID Mapping**

   - Risk: Customer/stylist IDs don't map to Phase 1 users
   - Mitigation: Cross-reference with Phase 1 user mappings

4. **Duplicate Reviews**
   - Risk: Multiple reviews per booking violate business logic
   - Mitigation: Check for existing reviews before insertion

### Data Quality Checks

1. **Before Migration:**

   - Verify all review booking IDs exist in Phase 4 output
   - Check rating value distribution for reasonableness
   - Validate customer/stylist references against Phase 1 output

2. **During Migration:**

   - Monitor foreign key violation rates
   - Track comment preservation accuracy
   - Log duplicate review attempts

3. **After Migration:**
   - Run comprehensive validation queries
   - Test review functionality in application
   - Compare rating distributions with MySQL source

---

## Monitoring & Observability

### Key Metrics to Track

1. **Migration Progress:**

   - Reviews processed per minute
   - Success/error rates per step
   - Database constraint violation rates

2. **Data Quality:**

   - Percentage of MySQL ratings successfully migrated
   - Rating accuracy preservation rate
   - Comment preservation rate

3. **Business Impact:**
   - Total reviews available post-migration
   - Average rating validation
   - Review coverage across bookings

### Alerting Thresholds

- Error rate > 5% → Stop migration and investigate
- Foreign key violations > 1% → Check Phase 1/4 data integrity
- Rating discrepancies > 0% → Review data transformation logic
- Zero comment preservation → Check extraction/creation logic

This comprehensive test plan ensures the Phase 7 Reviews Migration maintains data integrity while successfully migrating the MySQL rating system into the new PostgreSQL reviews structure with proper relationship validation and business logic compliance.
