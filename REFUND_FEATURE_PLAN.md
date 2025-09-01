# Refund Feature Implementation Plan

## Overview

Implementation of comprehensive refund functionality for the Nabostylisten platform, enabling admin-initiated refunds and enhanced stylist/customer cancellation flows with automatic refund processing.

## Business Rules

### Customer-Initiated Cancellations

- **>48 hours before appointment**: Full refund to customer
- **24-48 hours before appointment**: 50% refund to customer, 50% compensation to stylist
- **<24 hours before appointment**: No refund to customer, full payment to stylist

### Stylist-Initiated Cancellations

- **Any time**: Full refund to customer (stylist fault, customer should not be penalized)

### Admin-Initiated Refunds

- **Full discretion**: Admin can refund any amount at any time for any reason
- **Audit trail**: All admin refunds logged with reason and administrator details

## Technical Foundation

### Existing Infrastructure

- ✅ `processRefund()` function in `server/stripe.actions.ts` handles complex refund logic
- ✅ Stripe integration with `createStripeRefund()` and `cancelStripePaymentIntent()`
- ✅ Database schema supports refund tracking (`payments.refunded_amount`, `refund_reason`)
- ✅ Admin payments dashboard with data table at `/protected/admin/payments`
- ✅ Payment status management and audit trails

### Key Integration Points

- Admin payments table with refund action button
- Existing booking cancellation dialog for stylists
- Payment processing pipeline with Stripe
- Email notification system for refund confirmations

## Phase 1: Admin Refund Interface

### 1.1 Admin Refund Dialog Component

**File**: `components/admin/admin-refund-dialog.tsx`

**Features**:

- Payment details display (amount, customer, stylist, booking date)
- Refund amount input with validation (cannot exceed remaining refundable amount)
- Refund reason selection dropdown + custom reason input
- Impact preview showing:
  - Current payment status and amounts
  - Refund breakdown (customer refund, platform fee impact)
  - What happens in Stripe (cancel vs refund)
  - Notification plan (emails to customer/stylist)
- Confirmation step with summary of actions

**Business Logic**:

- Calculate maximum refundable amount (original amount - existing refunds)
- Detect payment status (captured vs uncaptured) for appropriate Stripe action
- Preview refund impact on platform fees and stylist payouts

### 1.2 Admin Refund Server Action

**File**: `server/admin-refund.actions.ts`

**Functions**:

- `processAdminRefund({ paymentIntentId, refundAmountNOK, refundReason, adminId })`
- Admin authorization middleware
- Enhanced audit logging
- Integration with existing `processRefund()` logic

**Authorization**:

- Verify admin role from session
- Log all refund attempts (successful and failed)
- Rate limiting to prevent abuse

### 1.3 Payments Columns Integration

**File**: `components/admin/payments-columns.tsx`

**Changes**:

- Enable refund dropdown menu item
- Pass payment data to refund dialog
- Disable refund for fully refunded payments
- Show refund history in expandable row details

## Phase 2: Enhanced Stylist Cancellation Flow

### 2.1 Enhanced Cancel Booking Dialog

**File**: `components/my-bookings/cancel-booking-dialog.tsx`

**Enhancements**:

- Time-based refund calculation display
- Clear explanation of refund policy based on cancellation timing
- Preview of financial impact for both customer and stylist
- Confirmation of refund processing

**Business Logic**:

- Calculate hours until appointment start
- Apply customer vs stylist cancellation rules
- Show refund amounts and compensation details

### 2.2 Automatic Refund Integration

**File**: `server/booking.actions.ts`

**Enhanced Functions**:

- Update booking cancellation to trigger automatic refunds
- Integrate time-based refund calculations
- Process refunds immediately upon cancellation confirmation
- Send appropriate notifications to both parties

**Integration Points**:

- Existing booking cancellation flow
- `processRefund()` function for Stripe integration
- Email notification system
- Real-time updates via Supabase subscriptions

## Phase 3: Database & Security Enhancements

### 3.1 Database Schema Updates

**File**: `supabase/schemas/00-schema.sql`

**Additions**:

```sql
-- Add refund audit trail
ALTER TABLE public.payments
ADD COLUMN refund_initiated_by uuid REFERENCES public.profiles(id),
ADD COLUMN refund_initiated_at timestamp with time zone,
ADD COLUMN admin_refund_reason text;

-- Add indexes for refund queries
CREATE INDEX idx_payments_refund_status ON public.payments(status) WHERE refunded_amount > 0;
CREATE INDEX idx_payments_refund_initiated_by ON public.payments(refund_initiated_by);
```

### 3.2 Security & Rate Limiting

- Admin action rate limiting (max 10 refunds per hour per admin)
- Comprehensive audit logging for all refund operations
- Input validation and sanitization
- CSRF protection for admin actions

### 3.3 Error Handling & Recovery

- Rollback mechanisms for failed refund operations
- Stripe webhook handling for refund status updates
- Retry logic for failed Stripe API calls
- Dead letter queue for failed refund notifications

## Phase 4: User Experience & Notifications

### 4.1 Email Notifications

**Files**: `transactional/emails/refund-*.tsx`

**Templates**:

- Customer refund confirmation
- Stylist cancellation compensation notice
- Admin refund notification
- Refund processing status updates

### 4.2 Real-time Updates

- WebSocket notifications for refund status changes
- Dashboard refresh triggers for admin users
- Booking status updates in customer/stylist interfaces

### 4.3 User Interface Polish

- Loading states during refund processing
- Success/error toast notifications
- Clear refund policy documentation
- Refund history in user profiles

## Implementation Timeline

### Week 1: Phase 1 - Admin Refund Interface

- Day 1-2: Admin refund dialog component
- Day 3-4: Admin refund server action with authorization
- Day 5: Integration with payments table and testing

### Week 2: Phase 2 - Enhanced Cancellation Flow

- Day 1-2: Enhanced cancel booking dialog with refund preview
- Day 3-4: Automatic refund processing integration
- Day 5: End-to-end testing and refinements

### Week 3: Phase 3 & 4 - Polish and Production Readiness

- Day 1-2: Database schema updates and security enhancements
- Day 3-4: Email notifications and real-time updates
- Day 5: Final testing, documentation, and deployment

## Success Metrics

### Technical Metrics

- Refund processing success rate >99%
- Average refund processing time <30 seconds
- Zero failed Stripe integrations
- Complete audit trail for all refund operations

### Business Metrics

- Reduced admin workload for refund requests
- Improved customer satisfaction scores
- Faster resolution of cancellation disputes
- Clear financial reporting for refunded transactions

## Risk Mitigation

### Financial Risks

- Double-refund prevention through database constraints
- Maximum refund amount validation
- Admin approval for large refunds (>5000 NOK)
- Daily refund limit monitoring

### Technical Risks

- Stripe API failure handling with retry mechanisms
- Database transaction integrity with rollback capabilities
- Race condition prevention for concurrent refund requests
- Comprehensive error logging and monitoring

### Operational Risks

- Admin training documentation for refund procedures
- Clear escalation paths for complex refund scenarios
- Regular reconciliation with Stripe refund reports
- Customer support integration for refund inquiries

## Testing Strategy

### Unit Tests

- Refund calculation logic validation
- Authorization middleware testing
- Database transaction integrity
- Stripe integration mocking

### Integration Tests

- End-to-end refund flow testing
- Admin interface functionality
- Email notification delivery
- Real-time update propagation

### User Acceptance Testing

- Admin user workflow validation
- Customer/stylist cancellation scenarios
- Edge case handling (partial refunds, failed payments)
- Performance testing under load

---

## Next Steps

1. **Phase 1 Implementation**: Begin with admin refund dialog component
2. **Stakeholder Review**: Present plan to product and business teams
3. **Technical Review**: Validate approach with development team
4. **Sprint Planning**: Break down phases into detailed development tasks
