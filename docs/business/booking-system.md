# Booking System

## Overview

The booking system enables authenticated customers to convert their shopping cart contents into confirmed appointments with stylists. It provides a seamless transition from service selection to actual appointment scheduling, integrating cart data, availability management, and payment processing.

## Business Purpose

- **Appointment Scheduling**: Convert service selections into time-bound appointments
- **Calendar Integration**: Provide real-time availability and booking confirmation
- **Payment Processing**: Secure payment collection before appointment confirmation
- **Communication Channel**: Enable customer-stylist communication post-booking
- **Service Delivery**: Ensure smooth execution of booked services

## Core Business Rules

### 1. Authentication Required

**Rule**: All booking functionality requires authenticated users.

**Rationale**:

- Payment processing requires verified identity
- Booking history and management need user accounts
- Communication features require authenticated channels
- Cancellation and modification policies need user tracking

**Implementation**:

- Middleware enforces authentication on `/bestilling` route
- Unauthenticated users redirected to login with return URL
- Cart contents preserved through authentication process

### 2. Cart-to-Booking Conversion

**Rule**: Bookings are created from shopping cart contents.

**Business Flow**:

1. Customer adds services from single stylist to cart
2. Customer proceeds to booking (authentication check)
3. Cart contents transferred to booking summary
4. Customer selects appointment time
5. Customer confirms location and adds special requests
6. Payment processing and booking confirmation

**Data Transfer**:

- Service details (title, price, duration)
- Stylist information
- Total pricing calculations
- Service requirements and inclusions

### 3. Single Appointment Rule

**Rule**: All cart services must be bookable in a single appointment slot.

**Benefits**:

- Simplified scheduling for both customer and stylist
- Single payment transaction
- Unified service delivery experience
- Clear appointment duration calculation

**Implementation**:

- Total duration calculated from all cart services
- Single time slot selection covers all services
- Location consistent across all services

### 4. Real-Time Availability (Future)

**Rule**: Only available time slots can be selected for booking.

**Planned Features**:

- Integration with stylist availability calendar
- Real-time updates of available slots
- Automatic blocking of booked times
- Buffer time between appointments
- Holiday and vacation handling

## User Workflows

### Accessing Booking Page

1. **From Cart (Authenticated)**:

   - User clicks "Fortsett til booking" in cart
   - Direct redirect to `/bestilling`
   - Cart summary displayed immediately

2. **From Cart (Unauthenticated)**:

   - User clicks "Fortsett til booking"
   - Authentication dialog appears
   - User completes login/signup process
   - Email verification if new account
   - Automatic redirect to `/bestilling`
   - Cart contents preserved throughout

3. **Direct Access**:
   - User navigates directly to `/bestilling`
   - If no cart items: redirect to cart page
   - If authenticated with cart: booking page displayed

### Booking Process Flow

#### Phase 1: Order Review

- **Cart Summary Display**:
  - Stylist information and contact details
  - List of all selected services
  - Individual service details (price, duration)
  - Total price calculation
  - Total appointment duration

#### Phase 2-5: 4-Step Booking Process (Implemented)

The booking process is now implemented as a guided 4-step stepper system that prevents user overwhelm and ensures complete information collection:

**Step 1: Time Selection** ✅

- **Calendar Interface**:

  - Weekly view of stylist availability
  - Available time slots highlighted in green
  - Blocked/unavailable times grayed out
  - Time slot selection with duration validation
  - Automatic end-time calculation
  - Visual feedback for selected time slots (blue pulsing)

- **Business Logic for Time Selection**:

  - **Duration Calculation**: Service duration rounded up to nearest hour

    - Example: 90-minute service requires 2 full hours (120 minutes)
    - Example: 45-minute service requires 1 full hour (60 minutes)
    - Example: 150-minute service requires 3 full hours (180 minutes)

  - **Availability Validation**:

    - Must have consecutive available hours for entire service duration
    - Cannot select if stylist unavailable during any part of service window
    - Only work hours are available for selection (as defined by stylist)

  - **Visual States**:
    - **Green**: Available and can be booked
    - **Gray**: Stylist not working or unavailable
    - **Blue (pulsing)**: Currently selected time slot

- **Navigation Features**:

  - Previous/Next week navigation
  - "Today" button to return to current week
  - Calendar picker for jumping to specific dates
  - Week and month display in header

- **Help System**:
  - Contextual help dialog explaining calendar usage
  - Color coding explanations
  - Step-by-step booking instructions
  - Navigation tips for calendar interface

**Step 2: Location Selection** ✅

- **Service Location Options**:

  - Radio button selection between stylist and customer location
  - Dynamic options based on stylist capabilities (travel/own place)
  - Conditional address input for customer location
  - Form validation ensures location is selected

- **Address Collection**:
  - Textarea input for customer address when "hjemme hos meg" selected
  - Required field validation for customer location choice
  - Future integration planned with Mapbox for address validation

**Step 3: Message and Discount** ✅

- **Communication with Stylist**:

  - Optional textarea for customer messages to stylist
  - Placeholder text guides users on what information to include
  - Support for special requests, allergies, preferences

- **Discount Code System**:
  - Input field for discount codes
  - Optional field that doesn't block progression
  - Prepared for future integration with discount validation system

**Step 4: Payment and Confirmation** ✅

- **Booking Summary**:

  - Complete review of all booking details
  - Selected time display with Norwegian formatting
  - Location confirmation
  - Message and discount code review
  - Terms and conditions acceptance

- **Payment Processing** (Future Integration):
  - Stripe integration for secure payment
  - Authorization (not capture) initially
  - Full capture 24 hours before appointment
  - Payment method storage for future bookings

**Stepper System Features** ✅

- **Progressive Disclosure**: Each step only accessible after completing previous requirements
- **Step Validation**: Cannot proceed without completing required fields in current step
- **Responsive Design**: Different layouts for mobile (vertical) and desktop (horizontal)
- **Visual Progress**: Numbered steps with clear titles and descriptions
- **Navigation Controls**: Back/Next buttons with context-aware labels
- **Accessibility**: Proper step state management and keyboard navigation support

## Integration Points

### With Shopping Cart System

**Data Flow**:

- Cart items → Booking line items
- Cart totals → Booking totals
- Stylist selection → Appointment stylist
- Service selections → Appointment services

**State Management**:

- Cart state preserved during authentication
- Real-time cart validation at booking stage
- Cart clearing after successful booking

### With Authentication System

**Unified Authentication Integration**:

- **Route Protection**: Middleware enforces authentication on `/bestilling` route
- **Cart Integration**: Seamless authentication flow triggered from cart
- **Email OTP Flow**: Password-less authentication for security and UX
- **Context Awareness**: Booking-specific messaging in authentication dialog
- **State Preservation**: Cart contents and booking intent preserved throughout auth
- **Profile Creation**: Automatic user profile creation with metadata from signup

**Authentication Workflows**:

1. **Authenticated Access**: Direct access to booking page with cart summary
2. **Unauthenticated Access**:
   - Middleware redirect to login with return URL
   - Or cart-triggered auth dialog with booking context
3. **New User Flow**: Email + profile data → OTP → profile creation → booking access
4. **Existing User Flow**: Email → OTP → existing profile → booking access

**User Profile Integration**:

- Profile information automatically available for booking details
- Payment method storage linked to authenticated user
- Booking history associated with user profile
- Communication preferences applied to booking notifications

### With Calendar/Availability System (Future)

**Availability Integration**:

- Real-time stylist calendar access
- Available slot calculation
- Buffer time management
- Holiday/vacation handling
- Booking conflict prevention

### With Payment System (Future)

**Stripe Integration**:

- Secure payment processing
- Authorization vs. capture timing
- Webhook handling for payment events
- Refund processing for cancellations
- Payment method management

### With Communication System

**Booking-Related Communication**:

- Post-payment confirmation emails triggered from `/checkout/success` page
- Customer receipt emails with payment confirmation and booking details
- Stylist booking request emails sent only after successful payment
- Status update emails for both customers and stylists
- Branded email templates following Nabostylisten design system
- SMS reminders (if implemented)
- In-app chat channel creation
- Stylist notification system with user preference respect
- Booking update notifications

## Current Implementation Status

### ✅ Completed Features

1. **Authentication-Protected Route**:

   - Middleware enforcement on `/bestilling`
   - Redirect to login with return URL
   - Cart preservation through authentication

2. **Cart Integration**:

   - Cart summary display on booking page
   - Service and stylist information transfer
   - Total price calculation
   - Empty cart handling

3. **Complete 4-Step Booking Flow** ⭐ **NEW**:

   - **Step 1 - Time Selection**: Interactive calendar with availability validation
   - **Step 2 - Location**: Dynamic location selection with address input
   - **Step 3 - Message & Discount**: Optional customer communication and promo codes
   - **Step 4 - Payment Summary**: Complete booking review and confirmation

4. **Responsive Stepper System** ⭐ **NEW**:

   - Progressive step validation (cannot skip ahead without completing requirements)
   - Mobile-first responsive design (vertical on mobile, horizontal on desktop)
   - Numbered steps with clear progress indicators
   - Context-aware navigation controls

5. **Enhanced Booking Calendar**:

   - Weekly calendar view with service duration integration
   - Visual availability indicators (green/gray/blue states)
   - Duration-aware slot validation
   - Help dialog with comprehensive booking guidance
   - Navigation controls (prev/next week, today, calendar picker)

6. **Form Validation & UX**:

   - Real-time step validation prevents incomplete bookings
   - Required field enforcement for critical data
   - Optional field support for non-essential information
   - Clear visual feedback for form completion status

7. **Booking Data Management**:
   - Complete booking data collection across all steps
   - State persistence during step navigation
   - Data validation before final submission
   - Integration ready for payment processing

8. **Post-Booking Management** ⭐ **NEW**:
   - Unified booking detail access at `/bookinger/[bookingId]`
   - Role-based access control (customer, stylist, admin)
   - Status management for stylists (confirm/cancel with messages)
   - Automated email notifications for status changes
   - Simplified URL structure for email links and sharing

9. **Post-Payment Email System** ⭐ **NEW**:
   - Automated email sending triggered from checkout success page
   - Customer receipt emails with payment confirmation details
   - Stylist booking request emails sent only after successful payment
   - Background email processing to avoid blocking checkout experience
   - Respect for user notification preferences
   - Comprehensive booking details in all communications

### 📋 Planned Features

1. **Payment Integration**:

   - Stripe Checkout session creation
   - Payment authorization flow
   - Booking confirmation process

2. **Enhanced Location Features**:

   - Mapbox address validation and autocomplete
   - Travel cost calculation
   - Distance-based service area validation

3. **Enhanced Communication**:
   - Chat channel creation between customer and stylist
   - Advanced email customization options
   - SMS reminder notifications
   - Calendar event generation
   - Push notifications for mobile app

## Business Rules & Validation

### Booking Creation Rules

- Must have authenticated user
- Must have valid cart contents
- Services must be from single stylist
- All services must be currently available
- Stylist must be active and available

### Appointment Scheduling Rules

- Selected time slot must be available across entire service duration
- Appointment duration = sum of all service durations, rounded up to nearest hour
- Service duration rounding ensures full hour slot availability:
  - Services ≤ 60 minutes: require 1 hour slot
  - Services 61-120 minutes: require 2 hour slots
  - Services 121-180 minutes: require 3 hour slots
- Consecutive availability validation prevents partial booking
- Only stylist work hours are available for selection
- Unavailable periods (one-off and recurring) are excluded
- Real-time availability checking prevents double-booking
- Holiday/vacation period respect via unavailability system

### Step Progression Rules ⭐ **NEW**

- **Step 1 (Time Selection)**: Must select valid time slot before proceeding

  - Time slot selection required
  - Duration validation must pass
  - End time automatically calculated

- **Step 2 (Location)**: Must choose service location before proceeding

  - Location selection (stylist/customer) required
  - If customer location chosen, address input becomes required
  - Dynamic validation based on stylist capabilities

- **Step 3 (Message & Discount)**: Optional fields, no blocking validation

  - Message to stylist is optional
  - Discount code is optional
  - Step can be completed without any input

- **Step 4 (Payment)**: All previous steps must be completed
  - Cannot access until Steps 1-3 are valid
  - Shows comprehensive booking summary
  - Ready for payment processing integration

### Payment Rules

- Authorization required before booking confirmation
- Full capture 24 hours before appointment
- Refund policy enforcement for cancellations
- No payment for consultation-only services (if applicable)

### Cancellation Rules

- 24+ hours advance notice for full refund
- Less than 24 hours: partial refund or credit
- No-show policy enforcement
- Stylist-initiated cancellations: full refund + compensation

## Error Handling & Edge Cases

### Service Availability Changes

**Scenario**: Service becomes unavailable after adding to cart but before booking.

**Handling**:

- Real-time validation at booking page load
- Clear notification of unavailable services
- Option to remove or replace services
- Alternative service suggestions

### Stylist Unavailability

**Scenario**: Stylist becomes inactive or unavailable during booking process.

**Handling**:

- Immediate notification to customer
- Automatic cart clearing
- Alternative stylist suggestions
- Rebooking assistance

### Payment Processing Failures

**Scenario**: Payment authorization fails during checkout.

**Handling**:

- Clear error messaging
- Alternative payment method options
- Booking hold for limited time
- Customer support contact information

### Calendar Conflicts

**Scenario**: Selected time slot becomes unavailable during booking process.

**Handling**:

- Real-time slot validation
- Alternative time suggestions
- Automatic calendar refresh
- Conflict resolution workflow

## Success Metrics

### Conversion Metrics

- Cart-to-booking conversion rate
- Authentication completion rate during booking
- Booking completion rate (after time selection)
- Payment success rate
- Rebooking rate after cancellations

### User Experience Metrics

- Time to complete booking process
- Authentication friction measurement
- Calendar interaction patterns
- Error recovery success rate
- Customer satisfaction scores

### Business Impact Metrics

- Average booking value
- Service utilization rates
- Stylist booking frequency
- Revenue per customer
- Customer lifetime value

## Future Enhancement Opportunities

### Advanced Scheduling Features

1. **Recurring Appointments**:

   - Weekly/monthly appointment setup
   - Flexible scheduling patterns
   - Automatic rebooking
   - Bulk management interface

2. **Group Bookings**:

   - Multiple customer appointments
   - Shared payment handling
   - Coordinated scheduling
   - Group communication channels

3. **Package Bookings**:
   - Multi-session service packages
   - Prepaid service bundles
   - Loyalty program integration
   - Progress tracking

### Enhanced User Experience

1. **Smart Scheduling**:

   - AI-powered time recommendations
   - Customer preference learning
   - Optimal slot suggestions
   - Travel time considerations

2. **Mobile Optimization**:

   - Progressive Web App features
   - Offline booking capability
   - Push notifications
   - Quick rebooking options

3. **Accessibility Features**:
   - Screen reader optimization
   - Keyboard navigation
   - High contrast modes
   - Multi-language support

### Business Intelligence

1. **Booking Analytics**:

   - Demand pattern analysis
   - Peak time identification
   - Service popularity tracking
   - Revenue optimization insights

2. **Customer Insights**:
   - Booking behavior analysis
   - Preference identification
   - Satisfaction tracking
   - Retention prediction

## Risk Management

### Technical Risks

- **Payment Processing Failures**: Multiple payment method support, fallback options
- **Calendar System Downtime**: Offline booking with manual confirmation
- **Database Conflicts**: Optimistic locking, conflict resolution algorithms

### Business Risks

- **Overbooking**: Real-time availability checking, buffer time management
- **No-Shows**: Confirmation requirements, deposit policies
- **Cancellation Abuse**: Clear policies, pattern detection

### Compliance & Legal

- **Data Privacy**: GDPR compliance for booking data, user consent management
- **Payment Security**: PCI DSS compliance, secure token handling
- **Consumer Rights**: Clear cancellation policies, dispute resolution processes

## System Integration Architecture

### Data Flow Summary

1. **Cart System** → **Booking System**: Service selections, pricing, stylist info
2. **Booking System** → **Calendar System**: Availability queries, slot reservations
3. **Booking System** → **Payment System**: Transaction processing, confirmation
4. **Booking System** → **Communication System**: Notifications, chat setup
5. **Booking System** → **Customer System**: History tracking, profile updates

### State Management

- **Client-Side**: Booking form state, UI interactions, validation feedback
- **Server-Side**: Booking persistence, calendar integration, payment processing
- **Real-Time**: Availability updates, booking confirmations, status changes

This booking system serves as the critical conversion point from browsing to confirmed appointments, ensuring a smooth, secure, and user-friendly experience that maximizes both customer satisfaction and business outcomes.
