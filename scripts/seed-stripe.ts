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

// Helper function for exponential backoff with jitter for rate limiting
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Only retry on rate limit errors (429) and lock timeout errors
      const isRateLimit = error.statusCode === 429;
      const isLastAttempt = attempt === maxRetries;

      if (!isRateLimit || isLastAttempt) {
        throw error;
      }

      // Calculate exponential backoff with jitter
      const exponentialDelay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
      const delay = exponentialDelay + jitter;

      console.log(
        `    ⏳ Rate limited, retrying in ${Math.round(delay)}ms (attempt ${
          attempt + 1
        }/${maxRetries + 1})`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Should not reach here");
}

// Helper function to process items in batches to avoid hitting concurrency limits
async function processBatches<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize = 10,
  delayBetweenBatches = 100,
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(
      `    📦 Processing batch ${Math.floor(i / batchSize) + 1}/${
        Math.ceil(items.length / batchSize)
      } (${batch.length} items)`,
    );

    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);

    // Small delay between batches to avoid overwhelming the API
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
}

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

async function deleteAllStripeAccounts() {
  console.log("\n🗑️  Flushing all Stripe connected accounts...");

  try {
    let totalAccountsDeleted = 0;
    let totalAccountsCleared = 0;
    let hasMoreAccounts = true;
    let startingAfter: string | undefined;

    while (hasMoreAccounts) {
      // List accounts with pagination using Stripe SDK with retry logic
      const listParams: { limit: number; starting_after?: string } = {
        limit: 100,
      };
      if (startingAfter) {
        listParams.starting_after = startingAfter;
      }

      const accounts = await retryWithBackoff(() =>
        stripe.accounts.list(listParams)
      );

      if (!accounts.data || accounts.data.length === 0) {
        console.log("ℹ️  No more Stripe connected accounts found");
        break;
      }

      console.log(
        `📋 Found ${accounts.data.length} Stripe connected accounts to delete (batch)`,
      );

      // Store the pagination cursor BEFORE deleting accounts
      const nextCursor = accounts.data.length > 0
        ? accounts.data[accounts.data.length - 1].id
        : undefined;

      // Delete accounts in batches to respect rate limits
      const results = await processBatches(accounts.data, async (account) => {
        console.log(
          `  🗑️  Deleting account: ${account.id}`,
        );

        try {
          // Delete the account from Stripe with retry logic
          const deleted = await retryWithBackoff(() =>
            stripe.accounts.del(account.id)
          );
          console.log(
            `    ✅ Stripe deletion result for ${account.id}: ${
              deleted.deleted ? "deleted" : "failed"
            }`,
          );

          const stripeDeleted = deleted.deleted;

          // Clear from database - find any stylist_details with this account ID
          const { error: updateError } = await supabase
            .from("stylist_details")
            .update({ stripe_account_id: null })
            .eq("stripe_account_id", account.id);

          if (updateError) {
            console.log(
              `    ⚠️  Database clear warning for ${account.id}: ${updateError.message}`,
            );
          } else {
            console.log(
              `    ✅ Cleared account ID ${account.id} from database`,
            );
          }

          return {
            stripeDeleted,
            databaseCleared: !updateError,
            accountId: account.id,
          };

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (stripeError: any) {
          console.log(`    ⚠️  Stripe error details for ${account.id}:`, {
            type: stripeError.type,
            code: stripeError.code,
            message: stripeError.message,
          });

          // Account might already be deleted or doesn't exist
          if (
            stripeError.type === "StripeInvalidRequestError" &&
            (stripeError.message?.includes("No such account") ||
              stripeError.code === "resource_missing")
          ) {
            console.log(
              `    ℹ️  Account ${account.id} doesn't exist in Stripe anymore`,
            );
          } else {
            console.error(
              `    ❌ Failed to delete Stripe account ${account.id}: ${stripeError.message}`,
            );
          }

          // Still try to clear from database
          const { error: updateError } = await supabase
            .from("stylist_details")
            .update({ stripe_account_id: null })
            .eq("stripe_account_id", account.id);

          if (!updateError) {
            console.log(
              `    ✅ Cleared account ID ${account.id} from database`,
            );
          } else {
            console.log(
              `    ⚠️  Database clear warning for ${account.id}: ${updateError.message}`,
            );
          }

          return {
            stripeDeleted: false,
            databaseCleared: !updateError,
            accountId: account.id,
          };
        }
      });

      const batchAccountsDeleted = results.filter((r) =>
        r.stripeDeleted
      ).length;
      const batchAccountsCleared = results.filter((r) =>
        r.databaseCleared
      ).length;

      totalAccountsDeleted += batchAccountsDeleted;
      totalAccountsCleared += batchAccountsCleared;

      console.log(
        `    📊 Batch complete: ${batchAccountsDeleted} deleted, ${batchAccountsCleared} cleared from DB`,
      );

      // Check if there are more accounts to fetch
      hasMoreAccounts = accounts.has_more;
      if (hasMoreAccounts && nextCursor) {
        startingAfter = nextCursor;
        console.log(
          `    ➡️  Fetching next batch (starting after: ${startingAfter})`,
        );
      }
    }

    // Also clear any remaining database references to ensure clean state
    const { error: clearAllError } = await supabase
      .from("stylist_details")
      .update({ stripe_account_id: null })
      .not("stripe_account_id", "is", null);

    if (clearAllError) {
      console.log(
        `    ⚠️  Failed to clear remaining database references: ${clearAllError.message}`,
      );
    } else {
      console.log(
        `    ✅ Cleared all remaining account references from database`,
      );
    }

    console.log(`  🎯 TOTAL: Deleted ${totalAccountsDeleted} Stripe accounts`);
    console.log(
      `  🎯 TOTAL: Cleared ${totalAccountsCleared} database references`,
    );
  } catch (error) {
    console.error("❌ Unexpected error in deleteAllStripeAccounts:", error);
  }
}

async function deleteAllStripeCustomers() {
  console.log("\n🗑️  Flushing all Stripe customers...");

  try {
    let totalCustomersDeleted = 0;
    let totalCustomersCleared = 0;
    let hasMoreCustomers = true;
    let startingAfter: string | undefined;

    while (hasMoreCustomers) {
      // List customers with pagination using Stripe SDK with retry logic
      const listParams: { limit: number; starting_after?: string } = {
        limit: 100,
      };
      if (startingAfter) {
        listParams.starting_after = startingAfter;
      }

      const customers = await retryWithBackoff(() =>
        stripe.customers.list(listParams)
      );

      if (!customers.data || customers.data.length === 0) {
        console.log("ℹ️  No more Stripe customers found");
        break;
      }

      // Filter out already deleted customers
      const activeCustomers = customers.data.filter((customer) =>
        !customer.deleted
      );

      if (activeCustomers.length === 0) {
        console.log("ℹ️  All customers in this batch are already deleted");
        // Still need to check if there are more pages
        hasMoreCustomers = customers.has_more;
        if (hasMoreCustomers && customers.data.length > 0) {
          startingAfter = customers.data[customers.data.length - 1].id;
          console.log(
            `    ➡️  Fetching next batch (starting after: ${startingAfter}) - skipping deleted customers`,
          );
          continue;
        } else {
          break;
        }
      }

      console.log(
        `📋 Found ${activeCustomers.length} active Stripe customers to delete (batch of ${customers.data.length} total)`,
      );

      // Store the pagination cursor BEFORE deleting customers
      const nextCursor = customers.data.length > 0
        ? customers.data[customers.data.length - 1].id
        : undefined;

      // Delete customers in batches to respect rate limits
      const results = await processBatches(
        activeCustomers,
        async (customer) => {
          console.log(
            `  🗑️  Deleting customer: ${customer.id} (${
              customer.email || "no email"
            })`,
          );

          try {
            // Delete the customer from Stripe with retry logic
            const deleted = await retryWithBackoff(() =>
              stripe.customers.del(customer.id)
            );
            console.log(
              `    ✅ Stripe deletion result for ${customer.id}: ${
                deleted.deleted ? "deleted" : "failed"
              }`,
            );

            const stripeDeleted = deleted.deleted;

            // Clear from database - find any profiles with this customer ID
            const { error: updateError } = await supabase
              .from("profiles")
              .update({ stripe_customer_id: null })
              .eq("stripe_customer_id", customer.id);

            if (updateError) {
              console.log(
                `    ⚠️  Database clear warning for ${customer.id}: ${updateError.message}`,
              );
            } else {
              console.log(
                `    ✅ Cleared customer ID ${customer.id} from database`,
              );
            }

            return {
              stripeDeleted,
              databaseCleared: !updateError,
              customerId: customer.id,
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (stripeError: any) {
            console.log(`    ⚠️  Stripe error details for ${customer.id}:`, {
              type: stripeError.type,
              code: stripeError.code,
              message: stripeError.message,
            });

            // Customer might already be deleted or doesn't exist
            if (
              stripeError.type === "StripeInvalidRequestError" &&
              (stripeError.message?.includes("No such customer") ||
                stripeError.code === "resource_missing")
            ) {
              console.log(
                `    ℹ️  Customer ${customer.id} doesn't exist in Stripe anymore`,
              );
            } else {
              console.error(
                `    ❌ Failed to delete Stripe customer ${customer.id}: ${stripeError.message}`,
              );
            }

            // Still try to clear from database
            const { error: updateError } = await supabase
              .from("profiles")
              .update({ stripe_customer_id: null })
              .eq("stripe_customer_id", customer.id);

            if (!updateError) {
              console.log(
                `    ✅ Cleared customer ID ${customer.id} from database`,
              );
            } else {
              console.log(
                `    ⚠️  Database clear warning for ${customer.id}: ${updateError.message}`,
              );
            }

            return {
              stripeDeleted: false,
              databaseCleared: !updateError,
              customerId: customer.id,
            };
          }
        },
      );

      const batchCustomersDeleted = results.filter((r) =>
        r.stripeDeleted
      ).length;
      const batchCustomersCleared = results.filter((r) =>
        r.databaseCleared
      ).length;

      totalCustomersDeleted += batchCustomersDeleted;
      totalCustomersCleared += batchCustomersCleared;

      console.log(
        `    📊 Batch complete: ${batchCustomersDeleted} deleted, ${batchCustomersCleared} cleared from DB`,
      );

      // Check if there are more customers to fetch
      hasMoreCustomers = customers.has_more;
      if (hasMoreCustomers && nextCursor) {
        startingAfter = nextCursor;
        console.log(
          `    ➡️  Fetching next batch (starting after: ${startingAfter})`,
        );
      }
    }

    // Also clear any remaining database references to ensure clean state
    const { error: clearAllError } = await supabase
      .from("profiles")
      .update({ stripe_customer_id: null })
      .not("stripe_customer_id", "is", null);

    if (clearAllError) {
      console.log(
        `    ⚠️  Failed to clear remaining database references: ${clearAllError.message}`,
      );
    } else {
      console.log(
        `    ✅ Cleared all remaining customer references from database`,
      );
    }

    console.log(
      `  🎯 TOTAL: Deleted ${totalCustomersDeleted} Stripe customers`,
    );
    console.log(
      `  🎯 TOTAL: Cleared ${totalCustomersCleared} database references`,
    );
  } catch (error) {
    console.error("❌ Unexpected error in deleteAllStripeCustomers:", error);
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
    await deleteAllStripeAccounts();
    await deleteAllStripeCustomers();

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
