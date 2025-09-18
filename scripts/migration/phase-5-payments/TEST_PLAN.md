# Phase 5 Payments Migration Test Plan

## Overview

This test plan provides step-by-step validation procedures for each script in the Phase 5 Payments Migration process. This phase migrates the payment system from MySQL to PostgreSQL, including payment records, Stripe integrations, and financial calculations. Phase 5 requires completed Phase 4 (Bookings) migration.

## Prerequisites

- **Phase 4 Completed**: Bookings migration must be successfully completed (bookings-created.json required)
- **Required Files**:
  - `bookings-created.json` from Phase 4
  - MySQL dump file with payment data
- **Supabase local database**: Running with Phase 1-4 data
- **All dependencies installed**: (`bun install`)

## Environment Variables

Set these before running any scripts:

```bash
export MYSQL_DUMP_PATH="/Users/magnusrodseth/dev/personal/nabostylisten/nabostylisten_prod.sql"
```

---

## Step 1: Extract Payments (`01-extract-payments.ts`)

### Purpose

Extracts payment records from MySQL dump, transforms data for PostgreSQL compatibility, maps payment IDs to booking IDs, handles status transformations, and calculates financial amounts.

### Input Validation

1. **Verify MySQL dump has payment table:**

   ```bash
   grep -c "CREATE TABLE \`payment\`" nabostylisten_prod.sql  # Should return 1
   grep -c "INSERT INTO \`payment\`" nabostylisten_prod.sql  # Should return > 0
   ```

2. **Verify Phase 4 dependencies exist:**

   ```bash
   ls scripts/migration/temp/bookings-created.json  # Should exist
   jq '.metadata.successful_creations' scripts/migration/temp/bookings-created.json  # Should return > 0
   ```

### Expected MySQL Payment Table Structure

**Payment table columns:**

- id (varchar 36)
- payment_intent_id (varchar 255) - Stripe payment intent ID
- stylist_amount (decimal) - Amount to be paid to stylist
- platform_amount (decimal) - Platform fee
- salon_amount (decimal) - Salon commission (removed in new system)
- salon_percentage (decimal) - Salon percentage (removed in new system)
- stylist_transfer_id (varchar 255) - Stripe transfer ID for stylist payout
- salon_transfer_id (varchar 255) - Stripe transfer ID for salon (removed in new system)
- status (varchar) - Payment status
- created_at, updated_at (datetime)

### Expected MySQL Booking Table Structure (for mapping)

**Booking table columns (relevant for payments):**

- id (varchar 36)
- payment_id (varchar 36) - Foreign key to payment.id
- buyer_id, stylist_id (varchar 36)
- status (varchar)
- date_time (datetime)

### Expected Status Mappings

| MySQL Status  | PostgreSQL Status | Additional Processing |
| ------------- | ----------------- | --------------------- |
| pending       | pending           | None                  |
| needs_capture | requires_capture  | None                  |
| captured      | succeeded         | Set captured_at       |
| cancelled     | cancelled         | None                  |
| refunded      | succeeded         | Set refunded_amount   |
| failed        | cancelled         | None                  |

### Run the Script

```bash
bun run scripts/migration/phase-5-payments/01-extract-payments.ts
```

### Output Files to Validate

#### 1. `temp/payments-extracted.json`

**Expected Structure:**

```json
{
  "metadata": {
    "extracted_at": "ISO date string",
    "total_mysql_payments": number,
    "total_mysql_bookings": number,
    "processed_payments": number,
    "skipped_payments": number,
    "unique_bookings": number,
    "status_distribution": {
      "pending": number,
      "requires_capture": number,
      "succeeded": number,
      "cancelled": number
    }
  },
  "payments": [
    {
      "id": "UUID from MySQL",
      "booking_id": "Booking UUID",
      "payment_intent_id": "pi_... from Stripe",
      "original_amount": number,
      "discount_amount": 0,
      "final_amount": number,
      "platform_fee": number,
      "stylist_payout": number,
      "affiliate_commission": 0,
      "currency": "NOK",
      "discount_code": null,
      "discount_percentage": null,
      "discount_fixed_amount": null,
      "affiliate_id": null,
      "affiliate_commission_percentage": null,
      "stripe_application_fee_amount": number,
      "stylist_transfer_id": "string or null",
      "status": "pending|requires_capture|succeeded|cancelled",
      "created_at": "ISO date string",
      "updated_at": "ISO date string",
      "authorized_at": null,
      "captured_at": "ISO date string or null",
      "succeeded_at": "ISO date string or null",
      "payout_initiated_at": "ISO date string or null",
      "payout_completed_at": null,
      "refunded_amount": number,
      "refund_reason": "string or null"
    }
  ],
  "skipped": [
    {
      "payment": { ...payment object },
      "reason": "No booking found for this payment|Booking was not migrated to PostgreSQL|Payment has no payment_intent_id"
    }
  ]
}
```

**Validation Checks:**

- [ ] All payments have valid UUID in `id`
- [ ] All `booking_id` values correspond to migrated bookings from Phase 4
- [ ] All payments have valid `payment_intent_id` (pi\_...)
- [ ] Status values are only: pending, requires_capture, succeeded, cancelled
- [ ] `final_amount` = `stylist_payout` + `platform_fee`
- [ ] `stripe_application_fee_amount` = `platform_fee` \* 100 (converted to øre)
- [ ] All amounts are non-negative numbers
- [ ] `captured_at` is set only for succeeded (previously captured) payments
- [ ] `refunded_amount` > 0 only for refunded payments
- [ ] All dates are valid ISO strings

#### 2. `temp/payment-extraction-stats.json`

**Expected Structure:**

```json
{
  "total_payments": number,
  "processed_payments": number,
  "skipped_payments": number,
  "skip_reasons": {
    "no_booking": number,
    "booking_not_migrated": number,
    "no_payment_intent": number
  },
  "status_distribution": {
    "pending": number,
    "requires_capture": number,
    "succeeded": number,
    "cancelled": number
  },
  "financial_summary": {
    "total_amount": number,
    "total_platform_fees": number,
    "total_stylist_payouts": number,
    "total_refunded": number,
    "average_payment": number
  }
}
```

**Validation:**

- [ ] All counts are non-negative integers
- [ ] processed_payments + skipped_payments = total_payments
- [ ] skip_reasons sum equals skipped_payments
- [ ] total_amount = total_platform_fees + total_stylist_payouts
- [ ] financial_summary values are realistic (no extreme outliers)

### Common Issues & Solutions

| Issue                        | Solution                                        |
| ---------------------------- | ----------------------------------------------- |
| "No booking mapping found"   | Ensure Phase 4 completed successfully           |
| "Payment intent ID missing"  | Expected for incomplete/draft payments - skip   |
| "Invalid amount calculation" | Check decimal parsing from MySQL strings        |
| High skip rate               | Verify booking migration completed successfully |

---

## Step 2: Create Payments (`02-create-payments.ts`)

### Purpose

Creates payment records in PostgreSQL payments table with transformed data from Step 1, maintaining Stripe references and financial integrity.

### Input Requirements

- `temp/payments-extracted.json` (from Step 1)
- `temp/payment-extraction-stats.json` (from Step 1)
- Valid bookings in database (from Phase 4)

### Run the Script

```bash
bun run scripts/migration/phase-5-payments/02-create-payments.ts
```

### Output Files to Validate

#### 1. `temp/payments-created.json`

**Expected Structure:**

```json
{
  "metadata": {
    "created_at": "ISO date",
    "total_processed": number,
    "successful_creations": number,
    "failed_creations": number
  },
  "results": [
    {
      "payment_id": "Payment UUID",
      "booking_id": "Booking UUID",
      "payment_intent_id": "pi_...",
      "success": boolean,
      "error": "error message"  // Only if success=false
    }
  ]
}
```

**Validation Checks:**

- [ ] All successful results correspond to created database records
- [ ] Failed count matches error entries
- [ ] Total processed = successful + failed
- [ ] All payment IDs are valid UUIDs
- [ ] No duplicate payment_intent_ids

#### 2. `temp/payment-creation-stats.json`

**Expected Structure:**

```json
{
  "total_payments": number,
  "successful_creations": number,
  "failed_creations": number,
  "status_distribution": {
    "pending": number,
    "requires_capture": number,
    "succeeded": number,
    "cancelled": number
  },
  "financial_summary": {
    "total_amount": number,
    "total_platform_fees": number,
    "total_stylist_payouts": number,
    "total_refunded": number
  },
  "stripe_integration": {
    "payments_with_transfer_ids": number,
    "payments_with_refunds": number,
    "average_application_fee_percentage": number
  }
}
```

### Database Validation

```sql
-- Check payments table
SELECT COUNT(*) FROM payments;  -- Should match successful count

-- Verify payment data integrity
SELECT
  COUNT(*) as total,
  COUNT(DISTINCT id) as unique_ids,
  COUNT(DISTINCT booking_id) as unique_bookings,
  COUNT(DISTINCT payment_intent_id) as unique_payment_intents,
  AVG(final_amount) as avg_amount,
  SUM(platform_fee) as total_fees,
  SUM(stylist_payout) as total_payouts
FROM payments;

-- Check foreign key relationships
SELECT COUNT(*)
FROM payments p
LEFT JOIN bookings b ON p.booking_id = b.id
WHERE b.id IS NULL;  -- Should be 0

-- Verify unique constraint on booking_id
SELECT booking_id, COUNT(*) as payment_count
FROM payments
GROUP BY booking_id
HAVING COUNT(*) > 1;  -- Should return no rows (one payment per booking)

-- Check status distribution
SELECT
  status,
  COUNT(*) as count,
  ROUND(AVG(final_amount), 2) as avg_amount,
  ROUND(SUM(platform_fee), 2) as total_platform_fee,
  ROUND(SUM(stylist_payout), 2) as total_stylist_payout
FROM payments
GROUP BY status
ORDER BY count DESC;

-- Validate financial calculations
SELECT COUNT(*)
FROM payments
WHERE final_amount != (stylist_payout + platform_fee);  -- Should be 0

-- Check Stripe integration
SELECT
  COUNT(*) as total_payments,
  COUNT(payment_intent_id) as with_payment_intent,
  COUNT(stylist_transfer_id) as with_transfers,
  COUNT(CASE WHEN refunded_amount > 0 THEN 1 END) as with_refunds
FROM payments;

-- Verify payment timestamps
SELECT COUNT(*)
FROM payments
WHERE
  (status = 'succeeded' AND captured_at IS NULL) OR
  (refunded_amount > 0 AND refund_reason IS NULL);  -- Should be 0

-- Check for negative amounts
SELECT COUNT(*)
FROM payments
WHERE
  final_amount < 0 OR
  platform_fee < 0 OR
  stylist_payout < 0 OR
  refunded_amount < 0;  -- Should be 0
```

### Common Issues & Solutions

| Issue                   | Solution                                  |
| ----------------------- | ----------------------------------------- |
| "Foreign key violation" | Ensure booking exists in database         |
| "Duplicate key error"   | Check for existing payment with same ID   |
| "Unique constraint"     | Booking already has a payment             |
| "Invalid amount"        | Check amount calculations and conversions |
| "Invalid status"        | Verify status mapping from MySQL          |

---

## Step 3: Validate Payments (`03-validate-payments.ts`)

### Purpose

Performs comprehensive validation of migrated payment data, verifying data integrity, Stripe references, and financial calculations.

### Input Requirements

- `temp/payments-created.json` (from Step 2)
- Access to PostgreSQL database with migrated payments
- Access to MySQL dump for comparison

### Run the Script

```bash
bun run scripts/migration/phase-5-payments/03-validate-payments.ts
```

### Output Files to Validate

#### 1. `temp/payment-validation-report.json`

**Expected Structure:**

```json
{
  "metadata": {
    "validated_at": "ISO date",
    "total_payments_validated": number,
    "validation_passed": boolean
  },
  "validation_results": {
    "record_counts": {
      "mysql_payments": number,
      "postgres_payments": number,
      "match_percentage": number,
      "passed": boolean
    },
    "financial_integrity": {
      "mysql_total": number,
      "postgres_total": number,
      "difference": number,
      "passed": boolean
    },
    "stripe_references": {
      "payment_intents_valid": number,
      "payment_intents_invalid": number,
      "transfer_ids_valid": number,
      "passed": boolean
    },
    "booking_relationships": {
      "all_payments_have_bookings": boolean,
      "no_orphaned_payments": boolean,
      "no_duplicate_bookings": boolean,
      "passed": boolean
    },
    "data_consistency": {
      "status_mapping_correct": boolean,
      "amounts_calculated_correctly": boolean,
      "timestamps_valid": boolean,
      "passed": boolean
    }
  },
  "issues": [
    {
      "type": "warning|error",
      "category": "string",
      "message": "string",
      "affected_records": ["payment_id1", "payment_id2"]
    }
  ]
}
```

#### 2. `temp/phase-5-completed.json`

**Expected Structure:**

```json
{
  "phase": "Phase 5 - Payment Migration",
  "completed_at": "ISO date",
  "status": "success|partial_success|failed",
  "final_stats": {
    "total_mysql_payments": number,
    "total_migrated": number,
    "migration_rate": number,
    "total_amount_migrated": number,
    "validation_passed": boolean
  },
  "database_counts": {
    "payments": number,
    "payments_with_transfers": number,
    "payments_with_refunds": number
  },
  "next_steps": [
    "Verify Stripe webhook integration",
    "Test payment capture process",
    "Validate payout calculations"
  ]
}
```

### SQL Validation Queries

Run these queries after completing all migration steps to verify data integrity:

```bash
# Connect to your local database
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

#### 1. Record Count Validation

```sql
-- Check total payment counts
SELECT
  'Payment Record Count' as validation_check,
  COUNT(*) as postgres_count
FROM payments;

-- Check unique constraint integrity (one payment per booking)
SELECT
  'Unique Booking-Payment Relationship' as validation_check,
  COUNT(DISTINCT booking_id) as unique_bookings,
  COUNT(*) as total_payments,
  CASE
    WHEN COUNT(DISTINCT booking_id) = COUNT(*) THEN 'PASSED ✅'
    ELSE 'FAILED ❌ - Multiple payments per booking detected'
  END as status
FROM payments;

-- Check for orphaned payments (payments without bookings)
SELECT
  'Orphaned Payments Check' as validation_check,
  COUNT(*) as orphaned_count,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASSED ✅'
    ELSE 'FAILED ❌ - Found payments without valid bookings'
  END as status
FROM payments p
LEFT JOIN bookings b ON p.booking_id = b.id
WHERE b.id IS NULL;
```

#### 2. Financial Integrity Validation

```sql
-- Validate amount calculations
SELECT
  'Amount Calculation Integrity' as validation_check,
  COUNT(*) as incorrect_calculations,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASSED ✅'
    ELSE 'FAILED ❌ - Found payments with incorrect amount calculations'
  END as status
FROM payments
WHERE final_amount != (stylist_payout + platform_fee);

-- Check for negative amounts
SELECT
  'Negative Amount Check' as validation_check,
  SUM(CASE WHEN final_amount < 0 THEN 1 ELSE 0 END) as negative_final,
  SUM(CASE WHEN platform_fee < 0 THEN 1 ELSE 0 END) as negative_platform,
  SUM(CASE WHEN stylist_payout < 0 THEN 1 ELSE 0 END) as negative_payout,
  SUM(CASE WHEN refunded_amount < 0 THEN 1 ELSE 0 END) as negative_refund,
  CASE
    WHEN SUM(CASE WHEN final_amount < 0 OR platform_fee < 0 OR stylist_payout < 0 OR refunded_amount < 0 THEN 1 ELSE 0 END) = 0
    THEN 'PASSED ✅'
    ELSE 'FAILED ❌ - Found negative amounts'
  END as status
FROM payments;

-- Financial summary
SELECT
  'Financial Summary' as report_type,
  COUNT(*) as total_payments,
  ROUND(SUM(final_amount)::numeric, 2) as total_revenue,
  ROUND(SUM(platform_fee)::numeric, 2) as total_platform_fees,
  ROUND(SUM(stylist_payout)::numeric, 2) as total_stylist_payouts,
  ROUND(SUM(refunded_amount)::numeric, 2) as total_refunded,
  ROUND(AVG(final_amount)::numeric, 2) as avg_payment_amount,
  ROUND(AVG(platform_fee)::numeric, 2) as avg_platform_fee,
  ROUND((AVG(platform_fee) / NULLIF(AVG(final_amount), 0) * 100)::numeric, 2) as avg_platform_fee_percentage
FROM payments;
```

#### 3. Stripe Integration Validation

```sql
-- Validate payment intent IDs
SELECT
  'Stripe Payment Intent Validation' as validation_check,
  COUNT(*) as total_payments,
  COUNT(payment_intent_id) as with_payment_intent,
  COUNT(CASE WHEN payment_intent_id LIKE 'pi_%' THEN 1 END) as valid_format,
  ROUND((COUNT(payment_intent_id)::numeric / COUNT(*)::numeric * 100), 2) as coverage_percentage,
  CASE
    WHEN COUNT(payment_intent_id) = COUNT(CASE WHEN payment_intent_id LIKE 'pi_%' THEN 1 END)
    THEN 'PASSED ✅'
    ELSE 'FAILED ❌ - Found invalid payment intent formats'
  END as status
FROM payments;

-- Check for duplicate payment intents
SELECT
  'Duplicate Payment Intent Check' as validation_check,
  COUNT(*) as duplicate_count,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASSED ✅'
    ELSE 'FAILED ❌ - Found duplicate payment intent IDs'
  END as status
FROM (
  SELECT payment_intent_id, COUNT(*) as count
  FROM payments
  WHERE payment_intent_id IS NOT NULL
  GROUP BY payment_intent_id
  HAVING COUNT(*) > 1
) duplicates;

-- Stripe transfer tracking
SELECT
  'Stripe Transfer Tracking' as report_type,
  COUNT(*) as total_payments,
  COUNT(stylist_transfer_id) as with_transfers,
  ROUND((COUNT(stylist_transfer_id)::numeric / COUNT(*)::numeric * 100), 2) as transfer_percentage,
  COUNT(CASE WHEN stylist_transfer_id LIKE 'tr_%' OR stylist_transfer_id LIKE 'po_%' THEN 1 END) as valid_transfer_format
FROM payments
WHERE status = 'succeeded';
```

#### 4. Status Distribution Validation

```sql
-- Payment status distribution
SELECT
  status,
  COUNT(*) as count,
  ROUND((COUNT(*)::numeric / SUM(COUNT(*)) OVER() * 100), 2) as percentage,
  ROUND(AVG(final_amount)::numeric, 2) as avg_amount,
  ROUND(SUM(final_amount)::numeric, 2) as total_amount,
  ROUND(SUM(refunded_amount)::numeric, 2) as total_refunded
FROM payments
GROUP BY status
ORDER BY count DESC;

-- Status-specific validation
SELECT
  'Status-Specific Validation' as validation_check,
  SUM(CASE WHEN status = 'succeeded' AND captured_at IS NULL THEN 1 ELSE 0 END) as succeeded_without_capture,
  SUM(CASE WHEN status = 'requires_capture' AND captured_at IS NOT NULL THEN 1 ELSE 0 END) as uncaptured_with_timestamp,
  SUM(CASE WHEN refunded_amount > 0 AND refund_reason IS NULL THEN 1 ELSE 0 END) as refund_without_reason,
  CASE
    WHEN SUM(CASE
      WHEN (status = 'succeeded' AND captured_at IS NULL) OR
           (status = 'requires_capture' AND captured_at IS NOT NULL) OR
           (refunded_amount > 0 AND refund_reason IS NULL)
      THEN 1 ELSE 0 END) = 0
    THEN 'PASSED ✅'
    ELSE 'FAILED ❌ - Found inconsistent status data'
  END as status
FROM payments;
```

#### 5. Booking Relationship Validation

```sql
-- Booking-Payment relationship integrity
SELECT
  'Booking-Payment Relationships' as validation_check,
  COUNT(DISTINCT p.booking_id) as payments_with_bookings,
  COUNT(DISTINCT b.id) as valid_bookings,
  COUNT(DISTINCT p.id) as total_payments,
  CASE
    WHEN COUNT(DISTINCT p.booking_id) = COUNT(DISTINCT b.id)
    THEN 'PASSED ✅'
    ELSE 'FAILED ❌ - Mismatch in booking relationships'
  END as status
FROM payments p
LEFT JOIN bookings b ON p.booking_id = b.id;

-- Check completed bookings have payments
SELECT
  'Completed Bookings Payment Coverage' as validation_check,
  COUNT(DISTINCT b.id) as completed_bookings,
  COUNT(DISTINCT p.booking_id) as bookings_with_payments,
  COUNT(DISTINCT b.id) - COUNT(DISTINCT p.booking_id) as missing_payments,
  CASE
    WHEN COUNT(DISTINCT b.id) = COUNT(DISTINCT p.booking_id)
    THEN 'PASSED ✅'
    ELSE CONCAT('WARNING ⚠️ - ', (COUNT(DISTINCT b.id) - COUNT(DISTINCT p.booking_id))::text, ' completed bookings without payments')
  END as status
FROM bookings b
LEFT JOIN payments p ON b.id = p.booking_id
WHERE b.status = 'completed';
```

#### 6. Temporal Validation

```sql
-- Payment timeline analysis
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as payment_count,
  ROUND(SUM(final_amount)::numeric, 2) as monthly_revenue,
  ROUND(AVG(final_amount)::numeric, 2) as avg_payment,
  COUNT(DISTINCT booking_id) as unique_bookings
FROM payments
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC
LIMIT 12;

-- Timestamp consistency
SELECT
  'Timestamp Consistency' as validation_check,
  COUNT(*) as total_payments,
  SUM(CASE WHEN updated_at < created_at THEN 1 ELSE 0 END) as updated_before_created,
  SUM(CASE WHEN captured_at IS NOT NULL AND captured_at < created_at THEN 1 ELSE 0 END) as captured_before_created,
  SUM(CASE WHEN succeeded_at IS NOT NULL AND succeeded_at < created_at THEN 1 ELSE 0 END) as succeeded_before_created,
  CASE
    WHEN SUM(CASE
      WHEN updated_at < created_at OR
           (captured_at IS NOT NULL AND captured_at < created_at) OR
           (succeeded_at IS NOT NULL AND succeeded_at < created_at)
      THEN 1 ELSE 0 END) = 0
    THEN 'PASSED ✅'
    ELSE 'FAILED ❌ - Found timestamp inconsistencies'
  END as status
FROM payments;
```

#### 7. Refund Tracking Validation

```sql
-- Refund summary
SELECT
  'Refund Summary' as report_type,
  COUNT(*) as total_refunds,
  ROUND(SUM(refunded_amount)::numeric, 2) as total_refunded_amount,
  ROUND(AVG(refunded_amount)::numeric, 2) as avg_refund,
  COUNT(DISTINCT refund_reason) as unique_reasons,
  ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM payments)::numeric * 100), 2) as refund_rate_percentage
FROM payments
WHERE refunded_amount > 0;

-- Refund validation
SELECT
  'Refund Data Validation' as validation_check,
  COUNT(*) as refunds_exceeding_payment,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASSED ✅'
    ELSE 'FAILED ❌ - Found refunds exceeding original payment amount'
  END as status
FROM payments
WHERE refunded_amount > final_amount;
```

#### 8. Data Completeness

```sql
-- Overall data completeness
SELECT
  'Data Completeness Report' as report_type,
  COUNT(*) as total_records,
  ROUND((COUNT(payment_intent_id)::numeric / COUNT(*)::numeric * 100), 2) as payment_intent_completeness,
  ROUND((COUNT(captured_at)::numeric / COUNT(*)::numeric * 100), 2) as capture_timestamp_coverage,
  ROUND((COUNT(stylist_transfer_id)::numeric / COUNT(*)::numeric * 100), 2) as transfer_id_coverage,
  ROUND((COUNT(CASE WHEN refunded_amount > 0 THEN refund_reason END)::numeric /
         NULLIF(COUNT(CASE WHEN refunded_amount > 0 THEN 1 END), 0)::numeric * 100), 2) as refund_reason_completeness
FROM payments;
```

#### 9. Business Metrics

```sql
-- Key business metrics
SELECT
  'Business Metrics Summary' as report_type,
  COUNT(DISTINCT booking_id) as unique_bookings_paid,
  COUNT(*) as total_transactions,
  ROUND(SUM(final_amount)::numeric, 2) as gross_revenue,
  ROUND(SUM(platform_fee)::numeric, 2) as total_platform_revenue,
  ROUND(SUM(stylist_payout)::numeric, 2) as total_stylist_earnings,
  ROUND(SUM(refunded_amount)::numeric, 2) as total_refunds,
  ROUND((SUM(final_amount) - SUM(refunded_amount))::numeric, 2) as net_revenue,
  ROUND((SUM(platform_fee)::numeric / NULLIF(SUM(final_amount), 0)::numeric * 100), 2) as platform_fee_percentage
FROM payments
WHERE status = 'succeeded';

-- Payment success rate
SELECT
  'Payment Success Rate' as metric,
  COUNT(*) as total_payments,
  COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as successful_payments,
  COUNT(CASE WHEN status IN ('cancelled', 'failed') THEN 1 END) as failed_payments,
  ROUND((COUNT(CASE WHEN status = 'succeeded' THEN 1 END)::numeric / COUNT(*)::numeric * 100), 2) as success_rate_percentage,
  ROUND((COUNT(CASE WHEN status IN ('cancelled', 'failed') THEN 1 END)::numeric / COUNT(*)::numeric * 100), 2) as failure_rate_percentage
FROM payments;
```

#### 10. Final Validation Summary

```sql
-- Final comprehensive validation
WITH validation_summary AS (
  SELECT
    COUNT(*) as total_payments,
    COUNT(DISTINCT booking_id) as unique_bookings,
    COUNT(payment_intent_id) as with_stripe_id,
    SUM(CASE WHEN final_amount != (stylist_payout + platform_fee) THEN 1 ELSE 0 END) as calculation_errors,
    SUM(CASE WHEN final_amount < 0 OR platform_fee < 0 OR stylist_payout < 0 THEN 1 ELSE 0 END) as negative_amounts,
    COUNT(CASE WHEN status NOT IN ('pending', 'requires_capture', 'succeeded', 'cancelled') THEN 1 END) as invalid_status
  FROM payments
)
SELECT
  'FINAL VALIDATION SUMMARY' as validation_report,
  CASE
    WHEN calculation_errors = 0
     AND negative_amounts = 0
     AND invalid_status = 0
     AND with_stripe_id = total_payments
    THEN '✅ MIGRATION SUCCESSFUL - All validations passed'
    ELSE '❌ MIGRATION ISSUES DETECTED - Review failed checks above'
  END as overall_status,
  total_payments,
  unique_bookings,
  calculation_errors,
  negative_amounts,
  invalid_status,
  with_stripe_id as payments_with_stripe_id
FROM validation_summary;
```

### Success Criteria

Phase 5 is considered successful when:

- ✅ All 3 steps complete without critical errors
- ✅ Error rate is below 5% of total records
- ✅ All database integrity checks pass
- ✅ Financial totals match between systems (within rounding tolerance)
- ✅ All payments have valid booking relationships
- ✅ All Stripe payment intent IDs are preserved
- ✅ Status mappings are correctly applied
- ✅ No negative amounts or invalid calculations
- ✅ Validation report shows "validation_passed": true

---

## Integration Testing

After successful Phase 5 completion:

1. **Test payment display:**

   - Payment history shows correctly for bookings
   - Payment status displays properly
   - Financial amounts are accurate
   - Refund information displays correctly

2. **Test Stripe integration:**

   - Payment intent IDs link correctly
   - Transfer IDs are preserved
   - Application fee amounts are correct
   - Webhook processing works (if applicable)

3. **Test financial reporting:**

   - Revenue calculations are accurate
   - Platform fee reports match expectations
   - Stylist payout calculations are correct
   - Refund tracking works properly

4. **Test payment operations:**
   - Payment capture process (for requires_capture status)
   - Refund processing
   - Payout initiation
   - Status updates

## Rollback Procedure

If any step fails critically:

1. **Clean payment data:**

   ```sql
   -- Clear payments table
   DELETE FROM payments;
   ```

2. **Reset temp files:**

   ```bash
   rm -f scripts/migration/temp/payments-extracted.json
   rm -f scripts/migration/temp/payment-extraction-stats.json
   rm -f scripts/migration/temp/payments-created.json
   rm -f scripts/migration/temp/payment-creation-stats.json
   rm -f scripts/migration/temp/payment-validation-report.json
   rm -f scripts/migration/temp/phase-5-completed.json
   ```

3. **Fix identified issues**

4. **Re-run from Step 1**

---

## Risk Assessment

### High Risk Areas

1. **Booking ID Mapping**

   - Risk: Payment references non-existent booking
   - Mitigation: Validate all bookings exist before creating payments
   - Impact: Payment without booking breaks business logic

2. **Stripe Reference Integrity**

   - Risk: Loss of payment_intent_id breaks Stripe integration
   - Mitigation: Validate all Stripe IDs format and preserve exactly
   - Impact: Cannot process refunds or track payments in Stripe

3. **Financial Calculations**

   - Risk: Incorrect amount calculations affect revenue
   - Mitigation: Validate sum of stylist_payout + platform_fee = final_amount
   - Impact: Financial reporting errors, payout discrepancies

4. **Status Mapping**

   - Risk: Incorrect status prevents payment processing
   - Mitigation: Comprehensive status mapping with validation
   - Impact: Payments stuck in wrong state, cannot capture or refund

5. **Duplicate Payments**
   - Risk: Multiple payments for single booking
   - Mitigation: Unique constraint on booking_id
   - Impact: Overcharging customers, financial discrepancies

### Data Quality Checks

1. **Before Migration:**

   - Verify all referenced bookings exist in Phase 4 output
   - Check for reasonable amount ranges (no extreme values)
   - Validate Stripe ID formats

2. **During Migration:**

   - Monitor error rates per step
   - Log all skipped payments with reasons
   - Validate foreign key relationships before insertion

3. **After Migration:**
   - Run comprehensive validation queries
   - Compare financial totals with MySQL
   - Test sample transactions in application

---

## Performance Considerations

### Batch Processing

- Process payments in batches of 500-1000 for production
- Monitor memory usage during large payment migrations
- Consider using database transactions for atomicity

### Index Creation

After migration, ensure these indexes exist:

```sql
-- Payment lookup optimization
CREATE INDEX IF NOT EXISTS idx_payments_booking_id
ON payments(booking_id);

CREATE INDEX IF NOT EXISTS idx_payments_payment_intent_id
ON payments(payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
ON payments(status);

-- Financial reporting optimization
CREATE INDEX IF NOT EXISTS idx_payments_created_at
ON payments(created_at);

CREATE INDEX IF NOT EXISTS idx_payments_status_created
ON payments(status, created_at);

-- Payout tracking
CREATE INDEX IF NOT EXISTS idx_payments_stylist_transfer
ON payments(stylist_transfer_id)
WHERE stylist_transfer_id IS NOT NULL;
```

---

## Monitoring & Observability

### Key Metrics to Track

1. **Migration Progress:**

   - Records processed per minute
   - Success/error rates per step
   - Memory usage during processing

2. **Data Quality:**

   - Percentage of payments with valid bookings
   - Percentage of payments with Stripe IDs
   - Status transformation success rate

3. **Financial Impact:**
   - Total amount migrated
   - Platform fees preserved
   - Refund amounts tracked
   - Average payment amounts

### Alerting Thresholds

- Error rate > 5% → Stop migration and investigate
- Financial discrepancy > 1000 NOK → Review calculations
- Missing Stripe IDs > 1% → Check data extraction
- Orphaned payments > 0 → Review booking relationships

---

## Post-Migration Verification

### Business Validation

1. **Financial Reconciliation:**

   ```sql
   -- Compare totals with accounting records
   SELECT
     DATE_TRUNC('month', created_at) as month,
     COUNT(*) as payment_count,
     SUM(final_amount) as total_revenue,
     SUM(platform_fee) as total_fees,
     SUM(stylist_payout) as total_payouts,
     SUM(refunded_amount) as total_refunds
   FROM payments
   WHERE status = 'succeeded'
   GROUP BY DATE_TRUNC('month', created_at)
   ORDER BY month DESC;
   ```

2. **Stripe Consistency:**

   - Export payment IDs and verify against Stripe dashboard
   - Check transfer IDs match Stripe Connect transfers
   - Validate application fee amounts

3. **Booking-Payment Integrity:**

   ```sql
   -- Ensure all completed bookings have payments
   SELECT COUNT(*)
   FROM bookings b
   LEFT JOIN payments p ON b.id = p.booking_id
   WHERE b.status = 'completed' AND p.id IS NULL;  -- Should be minimal
   ```

### Next Steps

After successful Phase 5 completion:

1. **Enable Payment Processing:**

   - Configure Stripe webhooks for new system
   - Test payment capture workflow
   - Verify refund processing

2. **Financial Reporting:**

   - Set up revenue dashboards
   - Configure payout reports
   - Implement financial analytics

3. **Proceed to Next Phase:**
   - Phase 6: Chat/Messaging Migration (if applicable)
   - Or begin post-migration optimization

This comprehensive test plan ensures the Phase 5 Payments Migration maintains financial integrity while successfully transforming the MySQL payment system into the new PostgreSQL structure with enhanced tracking and reporting capabilities.
