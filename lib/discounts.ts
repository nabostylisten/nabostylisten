/**
 * Discount calculation utilities
 */

import type { DatabaseTables } from "@/types";

type Discount = DatabaseTables["discounts"]["Row"];

/**
 * Calculate discount amount for a given discount and order amount
 * Treats maximum_order_amount as a cap for discount calculation, not a hard limit
 */
export function calculateDiscountAmount(
  discount: Discount,
  orderAmountCents: number
): number {
  let discountAmount = 0;
  let discountableAmount = orderAmountCents;
  
  // If there's a maximum order amount, cap the discountable amount
  if (discount.maximum_order_amount) {
    discountableAmount = Math.min(orderAmountCents, discount.maximum_order_amount);
  }
  
  if (discount.discount_percentage !== null) {
    discountAmount = Math.round((discountableAmount * discount.discount_percentage) / 100);
  } else if (discount.discount_amount !== null) {
    discountAmount = Math.min(discount.discount_amount, discountableAmount);
  }

  // Ensure discount doesn't exceed discountable amount
  return Math.min(discountAmount, discountableAmount);
}