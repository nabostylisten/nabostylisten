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

// Database tables that correspond to supported Stripe events
// Based on the stripe schema tables available in the database
const SUPPORTED_STRIPE_ENTITIES = [
  'charge',
  'coupon', 
  'credit_note',
  'customer',
  'dispute',
  'early_fraud_warning',
  'event',
  'invoice',
  'payment_intent',
  'payment_method',
  'payout',
  'plan',
  'price',
  'product',
  'refund',
  'review',
  'setup_intent',
  'subscription_item',
  'subscription_schedule',
  'subscription',
  'tax_id',
] as const;

// Function to check if an event type is supported by checking if the entity is in our database
function isSupportedEvent(eventType: string): boolean {
  return SUPPORTED_STRIPE_ENTITIES.some(entity => eventType.includes(entity));
}

Deno.serve(async (req) => {
  try {
    // Extract raw body as Uint8Array (buffer)
    const rawBody = new Uint8Array(await req.arrayBuffer());
    const stripeSignature = req.headers.get("stripe-signature");

    // Parse the webhook to get event type for logging
    let eventType = 'unknown';
    try {
      const textBody = new TextDecoder().decode(rawBody);
      const eventData = JSON.parse(textBody);
      eventType = eventData.type || 'unknown';
    } catch (parseError: unknown) {
      console.error("Error parsing webhook body:", parseError);
      console.warn("Could not parse webhook body for event type detection");
    }

    console.log("Processing Stripe webhook:", {
      eventType,
      bodySize: rawBody.length,
      hasSignature: !!stripeSignature
    });

    // Check if this event type corresponds to a supported entity in our database
    if (!isSupportedEvent(eventType)) {
      console.log(`[SKIPPED] Event type not supported by database schema: ${eventType}`);
      
      return new Response(
        JSON.stringify({ 
          message: `Event ${eventType} skipped - entity not in database schema`,
          supportedEntities: SUPPORTED_STRIPE_ENTITIES
        }),
        {
          status: 202, // Accept the webhook but don't process
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Try to process with Stripe Sync Engine
    // @ts-expect-error - stripeSignature is not typed
    await stripeSync.processWebhook(rawBody, stripeSignature);
    
    console.log(`[SUCCESS] Stripe webhook processed: ${eventType}`);

    return new Response(null, {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Stripe webhook processing failed:", {
      error: error.message,
      stack: error.stack
    });
    
    // Check if this is an "Unhandled webhook event" error
    if (error.message === "Unhandled webhook event") {
      console.warn(`[UNSUPPORTED] Unknown event type - add to UNSUPPORTED_EVENTS map if this should be ignored`);
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
