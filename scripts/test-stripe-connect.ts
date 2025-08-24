#!/usr/bin/env bun

/**
 * Test script for Stripe Connect integration
 * 
 * This script tests the Stripe Connect account creation functionality
 * without requiring a full application approval flow.
 * 
 * Usage: bun run with-env bun scripts/test-stripe-connect.ts
 */

import { 
  createStripeConnectedAccount, 
  createStripeAccountOnboardingLink, 
  getStripeAccountStatus 
} from "@/lib/stripe/connect";

async function testStripeConnectIntegration() {
  console.log("🧪 Testing Stripe Connect integration...\n");

  // Test data
  const testProfileId = "test-profile-" + Math.random().toString(36).substring(7);
  const testEmail = `test-stylist-${Date.now()}@example.com`;

  console.log(`📊 Test data:`);
  console.log(`   Profile ID: ${testProfileId}`);
  console.log(`   Email: ${testEmail}\n`);

  try {
    // Step 1: Create connected account
    console.log("1. Creating Stripe Connect account...");
    const accountResult = await createStripeConnectedAccount({
      email: testEmail,
    });

    if (accountResult.error || !accountResult.data) {
      console.error("❌ Failed to create account:", accountResult.error);
      return;
    }

    const stripeAccountId = accountResult.data.stripeAccountId;
    console.log(`✅ Created account: ${stripeAccountId}\n`);

    // Step 2: Create onboarding link
    console.log("2. Creating onboarding link...");
    const linkResult = await createStripeAccountOnboardingLink({
      stripeAccountId,
    });

    if (linkResult.error || !linkResult.data) {
      console.error("❌ Failed to create onboarding link:", linkResult.error);
      return;
    }

    console.log(`✅ Created onboarding link: ${linkResult.data.url}\n`);

    // Step 3: Check account status
    console.log("3. Checking account status...");
    const statusResult = await getStripeAccountStatus({
      stripeAccountId,
    });

    if (statusResult.error || !statusResult.data) {
      console.error("❌ Failed to get account status:", statusResult.error);
      return;
    }

    console.log(`✅ Account status:`);
    console.log(`   Charges enabled: ${statusResult.data.charges_enabled}`);
    console.log(`   Details submitted: ${statusResult.data.details_submitted}`);
    console.log(`   Payouts enabled: ${statusResult.data.payouts_enabled}`);
    console.log(`   Country: ${statusResult.data.country}`);
    console.log(`   Currency: ${statusResult.data.default_currency}`);

    if (statusResult.data.requirements) {
      console.log(`   Requirements:`);
      console.log(`     Currently due: ${statusResult.data.requirements.currently_due?.length || 0}`);
      console.log(`     Eventually due: ${statusResult.data.requirements.eventually_due?.length || 0}`);
    }

    console.log(`\n🎉 Stripe Connect integration test completed successfully!`);
    console.log(`\n📋 Summary:`);
    console.log(`   ✅ Account creation: PASSED`);
    console.log(`   ✅ Onboarding link: PASSED`);
    console.log(`   ✅ Status check: PASSED`);
    console.log(`\n🔗 Next steps:`);
    console.log(`   1. Visit the onboarding link in a browser to complete setup`);
    console.log(`   2. The webhook will sync account updates to the database`);
    console.log(`   3. Test the full application approval flow`);

  } catch (error) {
    console.error("❌ Test failed with error:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Stack trace:", error.stack);
    }
  }
}

// Only run if this file is executed directly
if (import.meta.main) {
  testStripeConnectIntegration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}