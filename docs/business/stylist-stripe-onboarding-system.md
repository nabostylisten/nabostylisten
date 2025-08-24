# Stylist Stripe Onboarding System

## Business Overview

The Stylist Stripe Onboarding System enables approved stylists to receive payments from customers through Stripe Connect. This system creates a seamless flow from application approval to payment readiness, ensuring stylists can monetize their services on the platform while maintaining compliance with financial regulations.

## Business Value

- **Revenue Generation**: Enables stylists to receive payments, creating the core monetization mechanism for the platform
- **Compliance**: Ensures all payment processing meets regulatory requirements through Stripe's managed onboarding
- **Trust & Security**: Provides customers confidence that payments are handled securely through established payment infrastructure
- **Scalability**: Automated onboarding process reduces manual overhead as the stylist base grows

## User Journey

### 1. Application Submission

- **Who**: Prospective stylists
- **What**: Complete detailed application form including personal information, address, portfolio, and professional experience
- **Key Features**:
  - Mapbox address autocomplete for accurate location data and country code extraction
  - Portfolio image upload (1-10 images, compressed automatically)
  - Service category selection
  - Price range specification

### 2. Admin Review Process

- **Who**: Platform administrators
- **What**: Review and approve/reject stylist applications
- **Decision Points**:
  - Quality of portfolio work
  - Professional experience description
  - Completeness of application
  - Compliance with platform standards
- **Actions Available**:
  - **Applied**: Initial status when submitted
  - **Pending Info**: Request additional information from applicant
  - **Approved**: Trigger automatic account creation and Stripe setup
  - **Rejected**: Decline application with reason

### 3. Automatic Account Creation (Upon Approval)

- **Trigger**: Admin approves application
- **System Actions**:
  - Create Supabase authentication account
  - Generate user profile with stylist role
  - Create address record from application data
  - Establish Stripe Customer account (for purchasing services)
  - Create Stripe Connect account (for receiving payments)
  - Generate stylist profile with default settings
  - Send approval confirmation email
  - **Send onboarding email with next steps**

### 4. Stylist Onboarding Email

- **Purpose**: Guide newly approved stylists to complete their setup
- **Content**:
  - Congratulations on approval
  - Link to Stripe onboarding page
  - Overview of next steps
  - Platform introduction and resources

### 5. Stripe Connect Onboarding

- **Entry Point**: Stylist clicks link in onboarding email or visits `/stylist/stripe`
- **Process**:
  - System checks current onboarding status
  - If incomplete, redirects to Stripe-hosted onboarding form
  - Stylist completes required information:
    - Bank account details for payouts
    - Tax information
    - Identity verification
    - Business details
- **Experience**: Fully managed by Stripe with professional, secure interface

### 6. Return to Platform

- **Entry Point**: Stripe redirects to `/stylist/stripe/return` after completion
- **System Actions**:
  - Verify user authorization
  - Check Stripe account status in real-time
  - Display appropriate status (success, pending, or requiring action)
- **User Experience**:
  - Clear status indication with visual feedback
  - Guidance on next steps
  - Navigation to profile setup or service creation

### 7. Platform Access

- **Ready State**: All onboarding steps completed successfully
- **Capabilities Unlocked**:
  - Create and publish services
  - Receive bookings from customers
  - Accept payments through Stripe
  - Access stylist dashboard and analytics
  - Manage availability and pricing

## Business Rules

### Application Requirements

- Complete personal and professional information required
- Minimum portfolio of 1 image, maximum 10 images
- Valid address with country code for Stripe compliance
- Detailed professional experience (minimum 50 characters)
- Realistic price range specification

### Approval Criteria

- Portfolio demonstrates professional quality work
- Experience description shows relevant background
- Complete and accurate application information
- Compliance with platform content policies

### Payment Processing

- **Dual Stripe Integration**:
  - Stripe Customer: Allows stylists to book services from other stylists
  - Stripe Connect: Enables receiving payments from customers
- **Country Code Compliance**: Uses ISO 3166-1 alpha-2 country codes extracted from Mapbox
- **Payout Requirements**: Must complete full Stripe onboarding including:
  - Bank account verification
  - Identity verification
  - Tax information submission
  - Business detail completion

### Onboarding Status Validation

Three critical flags must be enabled for full access:

- **charges_enabled**: Can accept payments from customers
- **details_submitted**: All required information provided to Stripe
- **payouts_enabled**: Can receive funds to bank account

## Success Metrics

### Application Processing

- Time from application submission to admin review
- Application approval rate
- Average time for admin decision

### Onboarding Completion

- Percentage of approved stylists who complete Stripe onboarding
- Average time from approval to onboarding completion
- Drop-off rates at each onboarding step

### Platform Engagement

- Time from onboarding completion to first service creation
- Percentage of onboarded stylists who publish services
- Revenue generated within first 30 days of onboarding

## Risk Mitigation

### Compliance Risks

- **Country Code Accuracy**: Mapbox integration ensures proper ISO country codes for Stripe compliance
- **Data Validation**: Comprehensive form validation prevents incomplete or invalid submissions
- **Identity Verification**: Stripe handles all KYC requirements and compliance

### User Experience Risks

- **Clear Status Communication**: Real-time status updates prevent confusion
- **Error Handling**: Graceful fallbacks for Stripe API issues
- **Support Contact**: Clear contact information for assistance

### Technical Risks

- **API Reliability**: Retry logic and error handling for Stripe API calls
- **Data Consistency**: Transaction-safe operations for account creation
- **Performance**: Client-side loading for slow Stripe API calls

## Future Enhancements

### Onboarding Improvements

- Progress tracking dashboard for multi-step onboarding
- Automated reminders for incomplete onboarding
- Regional payment method support expansion

### Admin Tools

- Bulk application processing capabilities
- Advanced filtering and search for applications
- Analytics dashboard for approval patterns

### Stylist Experience

- Onboarding checklist and progress tracking
- Integration with accounting software
- Advanced payout scheduling options

## Communication Strategy

### Email Templates

- **Application Received**: Confirmation to applicant
- **Status Updates**: Approval, rejection, or information requests
- **Onboarding Welcome**: Guide to Stripe setup process
- **Completion Confirmation**: Success message and next steps

### In-App Notifications

- Real-time status updates during onboarding
- Clear error messages with action items
- Success celebrations for milestone completion

### Support Documentation

- Stylist onboarding guide
- FAQ for common onboarding issues
- Video tutorials for Stripe process
- Contact information for assistance
