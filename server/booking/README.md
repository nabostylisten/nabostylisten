# Booking Actions Refactoring

## Overview

This directory contains the refactored booking actions that were previously consolidated in `/server/booking.actions.ts` (2,716 lines). The monolithic file has been split into focused, domain-specific modules for better maintainability and developer experience.

## File Structure

### Core Action Files

#### `crud.actions.ts` - Basic Database Operations

**Functions:**

- `getBooking(id: string)` - Retrieve single booking by ID
- `createBooking(booking)` - Create new booking record
- `updateBooking(id, booking)` - Update existing booking
- `deleteBooking(id)` - Delete booking record
- `getUserBookings(userId, filters, userRole)` - Get user's bookings with filtering
- `getBookingDetails(bookingId)` - Get detailed booking info with joins
- `getBookingCounts(userId, userRole)` - Get booking count statistics

**Purpose:** Simple CRUD operations with minimal business logic. These functions primarily handle database interactions with basic validation.

#### `creation.actions.ts` - Complex Booking Creation

**Functions:**

- `createBookingWithServices(bookingData)` - Main booking creation with full business logic

**Purpose:** Handles the complex booking creation process including:

- Stripe payment intent creation
- Service linking and pricing calculations
- Trial session creation (if requested)
- Payment record creation
- Error handling and rollback scenarios
- Stripe onboarding validation

#### `lifecycle.actions.ts` - Booking State Management

**Functions:**

- `cancelBooking(bookingId, reason?)` - Cancel booking with refund logic
- `rescheduleBooking({bookingId, newStartTime, newEndTime, ...})` - Reschedule with trial handling
- `updateBookingStatus({bookingId, status, message})` - Update status with notifications

**Purpose:** Manages booking state transitions throughout the booking lifecycle:

- Cancellation with refund calculations based on platform config
- Rescheduling with trial session coordination
- Status updates with automatic email notifications
- Business rule enforcement for state transitions

#### `notifications.actions.ts` - Email & Communication

**Functions:**

- `sendPostPaymentEmails(bookingId)` - Send receipt and request emails after payment
- `notifyStripeOnboardingRequired({stylistId, customerName})` - Stripe onboarding notifications

**Purpose:** Handles all email communication related to bookings:

- Customer receipt emails after successful payment
- Stylist booking request notifications
- Stripe onboarding requirement alerts
- Respects user notification preferences
- Prevents duplicate email sending

#### `trial-sessions.actions.ts` - Trial Session Logic

**Functions:**

- `calculateOptimalTrialSessionTime({originalMainStart, ...})` - Calculate ideal trial timing

**Purpose:** Specialized utilities for trial session management:

- Time calculation algorithms for maintaining relative timing
- Trial session constraint validation
- Integration with main booking scheduling

### Shared Utilities

#### `shared/types.ts`

- Common interfaces and type definitions used across booking modules
- Extracted from inline types in the original file

#### `shared/validation.ts`

- Zod schemas for booking validation
- Shared validation utilities used by multiple action files

#### `shared/utils.ts`

- Common helper functions used across booking operations
- Date/time utilities, formatting functions, etc.

## Migration Strategy

The refactoring followed this systematic approach:

1. **Analyze Function Dependencies** - Mapped which functions call each other and their external dependencies
2. **Group by Domain** - Categorized functions based on their primary responsibility
3. **Extract Shared Code** - Identified common utilities and moved them to shared directory
4. **Migrate Incrementally** - Moved functions one group at a time, updating imports immediately
5. **Test Each Migration** - Verified functionality after each group migration

## Import Updates

After moving functions, all import statements throughout the codebase were updated from:

```typescript
import { functionName } from "@/server/booking.actions";
```

To domain-specific imports:

```typescript
import { functionName } from "@/server/booking/crud.actions";
import { functionName } from "@/server/booking/creation.actions";
// etc.
```

## Benefits Achieved

1. **Maintainability** - Each file focuses on a specific domain, making it easier to locate and modify functionality
2. **Team Collaboration** - Multiple developers can work on different aspects without merge conflicts
3. **Code Organization** - Clear separation of concerns with logical grouping
4. **Performance** - Smaller files load faster in IDEs and reduce memory usage
5. **Testing** - More focused unit tests can be written for each domain
6. **Code Reuse** - Shared utilities eliminate duplication across modules

## Future Development Guidelines

When adding new booking-related functionality:

1. **CRUD Operations** → Add to `crud.actions.ts`
2. **Complex Creation Logic** → Extend `creation.actions.ts`
3. **State Management** → Add to `lifecycle.actions.ts`
4. **Email/Notifications** → Add to `notifications.actions.ts`
5. **Trial Session Features** → Add to `trial-sessions.actions.ts`
6. **Shared Utilities** → Add to appropriate `shared/` file

## Original Context

The original `booking.actions.ts` file contained all booking-related server actions in a single file. While functional, this approach had several drawbacks:

- Difficult to navigate (2,716 lines)
- Merge conflicts when multiple developers worked on bookings
- Mixed concerns (CRUD, payments, emails, business logic)
- IDE performance issues with large files
- Harder to write focused tests

This refactoring maintains all existing functionality while providing better code organization and developer experience.
