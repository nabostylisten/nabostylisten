# User Preferences Implementation Plan

## Overview

This document outlines the comprehensive implementation plan for user preferences in the Nabostylisten platform. The preferences system allows users to control their notification settings across various features of the application.

## Database Schema

The user preferences are stored in the `user_preferences` table with the following structure:

```sql
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Newsletter and Marketing
    newsletter_subscribed boolean DEFAULT false NOT NULL,
    marketing_emails boolean DEFAULT true NOT NULL,
    promotional_sms boolean DEFAULT false NOT NULL,

    -- Booking Notifications
    booking_confirmations boolean DEFAULT true NOT NULL,
    booking_reminders boolean DEFAULT true NOT NULL,
    booking_cancellations boolean DEFAULT true NOT NULL,
    booking_status_updates boolean DEFAULT true NOT NULL,

    -- Chat and Communication
    chat_messages boolean DEFAULT true NOT NULL,

    -- Stylist-specific Notifications (for stylists)
    new_booking_requests boolean DEFAULT true NOT NULL,
    review_notifications boolean DEFAULT true NOT NULL,
    payment_notifications boolean DEFAULT true NOT NULL,

    -- Application Updates (for pending/applied stylists)
    application_status_updates boolean DEFAULT true NOT NULL,

    -- Delivery Preferences
    email_delivery boolean DEFAULT true NOT NULL,
    sms_delivery boolean DEFAULT false NOT NULL,
    push_notifications boolean DEFAULT false NOT NULL -- Future: for mobile app
);
```

## Current Implementation Status

### Existing Components

- **Preferences Page**: `app/profiler/[profileId]/preferanser/page.tsx`
- **Preferences Form**: `components/preferences/preferences-form.tsx`
- **Server Actions**: `server/preferences.actions.ts`
- **User Registration**: `components/auth/auth-form.tsx` and `components/auth/use-auth-form.ts`

### Current State

The preferences UI is fully implemented and functional, but the domain logic to actually respect these preferences throughout the application is missing. Users can toggle preferences, but the application doesn't act on these settings.

## Implementation Requirements by Preference

### 1. Newsletter and Marketing Preferences

#### newsletter_subscribed

- **Integration Point**: User signup process
- **Implementation**:
  - After user signup but BEFORE redirect, run server action to add user to newsletter via Brevo API
  - Use existing newsletter client at `lib/newsletter.ts`
  - When user unchecks preference in form, call `contactsApi.deleteContact(contact.email)` to remove from newsletter
- **Location**: `server/preferences.actions.ts`

#### marketing_emails

- **Integration Point**: Marketing email campaigns via Brevo
- **Implementation**:
  - Implement CRUD operations for Brevo marketing email lists
  - Subscribe/unsubscribe users based on preference changes
  - Check preference before sending marketing emails
- **Location**: `server/preferences.actions.ts`

#### promotional_sms

- **Status**: Future implementation
- **Implementation**:
  - Create wrapper functions with TODO comments
  - Will integrate with SMS service later (likely Twilio)
- **Location**: `server/preferences.actions.ts`

### 2. Booking Notification Preferences

#### booking_confirmations

- **Integration Point**: Booking confirmation process
- **Implementation**:
  - Send email after booking is confirmed in `server/booking.actions.ts`
  - Only send if user has this preference enabled
  - Use existing email templates from `transactional/emails/`
- **Location**: `server/booking.actions.ts`

#### booking_reminders

- **Integration Point**: Scheduled cron job
- **Implementation**:
  - Create new cron job API route following existing pattern
  - Send reminders 24 hours before booking
  - Check user preferences before sending
  - Follow patterns from `app/api/cron/cleanup-old-messages/route.ts`
- **Location**: `app/api/cron/booking-reminders/route.ts`
- **Schedule**: Daily execution to check for upcoming bookings

#### booking_cancellations

- **Integration Point**: Booking cancellation process
- **Implementation**:
  - Already partially implemented in booking actions
  - Update to respect user preferences before sending cancellation emails
  - Send to both customer and stylist if their respective preferences allow
- **Locations**:
  - `components/my-bookings/booking-status-dialog.tsx`
  - `server/booking.actions.ts`

#### booking_status_updates

- **Integration Point**: Any booking status change
- **Implementation**:
  - Uses same logic as booking_cancellations
  - Check preferences before sending status update emails
  - Apply to all booking status transitions
- **Location**: `server/booking.actions.ts`

### 3. Chat and Communication Preferences

#### chat_messages

- **Integration Point**: Scheduled cron job
- **Implementation**:
  - Create hourly cron job to group unread chat messages
  - Send email digest of unread messages since last email
  - Implement mechanism to prevent duplicate emails (track last email sent timestamp)
  - Only send once until user reads messages, then reset for future unread messages
- **Location**: `app/api/cron/chat-message-digest/route.ts`
- **Schedule**: Hourly execution
- **Logic**: Group unread messages per user, send digest email, mark email as sent

### 4. Stylist-specific Notification Preferences

#### new_booking_requests

- **Integration Point**: Booking creation process
- **Implementation**:
  - Send email to stylist when new booking is requested
  - Check stylist's preference before sending
  - Use existing email templates
- **Locations**:
  - `app/bestilling/page.tsx`
  - `server/booking.actions.ts`

#### review_notifications

- **Integration Point**: Review submission process
- **Implementation**:
  - Send email to recipient (stylist) when they receive a new review
  - Check stylist's preference before sending
- **Location**: Review submission server actions

#### payment_notifications

- **Integration Point**: Payment processing cron job
- **Implementation**:
  - Create cron job for payment processing
  - Charge customers 24 hours before booking
  - Send payment confirmation emails respecting preferences
- **Location**: `app/api/cron/payment-processing/route.ts`
- **Schedule**: Daily execution

### 5. Application Status Updates

#### application_status_updates

- **Integration Point**: Admin application management
- **Implementation**:
  - Existing email template at `transactional/emails/application-status-update.tsx`
  - Update application status change logic to check user preferences
  - Only send status update emails if preference is enabled
- **Location**: Admin application management actions

### 6. Delivery Preferences

#### email_delivery & sms_delivery

- **Integration Point**: All notification systems
- **Implementation**:
  - Create runtime-agnostic utility function to check preferences
  - Function takes Supabase client and profile ID, returns structured preference object
  - Check these flags in addition to specific notification preferences
  - If email_delivery is false, skip all email notifications regardless of specific preferences
  - If sms_delivery is false, skip all SMS notifications
- **Location**: `lib/preferences-utils.ts`

## Required Infrastructure Updates

### 1. Database Function Update

- **File**: `supabase/schemas/00-schema.sql`
- **Change**: Update `handle_new_user()` function to automatically insert default user preferences
- **Implementation**: Add INSERT statement for user_preferences table with default values

### 2. Cron Job Infrastructure

- **New Cron Jobs Required**:
  - `booking-reminders` - Daily at 10 AM UTC
  - `chat-message-digest` - Every hour
  - `payment-processing` - Daily at 6 AM UTC
- **Configuration**: Update `vercel.json` with new cron schedules
- **Pattern**: Follow existing `cleanup-old-messages` implementation

### 3. Email Template Integration

- **Location**: `transactional/emails/`
- **Requirement**: Ensure all notification emails use existing templates
- **New Templates Needed**:
  - Booking confirmation
  - Booking reminder
  - Chat message digest
  - Payment processing confirmation

### 4. Preferences Utility Function

- **File**: `lib/preferences-utils.ts`
- **Purpose**: Runtime-agnostic function to check user preferences
- **Signature**: `getUserNotificationPreferences(supabase: SupabaseClient, profileId: string)`
- **Returns**: Structured object with notification preferences and delivery settings
- **Usage**: Import in both client and server code

## Implementation Priority

### Phase 1: Core Infrastructure

1. Update `handle_new_user()` SQL function
2. Create preferences utility function
3. Implement newsletter subscription logic

### Phase 2: Booking Notifications

1. Update booking confirmation emails
2. Create booking reminders cron job
3. Update cancellation and status update logic

### Phase 3: Advanced Features

1. Create chat message digest cron job
2. Implement payment processing notifications
3. Update application status notifications

### Phase 4: Future Features

1. Implement promotional SMS wrappers
2. Review and optimize all preference checks
3. Add monitoring and analytics

## Testing Strategy

### Unit Tests

- Test preference utility functions
- Test server actions with preference checks
- Mock external services (Brevo, email sending)

### Integration Tests

- Test complete user signup flow with preference creation
- Test email sending with preference checks
- Test cron job execution with preference validation

### Manual Testing

- Test preference form updates
- Verify emails are sent/not sent based on preferences
- Test cron job execution in development

## Monitoring and Analytics

### Metrics to Track

- Preference change frequency by type
- Email delivery success rates by preference type
- Cron job execution success/failure rates
- User engagement with different notification types

### Alerting

- Failed email deliveries
- Cron job failures
- High preference opt-out rates (indicating spam issues)

## Security Considerations

### Data Privacy

- Respect user preferences immediately after changes
- Implement proper audit logging for preference changes
- Ensure GDPR compliance for marketing communications

### API Security

- All cron jobs protected with CRON_SECRET
- Preference checks use proper authentication
- Email APIs use secure credentials

## Future Enhancements

### Advanced Preferences

- Time-based preferences (no emails during certain hours)
- Frequency limits (max emails per day/week)
- Channel preferences (email vs SMS vs push)
- Granular booking notification timing

### Analytics Integration

- Track preference effectiveness
- A/B test notification content
- Personalized notification timing
- User engagement scoring

This comprehensive implementation plan ensures that all user preferences are properly respected throughout the Nabostylisten platform while maintaining system performance and user experience.
