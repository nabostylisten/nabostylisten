# Stripe Connect Integration

## Overview

This document describes the implementation of Stripe Connect for enabling payments to stylists in the Nabostylisten marketplace platform. The integration follows Stripe's recommended Express accounts model for marketplaces.

## Architecture

### Design Pattern

The integration follows a **layered architecture** pattern:
- **Service Layer** (`lib/stripe/connect.ts`) - Pure business logic, context-independent
- **Action Layer** (`server/stripe.actions.ts`) - Next.js server actions for web requests  
- **Application Layer** (`server/application.actions.ts`) - High-level business processes

This allows the same Stripe operations to be called from:
- Server actions (web requests)
- Background jobs/cron tasks
- CLI scripts and testing
- Admin tools

### Key Components

1. **Stripe Configuration** (`lib/stripe/config.ts`)
   - Stripe client initialization
   - Connect account configuration for Norwegian marketplace
   - URL configuration for onboarding flow

2. **Service Functions** (`lib/stripe/connect.ts`)
   - Pure Stripe operations that can run in any context
   - `createStripeConnectedAccount()` - Creates Express accounts
   - `createStripeAccountOnboardingLink()` - Generates onboarding URLs
   - `getStripeAccountStatus()` - Retrieves account verification status
   - `createConnectedAccountWithDatabase()` - Combines Stripe + database operations

3. **Server Actions** (`server/stripe.actions.ts`)
   - Thin wrappers around service functions for Next.js request context
   - `createConnectedAccount()` - Server action for account creation
   - `createAccountOnboardingLink()` - Server action for onboarding links
   - `getStripeAccountStatus()` - Server action for status checks

4. **Database Integration**
   - `stylist_details.stripe_account_id` - Links Stripe accounts to profiles
   - Webhook sync via existing Stripe Sync Engine

5. **Onboarding Pages**
   - `/stylist/stripe/return` - Success/status page after onboarding
   - `/stylist/stripe/refresh` - Handles expired/invalid links

## Implementation Flow

### 1. Application Approval Process

When an admin approves a stylist application (`updateApplicationStatus("approved")`):

1. **User Creation**: Supabase Auth user and profile are created
2. **Stripe Account**: Express Connect account is created automatically
3. **Database Update**: `stripe_account_id` is saved to `stylist_details`
4. **Onboarding Link**: Temporary URL is generated for account setup
5. **Email Notification**: Approval email includes onboarding instructions

### 2. Webhook Event Handling

The integration includes intelligent webhook processing that distinguishes between supported and unsupported events:

**Supported Events** (sync to `stripe` schema):
- `customer.*` → Customer data for payments
- `payment_intent.*` → Payment processing data
- `charge.*` → Transaction records
- `invoice.*` → Billing information
- `subscription.*` → Recurring payment data
- Plus other events matching database tables

**Unsupported Events** (gracefully skipped):
- `account.*` - Connect account events (handled during approval)
- `capability.*` - Connect capability updates (expected for marketplace)
- `person.*` - Account verification events
- `transfer.*`, `payout.*` - Payout events (tracked separately)

The webhook handler automatically:
1. Parses incoming events to determine type
2. Checks if the event entity exists in database schema
3. Processes supported events or gracefully skips others
4. Returns 202 status for all webhook acknowledgments
5. Logs clear messages about processed vs skipped events

### 3. Dual-Role User Creation

When a stylist is approved, they receive both:
- **Stripe Customer ID** - For purchasing services from other stylists
- **Stripe Connect Account** - For receiving payments from their customers

This ensures stylists can participate in both sides of the marketplace.

### 4. Account Creation Configuration

```typescript
const STRIPE_CONNECT_CONFIG = {
  country: 'NO',
  default_currency: 'nok',
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
  controller: {
    losses: { payments: 'application' },
    fees: { payer: 'application' },
    stripe_dashboard: { type: 'express' },
  },
};
```

### 3. Data Synchronization

- **Webhook Integration**: Account updates sync via existing webhook infrastructure
- **Real-time Updates**: Account status changes are reflected in database
- **Error Handling**: Account creation failures don't block user approval

## Environment Variables

Required environment variables (add to `.env`):

```env
# Stripe API keys
STRIPE_SECRET_KEY=sk_test_your-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key

# App URL for redirects
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Testing

### Manual Testing

Run the test script to verify integration:

```bash
bun run stripe:test:connect
```

This will:
1. Create a test Stripe Connect account
2. Generate an onboarding link
3. Check account status
4. Verify all components work together

### Integration Testing

1. **Create Application**: Submit stylist application form
2. **Admin Approval**: Approve application in admin dashboard
3. **Verify Creation**: Check that Stripe account ID is saved
4. **Test Onboarding**: Visit onboarding URL to complete setup
5. **Webhook Sync**: Verify account data syncs to database

## Security Considerations

### Account Link Security
- **Single Use**: Account links are single-use only
- **Expiration**: Links expire after a few minutes
- **Authentication**: Users must be authenticated before accessing links
- **No Sharing**: Links should never be shared outside the platform

### Data Protection
- **Minimal Storage**: Only essential Stripe data is stored locally
- **Webhook Validation**: All webhook requests are signature-verified
- **Error Logging**: Sensitive data is excluded from error logs

## Error Handling

### Graceful Degradation
- **Non-blocking**: Stripe account creation failure doesn't block user approval
- **Retry Mechanism**: Failed accounts can be created manually later
- **Status Monitoring**: Account status is checked and displayed to users

### Common Error Scenarios
1. **API Rate Limits**: Implemented with appropriate delays
2. **Network Failures**: Graceful fallback with error logging
3. **Invalid Configurations**: Clear error messages for troubleshooting
4. **Account Restrictions**: Proper handling of compliance issues

## Monitoring and Maintenance

### Key Metrics to Monitor
- **Account Creation Success Rate**: Track failed account creations
- **Onboarding Completion Rate**: Monitor user onboarding flow
- **Webhook Processing**: Ensure reliable data synchronization
- **Account Status Changes**: Track verification progress

### Regular Maintenance Tasks
- **Review Failed Accounts**: Manual creation for failed cases
- **Update API Version**: Keep Stripe client library current
- **Monitor Compliance**: Ensure regulatory compliance
- **Performance Optimization**: Monitor API response times

## Future Enhancements

### Planned Features
1. **Dashboard Integration**: Stylist dashboard with Stripe Connect stats
2. **Automated Transfers**: Implement payout scheduling
3. **Fee Management**: Dynamic fee calculation and display
4. **Advanced Analytics**: Revenue and performance tracking
5. **Multi-currency Support**: Expand beyond NOK if needed

### Technical Improvements
- **Caching**: Implement account status caching
- **Background Jobs**: Move account creation to background processing
- **Enhanced Testing**: Comprehensive integration test suite
- **Performance Monitoring**: Detailed metrics and alerting

## Troubleshooting

### Common Issues

**Account Creation Fails**
- Check Stripe API keys in environment variables
- Verify webhook endpoints are configured correctly
- Review Stripe dashboard for account restrictions

**Onboarding Links Don't Work**
- Ensure `NEXT_PUBLIC_APP_URL` is set correctly
- Check that return/refresh URLs are accessible
- Verify user authentication status

**Database Sync Issues**
- Confirm webhook is receiving Stripe events
- Check Stripe Sync Engine configuration
- Review database permissions for webhook processing

### Debug Commands

```bash
# Test basic integration
bun run stripe:test:connect

# Check webhook status
bun run stripe:functions:serve

# Test webhook events
bun run stripe:trigger account.updated
```

## API Reference

### Core Functions

#### `createConnectedAccount({ profileId, email })`
Creates a new Stripe Express account for a stylist.

**Parameters:**
- `profileId`: UUID of the stylist's profile
- `email`: Stylist's email address

**Returns:**
- `stripeAccountId`: The created account ID
- `error`: Error message if creation fails

#### `createAccountOnboardingLink({ stripeAccountId })`
Generates a temporary onboarding URL for account setup.

**Parameters:**
- `stripeAccountId`: The Stripe account ID

**Returns:**
- `url`: Temporary onboarding URL
- `error`: Error message if creation fails

#### `getStripeAccountStatus({ stripeAccountId })`
Retrieves current account status and requirements.

**Parameters:**
- `stripeAccountId`: The Stripe account ID

**Returns:**
- Account status including verification state
- Outstanding requirements for compliance
- `error`: Error message if retrieval fails

## Related Documentation

- [Stripe Webhook Local Setup](./stripe-webhook-local-setup.md)
- [Application Approval Process](../business/application-approval-workflow.md)
- [Database Schema Documentation](./database-schema.md)