import type {
  bookingsScalars,
  discountsScalars,
  profilesScalars,
  SeedClient,
} from "@snaplet/seed";
import { addDays, addMonths, subDays, subMonths } from "date-fns";

/**
 * Creates comprehensive discount codes for testing all edge cases
 * Includes expired, future, limited use, user-specific, and various discount types
 */
export async function createDiscountCodes(seed: SeedClient) {
  console.log(
    "-- Creating comprehensive discount codes for testing edge cases...",
  );

  const now = new Date();

  const { discounts } = await seed.discounts([
    // === ACTIVE & VALID DISCOUNTS ===

    // Standard percentage discount
    {
      code: "VELKOMMEN20",
      description: "20% rabatt for nye kunder",
      discount_percentage: 20,
      discount_amount: null,
      currency: "NOK",
      max_uses: 100,
      current_uses: 12,
      max_uses_per_user: 1,
      is_active: true,
      valid_from: subMonths(now, 3),
      expires_at: addMonths(now, 3),
      minimum_order_amount: 500, // 500 NOK
    },

    // Standard fixed amount discount
    {
      code: "SOMMER100",
      description: "100 kr rabatt på alle tjenester",
      discount_percentage: null,
      discount_amount: 100, // 100 NOK
      currency: "NOK",
      max_uses: 50,
      current_uses: 5,
      max_uses_per_user: 2,
      is_active: true,
      valid_from: subMonths(now, 2),
      expires_at: addMonths(now, 1),
      minimum_order_amount: 800, // 800 NOK
    },

    // High percentage discount with order limits
    {
      code: "VIP50",
      description: "50% rabatt for VIP kunder",
      discount_percentage: 50,
      discount_amount: null,
      currency: "NOK",
      max_uses: 10,
      current_uses: 2,
      max_uses_per_user: 3,
      is_active: true,
      valid_from: subMonths(now, 1),
      expires_at: addMonths(now, 6),
      minimum_order_amount: 1000, // 1000 NOK
      maximum_order_amount: 5000, // 5000 NOK
    },

    // Small fixed discount with no minimum
    {
      code: "PRØV50",
      description: "50 kr rabatt - ingen minimumskjøp",
      discount_percentage: null,
      discount_amount: 50, // 50 NOK
      currency: "NOK",
      max_uses: 200,
      current_uses: 45,
      max_uses_per_user: 1,
      is_active: true,
      valid_from: subDays(now, 30),
      expires_at: addDays(now, 30),
      minimum_order_amount: null,
    },

    // === EXPIRED DISCOUNTS ===

    {
      code: "EXPIRED2023",
      description: "Utgått rabattkode fra 2023",
      discount_percentage: 25,
      discount_amount: null,
      currency: "NOK",
      max_uses: 100,
      current_uses: 100, // Also maxed out
      max_uses_per_user: 1,
      is_active: true, // Still active but expired
      valid_from: new Date("2023-01-01"),
      expires_at: new Date("2023-12-31"),
      minimum_order_amount: 500,
    },

    {
      code: "OLDCAMPAIGN",
      description: "Gammel kampanje - utgått forrige måned",
      discount_percentage: null,
      discount_amount: 150, // 150 NOK
      currency: "NOK",
      max_uses: 50,
      current_uses: 35,
      max_uses_per_user: 2,
      is_active: true,
      valid_from: subMonths(now, 3),
      expires_at: subMonths(now, 1), // Expired last month
      minimum_order_amount: 700,
    },

    // === NOT YET ACTIVE DISCOUNTS ===

    {
      code: "FUTURE2025",
      description: "Fremtidig rabatt - starter neste måned",
      discount_percentage: 30,
      discount_amount: null,
      currency: "NOK",
      max_uses: 100,
      current_uses: 0,
      max_uses_per_user: 1,
      is_active: true,
      valid_from: addMonths(now, 1), // Starts next month
      expires_at: addMonths(now, 6),
      minimum_order_amount: 600,
    },

    {
      code: "NEWYEAR2025",
      description: "Nyttårskampanje - starter om 2 måneder",
      discount_percentage: null,
      discount_amount: 200, // 200 NOK
      currency: "NOK",
      max_uses: 150,
      current_uses: 0,
      max_uses_per_user: 1,
      is_active: true,
      valid_from: addMonths(now, 2),
      expires_at: addMonths(now, 4),
      minimum_order_amount: 1000,
    },

    // === INACTIVE DISCOUNTS ===

    {
      code: "INACTIVE15",
      description: "Inaktiv kode - deaktivert av admin",
      discount_percentage: 15,
      discount_amount: null,
      currency: "NOK",
      max_uses: 100,
      current_uses: 25,
      max_uses_per_user: 1,
      is_active: false, // Deactivated
      valid_from: subMonths(now, 1),
      expires_at: addMonths(now, 2),
      minimum_order_amount: 400,
    },

    // === MAXED OUT DISCOUNTS ===

    {
      code: "SOLDOUT",
      description: "Utsolgt tilbud - alle koder brukt",
      discount_percentage: 40,
      discount_amount: null,
      currency: "NOK",
      max_uses: 20,
      current_uses: 20, // Maxed out
      max_uses_per_user: 1,
      is_active: true,
      valid_from: subDays(now, 15),
      expires_at: addDays(now, 15),
      minimum_order_amount: 750,
    },

    // === UNLIMITED USE DISCOUNTS ===

    {
      code: "UNLIMITED10",
      description: "10% rabatt - ubegrenset bruk",
      discount_percentage: 10,
      discount_amount: null,
      currency: "NOK",
      max_uses: null, // Unlimited total uses
      current_uses: 532,
      max_uses_per_user: 5,
      is_active: true,
      valid_from: subMonths(now, 6),
      expires_at: null, // Never expires
      minimum_order_amount: 300,
    },

    // === MULTIPLE USE PER USER ===

    {
      code: "LOYALTY5X",
      description: "Lojalitetsrabatt - kan brukes 5 ganger per kunde",
      discount_percentage: null,
      discount_amount: 75, // 75 NOK
      currency: "NOK",
      max_uses: 500,
      current_uses: 123,
      max_uses_per_user: 5,
      is_active: true,
      valid_from: subMonths(now, 2),
      expires_at: addMonths(now, 4),
      minimum_order_amount: 500,
    },

    // === HIGH VALUE DISCOUNTS ===

    {
      code: "PREMIUM500",
      description: "500 kr rabatt på store bestillinger",
      discount_percentage: null,
      discount_amount: 500, // 500 NOK
      currency: "NOK",
      max_uses: 30,
      current_uses: 8,
      max_uses_per_user: 1,
      is_active: true,
      valid_from: subDays(now, 45),
      expires_at: addDays(now, 45),
      minimum_order_amount: 2000, // 2000 NOK minimum
    },

    // === EDGE CASE PERCENTAGES ===

    {
      code: "MINIMAL1",
      description: "Minimal rabatt - 1%",
      discount_percentage: 1,
      discount_amount: null,
      currency: "NOK",
      max_uses: 1000,
      current_uses: 250,
      max_uses_per_user: 10,
      is_active: true,
      valid_from: subMonths(now, 1),
      expires_at: addMonths(now, 12),
      minimum_order_amount: null,
    },

    {
      code: "MAXIMAL99",
      description: "Maksimal rabatt - 99%",
      discount_percentage: 99,
      discount_amount: null,
      currency: "NOK",
      max_uses: 5,
      current_uses: 1,
      max_uses_per_user: 1,
      is_active: true,
      valid_from: now,
      expires_at: addDays(now, 7),
      minimum_order_amount: 1000,
      maximum_order_amount: 1500, // Limited to prevent huge discounts
    },

    // === EXACT BOUNDARY DISCOUNTS ===

    {
      code: "TODAYONLY",
      description: "Kun gyldig i dag",
      discount_percentage: 25,
      discount_amount: null,
      currency: "NOK",
      max_uses: 50,
      current_uses: 12,
      max_uses_per_user: 1,
      is_active: true,
      valid_from: now,
      expires_at: addDays(now, 1), // Expires tomorrow
      minimum_order_amount: 600,
    },

    {
      code: "JUSTEXPIRED",
      description: "Nettopp utgått - i går",
      discount_percentage: 20,
      discount_amount: null,
      currency: "NOK",
      max_uses: 100,
      current_uses: 76,
      max_uses_per_user: 1,
      is_active: true,
      valid_from: subDays(now, 30),
      expires_at: subDays(now, 1), // Expired yesterday
      minimum_order_amount: 500,
    },

    {
      code: "STARTSTOMORROW",
      description: "Starter i morgen",
      discount_percentage: null,
      discount_amount: 125, // 125 NOK
      currency: "NOK",
      max_uses: 75,
      current_uses: 0,
      max_uses_per_user: 2,
      is_active: true,
      valid_from: addDays(now, 1), // Starts tomorrow
      expires_at: addDays(now, 31),
      minimum_order_amount: 700,
    },

    // === COMPLEX ORDER AMOUNT RESTRICTIONS ===

    {
      code: "NARROW200TO300",
      description: "Kun for bestillinger mellom 200-300 kr",
      discount_percentage: 15,
      discount_amount: null,
      currency: "NOK",
      max_uses: 100,
      current_uses: 34,
      max_uses_per_user: 3,
      is_active: true,
      valid_from: subDays(now, 10),
      expires_at: addDays(now, 20),
      minimum_order_amount: 200, // 200 NOK
      maximum_order_amount: 300, // 300 NOK
    },

    {
      code: "BIGSPENDER",
      description: "For store bestillinger over 5000 kr",
      discount_percentage: null,
      discount_amount: 1000, // 1000 NOK off
      currency: "NOK",
      max_uses: 20,
      current_uses: 3,
      max_uses_per_user: 1,
      is_active: true,
      valid_from: subMonths(now, 1),
      expires_at: addMonths(now, 3),
      minimum_order_amount: 5000, // 5000 NOK minimum
    },

    // === SPECIAL TEST CASES ===

    {
      code: "TESTCODE",
      description: "Test kode for utviklere",
      discount_percentage: 50,
      discount_amount: null,
      currency: "NOK",
      max_uses: null, // Unlimited
      current_uses: 999,
      max_uses_per_user: 100, // High limit for testing
      is_active: true,
      valid_from: subMonths(now, 12),
      expires_at: addMonths(now, 12),
      minimum_order_amount: null,
    },
  ]);

  console.log(
    `-- Created ${discounts.length} discount codes covering all edge cases`,
  );
  return discounts;
}

/**
 * Creates user-specific discount restrictions
 * Links certain discounts to specific user profiles
 */
export async function createDiscountRestrictions(
  seed: SeedClient,
  discounts: discountsScalars[],
  profiles: profilesScalars[],
) {
  console.log("-- Creating user-specific discount restrictions...");

  // Find specific discounts that should have user restrictions
  const vipDiscount = discounts.find((d) => d.code === "VIP50");
  const loyaltyDiscount = discounts.find((d) => d.code === "LOYALTY5X");
  const premiumDiscount = discounts.find((d) => d.code === "PREMIUM500");

  // Get some specific users (assuming we have at least 5 customer profiles)
  const customerProfiles = profiles.filter((p) => p.role === "customer").slice(
    0,
    5,
  );

  const restrictions = [];

  // VIP discount - only for first 2 customers
  if (vipDiscount && customerProfiles.length >= 2) {
    restrictions.push(
      {
        discount_id: vipDiscount.id,
        profile_id: customerProfiles[0].id,
      },
      {
        discount_id: vipDiscount.id,
        profile_id: customerProfiles[1].id,
      },
    );
  }

  // Loyalty discount - for customers 1-3
  if (loyaltyDiscount && customerProfiles.length >= 3) {
    for (let i = 0; i < 3; i++) {
      restrictions.push({
        discount_id: loyaltyDiscount.id,
        profile_id: customerProfiles[i].id,
      });
    }
  }

  // Premium discount - only for customer 0
  if (premiumDiscount && customerProfiles.length >= 1) {
    restrictions.push({
      discount_id: premiumDiscount.id,
      profile_id: customerProfiles[0].id,
    });
  }

  if (restrictions.length > 0) {
    await seed.discount_restrictions(restrictions);
    console.log(
      `-- Created ${restrictions.length} user-specific discount restrictions`,
    );
  }

  return restrictions;
}

/**
 * Creates discount usage records for testing
 * Simulates customers having used certain discounts
 */
export async function createDiscountUsage(
  seed: SeedClient,
  discounts: discountsScalars[],
  profiles: profilesScalars[],
  bookings: bookingsScalars[],
) {
  console.log("-- Creating discount usage records for testing...");

  const customerProfiles = profiles.filter((p) => p.role === "customer");
  const usageRecords = [];

  // Create usage records for some discounts
  const discountsWithUsage = [
    "VELKOMMEN20",
    "SOMMER100",
    "UNLIMITED10",
    "LOYALTY5X",
  ];

  for (const code of discountsWithUsage) {
    const discount = discounts.find((d) => d.code === code);
    if (!discount) continue;

    // Create 1-3 usage records per discount
    const usageCount = Math.min(3, customerProfiles.length);
    for (let i = 0; i < usageCount; i++) {
      const booking = bookings[Math.floor(Math.random() * bookings.length)];
      usageRecords.push({
        discount_id: discount.id,
        profile_id: customerProfiles[i].id,
        booking_id: booking?.id || null,
        used_at: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ), // Random date in last 30 days
      });
    }
  }

  if (usageRecords.length > 0) {
    await seed.discount_usage(usageRecords);
    console.log(`-- Created ${usageRecords.length} discount usage records`);
  }

  return usageRecords;
}
