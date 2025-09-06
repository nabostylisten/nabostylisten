# Trial Session Feature Implementation Plan

## Overview

A trial session is a preliminary version of a service that happens before the main booking. This feature is particularly valuable for services like wedding makeup, where customers benefit from trying the service months before the actual event. The trial session has its own pricing, scheduling, and payment processing.

## Use Cases and Examples

### When Trial Sessions Are Appropriate

1. **Wedding Services** (bridal makeup, hair styling)
   - Trial typically 1-3 months before wedding
   - Allows testing of styles and products
   - Builds customer confidence
2. **Special Event Styling** (prom, graduation)

   - Trial 2-4 weeks before event
   - Tests for allergies or reactions
   - Perfects the desired look

3. **Complex Color Services** (major color changes)
   - Trial for strand tests
   - Determines processing time
   - Previews final result

### When NOT to Use Trial Sessions

- Quick services (basic haircuts, nail polish)
- Regular maintenance services
- Services under 30 minutes
- Low-cost services (<500 NOK)

## Implementation Phases

### ✅ Phase 1: Database Schema Updates

#### 1.1 Services Table Updates

```sql
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS has_trial_session boolean DEFAULT false;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS trial_session_price numeric(10, 2);
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS trial_session_duration_minutes integer;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS trial_session_description text;
```

#### 1.2 Bookings Table Updates

```sql
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS is_trial_session boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS main_booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS trial_booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL;
```

#### 1.3 RLS Policies

```sql
-- Allow users to view trial sessions linked to their bookings
CREATE POLICY "Users can view trial sessions for their bookings" ON public.bookings
    FOR SELECT USING (
        auth.uid() = customer_id OR
        auth.uid() = stylist_id OR
        EXISTS (
            SELECT 1 FROM public.bookings main
            WHERE main.id = bookings.main_booking_id
            AND (main.customer_id = auth.uid() OR main.stylist_id = auth.uid())
        )
    );

-- Allow stylists to update trial sessions
CREATE POLICY "Stylists can update their trial sessions" ON public.bookings
    FOR UPDATE USING (
        auth.uid() = stylist_id AND is_trial_session = true
    );
```

### ✅ Phase 2: Service Management UI Updates

#### 2.1 Service Form Component Updates

**File**: `/components/service-form.tsx`

Add new form fields:

- Toggle switch: "Tilby prøvetime for denne tjenesten"
- Conditional fields when enabled:
  - Trial session price (NOK)
  - Trial session duration (minutes)
  - Trial session description
- Info box with examples and best practices

#### 2.2 Service Display Updates

**File**: `/app/profiler/[profileId]/mine-tjenester/services-page-client.tsx`

- Add trial session badge to service cards
- Display trial session pricing and duration
- Show trial session availability indicator
- Update different services pages (<http://localhost:3000/tjenester/6faeb7cd-55a7-4c46-9a5f-b3ae09df2246>) to also include information on the trial session.

### ✅ Phase 3: Customer Booking Flow Updates

#### 3.1 New Booking Stepper Step

**File**: `/components/booking/booking-stepper.tsx`

Add new step after time selection:

```typescript
{
  id: "trial-session",
  title: "Prøvetime",
  description: "Velg dato for prøvetime",
  icon: <TestTube className="w-4 h-4" />,
  conditional: hasTrialSession // Only show if service has trial
}
```

#### 3.2 New Components

##### Trial Session Step Component

**File**: `/components/booking/trial-session-step.tsx`

- Explanation of what a trial session is
- Calendar for selecting trial date
- Validation: must be before main booking
- Display trial session price and duration

##### Trial Session Info Dialog

**File**: `/components/booking/trial-session-info-dialog.tsx`

- FAQ-style information about trial sessions
- Benefits and what to expect
- Cancellation policies

#### 3.3 Booking Store Updates

**File**: `/stores/booking.store.ts`

- Add trial session data fields
- Add validation for trial session dates
- Update step progression logic

### ✅ Phase 4: Booking Management Updates

#### ✅ 4.1 Booking Card Updates

**File**: `/components/my-bookings/booking-card.tsx`

- ✅ Display trial session relationship badge
- ✅ Show trial session date if exists
- ✅ Link between main and trial bookings
- ✅ Fixed pricing display to show correct original and discounted amounts

**TODO**: Show the correct price (original, discount and final) in the booking card and booking page.

#### ✅ 4.2 New Trial Session Card

**File**: `/components/my-bookings/trial-session-card.tsx`

- ✅ Specialized display for trial sessions
- ✅ Link to main booking
- ✅ Actions: move, cancel, view details
- ✅ Purple-themed styling to distinguish from regular bookings

#### 4.3 Move Trial Session

**File**: `/components/booking/move-trial-session-content.tsx`

- Reuse existing move booking logic
- Additional validation: maintain before main booking
- Notify customer of changes

#### 4.4 Cancel Trial Session

Update: `/components/my-bookings/cancel-booking-dialog.tsx`

- Handle trial session cancellation
- Apply refund rules:
  - Stylist cancels: 100% refund
  - Customer cancels: standard rules apply

### Phase 5: Server Actions Updates

#### 5.1 Service Actions

**File**: `/server/service.actions.ts`

```typescript
// Update createService and updateService to handle trial fields
export async function createService(data: ServiceFormData) {
  // Include trial session fields in insert
  const serviceData = {
    ...data,
    has_trial_session: data.has_trial_session,
    trial_session_price: data.trial_session_price,
    trial_session_duration_minutes: data.trial_session_duration_minutes,
    trial_session_description: data.trial_session_description,
  };
  // ... rest of implementation
}
```

#### 5.2 Booking Actions

**File**: `/server/booking.actions.ts`

```typescript
export async function createBookingWithServices(input: CreateBookingInput) {
  // ... existing validation

  // If service has trial session and customer selected it
  if (input.includeTrialSession && service.has_trial_session) {
    // Create trial session booking first
    const trialBooking = await createTrialSessionBooking({
      ...input,
      startTime: input.trialSessionStartTime,
      endTime: input.trialSessionEndTime,
      price: service.trial_session_price,
      duration: service.trial_session_duration_minutes,
      is_trial_session: true,
    });

    // Create main booking with reference to trial
    const mainBooking = await createMainBooking({
      ...input,
      trial_booking_id: trialBooking.id,
    });

    // Update trial booking with main booking reference
    await updateBooking(trialBooking.id, {
      main_booking_id: mainBooking.id,
    });
  }
}

export async function moveTrialSession({
  trialBookingId,
  newStartTime,
  newEndTime,
}: MoveTrialSessionInput) {
  // Validate new time is still before main booking
  // Use existing rescheduleBooking logic
}

export async function cancelTrialSession(trialBookingId: string) {
  // Apply appropriate refund rules
  // Update related main booking
}
```

### Phase 6: Payment & Cron Job Updates

#### 6.1 Payment Processing

**File**: `/app/api/cron/payment-processing/route.ts`

- Process trial sessions separately from main bookings
- Capture payment 24 hours before trial session date
- Handle trial session specific payment metadata

#### 6.2 Payout Processing

**File**: `/app/api/cron/payout-processing/route.ts`

- Process payouts for completed trial sessions
- Track separately from main booking payouts

#### 6.3 Email Notifications

Create new email templates:

- Trial session booking confirmation
- Trial session reminder (24h before)
- Trial session rescheduled
- Trial session cancelled

### Phase 7: UI Components Breakdown

#### 7.1 Stylist Side Components

- `TrialSessionToggle`: Enable/disable trial for service
- `TrialSessionPricing`: Set trial pricing and duration
- `TrialSessionDescription`: Describe what's included

#### 7.2 Customer Side Components

- `TrialSessionScheduler`: Calendar for trial date selection
- `TrialSessionSummary`: Display selected trial details
- `TrialSessionBadge`: Visual indicator on bookings

#### 7.3 Shared Components

- `TrialSessionStatus`: Display trial session status
- `TrialSessionActions`: Move/cancel buttons
- `TrialSessionLink`: Navigate between trial and main

## Data Flow

### Creating a Booking with Trial Session

1. Customer selects service with trial option
2. Chooses main booking date/time
3. If trial available, new step appears
4. Customer selects trial date (before main)
5. System creates two linked bookings
6. Two payment intents created
7. Confirmation emails sent for both

### Moving a Trial Session

1. Stylist initiates move from booking details
2. System validates new date is before main
3. Updates trial booking times
4. Sends notification to customer
5. Updates payment capture schedule

### Cancelling a Trial Session

1. Either party initiates cancellation
2. System checks cancellation rules
3. Processes refund if applicable
4. Updates booking statuses
5. Sends cancellation notifications

## Validation Rules

### Service Level

- Trial price must be > 0 if enabled
- Trial duration must be >= 30 minutes
- Trial description required if enabled

### Booking Level

- Trial must be before main booking
- Minimum 24h between trial and main
- Trial cannot be in the past
- Cannot book trial without main booking

### Cancellation Rules

- Stylist cancels trial: 100% refund
- Customer cancels >48h before: 100% refund
- Customer cancels 24-48h before: 50% refund
- Customer cancels <24h before: No refund

## Testing Requirements

### Unit Tests

- Trial session validation logic
- Price calculation with trials
- Date validation rules
- Refund calculations

### Integration Tests

- Full booking flow with trial
- Payment processing for trials
- Moving trial sessions
- Cancellation flows

### E2E Tests

- Customer books service with trial
- Stylist moves trial session
- Customer cancels trial
- Payment capture for trials

## Migration Strategy

1. Deploy database changes
2. Update server actions
3. Deploy UI without enabling feature
4. Test with internal accounts
5. Enable for select stylists
6. Gradual rollout to all users

## Success Metrics

- Trial session adoption rate
- Trial to main booking conversion
- Customer satisfaction scores
- Reduction in last-minute cancellations
- Revenue from trial sessions

## Future Enhancements

1. **Trial Session Packages**: Bundle multiple trials
2. **Trial Reviews**: Separate review system for trials
3. **Trial Reminders**: SMS reminders for trials
4. **Trial Photos**: Upload trial results for reference
5. **Trial Notes**: Stylist notes from trial for main booking
