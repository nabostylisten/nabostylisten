/**
 * Common booking calculation utilities
 * Ensures consistent calculations across all booking components
 */

export interface BookingItem {
  price: number;
  quantity?: number;
}

export interface TrialSession {
  price: number;
}

export interface AppliedDiscount {
  discountAmount: number;
  code: string;
  wasLimitedByMaxOrderAmount?: boolean;
  maxOrderAmountNOK?: number;
}

export interface BookingTotals {
  serviceSubtotal: number;
  trialSessionAmount: number;
  subtotalBeforeDiscount: number;
  discountAmount: number;
  finalTotal: number;
}

/**
 * Calculate booking totals with consistent logic
 */
export function calculateBookingTotals({
  items = [],
  trialSession,
  appliedDiscount,
}: {
  items?: BookingItem[];
  trialSession?: TrialSession | null;
  appliedDiscount?: AppliedDiscount | null;
}): BookingTotals {
  // Calculate service subtotal
  const serviceSubtotal = items.reduce((total, item) => {
    return total + item.price * (item.quantity || 1);
  }, 0);

  // Calculate trial session amount
  const trialSessionAmount = trialSession?.price || 0;

  // Calculate subtotal before discount
  const subtotalBeforeDiscount = serviceSubtotal + trialSessionAmount;

  // Get discount amount (already validated with max order limits)
  const discountAmount = appliedDiscount?.discountAmount || 0;

  // Calculate final total
  const finalTotal = subtotalBeforeDiscount - discountAmount;

  return {
    serviceSubtotal,
    trialSessionAmount,
    subtotalBeforeDiscount,
    discountAmount,
    finalTotal,
  };
}

/**
 * Format currency consistently across all components
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString("no-NO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " kr";
}

/**
 * Format percentage consistently
 */
export function formatPercentage(percentage: number): string {
  return percentage.toLocaleString("no-NO", {
    maximumFractionDigits: 1,
  }) + "%";
}

/**
 * Get booking breakdown for display components
 */
export function getBookingBreakdown({
  items = [],
  trialSession,
  appliedDiscount,
}: {
  items?: BookingItem[];
  trialSession?: TrialSession | null;
  appliedDiscount?: AppliedDiscount | null;
}) {
  const totals = calculateBookingTotals({ items, trialSession, appliedDiscount });

  return {
    ...totals,
    // Formatted versions for display
    formattedServiceSubtotal: formatCurrency(totals.serviceSubtotal),
    formattedTrialSessionAmount: formatCurrency(totals.trialSessionAmount),
    formattedSubtotal: formatCurrency(totals.subtotalBeforeDiscount),
    formattedDiscountAmount: formatCurrency(totals.discountAmount),
    formattedFinalTotal: formatCurrency(totals.finalTotal),
    // Display helpers
    hasDiscount: totals.discountAmount > 0,
    hasTrialSession: totals.trialSessionAmount > 0,
    savings: totals.discountAmount,
    formattedSavings: formatCurrency(totals.discountAmount),
  };
}

/**
 * Convert cart items to BookingItem format
 */
export function cartItemsToBookingItems(
  cartItems: Array<{ service: { price: number }; quantity: number }>
): BookingItem[] {
  return cartItems.map(item => ({
    price: item.service.price,
    quantity: item.quantity,
  }));
}