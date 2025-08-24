import Stripe from 'stripe';

// Initialize Stripe client with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
});

export const getStripePublishableKey = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error('Stripe publishable key not found');
  }
  return key;
};

// Stripe Connect configuration for Norwegian marketplace
export const STRIPE_CONNECT_CONFIG: Stripe.AccountCreateParams = {
  business_profile: {
    estimated_worker_count: 1,
    url: 'https://www.nabostylisten.no',
    support_email: 'kontakt@nabostylisten.no',
    support_url: 'https://www.nabostylisten.no/kontakt',
  },
  business_type: 'individual',
  country: 'NO' as const,
  default_currency: 'nok' as const,
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
  // Controller settings for marketplace model
  controller: {
    losses: {
      payments: 'application',
    },
    fees: {
      payer: 'application' 
    },
    stripe_dashboard: {
      type: 'express' 
    },
  },
} as const;

// URL configuration for onboarding flow
export const getOnboardingUrls = () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return {
    return_url: `${baseUrl}/stylist/stripe/return`,
    refresh_url: `${baseUrl}/stylist/stripe/refresh`,
  };
};
