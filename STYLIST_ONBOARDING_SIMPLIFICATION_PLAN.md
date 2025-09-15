# Stylist Onboarding Simplification Implementation Plan

## Overview

Convert from two-step onboarding (Stripe + separate Identity Verification) to single-step combined Stripe onboarding using `collect: { future_requirements: 'include' }` in account links.

**Key Change**: Identity verification will be embedded within the Stripe onboarding flow, eliminating the need for a separate verification step.

## Phase 1: Core Stripe Integration Changes

### 1.1 Update Account Link Creation

**Primary File**: `/lib/stripe/connect.ts`

- **Function**: `createStripeConnectedAccountOnboardingLink`
- **Change**: Add `collect: { future_requirements: 'include' }` to `stripe.accountLinks.create()`
- **Purpose**: Forces Stripe to collect identity verification documents during onboarding

**Secondary File**: `/server/stripe.actions.ts`

- **Function**: `createAccountOnboardingLink`
- **Change**: Ensure this function properly uses the updated connect.ts function
- **Purpose**: Maintain API consistency

### 1.2 Enhanced Webhook Handling

**Primary File**: `/app/api/webhooks/stripe/identity/route.ts`

#### Current Webhook Events Handled

- `identity.verification_session.verified`
- `identity.verification_session.requires_input`
- `identity.verification_session.processing`

#### New Webhook Events to Handle

- `account.updated` - When account status changes
- `person.updated` - When person verification status changes
- `capability.updated` - When capabilities (charges/payouts) are enabled

#### Changes Required

1. **Add new event handlers**:

   ```typescript
   case 'account.updated':
     // Check if account is fully verified (charges_enabled && payouts_enabled)
     // Check if person verification is complete
     // Update identity_verification_completed_at if both are true

   case 'person.updated':
     // Check person verification status
     // Update database if verification is complete

   case 'capability.updated':
     // Check if both 'charges' and 'transfers' capabilities are active
     // Combined with person verification status, determine full completion
   ```

2. **Database Update Logic**:

   - Field to update: `stylist_details.identity_verification_completed_at`
   - Condition: Account has `charges_enabled=true` AND `payouts_enabled=true` AND person verification is complete
   - Remove separate verification session tracking

3. **Remove obsolete handlers**: Keep identity verification handlers for any existing sessions but prioritize account-based verification

## Phase 2: Onboarding Status Logic Simplification

### 2.1 Update Status Utility Functions

**Primary File**: `/lib/stylist-onboarding-status.ts`

#### Type Changes

```typescript
// OLD Status Types (remove these):
| "identity_verification_required"
| "identity_verification_pending"

// NEW Simplified Types:
export type StylistOnboardingStatus =
  | "not_started"           // No Stripe account created
  | "onboarding_pending"    // Stripe account created but not fully complete
  | "fully_verified";       // All requirements completed
```

#### Function Updates

1. **`getStylistOnboardingStatus`**:

   - Remove identity verification parameters
   - Simplify logic to only check Stripe account status
   - Return `fully_verified` when charges_enabled && payouts_enabled && identity_verification_completed_at is set

2. **`getStylistVerificationStatus`**:

   - Remove `hasVerificationSession` parameter
   - Remove `identityVerificationStatus` separate checking
   - Simplify to check only account status + database completion timestamp

3. **`canCreateServices`**:

   - Simplify to only check `status === "fully_verified"`

4. **`getOnboardingStatusMessage`**:

   - Remove identity verification specific messages
   - Update messages to reflect single-step process

5. **`getNextAction`**:
   - Remove separate identity verification actions
   - Update to reflect combined process

### 2.2 Remove Obsolete Functions

- `isStylistFullyVerified` - Replace with simpler status check
- `shouldShowStylistServices` - Integrate into main status logic

## Phase 3: UI/UX Component Updates

### 3.1 Main Onboarding Page Simplification

**File**: `/app/stylist/stripe/page.tsx`

#### Changes Required

1. **Remove identity verification routing logic**:

   - Remove check for `!identityVerificationComplete`
   - Remove rendering of `StylistIdentityVerification` component
   - Simplify to only check `needsOnboarding`

2. **Simplify status determination**:

   - Remove `checkIdentityVerificationStatus` calls
   - Remove identity verification status variables
   - Remove database sync logic for identity verification

3. **Update component props**:
   - Remove identity verification related props from `StylistStripeOnboarding`

**File**: `/app/stylist/stripe/stylist-stripe-onboarding.tsx`

#### Changes Required

1. **Remove identity verification props and logic**
2. **Simplify status messaging** to reflect single-step process
3. **Update progress indicators** to show only: not started → in progress → completed
4. **Remove references** to separate identity verification step

### 3.2 Stepper Component Simplification

**File**: `/components/stylist-onboarding-stepper.tsx`

#### Changes Required

1. **Update step definitions**:

   ```typescript
   // OLD Steps (4 steps):
   - "application" (Application Approved)
   - "stripe-setup" (Stripe Setup)
   - "identity" (Identity Verification)
   - "ready" (Ready for Sales)

   // NEW Steps (3 steps):
   - "application" (Application Approved)
   - "onboarding" (Complete Onboarding)
   - "ready" (Ready for Sales)
   ```

2. **Update step descriptions**:

   - "Complete Onboarding": "Account setup & verification"
   - Remove identity verification step entirely

3. **Update progress calculation** to reflect 3-step process

### 3.3 Remove Identity Verification Component

**File**: `/components/stylist-identity-verification.tsx`

#### Action: REMOVE ENTIRELY

- This component becomes obsolete as identity verification is now part of main onboarding
- Update any imports referencing this component

### 3.4 Update Revenue Dashboard

**File**: `/components/revenue/stylist-revenue-dashboard.tsx`

#### Changes Required

1. **Simplify status checks**:

   - Remove separate identity verification status checks
   - Update to use simplified `StylistOnboardingStatus`

2. **Update requirement messaging**:

   - Remove references to separate identity verification step
   - Update onboarding requirements description to reflect combined process

3. **Update status indicators**:
   - Remove identity verification specific indicators
   - Simplify to show single onboarding progress

### 3.5 Services Page Integration

**File**: `/app/profiler/[profileId]/mine-tjenester/page.tsx`

#### Changes Required

1. **Update redirect logic** to use simplified status
2. **Remove identity verification specific redirects**
3. **Update onboarding prompts** to reflect single-step process

## Phase 4: Email Content Updates

### 4.1 Primary Onboarding Email

**File**: `/transactional/emails/stylist-onboarding.tsx`

#### Content Changes Required

1. **Update main messaging**:

   - Change from "two-step process" to "single onboarding process"
   - Update time estimate from "multiple steps" to "approximately 5-7 minutes"

2. **Update requirements section**:

   - Combine identity verification into main requirements list
   - Update requirement #3: "Identity verification documents (ID, passport, or driver's license)"

3. **Update CTA section**:

   - Change button text to "Complete Onboarding" instead of "Start Onboarding"
   - Update subtext to reflect identity verification is included

4. **Update benefits section**:
   - Remove references to separate steps
   - Emphasize seamless single process

### 4.2 Secondary Email Templates

**File**: `/transactional/emails/stylist-onboarding-reminder.tsx`

- Update content to match single-step messaging
- Remove references to separate identity verification

**File**: `/transactional/emails/stripe-onboarding-required.tsx`

- Update to reflect that identity verification is included in onboarding
- Remove separate identity verification messaging

**File**: `/transactional/emails/stylist-application.tsx`

- Verify messaging aligns with new simplified process

## Phase 5: Database Schema Changes

### 5.1 Column Rename

**File**: `/supabase/schemas/00-schema.sql`

#### Column Rename Required

- **OLD**: `stylist_details.identity_verification_completed_at`
- **NEW**: `stylist_details.full_onboarding_completed_at`

#### Migration SQL

```sql
-- Rename the column to better reflect its purpose
ALTER TABLE public.stylist_details
RENAME COLUMN identity_verification_completed_at TO full_onboarding_completed_at;

-- Update the column comment
COMMENT ON COLUMN public.stylist_details.full_onboarding_completed_at IS 'When the complete stylist onboarding (including identity verification) was completed';
```

#### Reasoning

Since identity verification completion now equals full onboarding completion, the column name should reflect that this timestamp represents the completion of the entire onboarding process, not just identity verification.

### 5.2 Update All Code References

**Search and Replace Throughout Codebase**:

- Find: `identity_verification_completed_at`
- Replace: `full_onboarding_completed_at`

#### Complete List of Files Requiring Updates

> Note that you don't need to update the old migrations files. But we don't need to think about backwards compat either. Just keep the migration history as is.

1. **Database Schema & Functions**:

   - `/supabase/schemas/00-schema.sql` - Core schema definition, service functions
   - `/supabase/migrations/20250828141432_add_identity_verification_fields.sql` - Migration file
   - `/supabase/migrations/20250912064951_add_verification_filtering_to_service_functions.sql` - Service filtering
   - `/supabase/seed.sql` - Seed data

2. **Generated Types & Schemas**:

   - `/types/database.types.ts` - Generated TypeScript types
   - `/schemas/database.schema.ts` - Generated Zod schemas
   - `.snaplet/dataModel.json` - Snaplet data model

3. **Core Application Logic**:

   - `/app/api/webhooks/stripe/identity/route.ts` - Webhook handler
   - `/app/stylist/stripe/page.tsx` - Main onboarding page
   - `/server/stripe.actions.ts` - Stripe integration logic
   - `/lib/stylist-onboarding-status.ts` - Status determination logic
   - `/lib/stripe/sync-verification-status.ts` - Verification sync utility

4. **Background Jobs & Automation**:

   - `/app/api/cron/stylist-onboarding-reminders/route.ts` - Reminder emails
   - `/server/stats.actions.ts` - Statistics and analytics

5. **Business Logic & Services**:

   - `/server/booking/creation.actions.ts` - Booking creation logic
   - `/seed/utils/stylists.ts` - Development seeding utilities

6. **Documentation Files** (reference only, no code changes needed):
   - `STRIPE_IDENTITY_VERIFICATION_TEST_PLAN.md`
   - `STYLIST-VERIFICATION-FIX-PLAN.md`
   - `stripe-identity-verification-integration.md`

## Phase 6: Service Visibility Logic

### 6.1 Database Functions

**File**: `/supabase/schemas/00-schema.sql`

#### Functions to Update

1. **`traditional_services`** function:

   - Line 1083-1084: Keep the check `sd.identity_verification_completed_at IS NOT NULL`
   - This ensures only fully verified stylists' services are visible

2. **`nearby_services`** function:
   - Line 1239-1240: Keep the check `sd.identity_verification_completed_at IS NOT NULL`
   - Maintains the same filtering logic

## Phase 7: Testing and Validation

### 7.1 End-to-End Flow Testing

#### Test Cases

1. **New Stylist Application**:

   - Apply → Admin Approval → Single Onboarding Flow → Service Creation
   - Verify webhook properly sets `identity_verification_completed_at`
   - Confirm services become visible immediately after completion

2. **Partial Completion Handling**:

   - Start onboarding but don't complete
   - Verify proper status is shown
   - Confirm user can resume where they left off

3. **Webhook Event Processing**:
   - Test all new webhook events are properly handled
   - Verify database updates occur at the right time
   - Confirm no duplicate or conflicting updates

### 7.2 Migration Considerations

#### Existing Stylists

- Stylists with `identity_verification_completed_at` set: No changes needed
- Stylists in progress: May need manual verification or re-onboarding
- Ensure no existing functionality breaks

### 7.3 Cleanup Tasks

#### Files to Remove

- `/components/stylist-identity-verification.tsx`

#### Code to Remove

- All separate identity verification routing logic
- Obsolete status types and functions
- Redundant webhook handlers (after confirming new ones work)

## Implementation Priority

1. **Phase 1** (CRITICAL - Foundation): Core Stripe integration changes
2. **Phase 2** (CRITICAL - Dependencies): Status logic updates
3. **Phase 3** (HIGH - User Experience): UI component updates
4. **Phase 4** (MEDIUM - Communication): Email content updates
5. **Phase 5** (LOW - Documentation): Database considerations
6. **Phase 6** (HIGH - Business Logic): Service visibility
7. **Phase 7** (CRITICAL - Quality): Testing and validation

## Success Criteria

- [ ] Stylists complete onboarding in a single Stripe flow
- [ ] Identity verification documents are collected during onboarding
- [ ] Services become visible immediately after completion
- [ ] No separate identity verification step exists
- [ ] All email content reflects simplified process
- [ ] Existing functionality remains intact
- [ ] End-to-end flow works seamlessly

## Risk Mitigation

1. **Backwards Compatibility**: Test existing stylists aren't broken
2. **Webhook Reliability**: Ensure new webhook handlers are robust
3. **User Experience**: Provide clear messaging throughout process
4. **Rollback Plan**: Keep ability to revert to two-step process if needed
