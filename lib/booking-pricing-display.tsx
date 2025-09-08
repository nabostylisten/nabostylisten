import { formatCurrency } from "@/lib/booking-calculations";

// Types for the pricing data
export interface PaymentData {
  original_amount?: number;
  discount_amount?: number;
  final_amount: number;
}

export interface BookingPricingData {
  total_price: number;
  discount_applied: number;
  is_trial_session?: boolean;
}

export interface DiscountData {
  code?: string;
}

// Pricing display configuration
export interface PricingDisplayOptions {
  showDiscountCode?: boolean;
  isTrialSession?: boolean;
  trialSessionLabel?: string;
}

// Calculate pricing breakdown from available data
export function getPricingBreakdown(
  booking: BookingPricingData,
  payment?: PaymentData | null,
  discount?: DiscountData | null
) {
  // Use payment data if available (more accurate), otherwise use booking data
  const originalAmount =
    payment?.original_amount ?? booking.total_price + booking.discount_applied;
  const discountAmount = payment?.discount_amount ?? booking.discount_applied;
  const finalAmount = payment?.final_amount ?? booking.total_price;

  return {
    originalAmount,
    discountAmount,
    finalAmount,
    hasDiscount: discountAmount > 0,
    discountCode: discount?.code,
    isTrialSession: booking.is_trial_session,
  };
}

// React component for displaying pricing
export function BookingPricingDisplay({
  booking,
  payment,
  discount,
  options = {},
}: {
  booking: BookingPricingData;
  payment?: PaymentData | null;
  discount?: DiscountData | null;
  options?: PricingDisplayOptions;
}) {
  const breakdown = getPricingBreakdown(booking, payment, discount);
  const { showDiscountCode = true, isTrialSession = breakdown.isTrialSession } =
    options;

  // Special handling for trial sessions
  if (isTrialSession) {
    return (
      <span className="text-purple-700 dark:text-purple-300">
        {breakdown.finalAmount > 0 ? (
          <>
            {formatCurrency(breakdown.finalAmount)}
            <span className="text-xs ml-1">(prøvepris)</span>
          </>
        ) : (
          <span className="text-green-600 dark:text-green-400">
            Gratis prøvetime
          </span>
        )}
      </span>
    );
  }

  // Regular booking with discount
  if (breakdown.hasDiscount) {
    return (
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground line-through">
          {formatCurrency(breakdown.originalAmount)}
        </span>
        <span className="text-green-600 dark:text-green-400">
          {formatCurrency(breakdown.finalAmount)}
          <span className="text-xs ml-1">
            (-{formatCurrency(breakdown.discountAmount)})
          </span>
        </span>
        {showDiscountCode && breakdown.discountCode && (
          <span className="text-xs text-muted-foreground">
            Kode: {breakdown.discountCode}
          </span>
        )}
      </div>
    );
  }

  // Regular booking without discount
  return <span>{formatCurrency(breakdown.finalAmount)}</span>;
}

// Utility for discount info display
export function DiscountInfoDisplay({
  booking,
  payment,
  discount,
}: {
  booking: BookingPricingData;
  payment?: PaymentData | null;
  discount?: DiscountData | null;
}) {
  const breakdown = getPricingBreakdown(booking, payment, discount);

  if (!breakdown.hasDiscount || !breakdown.discountCode) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
      <span>
        Rabatt anvendt ({breakdown.discountCode}): -
        {formatCurrency(breakdown.discountAmount)}
      </span>
    </div>
  );
}
