import type { SeedClient } from "@snaplet/seed";

/**
 * Creates discount codes for testing the discount system
 * Includes both percentage and fixed amount discounts with usage limits
 */
export async function createDiscountCodes(seed: SeedClient) {
  console.log("-- Creating discount codes for testing...");
  
  const { discounts } = await seed.discounts([
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
      valid_from: new Date("2024-01-01"),
      expires_at: new Date("2024-12-31"),
      minimum_order_amount: 50000, // 500 NOK in øre
    },
    {
      code: "SOMMER100",
      description: "100 kr rabatt på alle tjenester",
      discount_percentage: null,
      discount_amount: 10000, // 100 NOK in øre
      currency: "NOK",
      max_uses: 50,
      current_uses: 5,
      max_uses_per_user: 2,
      is_active: true,
      valid_from: new Date("2024-06-01"),
      expires_at: new Date("2024-08-31"),
      minimum_order_amount: 80000, // 800 NOK in øre
    },
  ]);

  return discounts;
}