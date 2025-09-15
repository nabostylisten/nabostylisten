# Stripe Identity Verification Integration - Test Plan

## Overview

This test plan covers the complete stylist onboarding flow with the newly integrated Stripe Identity Verification system. The verification is now mandatory for stylists to create services and receive payments.

## Test Environment Setup

### Prerequisites

1. **Environment Variables**:

   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_IDENTITY_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   NEXT_PUBLIC_APP_URL=http://localhost:3000 (or production URL)
   ```

2. **Stripe Webhook Configuration**:

   - Endpoint: `https://yourdomain.com/api/webhooks/stripe/identity`
   - Events to select:
     - `identity.verification_session.verified`
     - `identity.verification_session.requires_input`
     - `identity.verification_session.processing`

3. **Test Accounts**:
   - Admin user for approving stylist applications
   - Test stylist user (recently approved)
   - Test customer user

## Test Scenarios

### Scenario 1: Complete Stylist Onboarding Flow (Happy Path)

**Objective**: Verify the complete onboarding flow from approved stylist to service creation

#### Step 1: Initial Stylist State Verification

1. ✅ **Login** as approved stylist user
2. ✅ **Navigate** to `/stylist/stripe`
3. ✅ **Expected**: Should see Stripe onboarding form (NOT identity verification yet)
4. ✅ **Verify**: Database shows `stripe_account_id` is NULL and `identity_verification_completed_at` is NULL

#### Step 2: Basic Stripe Onboarding

1. ✅ **Click** "Start onboarding" button
2. ✅ **Complete** Stripe Connect onboarding with test data:
   - Personal information
   - Bank account details
   - Tax information
3. ✅ **Return** to platform after Stripe completion
4. ✅ **Expected**: Should see onboarding completed message temporarily, then redirect to identity verification
5. ✅ **Verify**: Database shows `stripe_account_id` is populated, but `identity_verification_completed_at` is still NULL

#### Step 3: Identity Verification Required

1. ✅ **Navigate** to `/stylist/stripe` (after basic Stripe onboarding)
2. ✅ **Expected**: Should see identity verification screen with:
   - "Identitetsverifisering påkrevd" heading
   - Shield icon
   - "Start identitetsverifisering" button
   - Privacy notice about Stripe handling data
3. ✅ **Verify**: Service creation is blocked (check `/profiler/[id]/mine-tjenester`)

#### Step 4: Start Identity Verification

1. ✅ **Click** "Start identitetsverifisering" button
2. ✅ **Expected**: Should redirect to Stripe's hosted identity verification page
3. ✅ **Verify**: Database shows `stripe_verification_session_id` is populated
4. ✅ **Complete** identity verification with test document (use Stripe test cases)

#### Step 5: Identity Verification Processing

1. ✅ **Return** to `/stylist/stripe/identity-verification/return`
2. ❌ **Expected**: Should see appropriate status based on verification result:
   - **If verified**: Green checkmark with "Identitet verifisert!" message
   - **If processing**: Blue clock with "Verifisering behandles" message
   - **If failed**: Warning triangle with appropriate error message

#### Step 6: Webhook Processing

1. **Monitor** webhook endpoint logs for incoming events
2. **Expected**: Should receive `identity.verification_session.verified` event
3. **Verify**: Database `identity_verification_completed_at` is updated with timestamp

#### Step 7: Service Creation Access

1. **Navigate** to `/profiler/[id]/mine-tjenester`
2. **Expected**: "Opprett ny tjeneste" button should be enabled
3. **Create** a test service
4. **Expected**: Service creation should succeed
5. **Verify**: Can see the service in the list

### Scenario 2: Identity Verification Failure Handling

**Objective**: Test handling of failed identity verification

#### Step 2a: Failed Identity Verification

1. **Complete** basic Stripe onboarding (Steps 1-2 from Scenario 1)
2. **Start** identity verification process
3. **Use** Stripe's test case for failed verification or invalid document
4. **Expected**: Should receive `identity.verification_session.requires_input` webhook
5. **Verify**: Database `identity_verification_completed_at` remains NULL
6. **Check** return page shows appropriate error message
7. **Verify**: Service creation remains blocked

### Scenario 3: Existing Stylists with Stripe Accounts

**Objective**: Test identity verification requirement for existing stylists

#### Existing Stylist Flow

1. **Setup**: Create stylist with existing `stripe_account_id` but NULL `identity_verification_completed_at`
2. **Login** as this stylist
3. **Navigate** to `/stylist/stripe`
4. **Expected**: Should see identity verification screen (skip basic Stripe onboarding)
5. **Complete** identity verification process
6. **Verify**: Can create services after completion

### Scenario 4: Service Creation Blocking

**Objective**: Verify service creation is properly blocked without identity verification

#### Pre-Identity Verification Checks

1. **Setup**: Stylist with basic Stripe onboarding complete but no identity verification
2. **Navigate** to `/profiler/[id]/mine-tjenester`
3. **Expected**: "Opprett ny tjeneste" button should be disabled
4. **Try** to access service creation URL directly
5. **Expected**: Should redirect to `/stylist/stripe`

### Scenario 5: Webhook Reliability

**Objective**: Test webhook processing and error handling

#### Webhook Processing Tests

1. **Monitor** webhook logs during identity verification
2. **Test** webhook endpoint directly with test payloads
3. **Verify** proper event handling for all three event types:
   - `identity.verification_session.verified`
   - `identity.verification_session.requires_input`
   - `identity.verification_session.processing`
4. **Test** webhook signature validation
5. **Test** webhook endpoint without proper signature (should fail)

### Scenario 6: Mobile/Responsive Testing

**Objective**: Verify the flow works on mobile devices

#### Mobile Verification

1. **Test** entire flow on mobile browser
2. **Verify** Stripe's hosted identity verification page works on mobile
3. **Check** UI responsiveness of verification screens
4. **Test** camera access for document capture

## Database State Verification Points

Throughout testing, verify these database states:

### Initial State (New Stylist)

```sql
SELECT
  stripe_account_id,
  stripe_verification_session_id,
  identity_verification_completed_at
FROM stylist_details
WHERE profile_id = 'test-stylist-id';
-- Expected: NULL, NULL, NULL
```

### After Basic Stripe Onboarding

```sql
-- Expected: 'acct_xxx', NULL, NULL
```

### After Identity Verification Start

```sql
-- Expected: 'acct_xxx', 'vs_xxx', NULL
```

### After Identity Verification Complete

```sql
-- Expected: 'acct_xxx', 'vs_xxx', '2024-XX-XX XX:XX:XX+00'
```

## API Endpoint Testing

### Manual API Tests

#### Test Identity Verification Creation

```bash
# Should create verification session
curl -X POST http://localhost:3000/api/identity-verification \
  -H "Authorization: Bearer <stylist-jwt>" \
  -H "Content-Type: application/json"
```

#### Test Webhook Endpoint

```bash
# Should return 400 without signature
curl -X POST http://localhost:3000/api/webhooks/stripe/identity \
  -d '{"test": "data"}'

# Should return 200 with valid signature
curl -X POST http://localhost:3000/api/webhooks/stripe/identity \
  -H "stripe-signature: valid-signature" \
  -d '{"type": "identity.verification_session.verified", ...}'
```

## Error Cases to Test

### Client-Side Errors

1. **Network failure** during verification session creation
2. **User cancels** identity verification on Stripe's page
3. **Session timeout** on Stripe's identity verification page
4. **Multiple verification attempts** by same user

### Server-Side Errors

1. **Database connection failure** during webhook processing
2. **Stripe API downtime** during session creation
3. **Invalid profile IDs** in webhook metadata
4. **Malformed webhook payloads**

## Performance Testing

### Load Testing Points

1. **Multiple concurrent** identity verification sessions
2. **Webhook processing** under high load
3. **Database query performance** for verification status checks
4. **File upload performance** for identity documents

## Security Testing

### Security Verification Points

1. **Webhook signature validation** is enforced
2. **User session validation** for all verification actions
3. **CSRF protection** on verification forms
4. **Rate limiting** on verification attempts
5. **Sensitive data** is not logged or exposed

## Browser/Device Compatibility

### Test Matrix

- [ ] Chrome (Desktop)
- [ ] Firefox (Desktop)
- [ ] Safari (Desktop)
- [ ] Chrome (Mobile)
- [ ] Safari (iOS)
- [ ] Samsung Internet (Android)

## Success Criteria

### All tests pass when

1. ✅ **Basic Stripe onboarding** completes successfully
2. ✅ **Identity verification** is required after basic onboarding
3. ✅ **Service creation is blocked** without identity verification
4. ✅ **Service creation is enabled** after identity verification
5. ✅ **Webhooks process** identity verification events correctly
6. ✅ **Database updates** happen via webhooks
7. ✅ **Error cases** are handled gracefully
8. ✅ **UI/UX flows** work on all target devices
9. ✅ **Security measures** are properly implemented
10. ✅ **Performance** meets acceptable thresholds

## Rollback Plan

If issues are discovered:

### Immediate Actions

1. **Disable** identity verification requirement in production
2. **Remove** identity verification step from onboarding flow
3. **Allow** service creation with basic Stripe onboarding only

### Code Rollback

1. **Revert** the main Stripe page changes
2. **Remove** identity verification components
3. **Restore** original `getCurrentUserStripeStatus` logic
4. **Disable** webhook endpoint

### Database Rollback

```sql
-- If needed, remove identity verification fields
ALTER TABLE stylist_details
DROP COLUMN stripe_verification_session_id,
DROP COLUMN identity_verification_completed_at;
```

## Post-Deployment Monitoring

### Metrics to Monitor

1. **Identity verification completion rates**
2. **Average time to complete verification**
3. **Webhook success rates**
4. **Service creation rates** after verification
5. **Error rates** at each step
6. **User drop-off points** in the flow

### Alerting Setup

- **Webhook failures** > 5% failure rate
- **Identity verification** taking > 24 hours to complete
- **Database update failures** from webhooks
- **Spike in verification errors**

## Notes for Testers

### Important Test Data

- Use Stripe's test identity verification cases for consistent results
- Norway-specific testing since the platform is Norwegian
- Test with Norwegian identity documents when possible

### Common Issues to Watch For

- **Time zone handling** in timestamp comparisons
- **Webhook retry logic** if endpoint is temporarily down
- **Session expiration** during long verification processes
- **Mobile camera permissions** for document capture

---

## Conclusion

This test plan ensures the Stripe Identity Verification integration works reliably for the Norwegian marketplace platform. All scenarios should be tested in staging before production deployment, with particular attention to the webhook reliability and error handling scenarios.

Remember to update Stripe webhook URLs when deploying to production and verify all environment variables are properly configured.
