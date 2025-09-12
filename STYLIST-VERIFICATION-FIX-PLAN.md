# Stylist Verification Fix Plan

## Problem Statement

The current system has critical issues with stylist onboarding verification that allow unverified stylists to appear on the platform and cause payment failures:

1. **Database Field Inaccuracy**: `identity_verification_completed_at` is being set incorrectly, before actual Stripe identity verification is complete
2. **No Service Filtering**: Unverified stylists' services appear on the platform, causing payment failures when customers try to book
3. **Inconsistent Status Checks**: Different parts of the app use different logic to determine verification status
4. **Payment Intent Failures**: The flexible payment intent creation fails for unverified stylists with "transfer capabilities" errors

## Root Cause Analysis

### Issue 1: Incorrect Database Field Setting

- In `stripe-return-content.tsx`, the system only checks the database field: `!!stylistDetails?.identity_verification_completed_at`
- The main stylist page correctly checks Stripe API first, but other parts of the app don't
- The database field gets set prematurely, before actual Stripe verification is complete

### Issue 2: No Service Visibility Filtering

- Services from unverified stylists are visible on:
  - Services page (`/tjenester`)
  - Popular services component
  - Stylist public profiles
- This leads to customers booking with stylists who can't receive payments

### Issue 3: Payment Intent Creation Issues

- The flexible payment intent creation doesn't pre-check stylist verification status
- Results in runtime failures when trying to create payment intents for unverified stylists

## Solution Plan

## Phase 1: Create Centralized Onboarding Status Utility

### 1.1 Enhanced Onboarding Status Utility

**Files to Modify:**

- `lib/stylist-onboarding-status.ts`

**Tasks:**

- Extract the complete logic from `/app/stylist/stripe/page.tsx` into reusable functions
- Create `getStylistVerificationStatus()` function that:
  - Checks Stripe API for account status (charges_enabled, payouts_enabled, details_submitted)
  - Checks Stripe API for identity verification status (not just database)
  - Returns comprehensive status object with boolean flags
- Create `isStylistFullyVerified()` function for simple boolean checks
- Create `shouldShowStylistServices()` function for filtering logic

### 1.2 Database Sync Utility

**Files to Create:**

- `lib/stripe/sync-verification-status.ts`

**Tasks:**

- Create `syncVerificationStatusToDatabase()` function
- Only updates database when Stripe confirms verification is complete
- Handles batch updates for multiple stylists if needed

## Phase 2: Fix Database Synchronization Issues

### 2.1 Fix Stripe Return Content

**Files to Modify:**

- `components/stripe/stripe-return-content.tsx`

**Tasks:**

- Replace database-only check with proper Stripe API verification
- Use the new centralized utility function
- Only show "complete" status when Stripe confirms it

### 2.2 Update Webhook Handlers

**Files to Modify:**

- `app/api/webhooks/stripe/identity/route.ts`
- `app/api/webhooks/stripe/connect/route.ts`

**Tasks:**

- Ensure identity verification webhook properly syncs to database
- Add logging for verification status changes
- Handle edge cases where Stripe status changes

### 2.3 Fix Onboarding Flow Logic

**Files to Modify:**

- `app/stylist/stripe/stylist-stripe-onboarding.tsx`

**Tasks:**

- Ensure completion logic uses Stripe API as source of truth
- Fix any premature "completion" messaging

## Phase 3: Implement Service Filtering

### 3.1 Update Service Fetching Actions

**Files to Modify:**

- `server/infinite-services.actions.ts` (fetchInfiniteServices)
- `server/stats.actions.ts` (getPopularServices)

**Tasks:**

- Add database joins to include stylist verification status
- Filter out services where `identity_verification_completed_at` IS NULL
- Add database indexes if needed for performance

### 3.2 Update Service Display Components

**Files to Modify:**

- `components/services/infinite-services-grid.tsx`
- `components/landing/popular-services.tsx`
- `components/stylist-public-profile.tsx`

**Tasks:**

- Services grid: Only show verified stylists' services
- Popular services: Only include verified stylists
- Stylist profile: Show profile info but hide services if unverified

### 3.3 Add Verification Status Indicators

**Files to Modify:**

- `components/stylist-public-profile.tsx`

**Tasks:**

- Show verification status badge
- Display appropriate messaging for unverified stylists
- Provide guidance on verification process

## Phase 4: Update Payment Flow

### 4.1 Pre-flight Verification Check

**Files to Modify:**

- `server/booking/creation.actions.ts`
- `lib/stripe/connect.ts`

**Tasks:**

- Add verification check before creating payment intents
- Use database field for performance (now that it's accurate)
- Return appropriate error messages for unverified stylists

### 4.2 Booking Flow Error Handling

**Files to Modify:**

- `app/bestilling/page.tsx`
- `components/cart/add-to-cart-button.tsx`

**Tasks:**

- Handle verification errors gracefully
- Show informative error messages to customers
- Prevent adding unverified stylists' services to cart

## Phase 5: Performance Optimization

### 5.1 Database Indexes

**Files to Create:**

- Migration file for verification status indexes

**Tasks:**

- Add index on `stylist_details.identity_verification_completed_at`
- Add composite indexes for service filtering queries
- Monitor query performance

### 5.2 Caching Strategy

**Files to Create:**

- `lib/cache/verification-status-cache.ts`

**Tasks:**

- Implement Redis/memory caching for verification status
- Cache Stripe API responses for short periods
- Invalidate cache on webhook updates

## Phase 6: Admin Tools & Monitoring

### 6.1 Admin Dashboard Updates

**Files to Modify:**

- Admin dashboard components

**Tasks:**

- Show verification status in stylist listings
- Add tools to manually trigger verification sync
- Add alerts for verification failures

### 6.2 Monitoring & Alerts

**Files to Create:**

- Verification status monitoring utilities

**Tasks:**

- Monitor verification success rates
- Alert on sync failures between Stripe and database
- Track conversion impact of verification filtering

## Implementation Priority

### Critical (Must Fix Immediately)

- Phase 1.1: Centralized utility functions
- Phase 2.1: Fix stripe return content
- Phase 3.1: Service filtering in database queries

### High Priority (Next Sprint)

- Phase 4.1: Pre-flight verification checks
- Phase 2.2: Webhook improvements
- Phase 3.2: Component updates

### Medium Priority (Following Sprint)

- Phase 5.1: Performance optimization
- Phase 6: Admin tools and monitoring

## Success Criteria

### Functional Requirements

- ✅ Only fully verified stylists' services appear on platform
- ✅ Database `identity_verification_completed_at` field is accurate
- ✅ Payment intent creation never fails due to verification issues
- ✅ Customers cannot book with unverified stylists
- ✅ Clear error messages when verification is incomplete

### Performance Requirements

- ✅ Service filtering adds <50ms to query times
- ✅ Verification status checks are cached appropriately
- ✅ Database queries remain efficient with filtering

### User Experience Requirements

- ✅ Smooth onboarding flow with clear status indicators
- ✅ Informative error messages for customers and stylists
- ✅ Admin tools for managing verification issues

## Risk Mitigation

### Data Integrity Risks

- **Risk**: Existing verified stylists marked as unverified
- **Mitigation**: Careful migration script with manual verification of edge cases

### Performance Risks

- **Risk**: Service filtering slows down popular pages
- **Mitigation**: Proper indexing and query optimization testing

### Business Impact Risks

- **Risk**: Temporary reduction in visible services during rollout
- **Mitigation**: Staged rollout with ability to quickly revert

## Testing Strategy

### Unit Tests

- Onboarding status utility functions
- Service filtering logic
- Database sync functions

### Integration Tests

- Full onboarding flow end-to-end
- Service visibility with different verification states
- Payment intent creation with verification checks

### Manual Testing

- Stylist onboarding journey
- Customer booking journey with unverified stylists
- Admin dashboard functionality

## Rollout Plan

### Phase 1: Behind Feature Flag

- Deploy utility functions and database sync
- Test with small subset of users
- Monitor for issues

### Phase 2: Gradual Rollout

- Enable service filtering gradually (10%, 50%, 100%)
- Monitor conversion rates and error rates
- Be ready to quickly disable if issues arise

### Phase 3: Full Production

- All verification checks active
- Admin tools deployed
- Monitoring and alerting active

---

## Comprehensive Test Plan

This section outlines detailed test scenarios covering both stylist and customer flows across different verification states.

### Test Setup Prerequisites

**Test Data Required:**

- 3 Stylist accounts:
  - `Stylist A`: No Stripe account (completely new)
  - `Stylist B`: Stripe account with basic onboarding, no identity verification
  - `Stylist C`: Fully verified (Stripe + identity verification complete)
- 2 Customer accounts for booking tests
- Published services for each stylist state
- Test payment methods and addresses

**Environment Setup:**

- Local development environment with Supabase running
- Stripe test keys configured
- Email notifications enabled for testing
- Admin access for verification status checks

---

### 1. Stylist Onboarding Flow Tests

#### 1.1 New Stylist Registration (Stylist A)

**Test Scenario**: Complete new stylist onboarding from scratch

**Steps:**

1. Register new stylist account via application form
2. Get approved as stylist (admin action)
3. Navigate to `/stylist/stripe`

**Expected Results:**

- Shows "Stripe-konto må opprettes" message
- Displays "Opprett Stripe-konto" action button
- Verification status: `not_started`
- Cannot create services yet

**Verification:**

- Check database: `stripe_account_id` should be `NULL`
- Check database: `identity_verification_completed_at` should be `NULL`
- Services page should show empty state

---

#### 1.2 Stripe Account Creation (Stylist A → Stylist B state)

**Test Scenario**: Create Stripe Connect account

**Steps:**

1. Click "Opprett Stripe-konto" button
2. Complete Stripe Connect onboarding flow
3. Return to platform via return URL

**Expected Results:**

- Stripe account created successfully
- Shows onboarding completion status
- May show "Identitetsverifisering kreves" if basic Stripe complete
- Still cannot create services without identity verification

**Verification:**

- Check database: `stripe_account_id` should be populated
- Check database: `identity_verification_completed_at` still `NULL`
- Stripe dashboard shows account with appropriate capabilities

---

#### 1.3 Identity Verification Required (Stylist B)

**Test Scenario**: Stylist with basic Stripe account needs identity verification

**Steps:**

1. Navigate to `/stylist/stripe`
2. Observe status and messaging
3. Click identity verification button

**Expected Results:**

- Shows "Identitetsverifisering kreves" status
- Displays "Start identitetsverifisering" action button
- Clear messaging about next steps
- Verification status: `identity_verification_required`

**Verification:**

- Status page shows pending identity verification
- Cannot create services yet
- Services are not visible on platform

---

#### 1.4 Identity Verification Process (Stylist B → Stylist C state)

**Test Scenario**: Complete identity verification

**Steps:**

1. Click "Start identitetsverifisering"
2. Complete Stripe Identity verification flow
3. Return to platform
4. Wait for webhook processing or manual sync

**Expected Results:**

- Identity verification session created
- Shows "Identitetsverifisering er startet" status
- Eventually shows "Alt er klart!" when complete
- Can now create services

**Verification:**

- Check database: `identity_verification_completed_at` populated
- Verification status: `fully_verified`
- Can access service creation pages
- Services become visible on platform

---

#### 1.5 Fully Verified Stylist Status (Stylist C)

**Test Scenario**: Verify all functionality works for verified stylist

**Steps:**

1. Navigate to `/stylist/stripe`
2. Create new services
3. Check service visibility on platform
4. Test booking acceptance

**Expected Results:**

- Shows "Alt er klart!" success message
- All stylist features accessible
- Services visible in search results
- Can receive and process bookings

**Verification:**

- Database verification status complete
- Services appear in `/tjenester` page
- Services appear in popular services
- Payment intents created successfully

---

### 2. Customer Booking Flow Tests

#### 2.1 Happy Path - Booking Verified Stylist (Stylist C)

**Test Scenario**: Customer books service from fully verified stylist

**Steps:**

1. Navigate to `/tjenester`
2. Find and select service from Stylist C
3. Add to cart and proceed to booking
4. Complete booking form with payment details
5. Submit booking

**Expected Results:**

- Service appears in search results
- Can add to cart successfully
- Booking creation succeeds
- Payment intent created with destination
- Booking status: "pending"
- Confirmation emails sent

**Verification:**

- Database booking record created
- Payment intent has destination transfer
- `needs_destination_update` is `false`
- Stylist receives booking notification

---

#### 2.2 Edge Case - Booking Unverified Stylist (Direct API Call)

**Test Scenario**: Attempt booking with unverified stylist via direct backend call

**Steps:**

1. Use browser dev tools or API client
2. Call booking creation endpoint directly
3. Provide serviceId from Stylist A or B
4. Submit booking request

**Expected Results:**

- Booking creation fails with pre-flight check
- Error message: "Denne stylisten har ikke fullført identitetsverifiseringen..."
- No payment intent created
- Stylist receives verification notification email

**Verification:**

- No booking record in database
- No payment intent created
- Email sent to stylist about verification requirement
- Customer sees informative error message

---

#### 2.3 Service Visibility Tests

**Test Scenario**: Verify service filtering works across all touchpoints

**Steps:**

1. Navigate to `/tjenester` (services listing page)
2. Check popular services section on landing page
3. Search for services by unverified stylists
4. Navigate to unverified stylist public profiles

**Expected Results:**

- Only verified stylists' services appear in listings
- Popular services only include verified stylists
- Search results exclude unverified stylists
- Unverified stylist profiles show verification status

**Verification:**

- Database RPC functions filter correctly
- No unverified stylist services in any public listing
- Popular services component respects filtering
- Geographic search respects verification

---

#### 2.4 Edge Case - Service Became Unverified After Adding to Cart

**Test Scenario**: Service in cart but stylist loses verification status

**Steps:**

1. Add verified stylist service to cart
2. Admin removes stylist verification (test scenario)
3. Proceed to booking
4. Attempt to complete booking

**Expected Results:**

- Cart still contains service (expected)
- Booking creation fails at pre-flight check
- Clear error message about verification
- Stylist notified to complete verification

**Verification:**

- Pre-flight check catches verification loss
- Booking doesn't proceed
- Customer informed appropriately

---

### 3. Database Sync and Status Tests

#### 3.1 Database Sync Utility Testing

**Test Scenario**: Verify sync utility works correctly

**Steps:**

1. Create stylist with identity verification complete in Stripe
2. Ensure database `identity_verification_completed_at` is `NULL`
3. Run `syncVerificationStatusToDatabase()` function
4. Check results

**Expected Results:**

- Function detects mismatch
- Updates database with correct timestamp
- Returns success with sync details
- Subsequent calls show "already synced"

**Verification:**

- Database field updated correctly
- Function returns appropriate status
- No duplicate updates occur

---

#### 3.2 Comprehensive Status Function Testing

**Test Scenario**: Test `getStylistVerificationStatus()` with different states

**Steps:**

1. Test with Stylist A (no Stripe account)
2. Test with Stylist B (Stripe only)
3. Test with Stylist C (fully verified)
4. Test with edge cases (missing data)

**Expected Results:**

- Correct status returned for each scenario
- Appropriate boolean flags set
- User-friendly messages provided
- Next actions specified correctly

**Verification:**

- Status enum values correct
- Boolean flags accurate
- Messages match UI expectations

---

### 4. Email Notification Tests

#### 4.1 Verification Required Notifications

**Test Scenario**: Verify notification emails are sent appropriately

**Steps:**

1. Attempt booking with unverified stylist
2. Check email delivery
3. Verify email content and recipients

**Expected Results:**

- Stylist receives verification reminder email
- Admin receives notification (if configured)
- Email contains clear instructions
- Links work correctly

**Verification:**

- Emails delivered successfully
- Content is accurate and helpful
- Call-to-action links functional

---

### 5. Admin and Monitoring Tests

#### 5.1 Admin Dashboard Verification Status

**Test Scenario**: Admin can view and manage stylist verification

**Steps:**

1. Access admin dashboard
2. View stylist verification statuses
3. Identify stylists needing verification
4. Test manual sync triggers (if available)

**Expected Results:**

- Clear verification status display
- Easy identification of pending verifications
- Ability to take corrective actions
- Accurate status information

---

### 6. Performance and Edge Case Tests

#### 6.1 Service Listing Performance

**Test Scenario**: Verify filtering doesn't impact performance

**Steps:**

1. Create large dataset (100+ services, mix of verified/unverified)
2. Load services page
3. Measure load times
4. Check database query performance

**Expected Results:**

- Page loads within acceptable timeframes (<2 seconds)
- Database queries remain efficient
- No N+1 query problems
- Proper indexing utilized

**Verification:**

- Performance metrics within targets
- Database query plans efficient
- Memory usage reasonable

---

#### 6.2 Race Condition Tests

**Test Scenario**: Handle concurrent verification status changes

**Steps:**

1. Start booking process with Stylist B
2. Complete identity verification during booking
3. Test various timing scenarios

**Expected Results:**

- System handles status changes gracefully
- No data corruption
- Appropriate error handling
- Consistent user experience

---

### 7. Rollback and Recovery Tests

#### 7.1 Feature Rollback Testing

**Test Scenario**: Verify system works if verification filtering disabled

**Steps:**

1. Disable verification filtering (feature flag or code change)
2. Test service visibility
3. Test booking creation
4. Re-enable and verify

**Expected Results:**

- System gracefully falls back to previous behavior
- No data loss or corruption
- Easy to re-enable filtering
- Clear operational procedures

---

### Test Execution Checklist

**Pre-Test Setup:**

- [ ] Test environment configured
- [ ] Test data created (3 stylists in different states)
- [ ] Email notifications enabled
- [ ] Database backup taken
- [ ] Monitoring tools active

**During Testing:**

- [ ] Document all results
- [ ] Screenshot key states
- [ ] Log any unexpected behavior
- [ ] Test both happy paths and edge cases
- [ ] Verify database state after each test

**Post-Test Validation:**

- [ ] All database constraints maintained
- [ ] No orphaned records created
- [ ] Email notifications working
- [ ] Performance within acceptable limits
- [ ] Security measures intact

**Test Sign-Off:**

- [ ] All critical paths tested
- [ ] Edge cases handled appropriately
- [ ] Performance requirements met
- [ ] User experience validated
- [ ] Ready for production deployment
