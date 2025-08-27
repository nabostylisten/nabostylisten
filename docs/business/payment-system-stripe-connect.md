# Payment System with Stripe Connect

## Overview

**STATUS: PARTIALLY IMPLEMENTED** - Core payment capture and email notifications are live. Stripe Connect payouts pending.

The payment system uses Stripe for payment processing with automated payment capture 24 hours before appointments. Full marketplace functionality with Stripe Connect payouts to stylists is planned.

## Core Architecture

### Stripe Connect Setup

- **Account Type**: Express or Standard Connect accounts for stylists
- **Platform Fee**: 20% automatically deducted from each transaction
- **Payout Schedule**: Direct to stylist bank accounts (minus platform fee)

## Payment Flow

### 1. Pre-Authorization Model

**Implementation**: Payment authorization at booking time, capture before service

- **At Booking**:

  - Customer card pre-authorized for full amount
  - No immediate charge (funds reserved only)
  - Booking created with "pending" payment status

- **After Successful Payment**:
  - Customer receives payment receipt email with booking details
  - Stylist receives booking request email (only after payment confirmation)
  - Both emails sent automatically from `/checkout/success` page
  - Email delivery respects user notification preferences

- **24 Hours Before Service** ✅ (IMPLEMENTED):
  - Automatic payment capture via cron job
  - Platform fee (20%) calculated and tracked
  - Payment confirmation emails sent to both parties
  - Database tracking via `payment_captured_at` field

- **After Service Completion** ✅ (IMPLEMENTED):
  - Payout processing 1-2 hours after service ends
  - Email notifications sent to stylist and customer
  - Database tracking via `payout_processed_at` field
  - *Note: Actual Stripe Connect transfers pending implementation*

### 2. Cancellation Policy

- **48+ hours before**: Full refund, pre-authorization released
- **24-48 hours**: 50% charge, 50% refund
- **Less than 24 hours**: Full charge, no refund
- **No-show**: Full charge applied

## Automated Payment Scheduling ✅ (IMPLEMENTED)

### Payment Capture Automation

**Business Problem Solved**: Ensures no customer gets free services by missing payment capture windows.

#### Rolling Window Strategy

The system uses a sophisticated 6-hour rolling window to guarantee 100% payment capture coverage:

**Timeline Example:**
```
Customer books for Wednesday 14:00
↓
Tuesday 12:00 - Cron job sees booking (26 hours away, within 24-30h window)
Tuesday 14:00 - Payment captured (exactly 24h before appointment) ✅
Tuesday 18:00 - Next cron run skips booking (already captured)
Wednesday 14:00 - Service happens - PAID! ✅
```

**Key Benefits:**
- **Zero Gaps**: Every booking gets processed exactly once
- **Fault Tolerant**: System continues working even if one cron run fails
- **Scalable**: Handles high booking volumes without performance issues
- **Auditable**: Complete payment trail in database

### Payout Processing Automation

**Business Rule**: Process stylist payouts 1-2 hours after service completion to allow for any last-minute issues.

#### Service Completion Flow

1. **Booking Status**: Admin/stylist marks booking as "completed"
2. **Automated Processing**: Cron job runs every hour
3. **Payout Calculation**: 80% to stylist, 20% platform fee
4. **Notifications**: Both parties receive email confirmations
5. **Database Tracking**: All timestamps recorded for audit

**Email Communications:**
- **To Stylist**: "Utbetaling behandlet" with payout breakdown
- **To Customer**: "Tjeneste fullført" service completion confirmation

### Error Prevention

**Duplicate Prevention**: Uses database timestamps to prevent:
- Double payment captures
- Multiple payout attempts
- Race conditions between cron runs

**Monitoring Capabilities**:
- Logs all payment capture attempts
- Tracks success/failure rates
- Identifies bookings that might need manual intervention

## Integration Points

### Database Schema

- `stripe_payment_intent_id` in bookings table ✅ (already exists)
- `stripe_account_id` in stylist_details ✅ (already exists)
- `stripe_customer_id` in profiles ✅ (already exists)
- Payments table for detailed tracking ✅ (already exists)

### TODO: Implementation Tasks

1. **Stylist Onboarding**:

   - [ ] Create Stripe Connect onboarding flow
   - [ ] Store `stripe_account_id` after successful onboarding
   - [ ] Verify bank account and identity

2. **Booking Payment Flow**:

   - [x] Create payment intent with pre-authorization ✅ (implemented)
   - [x] Store `stripe_payment_intent_id` in booking ✅ (implemented)
   - [x] Post-payment email system with customer receipts and stylist notifications ✅ (implemented)
   - [x] **Payment capture cron job** ✅ (implemented)
     - Runs every 6 hours with 6-hour rolling window
     - Captures payments 24-30 hours before appointments
     - Prevents duplicate captures with database tracking
   - [x] **Payout notification system** ✅ (implemented)
     - Processes completed bookings every hour
     - Sends "payout processed" emails to both parties
     - Tracks payout status in database
   - [ ] **Stripe Connect transfers** (pending)
     - Actual money transfer to stylist accounts
     - Integration with stylist onboarding

3. **Chat Integration**:

   - [ ] Link chat to specific booking (not general customer-stylist chat)
   - [ ] Provide booking context in chat interface
   - [ ] Archive chat after booking completion

4. **Webhooks**:

   - [ ] Payment intent succeeded
   - [ ] Payment captured
   - [ ] Transfer completed to stylist
   - [ ] Refund processed

5. **Admin Dashboard**:
   - [ ] Transaction overview
   - [ ] Platform earnings reports
   - [ ] Dispute management
   - [ ] Payout monitoring

## Security Considerations

- PCI compliance through Stripe
- No card details stored locally
- Webhook signature verification
- Idempotent payment operations

## Future Enhancements

- Subscription services
- Package deals with upfront payment
- Tipping functionality
- Multi-currency support
