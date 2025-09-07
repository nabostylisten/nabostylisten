# Affiliate Commission Refund Testing

This document outlines the test scenarios for affiliate commission handling during booking cancellations and refunds.

## Implementation Summary

The affiliate commission refund handling has been implemented across all refund scenarios:

### 1. New Functions Added

- `reverseAffiliateCommission(bookingId)` - Marks affiliate commissions as "refunded" and updates affiliate_clicks
- `shouldPreventAffiliateCommission(bookingId)` - Prevents commission tracking for cancelled/refunded bookings
- Updated `trackAffiliateCommission(bookingId)` to check for prevention

### 2. Database Changes

Added new enum values to `affiliate_payout_status`:

- `'refunded'` - Commission reversed due to booking refund
- `'cancelled'` - Commission cancelled due to booking cancellation

### 3. Refund Scenarios Covered

#### A. Customer Booking Cancellation (`cancelBooking()`)

- **Location**: `/server/booking/lifecycle.actions.ts`
- **Behavior**: Calls `reverseAffiliateCommission()` after booking status update
- **Commission Status**: Set to "refunded"
- **Affiliate Clicks**: Reset `converted=false`, `commission_amount=0`

#### B. Stripe Payment Refund (`processRefund()`)

- **Location**: `/server/stripe.actions.ts`
- **Scenarios**:
  - Uncaptured payment cancellation → Commission reversed
  - Captured payment refund → Commission reversed
- **Commission Status**: Set to "refunded"

#### C. Admin Refund (`processAdminRefund()`)

- **Location**: `/server/admin/admin-refund.actions.ts`
- **Behavior**: Calls `reverseAffiliateCommission()` after successful refund
- **Commission Status**: Set to "refunded"

### 4. Prevention Mechanisms

#### A. Commission Tracking Prevention

- `trackAffiliateCommission()` now checks `shouldPreventAffiliateCommission()`
- Prevents commission creation for already cancelled/refunded bookings
- Handles race conditions gracefully

#### B. Idempotent Operations

- `reverseAffiliateCommission()` is safe to call multiple times
- Already reversed commissions are not modified again

## Test Scenarios

### Scenario 1: Customer Cancels Booking Before Payment Capture

1. Customer books service with affiliate code
2. Payment intent created but not captured
3. Customer cancels booking
4. **Expected**: No commission created, payment cancelled

### Scenario 2: Customer Cancels Booking After Payment Capture

1. Customer books service with affiliate code
2. Payment captured, commission created with status "pending"
3. Customer cancels booking
4. **Expected**: Commission status changed to "refunded", affiliate_clicks updated

### Scenario 3: Admin Refund on Completed Booking

1. Booking completed with affiliate commission
2. Admin processes refund through admin panel
3. **Expected**: Commission status changed to "refunded"

### Scenario 4: Partial Refund Scenarios

1. Full refund → Commission fully reversed
2. Any refund amount → Commission still reversed (business rule: any refund = no commission)

### Scenario 5: Race Condition Handling

1. Payment capture and cancellation happen simultaneously
2. **Expected**: Graceful handling, no duplicate commissions

## Business Rules Implemented

1. **Any refund = No commission**: Even partial refunds result in full commission reversal
2. **No double-tracking**: Prevention mechanism stops commission creation for refunded bookings
3. **Graceful failure**: Commission operations never fail parent refund operations
4. **Audit trail**: All commission reversals are logged with timestamps and reasons

## Manual Testing Steps

1. **Set up test booking with affiliate**:

   ```typescript
   // Create booking with affiliate_id in payment record
   // Verify commission is created when payment captured
   ```

2. **Test cancellation**:

   ```typescript
   // Cancel booking via cancelBooking()
   // Check commission status changed to "refunded"
   // Verify affiliate_clicks updated
   ```

3. **Test admin refund**:

   ```typescript
   // Process admin refund via admin panel
   // Check commission reversal logged
   ```

4. **Test prevention**:

   ```typescript
   // Try to track commission on already cancelled booking
   // Should be prevented and return null
   ```

## Edge Cases Handled

1. **No commission exists**: Reversal operations handle gracefully
2. **Already reversed**: Idempotent operations don't create errors
3. **Service failures**: Commission operations don't break refund flows
4. **Missing booking data**: Graceful fallbacks with logging

The implementation ensures that affiliate commissions cannot be issued when orders are cancelled or refunded, maintaining business rule integrity while providing comprehensive audit trails.
