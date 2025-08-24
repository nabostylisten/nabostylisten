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
  try {
    // Extract raw body as Uint8Array (buffer)
    const rawBody = new Uint8Array(await req.arrayBuffer());
    const stripeSignature = req.headers.get("stripe-signature");

    console.log("Processing Stripe webhook:", {
      bodySize: rawBody.length,
      hasSignature: !!stripeSignature
    });
    
    // @ts-expect-error - stripeSignature is not typed
    await stripeSync.processWebhook(rawBody, stripeSignature);
    
    console.log("Stripe webhook processed successfully");

    return new Response(null, {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Stripe webhook processing failed:", {
      error: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
