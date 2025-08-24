# User Preferences and Notification System

## Overview

The user preferences system provides comprehensive control over how users receive notifications and communications from the Nabostylisten platform. This system enables users to customize their notification experience based on their role (customer, stylist, admin) and personal preferences, ensuring they receive relevant information without being overwhelmed.

## Business Purpose

### Core Value Proposition

- **Personalized Communication**: Users control what notifications they receive and how
- **Reduced Noise**: Prevent notification fatigue by allowing granular control
- **Compliance Ready**: GDPR-compliant consent management for marketing communications
- **Role-Based Relevance**: Different notification options based on user type
- **Multi-Channel Support**: Email, SMS, and push notifications (future)

### Target Users

- **Customers**: Manage booking notifications, marketing preferences, chat alerts
- **Stylists**: Business notifications for bookings, reviews, payments, plus customer features
- **Pending Applicants**: Application status updates during stylist approval process
- **Admins**: System-level notifications and security alerts

## Key Features

### Notification Categories

#### 1. Newsletter and Marketing

- **Newsletter Subscription**: Monthly newsletter with tips, trends, and platform updates
- **Marketing Emails**: Promotional campaigns, special offers, and seasonal content
- **Promotional SMS**: Exclusive deals and urgent promotional messages
- **Business Integration**: Automatic sync with Brevo email marketing platform

#### 2. Booking Notifications

- **Booking Confirmations**: Immediate notification when stylist confirms appointment
- **Booking Reminders**: 24-hour advance reminder for upcoming appointments
- **Booking Cancellations**: Instant alert when appointments are cancelled
- **Status Updates**: Changes in booking status, rescheduling, or modifications

#### 3. Chat and Communication

- **Chat Messages**: Email notifications for new messages in booking conversations
- **Chat Message Sounds**: In-app audio alerts for real-time messaging (future)
- **Read Receipts**: Visual indicators for message status in conversations

#### 4. Stylist-Specific Notifications (Stylist Role Only)

- **New Booking Requests**: Immediate notification of customer booking requests
- **Review Notifications**: Alerts when customers leave reviews or ratings
- **Payment Notifications**: Updates on successful payments and pending payouts
- **Business Metrics**: Weekly/monthly performance summaries

#### 5. Application Status Updates (Applicants Only)

- **Application Progress**: Updates during stylist application review process
- **Information Requests**: Notifications when additional documentation is needed
- **Approval/Rejection**: Final decision notifications with next steps
- **Onboarding**: Welcome messages and setup guidance for approved stylists

#### 6. System and Security

- **Security Alerts**: Login attempts, password changes, suspicious activity
- **System Updates**: Platform maintenance, new features, service disruptions
- **Account Changes**: Profile modifications, payment method updates
- **Data Privacy**: GDPR compliance notifications, privacy policy updates

#### 7. Delivery Preferences

- **Email Delivery**: Primary notification channel for all communications
- **SMS Delivery**: High-priority notifications via text message
- **Push Notifications**: Mobile app notifications (planned for future releases)
- **Frequency Control**: Daily digest vs. real-time delivery options

## User Experience Features

### Automatic Saving

- **Real-Time Updates**: Preferences save automatically when toggled
- **Manual Save Option**: Top-right button for users who prefer explicit control
- **Visual Feedback**: Loading states and success confirmations
- **Error Handling**: Graceful failure with retry options

### Role-Based Interface

- **Dynamic Sections**: Only relevant notification types shown per user role
- **Progressive Disclosure**: Advanced options revealed based on user needs
- **Context-Aware Descriptions**: Explanatory text tailored to user's situation
- **Smart Defaults**: Sensible initial settings based on user type

### Migration and Onboarding

- **Newsletter Migration**: Existing subscriptions preserved during system upgrade
- **Default Preferences**: New users start with optimal notification settings
- **Guided Setup**: Optional tour highlighting important preference categories
- **Bulk Configuration**: Quick presets for common notification patterns

## Business Rules and Logic

### Default Preference Settings ✅ IMPLEMENTED

#### New Customers ✅ IMPLEMENTED

- **✅ Booking notifications: Enabled** (confirmations, reminders, cancellations)
- **✅ Chat messages: Enabled**
- **✅ Newsletter: Enabled** (with immediate Brevo sync)
- **✅ Marketing emails: Enabled** (with easy unsubscribe via preferences)
- **✅ Email delivery: Enabled** (master switch for all email notifications)
- **SMS delivery: Disabled** (future implementation)
- **Push notifications: Disabled** (future implementation)

#### New Stylists ✅ IMPLEMENTED

- **✅ All customer preferences: Enabled**
- **✅ Business notifications: Enabled** (bookings, reviews, payments)
- **✅ Application status updates: Enabled** (for pending applicants)
- **✅ Professional communications: Enabled**

#### Administrators ✅ IMPLEMENTED

- **✅ All notification types: Enabled** by default
- **✅ Same preference structure** as other users (no special handling)
- **✅ Can customize** all notification preferences

**Technical Implementation:**
- Default values defined in database schema and SQL `handle_new_user()` function
- All boolean preferences default to `true` except newsletter, SMS, and push notifications
- Consistent defaults across all user roles for simplicity

### Permission and Access Control

- **Self-Service Only**: Users can only modify their own preferences
- **No Deletion**: Preferences always exist with defaults (no null states)
- **Audit Trail**: All preference changes logged for compliance
- **Role Verification**: Server-side validation of role-specific options

### Integration Requirements

#### Newsletter System (Brevo) ✅ IMPLEMENTED

- **✅ Bidirectional Sync**: Newsletter preference changes automatically update Brevo subscription
- **✅ Automatic Signup**: New users are automatically subscribed to newsletter if preferences allow
- **✅ Preference Integration**: Newsletter subscription respects `newsletter_subscribed` and `email_delivery` preferences
- **✅ Unsubscribe Handling**: Users are removed from Brevo when they disable newsletter preference
- **✅ Marketing Email Management**: Separate CRUD operations for marketing email subscriptions
- **✅ Attribution Tracking**: Contact attributes track subscription source and timestamps
- **✅ Error Resilience**: Brevo API failures don't break preference updates
- **✅ Full Integration**: Complete end-to-end newsletter and marketing email management

**Technical Implementation:**
- Automatic subscription during user signup via `subscribeUserToNewsletterAfterSignup()`
- Real-time preference sync in `updateUserPreferences()` function
- Separate Brevo contact management for newsletter vs marketing emails
- Contact attributes: `SOURCE`, `SUBSCRIBED_AT`, `MARKETING_EMAILS`, `MARKETING_SUBSCRIBED_AT`

#### Notification Delivery

- **✅ Runtime-Agnostic Preferences**: Universal preference checking utility (`lib/preferences-utils.ts`)
- **✅ Structured Preference Access**: Type-safe preference checking with `getUserNotificationPreferences()`
- **✅ Batch Operations**: Efficient multi-preference checking with `batchCheckNotificationPreferences()`
- **✅ Convenience Functions**: Simple boolean checks with `shouldReceiveNotification()`
- **Fallback Logic**: Critical security notifications bypass user preferences (TODO: Implementation needed)
- **Delivery Confirmation**: Track successful notification delivery (TODO: Implementation needed)
- **Bounce Handling**: Update preferences based on delivery failures (TODO: Implementation needed)

**Technical Implementation:**
- Runtime-agnostic design works in both client and server environments
- Structured preference objects with logical AND operations (`specific_preference && delivery_preference`)
- Comprehensive TypeScript types for all notification categories
- Error handling with graceful fallbacks to safe defaults

## User Workflows

### Customer Preference Management

#### Initial Setup (New User) ✅ IMPLEMENTED

1. **✅ User completes registration process** - Standard auth flow with email/OTP or password
2. **✅ System creates default preferences based on role** - `handle_new_user()` SQL function automatically inserts preferences
3. **✅ Automatic newsletter subscription** - Respects `newsletter_subscribed` preference during signup
4. **✅ Seamless preference management** - Users can modify preferences via profile → "Preferanser" page
5. Optional onboarding tour highlights key preference categories (TODO: Implementation needed)

**Technical Implementation:**
- `handle_new_user()` SQL trigger automatically creates `user_preferences` record
- Newsletter subscription happens after OTP verification but before redirect
- Error handling ensures signup succeeds even if newsletter subscription fails

#### Ongoing Management ✅ IMPLEMENTED

1. **✅ Access preferences** via profile menu → "Preferanser"
2. **✅ Browse categorized notification options** - Role-based sections shown/hidden automatically
3. **✅ Toggle specific notification types with immediate saving** - Auto-save with 100ms debounce
4. **✅ Receive confirmation of changes** via toast notification
5. **✅ Real-time Brevo sync** - Newsletter and marketing email preferences update external systems

**Technical Implementation:**
- React Hook Form with auto-submit on field changes
- TanStack Query for optimistic updates and error handling
- Role-based UI filtering showing only relevant preferences
- Comprehensive error handling with user feedback

#### Marketing Opt-In Journey ✅ PARTIALLY IMPLEMENTED

1. **✅ Automatic newsletter handling** - Newsletter subscription based on default preferences
2. **✅ One-click subscribe/unsubscribe** from preference panel with real-time Brevo sync
3. **✅ Transparent subscription status** - Current preferences clearly displayed in UI
4. **✅ Separate marketing email management** - Independent from newsletter subscription
5. User sees newsletter signup during registration (TODO: Optional checkbox in signup form)
6. Periodic gentle prompts for newsletter subscription (TODO: Marketing automation)

**Technical Implementation:**
- Default `newsletter_subscribed: true` for new users creates automatic opt-in flow
- Immediate Brevo API sync when preferences change
- Separate contact attributes for newsletter vs marketing emails
- Error handling prevents preference update failures from breaking user experience

### Stylist Business Notifications

#### New Booking Alert Flow

1. Customer submits booking request
2. System checks stylist's "new_booking_requests" preference
3. If enabled, sends immediate email notification
4. Includes booking details and quick action links
5. Stylist can modify preference directly from email

#### Payment Notification System

1. Successful payment triggers notification check
2. Stylist receives payout confirmation based on preferences
3. Monthly earning summaries respect notification settings
4. Tax document availability notifications (always sent)

### Admin System Management

#### Critical Alert Handling

1. System monitors for critical errors or security issues
2. Checks admin preferences for notification delivery method
3. Sends immediate alerts via preferred channels
4. Escalation procedures for undelivered critical notifications

## Success Metrics

### User Engagement

- **Preference Adoption Rate**: Percentage of users who modify default settings
- **Notification Interaction**: Click-through rates on preference-controlled messages
- **Opt-Out Rates**: Tracking of users disabling specific notification types
- **Re-Engagement**: Users who re-enable previously disabled notifications

### Business Impact

- **Newsletter Growth**: Subscription rates through preference management
- **Notification Effectiveness**: Response rates for different message types
- **Support Reduction**: Fewer complaints about unwanted notifications
- **Conversion Rates**: Booking completion rates with optimized notifications

### Technical Performance

- **System Reliability**: Uptime and successful delivery rates
- **Response Times**: Speed of preference updates and notification delivery
- **Data Consistency**: Accuracy of preference synchronization across systems
- **Error Rates**: Failed preference updates or delivery failures

## Compliance and Privacy

### GDPR Compliance

- **Explicit Consent**: Clear opt-in for marketing communications
- **Right to Withdraw**: Easy unsubscribe and preference modification
- **Data Portability**: Preference export capability
- **Retention Policies**: Automatic cleanup of unused preference data

### Data Protection

- **Encryption**: All preference data encrypted at rest and in transit
- **Access Controls**: Row-level security ensuring users only see their data
- **Audit Logging**: Complete history of preference changes
- **Data Minimization**: Only collect preferences actually used by system

## Future Enhancements

### Planned Features

- **Smart Scheduling**: Time-based notification preferences (work hours only)
- **Location-Based**: Geographic preferences for local promotions
- **Frequency Controls**: Daily digest vs. real-time delivery options
- **Channel Preferences**: Different notification types via different channels

### Advanced Personalization

- **AI-Powered Suggestions**: Recommend optimal notification settings
- **Behavioral Learning**: Adapt preferences based on user interaction patterns
- **A/B Testing**: Optimize default settings and preference interfaces
- **Predictive Unsubscribe**: Proactively suggest preference adjustments

### Mobile Integration

- **Push Notification Control**: Granular mobile notification preferences
- **Geofencing**: Location-aware notification delivery
- **Offline Sync**: Preference changes work without internet connection
- **Voice Control**: Hands-free preference management

## Integration with Other Systems

### Booking System

- **Status Change Notifications**: Honor user preferences for booking updates
- **Reminder Timing**: Respect user's preferred advance notice period
- **Cancellation Policies**: Preference-aware refund and rescheduling notices

### Payment System

- **Transaction Confirmations**: Stylist and customer notification preferences
- **Payout Notifications**: Business-critical financial communications
- **Dispute Handling**: Preference-controlled dispute resolution communications

### Chat System

- **Message Notifications**: Email alerts based on chat preferences
- **Typing Indicators**: Real-time notification preferences
- **File Sharing**: Notification preferences for shared media

### Review System

- **New Review Alerts**: Stylist notifications for customer feedback
- **Review Reminders**: Customer encouragement based on preferences
- **Response Notifications**: Updates when stylists respond to reviews

## Risk Management

### Communication Risks

- **Over-Notification**: User fatigue leading to account abandonment
- **Under-Notification**: Missed important updates affecting user experience
- **Preference Conflicts**: Inconsistencies between different notification channels
- **Mitigation**: Smart defaults, regular preference health checks, user feedback loops

### Technical Risks

- **Synchronization Failures**: Preferences not reflecting in notification delivery
- **Performance Impact**: Complex preference queries affecting system speed
- **Data Loss**: Preference corruption or accidental resets
- **Mitigation**: Robust error handling, preference backup/restore, performance monitoring

### Compliance Risks

- **Regulatory Changes**: GDPR updates affecting preference requirements
- **Consent Management**: Invalid or expired marketing consents
- **Cross-Border Issues**: Different privacy laws in multiple jurisdictions
- **Mitigation**: Regular compliance audits, legal review of preference flows, documented consent processes

This user preferences system ensures Nabostylisten provides a respectful, personalized communication experience while maintaining business effectiveness and regulatory compliance.
