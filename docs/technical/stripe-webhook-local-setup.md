# Stripe Webhook Local Development Setup

## Overview

This document explains how to set up and test Stripe webhooks locally using the Supabase Edge Function with the stripe-sync-engine.

## Architecture

The webhook flow works as follows:

1. Stripe sends webhook events to your local endpoint
2. The Supabase Edge Function (`stripe-sync`) receives these events
3. The stripe-sync-engine processes the webhook and syncs data to your local Postgres database in the `stripe` schema

## Prerequisites

- Stripe CLI installed (`brew install stripe/stripe-cli/stripe`)
- Supabase CLI installed (`brew install supabase/tap/supabase`)
- Supabase local development environment running (`bun supabase:start`)
- Stripe account with test mode enabled

## Configuration

### JWT Verification

The stripe-sync Edge Function has JWT verification disabled in `supabase/config.toml`:

```toml
[functions.stripe-sync]
verify_jwt = false
```

This is **required and secure** because:

- Stripe webhooks cannot provide JWT tokens
- The stripe-sync-engine validates requests using Stripe's webhook signature
- This is the standard pattern for webhook endpoints

### Environment Variables

The Edge Function requires the following environment variables (stored in `supabase/functions/.env`):

```env
DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:54322/postgres
STRIPE_WEBHOOK_SECRET=whsec_[your_webhook_secret]
STRIPE_SECRET_KEY=sk_test_[your_test_secret_key]
```

**Important:** Edge Functions run in Docker containers, so they must use `host.docker.internal` instead of `127.0.0.1` to connect to the host machine's database.

### Host Machine Environment

For scripts running on the host machine (like migrations), create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

This allows host-based scripts to connect using localhost while Edge Functions use the Docker networking hostname.

## Setup Steps

### 1. Start Supabase Local Development

```bash
bun supabase:start
```

### 2. Ensure Stripe Schema Exists

The stripe-sync-engine requires the `stripe` schema and tables to exist in your database. This is automatically handled by the database reset script:

```bash
bun supabase:db:reset
```

Or run the migration manually:

```bash
bun run with-env bun scripts/supabase/stripe-sync-engine.ts
```

### 3. Run the Webhook Development Setup

The easiest way to start everything:

```bash
bun stripe:webhook:dev
```

This script will:

- Start the Supabase Edge Functions server
- Start the Stripe CLI webhook listener
- Forward all Stripe events to `localhost:54321/functions/v1/stripe-sync`

### Alternative: Manual Setup

If you prefer to run services separately:

```bash
# Terminal 1: Start Edge Functions server
bun stripe:functions:serve

# Terminal 2: Start Stripe webhook listener
bun stripe:listen
```

## Testing the Webhook

### Method 1: Trigger Test Events

Use the Stripe CLI to trigger test events:

```bash
# Trigger a payment intent succeeded event
stripe trigger payment_intent.succeeded

# Trigger a customer created event
stripe trigger customer.created

# Trigger a subscription updated event
stripe trigger customer.subscription.updated
```

### Method 2: Real Stripe API Calls

Make actual API calls from your application. When running locally, all Stripe events will be forwarded to your local Edge Function.

## Verifying Data Sync

Check that the data is being synced to your database:

```sql
-- Connect to your local Supabase database
psql postgresql://postgres:postgres@localhost:54322/postgres

-- Check the stripe schema tables
\dt stripe.*

-- View synced customers
SELECT * FROM stripe.customers;

-- View synced payment intents
SELECT * FROM stripe.payment_intents;

-- View synced subscriptions
SELECT * FROM stripe.subscriptions;
```

## Available NPM Scripts

- `bun stripe:webhook:dev` - Start the complete webhook development environment
- `bun stripe:functions:serve` - Start only the Edge Functions server
- `bun stripe:listen` - Start only the Stripe webhook listener
- `bun stripe:trigger <event>` - Trigger a test Stripe event

## Troubleshooting

### Edge Function Not Receiving Events

1. Ensure the Edge Functions server is running on port 54321
2. Check that the Stripe CLI is forwarding to the correct URL: `localhost:54321/functions/v1/stripe-sync`
3. Verify your webhook secret matches what's in the environment variables

### Database Connection Issues

**"Connection terminated unexpectedly" errors:**

1. **Check DATABASE_URL format**: Edge Functions must use `host.docker.internal:54322`, not `127.0.0.1:54322`
2. **Verify the stripe schema exists**: Run `bun run with-env bun scripts/supabase/stripe-sync-engine.ts`
3. **Check Edge Function logs**: Look for connection errors in `supabase functions serve` output
4. **Restart Edge Functions**: Stop and restart `bun stripe:webhook:dev` after config changes

### Database Not Updating

1. Check the Edge Function logs for processing errors
2. Verify webhook signature validation is passing
3. Ensure the stripe schema exists in your database
4. Check that all required tables were created by the stripe-sync-engine migration

### Authentication Errors

1. Ensure your Stripe secret key is for test mode (starts with `sk_test_`)
2. Verify the webhook secret matches what Stripe CLI provides
3. Check that you're logged in to Stripe CLI: `stripe login`

## Important Notes

- **Docker Networking**: Edge Functions run in Docker and require `host.docker.internal` to connect to the host database
- **Environment Files**: Two separate `.env` files are needed - one for Edge Functions (`supabase/functions/.env`) and one for host scripts (`.env`)
- **Stripe Schema**: The `stripe` schema is automatically created during `bun supabase:db:reset` or can be created manually with the migration script
- **Webhook Secrets**: The webhook secret shown by Stripe CLI when running `stripe listen` is temporary and changes each session
- **Production**: For production, you'll need to register a real webhook endpoint in your Stripe Dashboard
- **Idempotency**: The stripe-sync-engine automatically handles duplicate events
- **Schema Isolation**: All synced data is stored in the `stripe` schema, separate from your main application schema

## Related Documentation

- [Supabase Stripe Sync Engine Blog Post](https://supabase.com/blog/stripe-engine-as-sync-library)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
