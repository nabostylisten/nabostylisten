/**
 * Docs: https://supabase.com/blog/stripe-engine-as-sync-library
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { StripeSync } from "npm:@supabase/stripe-sync-engine@0.39.0";

// Load secrets from environment variables
const databaseUrl = Deno.env.get("DATABASE_URL")!;
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;

// Initialize StripeSync
const stripeSync = new StripeSync({
  databaseUrl,
  stripeWebhookSecret,
  stripeSecretKey,
  backfillRelatedEntities: false,
  autoExpandLists: true,
});

Deno.serve(async (req) => {
  // Extract raw body as Uint8Array (buffer)
  const rawBody = new Uint8Array(await req.arrayBuffer());

  const stripeSignature = req.headers.get("stripe-signature");

  // @ts-expect-error - stripeSignature is not typed
  await stripeSync.processWebhook(rawBody, stripeSignature);

  return new Response(null, {
    status: 202,
    headers: { "Content-Type": "application/json" },
  });
});
