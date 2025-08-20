# Authentication System

## Overview

The authentication system provides a unified, secure, and user-friendly way to handle user registration and login across the entire Nabostylisten platform. Built on Supabase Auth with email OTP (One-Time Password), the system eliminates password complexity while ensuring security and providing seamless user onboarding.

## Business Purpose

- **Friction-free Authentication**: Email OTP eliminates password fatigue and forgot password flows
- **Unified User Experience**: Consistent auth interface across all application touchpoints
- **Contextual Messaging**: Customizable labels for different use cases (e.g., booking-specific messaging)
- **Secure Onboarding**: Automatic profile creation with metadata from registration
- **Progressive Disclosure**: Users can browse without authentication until checkout

## Core Business Rules

### 1. Email OTP Only Authentication

**Rule**: All authentication uses email-based one-time passwords, no traditional passwords.

**Benefits**:

- Enhanced security (no password reuse, brute force attacks)
- Improved user experience (no forgotten passwords)
- Verified email addresses by default
- Mobile-friendly authentication flow

**Implementation**:

- Login: Email → OTP (Magic Link or 6-digit Code) → Authenticated
- Signup: Email + Profile Data → OTP (Magic Link or 6-digit Code) → Profile Created + Authenticated

### 2. Unified Authentication Flow

**Rule**: Same authentication logic across all application touchpoints.

**Consistency Points**:

- Form fields and validation
- Error handling and messaging
- Success states and redirects
- Mode switching (login ⟷ signup)

**Context Variations**:

- Dialog for in-flow authentication (cart → booking)
- Full-page forms for dedicated auth pages
- Customizable labels for different contexts

### 3. Progressive Authentication

**Rule**: Authentication required only when necessary.

**Public Access**:

- Service browsing and discovery
- Stylist profile viewing
- Cart management
- Service details

**Authentication Required**:

- Booking creation
- Profile management
- Order history
- Chat functionality

### 4. Dual OTP Verification Methods

**Rule**: Users can choose between two verification methods for optimal user experience.

**Verification Options**:

- **Magic Link**: Traditional email link that redirects to confirmation page
- **Manual Code Entry**: 6-digit numeric code that can be typed directly into the interface
- **Flexible Flow**: Users can switch between methods at any time during authentication

**User Benefits**:

- Mobile users can avoid app switching (email ↔ browser)
- Faster authentication via direct code entry
- Fallback option if magic links don't work
- Improved accessibility for different user preferences

### 5. Automatic Profile Creation

**Rule**: User profiles created automatically upon successful email verification.

**Profile Data Sources**:

- **Signup Flow**: Full name and phone number collected during registration
- **Login Flow**: Profile created with email only (for existing users signing up via login)
- **Database Trigger**: `handle_new_user()` function processes metadata

## User Workflows

### Registration (New Users)

1. **Initiation**:

   - User clicks "Registrer deg" or signup link
   - Or user proceeds to booking without authentication

2. **Data Collection**:

   - Email address (required)
   - Full name (required for signup)
   - Phone number (required for signup)

3. **OTP Process**:

   - System sends OTP email with user metadata and 6-digit code
   - User has two verification options:
     - **Option A**: Click magic link in email → Redirect to confirmation page
     - **Option B**: Enter 6-digit code directly in authentication form
   - Database trigger creates profile with provided data

4. **Completion**:
   - User automatically logged in
   - Redirected to intended destination or dashboard
   - Profile fully populated with registration data

### Login (Existing Users)

1. **Initiation**:

   - User clicks "Logg inn" or login link
   - Or user proceeds to booking and is prompted

2. **Identification**:

   - Email address only required
   - System recognizes existing user

3. **OTP Process**:

   - System sends OTP email with 6-digit code (no metadata needed)
   - User has two verification options:
     - **Option A**: Click magic link in email → Redirect to confirmation page
     - **Option B**: Enter 6-digit code directly in authentication form
   - Existing profile retrieved

4. **Completion**:
   - User logged in with existing profile
   - Redirected to intended destination

### Mode Switching

**Dynamic Mode Changes**:

- Users can switch between login and signup in any context
- Form fields adjust automatically (add/remove name/phone)
- Labels and messaging update contextually
- No page reload or navigation required

### OTP Verification Flow

**Two-Step Authentication Process**:

**Step 1: Email Collection**
- User enters email address (and profile data for signup)
- System sends OTP email with both magic link and 6-digit code
- User transitions to verification step

**Step 2: Verification**
- User presented with two verification options:
  - **Direct Code Entry**: Input 6-digit code from email
  - **Magic Link**: Click "Use magic link instead" or navigate back to email
- Flexible navigation between verification methods
- Clear instructions and error handling for each method

**Flow Navigation**:
- "Have code already?" button on email form for quick access to code entry
- "Back to email" button on code form for easy navigation
- Mode switching (login/signup) available at any step

## Authentication Contexts

### 1. Navigation Authentication (General)

**Location**: Main navbar, footer links
**Context**: General site authentication
**Labels**: Standard login/signup messaging
**Flow**:

- Dialog opens for quick authentication
- Default generic labels
- Redirects to home or previous page

### 2. Booking Authentication (Contextual)

**Location**: Cart → booking transition
**Context**: Purchase flow authentication  
**Labels**: Booking-specific messaging
**Flow**:

- "Logg inn for å fortsette til booking"
- "Opprett en konto for å fortsette til booking"
- Redirects directly to booking page

### 3. Standalone Page Authentication

**Location**: `/auth/login`, `/auth/sign-up`
**Context**: Direct authentication access
**Labels**: Standard page-specific messaging
**Flow**:

- Full-page card interface
- Cross-navigation between login/signup pages
- Supports redirect URLs from protected routes

### 4. Protected Route Authentication

**Location**: Middleware-protected pages
**Context**: Access control enforcement
**Labels**: Context-appropriate messaging
**Flow**:

- Automatic redirect to login with return URL
- Seamless return to intended page after auth
- Preserves application state during process

## Technical Architecture

### Component Structure

```
components/auth/
├── use-auth-form.ts     # Shared authentication logic
├── auth-form.tsx        # Core form component
├── auth-card.tsx        # Card wrapper for pages
└── index.ts            # Exports
```

### Shared Logic (`useAuthForm`)

**State Management**:

- Form fields (email, fullName, phoneNumber, otpCode)
- UI states (loading, error, success)
- Mode management (login/signup)
- Step management (email/code)

**Business Logic**:

- Form validation
- OTP request handling (signInWithOtp)
- OTP verification handling (verifyOtp)
- Success/error processing
- Redirect management
- Step transition management

### Component Hierarchy

```
AuthDialog (Modal)
├── DialogHeader (title/description)
└── AuthForm (shared logic)

AuthCard (Page)
├── CardHeader (title/description)
├── AuthForm (shared logic)
└── Mode switch links

AuthForm (Core)
├── Email Step (step === "email")
│   ├── Conditional fields (name/phone for signup)
│   ├── Email field (always present)
│   ├── Submit button (mode-specific labels)
│   ├── "Have code already?" button
│   └── Mode switch button
├── Code Step (step === "code")
│   ├── OTP code input (6-digit)
│   ├── Verify button
│   ├── Back to email button
│   └── Mode switch button
└── Success Step (isSuccess === true)
    └── Confirmation message
```

### Label Customization

**Customizable Elements**:

- Titles: "Logg inn" / "Registrer deg"
- Descriptions: Context-specific messaging
- Buttons: Action-specific text
- Loading states: Process-specific feedback
- Switch prompts: Mode transition messaging

**Context Examples**:

```typescript
// General context (navbar)
{
  loginDescription: "Skriv inn din e-post for å logge inn",
  signupDescription: "Opprett en ny konto"
}

// Booking context (cart)
{
  loginDescription: "Logg inn for å fortsette til booking",
  signupDescription: "Opprett en konto for å fortsette til booking"
}
```

## Integration Points

### With Shopping Cart System

**Authentication Gate**:

- Cart accessible without authentication
- Authentication required at "Fortsett til booking"
- Cart state preserved through auth flow
- Seamless transition to booking after login

### With Booking System

**User Identity**:

- Authenticated user required for booking creation
- Profile data automatically available
- Payment methods linked to user account
- Booking history associated with profile

### With Profile System

**Automatic Profile Creation**:

- Database trigger handles profile creation
- Metadata from OTP request populates profile
- Role defaulted to 'customer'
- Additional profile fields can be completed later

### With Middleware Protection

**Route Guard Integration**:

- Protected routes automatically redirect to login
- Return URL preserved in redirect chain
- Authentication state checked on route access
- Seamless continuation after successful auth

## Security Considerations

### OTP Security

**Email Verification**:

- Confirms email ownership
- Prevents account creation with invalid emails
- Time-limited verification links
- Single-use verification tokens

**Attack Mitigation**:

- Rate limiting on OTP requests
- Email flooding protection
- Invalid email handling
- Expired token management

### Data Privacy

**Minimal Data Collection**:

- Only essential fields collected
- Email always required
- Name/phone only for new accounts
- No password storage concerns

**GDPR Compliance**:

- Explicit consent for profile creation
- Clear data usage communication
- Right to deletion supported
- Data minimization principles followed

## User Experience Patterns

### Progressive Disclosure

**Information Architecture**:

1. Browse freely (no auth required)
2. Add to cart (no auth required)
3. Proceed to booking (auth gate)
4. Complete transaction (authenticated)

### Contextual Guidance

**Messaging Strategy**:

- General contexts: Standard auth messaging
- Transactional contexts: Purpose-specific messaging
- Error states: Clear, actionable guidance
- Success states: Next-step oriented

### Mobile Optimization

**Touch-Friendly Design**:

- Large touch targets
- Readable font sizes
- Simplified input fields
- Email client integration

**OTP Code Optimization**:

- Large, centered code input field
- Wide letter spacing for readability
- Numeric-only keyboard on mobile
- Auto-complete hints for password managers
- Clear visual feedback for valid/invalid codes

## Success Metrics

### Conversion Metrics

- **Auth Completion Rate**: OTP email → successful verification
- **Verification Method Split**: Magic link vs. code entry usage
- **Code Entry Success Rate**: Direct code verification success
- **Mode Switch Rate**: Login ⟷ signup transitions
- **Cart-to-Auth Rate**: Cart abandonment at auth gate
- **Auth-to-Booking Rate**: Authentication → completed booking

### User Experience Metrics

- **Time to Authentication**: From trigger to completion
- **Verification Method Preference**: User choice patterns
- **Step Completion Time**: Email step vs. code step duration
- **Error Rate**: Failed authentication attempts
- **Code Entry Errors**: Invalid code submission rate
- **Support Tickets**: Auth-related user issues
- **User Satisfaction**: Post-auth experience ratings

### Business Impact Metrics

- **New User Registration**: Signup completion rate
- **Return User Authentication**: Login success rate
- **Booking Conversion**: Auth impact on booking completion
- **User Retention**: Post-auth engagement rates

## Error Handling & Edge Cases

### Common Error Scenarios

**Invalid Email Addresses**:

- Clear validation messaging
- Format guidance provided
- Real-time validation feedback
- Suggested corrections

**OTP Delivery Issues**:

- Spam folder guidance
- Dual verification method (magic link + code)
- Alternative email option
- Resend functionality
- Support contact information

**Code Entry Issues**:

- 6-digit format validation
- Clear error messaging for invalid codes
- Numeric-only input filtering
- Code expiration handling
- Visual feedback for input state

**Network Connectivity**:

- Offline state detection
- Retry mechanisms
- Progress preservation
- Clear status communication

### Recovery Workflows

**Email Not Received**:

1. Check spam folder guidance
2. Verify email address accuracy
3. Try manual code entry instead
4. Resend OTP option
5. Try alternative email
6. Contact support escalation

**Invalid/Expired Codes**:

1. Clear error messaging
2. Format validation (6 digits only)
3. New OTP request option
4. Return to email input
5. Switch to magic link method

**Code Entry Difficulties**:

1. Large, readable input field
2. Visual feedback for validation
3. Clear format requirements
4. Magic link fallback option
5. Step navigation assistance

## Future Enhancement Opportunities

### Advanced Authentication

**Additional Methods**:

- SMS OTP for phone verification
- Social login integration (Google, Facebook)
- Magic links for faster access
- Biometric authentication (mobile)

### Enhanced User Experience

**Smart Features**:

- Email address suggestions
- Device trust mechanisms
- Pre-filled form fields
- Cross-device authentication

### Business Intelligence

**Analytics Integration**:

- User journey tracking
- Conversion funnel analysis
- A/B testing framework
- Personalization opportunities

## Support & Training

### Customer Support Topics

**Common User Issues**:

- Email not received guidance
- Code entry instructions
- Verification method selection
- Account creation confusion
- Mode switching explanation
- Profile completion help

### Development Guidelines

**Implementation Standards**:

- Consistent label usage
- Proper error handling
- Accessibility compliance
- Performance optimization

### Testing Procedures

**Quality Assurance**:

- Cross-browser compatibility
- Mobile responsiveness
- Email delivery testing
- OTP code verification testing
- Error scenario validation
- Accessibility compliance (screen readers, keyboard navigation)
- Input validation testing (numeric-only, 6-digit format)

## Compliance & Legal

### Data Protection

**Privacy Requirements**:

- GDPR compliance maintained
- Data retention policies
- User consent management
- Right to deletion support

### Security Standards

**Industry Compliance**:

- Email security best practices
- Token generation standards
- Rate limiting implementation
- Audit logging maintenance

This authentication system provides a secure, user-friendly, and scalable foundation for user management across the Nabostylisten platform, balancing security requirements with optimal user experience while supporting the business's growth and operational needs.
