# Booking Email Communication System

## Overview

The booking email communication system manages all email notifications related to the booking lifecycle, from initial payment confirmation through status updates and cancellations. The system ensures both customers and stylists stay informed throughout the booking process while respecting their notification preferences.

## Business Purpose

- **Payment Confirmation**: Provide customers with immediate receipt and booking details
- **Stylist Notifications**: Alert stylists to new paid booking requests only
- **Status Updates**: Keep both parties informed of booking changes
- **Professional Communication**: Maintain branded, consistent messaging
- **User Control**: Respect individual notification preferences

## Core Business Rules

### 1. Post-Payment Email Trigger

**Rule**: Customer receipt and stylist notification emails are sent only after successful payment.

**Implementation**: 
- Emails triggered from `/checkout/success` page when payment status is "succeeded" or "requires_capture"
- Background processing ensures checkout page isn't blocked by email delivery
- Failed email delivery doesn't affect checkout completion

**Business Rationale**:
- Ensures stylists only receive requests from paying customers
- Reduces spam and fake booking attempts
- Provides immediate payment confirmation to customers

### 2. Dual Email System

**Customer Receipt Email**:
- Confirms payment was received and processed
- Shows complete booking details including services, timing, and location
- Explains next steps in the booking process
- Clarifies payment capture timing (24 hours before appointment)
- Includes tips for successful booking experience

**Stylist Notification Email**:
- Alerts stylist to new booking request with full details
- Only sent for paid bookings to reduce noise
- Provides direct link to booking management interface
- Includes customer message and special requirements
- Contains booking acceptance/rejection guidance

### 3. Notification Preference Respect

**Rule**: All emails respect user notification preferences stored in database.

**Customer Preferences Checked**:
- `booking_confirmations`: Controls receipt email delivery

**Stylist Preferences Checked**:
- `new_booking_requests`: Controls booking notification email delivery

**Implementation**: 
- Preferences checked before each email sending attempt
- Users who opt out receive no emails for that category
- System logs preference-based email skipping for analytics

## Email Templates and Design

### Customer Receipt Email (`booking-receipt.tsx`)

**Key Features**:
- Nabostylisten branded design with consistent colors and styling
- Payment confirmation section with amount and timing details
- Complete booking summary with all selected services
- Clear next steps information about stylist review process
- Action button linking to booking details page
- Tips section for booking success
- Notification preference management link

**Content Structure**:
1. Thank you and payment confirmation
2. Payment security explanation with capture timing
3. Detailed booking information (service, stylist, time, location)
4. Customer's message to stylist (if provided)
5. Next steps explanation
6. Success tips for customers
7. Contact information and booking ID

### Stylist Notification Email (`new-booking-request.tsx`)

**Key Features**:
- Urgent notification design to encourage quick response
- Customer information and booking details
- Service requirements and location information
- Customer's message prominently displayed
- Direct action button for booking management
- Professional response guidance
- Notification preference management

**Content Structure**:
1. New booking request notification
2. Customer identification
3. Requested service details (name, date, time, location)
4. Customer message and special requests
5. Action button for booking review
6. Response tips and best practices
7. Booking ID for reference

## Technical Implementation

### Email Delivery Architecture

**Trigger Location**: `/app/checkout/success/page.tsx`
- Detects successful payment status from Stripe
- Calls `sendPostPaymentEmails()` server action asynchronously
- Handles email failures gracefully without affecting user experience

**Server Action**: `sendPostPaymentEmails()` in `server/booking.actions.ts`
- Fetches complete booking details with relations
- Checks user notification preferences
- Formats common data (dates, services, addresses)
- Sends both emails in parallel using Promise.allSettled
- Provides comprehensive error handling and logging

**Email Service Integration**:
- Uses Resend service for reliable email delivery
- React Email templates for consistent rendering
- Branded styling following design system
- Mobile-responsive email layouts

### Data Flow

1. **Payment Success Detection**:
   ```typescript
   const isPaymentSuccessful = 
     paymentIntent.status === "succeeded" || 
     paymentIntent.status === "requires_capture";
   ```

2. **Booking Data Retrieval**:
   - Complete booking details with customer, stylist, services, and address relations
   - Service aggregation for multiple services in single booking
   - Location determination and address formatting

3. **Preference Checking**:
   - Parallel preference checks for both customer and stylist
   - Individual email sending decisions based on preferences
   - Graceful handling when users opt out

4. **Email Generation**:
   - Common data formatting (dates, currency, duration)
   - Template-specific data preparation
   - Logo URL generation for branding consistency

5. **Parallel Email Delivery**:
   - Both emails sent simultaneously for efficiency
   - Individual failure handling per email
   - Result logging and analytics data collection

## User Workflows

### Customer Email Experience

1. **Immediate Receipt**: Customer completes payment and immediately receives confirmation
2. **Clear Expectations**: Email explains that stylist will review and respond
3. **Action Access**: Direct link to view booking details and status
4. **Preference Control**: Link to manage email preferences at bottom

### Stylist Email Experience

1. **Paid Request Notification**: Only receives emails for confirmed paid bookings
2. **Complete Information**: All necessary details to make informed decision
3. **Quick Action**: Direct link to accept/decline booking request
4. **Professional Guidance**: Tips for responding professionally and promptly

## Integration Points

### With Booking System
- Triggered after successful booking creation and payment processing
- Uses booking ID to fetch complete relationship data
- Integrates with booking status management workflow

### With User Preferences System
- Checks notification preferences before sending each email
- Respects user opt-out choices across all communication types
- Provides preference management links in email footers

### With Payment System
- Triggered by successful Stripe payment status detection
- Includes accurate payment capture timing information
- Handles different payment states (succeeded vs requires_capture)

### With Styling System
- Uses centralized email styling from `utils/styles.ts`
- Maintains brand consistency across all email templates
- Responsive design for mobile email clients

## Performance Considerations

### Asynchronous Processing
- Emails sent in background without blocking checkout success page
- Failed email delivery doesn't affect user checkout experience
- Parallel email sending for improved performance

### Error Resilience
- Individual email failures don't prevent other emails from sending
- Comprehensive error logging for monitoring and debugging
- Graceful degradation when email service is unavailable

### Preference Efficiency
- User preferences cached and checked in parallel
- Minimal database queries for preference validation
- Efficient email skipping when users opt out

## Monitoring and Analytics

### Email Delivery Tracking
- Success/failure rates for each email type
- User preference opt-out statistics
- Email delivery timing and performance metrics

### User Engagement Metrics
- Email open rates and click-through rates (if implemented)
- Booking acceptance rates after stylist notifications
- Customer satisfaction correlation with email communication

## Business Impact

### Customer Experience Improvements
- Immediate payment confirmation reduces anxiety
- Clear next steps reduce support inquiries
- Professional communication increases trust and confidence

### Stylist Efficiency
- Only paid booking notifications reduce noise
- Complete information enables faster decision-making
- Professional guidance improves response quality

### Business Operations
- Reduced fake bookings and payment disputes
- Improved conversion rates from booking to confirmation
- Enhanced brand perception through professional communication

## Future Enhancement Opportunities

### Advanced Personalization
- Dynamic content based on customer booking history
- Stylist-specific messaging and branding options
- Service-specific email templates and guidance

### Multi-Channel Communication
- SMS notifications for urgent booking updates
- Push notifications for mobile app users
- In-app notification center integration

### Email Automation
- Follow-up emails for pending booking responses
- Reminder emails before appointment times
- Post-service review request automation

### Analytics Integration
- Email performance tracking with PostHog
- A/B testing for email content optimization
- User journey tracking across email touchpoints

This email communication system ensures professional, timely, and preference-respecting communication throughout the booking lifecycle, contributing significantly to user satisfaction and business operational efficiency.