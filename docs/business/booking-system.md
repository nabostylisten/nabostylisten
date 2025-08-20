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

#### Phase 2: Time Selection (Work in Progress)

- **Calendar Interface** (Planned):

  - Weekly view of stylist availability
  - Available time slots highlighted
  - Blocked/unavailable times grayed out
  - Time slot selection with duration preview
  - Automatic end-time calculation

- **Current Implementation**:
  - Work-in-progress message
  - Explanation of upcoming features
  - Preview of planned functionality

#### Phase 3: Location and Details (Future)

- **Service Location Selection**:

  - Stylist's location option
  - Customer's address option
  - Address input with Mapbox integration
  - Travel cost calculations (if applicable)

- **Special Requests**:
  - Text field for customer notes
  - Specific requirements or preferences
  - Accessibility needs
  - Stylist communication

#### Phase 4: Payment and Confirmation (Future)

- **Payment Processing**:

  - Stripe integration for secure payment
  - Authorization (not capture) initially
  - Full capture 24 hours before appointment
  - Payment method storage for future bookings

- **Booking Confirmation**:
  - Email confirmation to customer and stylist
  - Calendar event generation
  - Booking reference number
  - Cancellation policy reminder

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

### With Communication System (Future)

**Booking-Related Communication**:

- Confirmation emails via Resend
- SMS reminders (if implemented)
- In-app chat channel creation
- Stylist notification system
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

3. **Basic UI Structure**:
   - Responsive booking page layout
   - Cart summary card with service details
   - Stylist information display
   - Order summary sidebar

### 🚧 Work in Progress

1. **Calendar Availability System**:
   - Integration with Mina Scheduler
   - Stylist availability management
   - Real-time slot booking
   - Time conflict resolution

### 📋 Planned Features

1. **Location Selection**:

   - Address input with Mapbox
   - Travel cost calculation
   - Location preference handling

2. **Payment Integration**:

   - Stripe Checkout session creation
   - Payment authorization flow
   - Booking confirmation process

3. **Communication Setup**:
   - Chat channel creation
   - Email confirmations
   - Notification preferences

## Business Rules & Validation

### Booking Creation Rules

- Must have authenticated user
- Must have valid cart contents
- Services must be from single stylist
- All services must be currently available
- Stylist must be active and available

### Appointment Scheduling Rules

- Selected time slot must be available
- Appointment duration = sum of all service durations
- Buffer time applied between appointments
- No double-booking prevention
- Holiday/vacation period respect

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
