# Shopping Cart System

## Overview

The shopping cart system enables customers to collect services from stylists before proceeding to booking. The system enforces a single-stylist-per-booking rule to ensure optimal booking experience and scheduling efficiency.

## Business Purpose

- **Simplified Booking Flow**: Customers can browse and collect services before committing to a booking
- **Service Bundling**: Allows customers to book multiple services in a single appointment
- **Reduced Friction**: No authentication required until checkout, maximizing conversion
- **Clear Pricing**: Customers can see total costs before proceeding to booking

## Core Business Rules

### 1. Single Stylist Restriction

**Rule**: Customers can only have services from ONE stylist in their cart at any given time.

**Rationale**:

- Simplifies scheduling coordination
- Ensures all services can be booked in a single appointment slot
- Prevents confusion about location (stylist's place vs customer's place)
- Streamlines payment processing

**Implementation**:

- When adding a service from a different stylist, users are presented with a clear choice:
  - Keep current cart (cancel the new addition)
  - Replace cart with new service (clear existing items)
- Dialog clearly explains why this restriction exists

### 2. Cart Persistence

**Rule**: Cart contents persist across browser sessions using localStorage.

**Benefits**:

- Users can leave and return without losing their selections
- No account required to maintain cart state
- Reduces abandonment rate

**Limitations**:

- Cart is device-specific (not synced across devices)
- Cart expires based on browser storage policies

### 3. Quantity Management

**Rule**: Users can adjust quantities for each service in their cart.

**Features**:

- Increment/decrement buttons for quick adjustments
- Direct input field for specific quantities
- Automatic removal when quantity reaches zero
- Real-time price updates

### 4. Authentication Requirements

**Rule**: No authentication required until checkout.

**Public Access Points**:

- Browse all services (`/tjenester`)
- View service details (`/tjenester/[id]`)
- Add to cart functionality
- View and manage cart (`/handlekurv`)

**Authentication Required For**:

- Proceeding to booking/checkout (`/bestilling`)
- Accessing booking history
- Managing profile settings

**Authentication Flow**:

- When clicking "Fortsett til booking" in cart:
  - If authenticated: Direct redirect to `/bestilling`
  - If not authenticated: Modal dialog with login/signup options
- Authentication dialog supports both:
  - Email OTP login for existing users
  - Account creation with email verification
- After successful authentication, automatic redirect to booking page
- Redirect URLs preserved through authentication process

## User Workflows

### Adding First Service

1. Customer browses services
2. Clicks "Legg til i handlekurv" (Add to cart)
3. Service added with quantity 1
4. Cart icon appears in navbar with item count
5. Success toast notification shown

### Adding Service from Same Stylist

1. Customer adds another service from the same stylist
2. If service already in cart: quantity incremented
3. If new service: added as separate line item
4. Cart total updates automatically
5. Success notification confirms addition

### Attempting to Add from Different Stylist

1. Customer tries to add service from different stylist
2. Warning dialog appears (cannot be dismissed without choice)
3. Dialog shows:
   - Current cart contents and stylist
   - New service attempting to add
   - Explanation of single-stylist rule
4. Customer must choose:
   - "Behold nåværende handlekurv" (Keep current cart)
   - "Erstatt med ny tjeneste" (Replace with new service)

### Managing Cart Items

1. **Via Hover Card** (Quick Preview):

   - Hover over cart icon (10ms delay)
   - View all items with prices
   - Adjust quantities with up/down arrows
   - Direct quantity input
   - Remove items with confirmation
   - Click to go to full cart page

2. **Via Cart Page** (`/handlekurv`):
   - Full view of all services
   - Detailed service information
   - Quantity controls per item
   - Remove individual items
   - Clear entire cart option
   - Order summary with total
   - Proceed to booking button (handles authentication)

### Empty Cart State

- Friendly message indicating empty cart
- Direct link to browse services
- No cart icon shown in navbar

### Proceeding to Booking

1. **Authenticated User Flow**:
   - User clicks "Fortsett til booking"
   - Immediate redirect to `/bestilling`
   - Cart contents preserved and displayed
   - Ready for calendar selection

2. **Unauthenticated User Flow**:
   - User clicks "Fortsett til booking"
   - Authentication dialog appears
   - User chooses login or signup
   - Email verification process
   - Automatic redirect to `/bestilling` after verification
   - Cart contents preserved throughout process

3. **Authentication Dialog Features**:
   - Toggle between login and signup modes
   - Email OTP for secure login
   - Account creation with full profile setup
   - Clear messaging about booking continuation
   - Proper redirect URL handling

## Validation Rules

### Service Addition

- Service must be published
- Service must have valid price
- Stylist profile must exist

### Quantity Changes

- Minimum quantity: 1
- Maximum quantity: No system limit (business may set limits)
- Only positive integers allowed

### Cart Operations

- Cannot have services from multiple stylists
- Cannot proceed to checkout with empty cart
- Must be authenticated to continue beyond cart view

## Integration Points

### With Service Discovery

- Add to cart buttons on service cards
- Quick add from service grid
- Detailed add from service detail page

### With Authentication System

**Unified Authentication Integration**:

- Modal-based authentication dialog for minimal cart disruption
- Booking-specific messaging: "Logg inn for å fortsette til booking"
- Cart state fully preserved through authentication process
- Support for both existing user login and new user registration
- Email OTP authentication eliminates password friction
- Automatic profile creation for new users with metadata
- Seamless redirect to booking page after successful authentication

**Authentication Flow**:

1. User clicks "Fortsett til booking" with items in cart
2. If unauthenticated: AuthDialog opens with booking context
3. User completes email OTP flow (login or signup)
4. Cart contents preserved throughout process
5. Automatic redirect to `/bestilling` after verification
6. Booking process continues with authenticated user context

### With Booking System

- Cart items transfer to booking summary
- Total price calculation carries forward
- Service durations used for scheduling
- Stylist information preserved for booking
- Real-time validation of cart contents at booking stage
- Seamless transition from cart to calendar selection

## Success Metrics

### Conversion Metrics

- Cart abandonment rate
- Add-to-cart conversion rate
- Cart-to-booking conversion rate
- Average items per cart

### User Experience Metrics

- Time to add first item
- Cart modification frequency
- Multi-stylist warning encounters
- Cart recovery rate (return visitors)

## Error Handling

### Service Unavailable

- If service becomes unavailable after adding to cart
- Show clear message at checkout
- Allow removal or replacement

### Stylist Unavailable

- If stylist becomes inactive
- Notify user before checkout
- Suggest alternatives

### Price Changes

- If prices change after adding to cart
- Show notification of price update
- Allow user to accept or remove item

## Future Enhancements

### Potential Features

1. **Save for Later**: Move items to wishlist
2. **Cart Sharing**: Share cart via link
3. **Recommended Services**: Suggest complementary services
4. **Bulk Discounts**: Apply discounts for multiple services
5. **Guest Checkout**: Complete booking without account
6. **Cross-Device Sync**: Sync cart across devices when logged in
7. **Abandoned Cart Recovery**: Email reminders for abandoned carts
8. **Service Packages**: Pre-defined service bundles
9. **Recurring Bookings**: Set up regular appointments

### Technical Improvements

- Server-side cart storage for logged-in users
- Cart analytics and tracking
- A/B testing cart flows
- Performance optimizations for large carts

## Business Impact

### Benefits

- **Increased Conversion**: Lower barrier to entry increases engagement
- **Higher Order Value**: Easy to add multiple services
- **Better UX**: Clear, intuitive shopping experience
- **Reduced Support**: Self-service cart management

### Risks & Mitigations

- **Cart Abandonment**: Mitigated by persistence and easy recovery
- **Inventory Issues**: Services not reserved until booking confirmed
- **Price Disputes**: Clear pricing shown at all stages

## Compliance & Legal

### Data Privacy

- Cart data stored locally (GDPR compliant)
- No personal data collected until checkout
- Clear data retention policies

### Consumer Rights

- Prices clearly displayed
- No hidden fees
- Easy cancellation process
- Clear terms of service

## Support & Training

### Customer Support Topics

- How to add services to cart
- Understanding single-stylist rule
- Managing quantities
- Clearing cart
- Recovering lost cart

### Stylist Education

- How customer cart affects bookings
- Benefits of service bundling
- Encouraging multi-service bookings
