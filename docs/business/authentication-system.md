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

### 1. Email OTP Authentication (Production) + Development Password Authentication

**Production Rule**: All authentication uses email-based one-time passwords, no traditional passwords.

**Production Benefits**:

- Enhanced security (no password reuse, brute force attacks)
- Improved user experience (no forgotten passwords)
- Verified email addresses by default
- Mobile-friendly authentication flow

**Production Implementation**:

- Login: Email → OTP (Magic Link or 6-digit Code) → Authenticated
- Signup: Email + Profile Data → OTP (Magic Link or 6-digit Code) → Profile Created + Authenticated

**Development Enhancement**: 

**Development Rule**: Password authentication available only in development environment for testing purposes.

**Development Benefits**:

- Faster testing with seeded users and known credentials
- No email delivery dependency during development
- Immediate authentication for development workflows
- Ability to test complete user flows without OTP delays

**Development Implementation**:

- Login: Email + Password → Immediate Authentication (with OTP fallback)
- Signup: Email + Password + Optional Profile Data → User Creation + Immediate Authentication
- Environment-gated feature (completely disabled in production)
- Visual indicators showing development-only features

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

### 6. Welcome Email System

**Rule**: New customers receive a branded welcome email after successful signup and email verification.

**Business Purpose**:

- **Onboarding Guidance**: Step-by-step instructions for platform usage
- **Feature Discovery**: Introduction to key platform capabilities
- **Engagement**: Immediate value delivery to reduce churn
- **Stylist Recruitment**: Cross-promotion to potential stylists
- **Brand Consistency**: Professional, branded communication

**Welcome Email Triggers**:

- **Magic Link Verification**: Sent via `/auth/confirm` route after server-side verification
- **OTP Code Verification**: Sent via client-side `handleVerifyOtp` function
- **Account Age Check**: Only sent for accounts created within the last hour
- **Customer-Only**: Only sent to users with `role: "customer"` (not stylists or admins)

**Welcome Email Content**:

- **Personalized Greeting**: Uses user's full name when available
- **3-Step Onboarding Guide**: 
  1. Explore stylists in your area
  2. Book your first appointment  
  3. Enjoy your stylist experience
- **Platform Tips**: Best practices for using Nabostylisten effectively
- **Stylist Recruitment Section**: "Interessert i å bli stylist?" with benefits and application link
- **Support Information**: Contact details and response expectations
- **Notification Settings**: Links to preference management

**Technical Implementation**:

- **Email Service**: Resend API for reliable delivery
- **Template Engine**: React Email for branded, responsive templates
- **Dual Coverage**: Works with both magic link and OTP code verification flows
- **Async Processing**: Non-blocking email sending to avoid authentication delays
- **Error Handling**: Comprehensive logging for debugging email delivery issues

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
   - **Welcome email sent automatically** with onboarding guidance and platform tips

**Development Signup Enhancement:**

**Development Flow (Additional):**

1. **Simplified User Creation**:

   - Password field becomes available and required
   - Full name and phone number become optional (marked as "valgfritt i utvikling")
   - Auto-fill defaults applied for missing profile data

2. **Streamlined Process**:

   - Email + Password + Optional Profile Data → Direct User Creation
   - Uses `supabase.auth.signUp()` with immediate email confirmation
   - Automatic sign-in attempt after successful user creation
   - No email verification step required

3. **Profile Data Handling**:

   - Provided data: Used as-is for profile creation
   - Missing full name: Defaults to "Development User"
   - Missing phone: Defaults to "+47 000 00 000"
   - Development users clearly identifiable in database

4. **Immediate Access**:
   - User created and authenticated in single step
   - Immediate redirect to intended destination
   - Profile accessible immediately for testing workflows
   - **No welcome email sent** (development users bypass email verification flow)

### Login (Existing Users)

**Production Flow:**

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

**Development Flow (Additional):**

1. **Password Authentication Option**:

   - Email address + password fields available
   - Clear visual indicator: "Kun utvikling" (Development only)
   - Auto-fill button available for quick testing ("Fyll inn" → "demo-password")
   - Password visibility toggle for ease of use

2. **Immediate Authentication**:

   - Direct authentication without email verification
   - Immediate success and redirect
   - Falls back to OTP if password authentication fails

3. **Error Handling**:

   - Development-specific password error messages
   - Clear distinction between password and OTP authentication failures
   - Graceful fallback to production OTP flow

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

### Welcome Email Workflow

**Automatic Email Delivery Process**:

**Step 1: Email Verification Completion**
- User completes either magic link click or OTP code entry
- System verifies user identity and email ownership
- Profile lookup performed to gather user data

**Step 2: Eligibility Check**
- **Account Age**: Only accounts created within last hour receive welcome email
- **User Role**: Only customers receive welcome email (not stylists or admins)  
- **Email Availability**: Valid email address must be present

**Step 3: Email Composition & Delivery**
- **Personalization**: Email customized with user's full name
- **Content Assembly**: Welcome message, onboarding steps, and recruitment section
- **Template Rendering**: React Email template compiled for cross-client compatibility
- **Delivery**: Sent via Resend API with error handling and retry logic

**Step 4: User Experience**
- **Immediate Value**: Users receive actionable next steps within minutes of signup
- **Platform Familiarity**: Introduction to key features reduces learning curve
- **Engagement Opportunity**: Stylist recruitment section expands user base
- **Support Access**: Clear contact information reduces support friction

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

- Form validation (with development context awareness)
- OTP request handling (signInWithOtp)
- OTP verification handling (verifyOtp)
- **Development**: Password authentication (signInWithPassword, signUp)
- **Development**: Environment-specific validation and error handling
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

### Welcome Email Metrics

- **Email Delivery Rate**: Successfully sent welcome emails vs. eligible signups
- **Email Open Rate**: Welcome email engagement and visibility
- **Onboarding Completion**: Users who follow welcome email guidance
- **Stylist Conversion**: Customers who apply to become stylists after welcome email
- **Support Ticket Reduction**: Impact of welcome email on new user support requests
- **First Booking Rate**: Conversion from welcome email to first service booking

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

**Welcome Email Delivery Issues**:

- Email service API failures (Resend downtime)
- Invalid email addresses preventing delivery
- Spam filtering by recipient email providers
- Template rendering errors
- Missing user profile data

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

**Welcome Email Not Received**:

1. Check spam/promotions folder guidance
2. Verify email delivery through server logs
3. Manual resend option (future enhancement)
4. Support contact for delivery issues
5. Alternative onboarding through in-app tips

## Development Features & Testing

### Development-Only Authentication System

**Purpose**: Enable rapid development and testing of authentication-dependent features without email delivery dependencies.

**Security Model**:

- **Environment Gating**: Password authentication completely disabled in production (`process.env.NODE_ENV !== "development"`)
- **Visual Indicators**: All development features clearly marked with "Kun utvikling" badges
- **Fallback Architecture**: Production OTP system remains fully functional in development

### Development User Management

**Seeded User Integration**:

- Seeded users from database scripts can be authenticated using known passwords
- Development users identifiable by default profile data
- Compatible with existing seed data workflows
- Preserves database referential integrity

**Testing User Creation**:

- Create users with known credentials for consistent testing
- Minimal profile data requirements for faster test setup
- Automatic profile population with development defaults
- Immediate availability for testing complex user workflows

### Development UX Features

**Password Management**:

- **Visibility Toggle**: Eye/eye-off icons for password field visibility
- **Auto-fill Button**: Quick "demo-password" insertion for testing
- **Clear Labeling**: Contextual placeholders ("Velg et passord" vs "Passord for test-brukere")

**Form Adaptations**:

- **Optional Fields**: Profile fields become optional when using password authentication
- **Dynamic Validation**: Form validation adapts to development vs production context
- **Error Messaging**: Development-specific error handling and messaging

**Visual Design**:

- **Development Badges**: Orange badges clearly indicate development-only features
- **Contextual Help**: Inline guidance for development features
- **State Management**: Proper loading states and success feedback

### Testing Scenarios Enabled

**User Authentication Testing**:

1. **New User Creation**: Test complete signup → profile creation → authentication flow
2. **Existing User Login**: Test login with known credentials from seeded data
3. **Error Handling**: Test password authentication failure scenarios
4. **Profile Integration**: Test authenticated user access to protected features

**Booking System Integration**:

1. **Cart → Auth → Booking**: Test complete purchase flow with authenticated users
2. **Profile Access**: Test booking creation with user profile data
3. **Session Management**: Test authentication persistence across booking steps
4. **Error Recovery**: Test authentication failure during booking process

**User Experience Testing**:

1. **Mode Switching**: Test login ↔ signup transitions with password fields
2. **Form Validation**: Test development-specific validation rules
3. **Responsive Design**: Test password field layouts across devices
4. **Accessibility**: Test password visibility controls and keyboard navigation

### Development Security Considerations

**Production Safety**:

- **Build-Time Exclusion**: Development features excluded from production builds
- **Environment Validation**: Runtime checks prevent accidental exposure
- **Code Splitting**: Development authentication logic isolated from production

**Development Security**:

- **Local Only**: Password authentication only available on local development servers
- **Temporary Data**: Development users clearly marked for easy cleanup
- **No Production Secrets**: No production credentials exposed in development code

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
