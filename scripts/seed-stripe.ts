#!/usr/bin/env bun

/**
 * Stripe Seeding Script
 *
 * This script runs AFTER the database has been seeded and creates real Stripe
 * accounts and customers using the actual Stripe service functions.
 *
 * ⚠️  DEVELOPMENT ONLY - This script will DELETE existing Stripe accounts/customers
 * and is protected by NODE_ENV checks to prevent running in production.
 *
 * Usage: NODE_ENV=development bun scripts/seed-stripe.ts
 *
 * Prerequisites:
 * 1. NODE_ENV must be set to 'development'
 * 2. Database must be seeded first (bun supabase:db:reset)
 * 3. Stripe API keys must be configured in environment
 * 4. Local Supabase instance must be running
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  createStripeConnectedAccount,
  createStripeCustomer,
  saveStripeAccountIdToDatabase,
  saveStripeCustomerIdToDatabase,
} from "@/lib/stripe/connect";
import { stripe } from "@/lib/stripe/config";

// Create Supabase service client for database operations
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

interface CustomerToSeed {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  stripe_customer_id: string | null;
}

async function validateDevelopmentEnvironment() {
  console.log("🔒 Validating development environment...");

  // Multiple checks to ensure we're in development
  const nodeEnv = process.env.NODE_ENV;
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction || nodeEnv !== "development") {
    console.error("❌ SAFETY CHECK FAILED!");
    console.error("   This script can only run in development environment.");
    console.error(`   Current NODE_ENV: ${nodeEnv || "undefined"}`);
    console.error("   Set NODE_ENV=development to run this script.");
    process.exit(1);
  }

  // Additional safety check for Stripe keys
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (
    stripeKey &&
    (stripeKey.includes("pk_live_") || stripeKey.includes("sk_live_"))
  ) {
    console.error("❌ SAFETY CHECK FAILED!");
    console.error(
      "   Detected live Stripe keys. This script only works with test keys.",
    );
    console.error("   Make sure you're using test Stripe keys (sk_test_...).");
    process.exit(1);
  }

  console.log("✅ Development environment validated");
  console.log(`   NODE_ENV: ${nodeEnv}`);
  console.log("   Ready to proceed with Stripe account cleanup and seeding");
}

async function deleteExistingStripeAccounts() {
  console.log("\n🗑️  Cleaning up existing Stripe accounts...");

  try {
    // Query all profiles with existing Stripe account IDs
    const { data: stylistsWithAccounts, error: queryError } = await supabase
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        stylist_details (
          stripe_account_id
        )
      `)
      .eq("role", "stylist")
      .not("stylist_details.stripe_account_id", "is", null);

    if (queryError) {
      console.error(
        "❌ Error querying stylists with Stripe accounts:",
        queryError,
      );
      return;
    }

    if (!stylistsWithAccounts || stylistsWithAccounts.length === 0) {
      console.log("ℹ️  No existing Stripe accounts found");
      return;
    }

    console.log(
      `📋 Found ${stylistsWithAccounts.length} Stripe accounts to delete`,
    );

    let accountsDeleted = 0;
    let accountsCleared = 0;

    for (const stylist of stylistsWithAccounts) {
      const stripeAccountId = stylist.stylist_details?.stripe_account_id;

      if (!stripeAccountId) continue;

      console.log(
        `  🗑️  Deleting account for ${stylist.full_name}: ${stripeAccountId}`,
      );

      try {
        // Delete from Stripe
        await stripe.accounts.del(stripeAccountId);
        accountsDeleted++;

        // Clear from database
        const { error: updateError } = await supabase
          .from("stylist_details")
          .update({ stripe_account_id: null })
          .eq("profile_id", stylist.id);

        if (updateError) {
          console.error(
            `    ❌ Failed to clear database: ${updateError.message}`,
          );
        } else {
          accountsCleared++;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (stripeError: any) {
        // Account might already be deleted or doesn't exist
        if (
          stripeError.type === "StripeInvalidRequestError" &&
          stripeError.message?.includes("No such account")
        ) {
          console.log(
            `    ℹ️  Account already deleted from Stripe, clearing database`,
          );

          // Clear from database anyway
          const { error: updateError } = await supabase
            .from("stylist_details")
            .update({ stripe_account_id: null })
            .eq("profile_id", stylist.id);

          if (!updateError) {
            accountsCleared++;
          }
        } else {
          console.error(
            `    ❌ Failed to delete Stripe account: ${stripeError.message}`,
          );
        }
      }
    }

    console.log(`  ✅ Deleted ${accountsDeleted} Stripe accounts`);
    console.log(`  ✅ Cleared ${accountsCleared} database references`);
  } catch (error) {
    console.error(
      "❌ Unexpected error in deleteExistingStripeAccounts:",
      error,
    );
  }
}

async function deleteExistingStripeCustomers() {
  console.log("\n🗑️  Cleaning up existing Stripe customers...");

  try {
    // Query all profiles with existing Stripe customer IDs
    const { data: profilesWithCustomers, error: queryError } = await supabase
      .from("profiles")
      .select("id, email, full_name, stripe_customer_id")
      .not("stripe_customer_id", "is", null);

    if (queryError) {
      console.error(
        "❌ Error querying profiles with Stripe customers:",
        queryError,
      );
      return;
    }

    if (!profilesWithCustomers || profilesWithCustomers.length === 0) {
      console.log("ℹ️  No existing Stripe customers found");
      return;
    }

    console.log(
      `📋 Found ${profilesWithCustomers.length} Stripe customers to delete`,
    );

    let customersDeleted = 0;
    let customersCleared = 0;

    for (const profile of profilesWithCustomers) {
      if (!profile.stripe_customer_id) continue;

      console.log(
        `  🗑️  Deleting customer for ${profile.full_name}: ${profile.stripe_customer_id}`,
      );

      try {
        // Delete from Stripe
        await stripe.customers.del(profile.stripe_customer_id);
        customersDeleted++;

        // Clear from database
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ stripe_customer_id: null })
          .eq("id", profile.id);

        if (updateError) {
          console.error(
            `    ❌ Failed to clear database: ${updateError.message}`,
          );
        } else {
          customersCleared++;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (stripeError: any) {
        // Customer might already be deleted or doesn't exist
        if (
          stripeError.type === "StripeInvalidRequestError" &&
          stripeError.message?.includes("No such customer")
        ) {
          console.log(
            `    ℹ️  Customer already deleted from Stripe, clearing database`,
          );

          // Clear from database anyway
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ stripe_customer_id: null })
            .eq("id", profile.id);

          if (!updateError) {
            customersCleared++;
          }
        } else {
          console.error(
            `    ❌ Failed to delete Stripe customer: ${stripeError.message}`,
          );
        }
      }
    }

    console.log(`  ✅ Deleted ${customersDeleted} Stripe customers`);
    console.log(`  ✅ Cleared ${customersCleared} database references`);
  } catch (error) {
    console.error(
      "❌ Unexpected error in deleteExistingStripeCustomers:",
      error,
    );
  }
}

async function seedStripeAccounts() {
  console.log("🎭 Starting Stripe account seeding for stylists...");

  try {
    // Query all stylists who need Stripe accounts
    const { data: stylists, error: stylistsError } = await supabase
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        stripe_customer_id,
        stylist_details (
          stripe_account_id
        )
      `)
      .eq("role", "stylist");

    if (stylistsError) {
      console.error("❌ Error fetching stylists:", stylistsError);
      return;
    }

    if (!stylists || stylists.length === 0) {
      console.log("ℹ️  No stylists found in database");
      return;
    }

    console.log(`📋 Found ${stylists.length} stylists to process`);

    let accountsCreated = 0;
    let accountsSkipped = 0;
    let customersCreated = 0;
    let customersSkipped = 0;

    for (const stylist of stylists) {
      if (!stylist.email) continue;

      console.log(
        `\n👤 Processing stylist: ${stylist.full_name} (${stylist.email})`,
      );

      // Create Stripe connected account if needed
      if (!stylist.stylist_details?.stripe_account_id) {
        console.log("  🏦 Creating Stripe connected account...");

        const accountResult = await createStripeConnectedAccount({
          email: stylist.email,
          name: stylist.full_name || "Unknown Stylist",
          address: {
            addressLine1: "Test Address 1",
            addressLine2: "",
            city: "Oslo",
            state: "",
            postalCode: "0150",
            country: "NO",
          },
        });

        if (accountResult.error || !accountResult.data) {
          console.error(
            `  ❌ Failed to create Stripe account: ${accountResult.error}`,
          );
          continue;
        }

        // Save to database
        const saveResult = await saveStripeAccountIdToDatabase({
          supabaseClient: supabase,
          profileId: stylist.id,
          stripeAccountId: accountResult.data.stripeAccountId,
        });

        if (saveResult.success) {
          console.log(
            `  ✅ Created Stripe account: ${accountResult.data.stripeAccountId}`,
          );
          accountsCreated++;
        } else {
          console.error(`  ❌ Failed to save account ID: ${saveResult.error}`);
        }
      } else {
        console.log("  ⏭️  Already has Stripe account, skipping");
        accountsSkipped++;
      }

      // Create Stripe customer if needed (stylists can also book services)
      if (!stylist.stripe_customer_id) {
        console.log("  👥 Creating Stripe customer for stylist...");

        const customerResult = await createStripeCustomer({
          email: stylist.email,
          name: stylist.full_name || undefined,
          metadata: {
            profile_id: stylist.id,
            source: "development_seed",
            role: "stylist",
          },
        });

        if (customerResult.error || !customerResult.data) {
          console.error(
            `  ❌ Failed to create Stripe customer: ${customerResult.error}`,
          );
          continue;
        }

        // Save to database
        const saveResult = await saveStripeCustomerIdToDatabase({
          supabaseClient: supabase,
          profileId: stylist.id,
          stripeCustomerId: customerResult.data.customerId,
        });

        if (saveResult.success) {
          console.log(
            `  ✅ Created Stripe customer: ${customerResult.data.customerId}`,
          );
          customersCreated++;
        } else {
          console.error(`  ❌ Failed to save customer ID: ${saveResult.error}`);
        }
      } else {
        console.log("  ⏭️  Already has Stripe customer, skipping");
        customersSkipped++;
      }
    }

    console.log(`\n📊 Stylist Processing Summary:`);
    console.log(`  🏦 Stripe accounts created: ${accountsCreated}`);
    console.log(`  ⏭️  Stripe accounts skipped: ${accountsSkipped}`);
    console.log(`  👥 Stripe customers created: ${customersCreated}`);
    console.log(`  ⏭️  Stripe customers skipped: ${customersSkipped}`);
  } catch (error) {
    console.error("❌ Unexpected error in seedStripeAccounts:", error);
  }
}

async function seedStripeCustomers() {
  console.log("\n👥 Starting Stripe customer seeding for regular customers...");

  try {
    // Query all customers who need Stripe accounts
    const { data: customers, error: customersError } = await supabase
      .from("profiles")
      .select("id, email, full_name, phone_number, stripe_customer_id")
      .eq("role", "customer")
      .returns<CustomerToSeed[]>();

    if (customersError) {
      console.error("❌ Error fetching customers:", customersError);
      return;
    }

    if (!customers || customers.length === 0) {
      console.log("ℹ️  No customers found in database");
      return;
    }

    console.log(`📋 Found ${customers.length} customers to process`);

    let customersCreated = 0;
    let customersSkipped = 0;

    for (const customer of customers) {
      console.log(
        `\n👤 Processing customer: ${customer.full_name} (${customer.email})`,
      );

      if (!customer.stripe_customer_id) {
        console.log("  👥 Creating Stripe customer...");

        const customerResult = await createStripeCustomer({
          email: customer.email,
          name: customer.full_name || undefined,
          phone: customer.phone_number || undefined,
          metadata: {
            profile_id: customer.id,
            source: "development_seed",
            role: "customer",
          },
        });

        if (customerResult.error || !customerResult.data) {
          console.error(
            `  ❌ Failed to create Stripe customer: ${customerResult.error}`,
          );
          continue;
        }

        // Save to database
        const saveResult = await saveStripeCustomerIdToDatabase({
          supabaseClient: supabase,
          profileId: customer.id,
          stripeCustomerId: customerResult.data.customerId,
        });

        if (saveResult.success) {
          console.log(
            `  ✅ Created Stripe customer: ${customerResult.data.customerId}`,
          );
          customersCreated++;
        } else {
          console.error(`  ❌ Failed to save customer ID: ${saveResult.error}`);
        }
      } else {
        console.log("  ⏭️  Already has Stripe customer, skipping");
        customersSkipped++;
      }
    }

    console.log(`\n📊 Customer Processing Summary:`);
    console.log(`  👥 Stripe customers created: ${customersCreated}`);
    console.log(`  ⏭️  Stripe customers skipped: ${customersSkipped}`);
  } catch (error) {
    console.error("❌ Unexpected error in seedStripeCustomers:", error);
  }
}

async function validateEnvironment() {
  console.log("🔍 Validating environment variables...");

  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
  ];

  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((envVar) => console.error(`  - ${envVar}`));
    process.exit(1);
  }

  // Test Supabase connection
  try {
    const { error } = await supabase.from("profiles").select("count").limit(1);
    if (error) {
      console.error("❌ Failed to connect to Supabase:", error.message);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Failed to connect to Supabase:", error);
    process.exit(1);
  }

  console.log("✅ Environment variables validated");
  console.log("✅ Supabase connection successful");
}

async function main() {
  console.log("🎯 Stripe Development Seeding Script");
  console.log("=====================================");
  console.log(
    "⚠️  WARNING: This script will DELETE all existing Stripe accounts/customers",
  );
  console.log(
    "   and create new ones for development. Only runs in NODE_ENV=development.",
  );
  console.log("   Make sure you've run 'bun supabase:db:reset' first.\n");

  try {
    // Safety checks first
    await validateDevelopmentEnvironment();
    await validateEnvironment();

    // Delete existing Stripe data
    console.log("\n🧹 CLEANUP PHASE");
    console.log("=================");
    await deleteExistingStripeAccounts();
    await deleteExistingStripeCustomers();

    // Create new Stripe data
    console.log("\n🏗️  CREATION PHASE");
    console.log("==================");
    await seedStripeAccounts();
    await seedStripeCustomers();

    console.log("\n🎉 Stripe seeding completed successfully!");
    console.log("\n💡 Next steps:");
    console.log(
      "  - Your development environment now has real Stripe accounts",
    );
    console.log(
      "  - Stylists can complete onboarding through the real Stripe flow",
    );
    console.log("  - Payment intents will work with real Stripe accounts");
    console.log("  - You can test the Express Dashboard functionality");
    console.log(
      "  - All previous Stripe accounts/customers have been cleaned up",
    );
  } catch (error) {
    console.error("\n❌ Stripe seeding failed:", error);
    process.exit(1);
  }
}

// Run the script
main();
