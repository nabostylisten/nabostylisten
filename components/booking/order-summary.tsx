"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Info, Percent, Tag } from "lucide-react";
import type { DatabaseTables } from "@/types";
import { 
  cartItemsToBookingItems, 
  getBookingBreakdown, 
  formatCurrency, 
  formatPercentage 
} from "@/lib/booking-calculations";

interface CartItem {
  service: {
    id: string;
    title: string;
    price: number;
    currency: string;
  };
  quantity: number;
}

interface AppliedDiscount {
  type: 'discount' | 'affiliate';
  discount?: DatabaseTables["discounts"]["Row"];
  affiliateInfo?: {
    stylistId: string;
    stylistName: string;
    affiliateCode: string;
    commissionPercentage: number;
  };
  discountAmount: number;
  code: string;
  wasLimitedByMaxOrderAmount?: boolean;
  maxOrderAmountNOK?: number;
  originalOrderAmountNOK?: number;
}

interface TrialSessionInfo {
  price: number;
  currency: string;
  title: string;
}

interface OrderSummaryProps {
  items: CartItem[];
  appliedDiscount?: AppliedDiscount | null;
  trialSession?: TrialSessionInfo | null;
  className?: string;
}

export function OrderSummary({
  items,
  appliedDiscount,
  trialSession,
  className,
}: OrderSummaryProps) {
  // Convert cart items to booking items format and get calculated breakdown
  const bookingItems = cartItemsToBookingItems(items);
  const trialSessionData = trialSession ? { price: trialSession.price } : null;
  const appliedDiscountData = appliedDiscount ? {
    discountAmount: appliedDiscount.discountAmount,
    code: appliedDiscount.code,
    wasLimitedByMaxOrderAmount: appliedDiscount.wasLimitedByMaxOrderAmount,
    maxOrderAmountNOK: appliedDiscount.maxOrderAmountNOK,
  } : null;

  const breakdown = getBookingBreakdown({
    items: bookingItems,
    trialSession: trialSessionData,
    appliedDiscount: appliedDiscountData,
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Bestillingssammendrag</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Line items */}
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.service.id} className="flex justify-between text-sm">
              <span>
                {item.service.title}
                {item.quantity > 1 && ` x${item.quantity}`}
              </span>
              <span>{formatCurrency(item.service.price * item.quantity)}</span>
            </div>
          ))}

          {/* Trial session line item */}
          {trialSession && (
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <span>Prøvetime</span>
              </span>
              <span>{formatCurrency(trialSession.price)}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{breakdown.formattedSubtotal}</span>
        </div>

        {/* Applied discount */}
        {appliedDiscount && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Tag className="w-3 h-3 text-green-600" />
                <span className="text-green-600">
                  {appliedDiscount.type === 'affiliate' 
                    ? `Partnerkode: ${appliedDiscount.code}` 
                    : `Rabattkode: ${appliedDiscount.code}`
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                {appliedDiscount.type === 'affiliate' ? (
                  <Badge variant="outline" className="text-xs">
                    10%
                  </Badge>
                ) : appliedDiscount.discount?.discount_percentage !== null ? (
                  <Badge variant="outline" className="text-xs">
                    {formatPercentage(
                      appliedDiscount.discount.discount_percentage
                    )}
                  </Badge>
                ) : null}
                <span className="text-green-600 font-medium">
                  -{breakdown.formattedDiscountAmount}
                </span>
              </div>
            </div>
            {appliedDiscount.type === 'affiliate' ? (
              <p className="text-xs text-muted-foreground pl-5">
                10% rabatt på tjenester fra {appliedDiscount.affiliateInfo?.stylistName}
              </p>
            ) : appliedDiscount.discount?.description ? (
              <p className="text-xs text-muted-foreground pl-5">
                {appliedDiscount.discount.description}
              </p>
            ) : null}
            {/* Maximum order amount feedback */}
            {appliedDiscount.wasLimitedByMaxOrderAmount && appliedDiscount.maxOrderAmountNOK && (
              <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs border border-blue-200 dark:border-blue-800">
                <Info className="w-3 h-3 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-blue-800 dark:text-blue-200">
                  <span className="font-medium">Rabattgrense:</span> Denne rabatten gjelder kun for bestillinger opp til {formatCurrency(appliedDiscount.maxOrderAmountNOK)}.
                </p>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Total */}
        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>{breakdown.formattedFinalTotal}</span>
        </div>

        {/* Savings indicator */}
        {appliedDiscount && breakdown.discountAmount > 0 && (
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <Percent className="w-4 h-4" />
              <span className="text-sm font-medium">
                Du sparer {breakdown.formattedDiscountAmount}!
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
