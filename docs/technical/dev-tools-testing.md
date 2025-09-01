# Dev Tools Testing Guide

This guide explains how to test payment processing and payout functionality using the dev tools dashboard.

## Overview

The dev tools dashboard (`/admin/dev-tools`) provides buttons to manually trigger payment processing and payout processing for testing purposes. Since Stripe Connect requires specific capabilities to be enabled, manual testing with real services is the recommended approach.

## Prerequisites

1. **Database Setup**: Run `bun supabase:db:reset` to set up test data with Stripe accounts
2. **Confirmed Bookings**: You need bookings with `status = "confirmed"` and `payment_captured_at = NULL`
3. **Real Payment Intents**: Create actual bookings through your application flow

## Testing Payment Processing

### Step 1: Create a Test Service Booking

1. **Navigate to the application** as a customer
2. **Browse services** and select a stylist who has completed Stripe onboarding
3. **Book a service** - this creates a real PaymentIntent with proper Connect integration
4. **Complete payment** but don't let the system auto-capture (booking should be `confirmed` status)

### Step 2: Verify Dev Tools Shows Pending Payments

1. **Go to `/admin/dev-tools`**
2. **Check "Behandle betalinger" button** - should show count > 0
3. **Verify the booking appears** in the database:

   ```sql
   SELECT id, status, payment_captured_at, stripe_payment_intent_id
   FROM bookings
   WHERE status = 'confirmed' AND payment_captured_at IS NULL;
   ```

### Step 3: Test Payment Capture

1. **Click "Behandle betalinger"** in dev tools
2. **Check the logs** for successful payment capture
3. **Verify booking is updated**:

   ```sql
   SELECT id, status, payment_captured_at
   FROM bookings
   WHERE id = 'your-booking-id';
   ```

## Testing Payout Processing

### Step 1: Create Completed Services

1. **Complete the service flow** (either wait for scheduled time or manually update)
2. **Set booking status to "completed"**:

   ```sql
   UPDATE bookings
   SET status = 'completed'
   WHERE id = 'your-booking-id';
   ```

3. **Ensure payment was captured** (`payment_captured_at IS NOT NULL`)
4. **Ensure payout hasn't been processed** (`payout_processed_at IS NULL`)

### Step 2: Test Payout Processing

1. **Go to `/admin/dev-tools`**
2. **Check "Behandle utbetalinger" button** - should show count > 0
3. **Click the button** to process payouts
4. **Verify payout completion**:

   ```sql
   SELECT id, status, payment_captured_at, payout_processed_at
   FROM bookings
   WHERE id = 'your-booking-id';
   ```

## Troubleshooting

### "No such payment_intent" Errors

- **Cause**: Fake payment intent IDs in seed data
- **Solution**: Use real bookings created through the application flow

### "Insufficient capabilities" Errors

- **Cause**: Stylist accounts need `transfers` capability enabled
- **Solution**: Complete Stripe onboarding for stylist accounts, or manually enable capabilities in Stripe Dashboard

### Zero Items to Process

- **Cause**: No bookings match the processing criteria
- **Solution**: Verify booking status and payment timestamps match expected states

## Database Queries for Debugging

```sql
-- Check bookings ready for payment capture
SELECT b.id, b.status, b.payment_captured_at, b.stripe_payment_intent_id,
       p.email as customer_email, s.email as stylist_email
FROM bookings b
JOIN profiles p ON b.customer_id = p.id
JOIN profiles s ON b.stylist_id = s.id
WHERE b.status = 'confirmed'
  AND b.payment_captured_at IS NULL;

-- Check bookings ready for payout
SELECT b.id, b.status, b.payment_captured_at, b.payout_processed_at,
       p.email as customer_email, s.email as stylist_email
FROM bookings b
JOIN profiles p ON b.customer_id = p.id
JOIN profiles s ON b.stylist_id = s.id
WHERE b.status = 'completed'
  AND b.payment_captured_at IS NOT NULL
  AND b.payout_processed_at IS NULL;

-- Check payment records
SELECT booking_id, payment_intent_id, status, captured_at, succeeded_at
FROM payments
ORDER BY created_at DESC
LIMIT 10;
```

## Manual Database Setup (Alternative)

If you need to quickly create test scenarios without going through the full booking flow:

```sql
-- Update an existing booking to need payment capture
UPDATE bookings
SET status = 'confirmed',
    payment_captured_at = NULL,
    stripe_payment_intent_id = 'pi_your_real_payment_intent_id'
WHERE id = 'existing-booking-id';

-- Update a booking to need payout processing
UPDATE bookings
SET status = 'completed',
    payment_captured_at = NOW(),
    payout_processed_at = NULL
WHERE id = 'existing-booking-id';
```

**Important**: Only use real PaymentIntent IDs that exist in your Stripe account.
