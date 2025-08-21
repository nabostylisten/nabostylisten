// TODO: Stripe configuration file
// This file will handle Stripe initialization and configuration
// To be implemented when Stripe is set up

// import Stripe from 'stripe';

// export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2024-06-20',
//   typescript: true,
// });

// export const getStripePublishableKey = () => {
//   const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
//   if (!key) {
//     throw new Error('Stripe publishable key not found');
//   }
//   return key;
// };

// Platform fee configuration
export const PLATFORM_FEE_PERCENTAGE = 0.20; // 20% platform fee

// Stripe Connect configuration for stylists
// TODO: Configure Stripe Connect settings
// - Onboarding flow for stylists
// - Account verification requirements
// - Payout schedules
// - Transfer timing (instant vs manual)

// Payment configuration
// TODO: Configure payment settings
// - Supported payment methods (cards, Vipps, etc.)
// - Currency settings (NOK)
// - Capture timing (24 hours before appointment)
// - Refund policies

// Webhook configuration
// TODO: Set up webhook endpoints for:
// - payment_intent.succeeded
// - payment_intent.failed
// - payment_intent.canceled
// - charge.refunded
// - account.updated (for Stripe Connect)
// - payout.paid (for stylist payouts)

export {};
