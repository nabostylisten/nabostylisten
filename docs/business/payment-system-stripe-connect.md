# Payment System with Stripe Connect

## Overview

**STATUS: TODO - To be implemented**

The payment system will use Stripe Connect to handle marketplace transactions between customers and stylists, with automatic platform fee collection and secure payment processing.

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

- **24 Hours Before Service**:
  - Automatic payment capture
  - Platform fee (20%) automatically separated
  - Stylist payout scheduled (80% of total)

### 2. Cancellation Policy

- **48+ hours before**: Full refund, pre-authorization released
- **24-48 hours**: 50% charge, 50% refund
- **Less than 24 hours**: Full charge, no refund
- **No-show**: Full charge applied

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

   - [ ] Create payment intent with pre-authorization
   - [ ] Store `stripe_payment_intent_id` in booking
   - [ ] Implement capture logic 24 hours before service

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
