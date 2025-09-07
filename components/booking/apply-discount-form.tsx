"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/kibo-ui/spinner";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Info, Percent, X } from "lucide-react";
import { validateDiscountOrAffiliateCode } from "@/server/discounts.actions";
import type { DatabaseTables } from "@/types";

const applyDiscountSchema = z.object({
  code: z.string().min(1, "Rabattkode er påkrevd").max(50, "Rabattkode kan ikke være lengre enn 50 tegn"),
});

type ApplyDiscountFormData = z.infer<typeof applyDiscountSchema>;

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

interface ApplyDiscountFormProps {
  orderAmountNOK: number;
  cartItems: { serviceId: string; quantity: number }[];
  onDiscountApplied: (discount: AppliedDiscount | null) => void;
  initialDiscountCode?: string;
  className?: string;
}

export function ApplyDiscountForm({
  orderAmountNOK,
  cartItems,
  onDiscountApplied,
  initialDiscountCode,
  className,
}: ApplyDiscountFormProps) {
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);

  // Validate orderAmountNOK
  if (!orderAmountNOK || isNaN(orderAmountNOK) || orderAmountNOK <= 0) {
    console.error("Invalid orderAmountNOK passed to ApplyDiscountForm:", orderAmountNOK);
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Rabattkode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Rabatt- og partnerkoder er ikke tilgjengelige for øyeblikket.
          </p>
        </CardContent>
      </Card>
    );
  }

  const form = useForm<ApplyDiscountFormData>({
    resolver: zodResolver(applyDiscountSchema),
    defaultValues: {
      code: initialDiscountCode || "",
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (data: ApplyDiscountFormData) => {
      if (!orderAmountNOK || isNaN(orderAmountNOK)) {
        throw new Error(`Invalid order amount: ${orderAmountNOK}`);
      }
      
      const result = await validateDiscountOrAffiliateCode({
        code: data.code.trim(),
        orderAmountNOK,
        cartItems,
      });
      return result;
    },
    onSuccess: (result) => {
      if (result.isValid && result.discountAmount > 0) {
        const discountData: AppliedDiscount = {
          type: result.type,
          discount: result.discount,
          affiliateInfo: result.affiliateInfo,
          discountAmount: result.discountAmount,
          code: result.type === 'discount' && result.discount 
            ? result.discount.code 
            : result.affiliateInfo?.affiliateCode || '',
          wasLimitedByMaxOrderAmount: result.wasLimitedByMaxOrderAmount,
          maxOrderAmountNOK: result.maxOrderAmountNOK,
          originalOrderAmountNOK: result.originalOrderAmountNOK,
        };
        setAppliedDiscount(discountData);
        onDiscountApplied(discountData);
        
        if (result.type === 'affiliate') {
          toast.success(`Partnerkode aktivert! Du får 10% rabatt fra ${result.affiliateInfo?.stylistName}`);
        } else {
          toast.success("Rabattkode aktivert!");
        }
      } else {
        toast.error(result.error || "Ugyldig rabatt- eller partnerkode");
      }
    },
    onError: (error) => {
      console.error("Error validating discount:", error);
      toast.error("Kunne ikke validere koden");
    },
  });

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    onDiscountApplied(null);
    form.reset();
    toast.success("Rabattkode fjernet");
  };

  const handleSubmit = (data: ApplyDiscountFormData) => {
    validateMutation.mutate(data);
  };

  const formatCurrency = (amountNOK: number) => {
    // Handle NaN and invalid numbers
    if (!amountNOK || isNaN(amountNOK)) {
      console.warn("Invalid amount in formatCurrency:", amountNOK);
      return "0 kr";
    }
    return amountNOK.toLocaleString('no-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " kr";
  };

  const formatPercentage = (percentage: number) => {
    return percentage.toLocaleString('no-NO', { 
      maximumFractionDigits: 1 
    }) + "%";
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="w-5 h-5" />
          Rabatt- eller partnerkode
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {appliedDiscount ? (
          // Show applied discount
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    {appliedDiscount.type === 'affiliate' 
                      ? `Partnerkode aktivert: ${appliedDiscount.code}`
                      : `Rabattkode aktivert: ${appliedDiscount.code}`
                    }
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    {appliedDiscount.type === 'affiliate' 
                      ? `10% rabatt på tjenester fra ${appliedDiscount.affiliateInfo?.stylistName}`
                      : appliedDiscount.discount?.description
                    }
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveDiscount}
                className="text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rabatt:</span>
              <div className="flex items-center gap-2">
                {appliedDiscount.type === 'affiliate' ? (
                  <Badge variant="secondary">
                    10%
                  </Badge>
                ) : appliedDiscount.discount?.discount_percentage !== null ? (
                  <Badge variant="secondary">
                    {formatPercentage(appliedDiscount.discount.discount_percentage)}
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    {formatCurrency(appliedDiscount.discount?.discount_amount || 0)}
                  </Badge>
                )}
                <span className="font-medium text-green-600 dark:text-green-400">
                  -{formatCurrency(appliedDiscount.discountAmount)}
                </span>
              </div>
            </div>

            {/* Maximum order amount feedback */}
            {appliedDiscount.wasLimitedByMaxOrderAmount && appliedDiscount.maxOrderAmountNOK && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium">Rabattgrense nådd</p>
                  <p>
                    Denne rabattkoden gjelder kun for bestillinger opp til {formatCurrency(appliedDiscount.maxOrderAmountNOK)}.
                    Rabatten beregnes derfor kun på {formatCurrency(appliedDiscount.maxOrderAmountNOK)} av den totale ordresummen.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Show discount form
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Har du en rabatt- eller partnerkode? (valgfritt)
                    </FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="Skriv inn rabatt- eller partnerkode..."
                          {...field}
                          value={field.value.toUpperCase()}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <Button
                        type="submit"
                        disabled={validateMutation.isPending || !field.value.trim()}
                      >
                        {validateMutation.isPending && (
                          <Spinner className="w-4 h-4 mr-2" />
                        )}
                        Aktiver
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        )}

        {/* Order amount info */}
        <div className="pt-2 border-t text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Ordrebeløp:</span>
            <span>{formatCurrency(orderAmountNOK)}</span>
          </div>
          {appliedDiscount && (
            <>
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Rabatt:</span>
                <span>-{formatCurrency(appliedDiscount.discountAmount)}</span>
              </div>
              <div className="flex justify-between font-medium text-base text-foreground border-t pt-2 mt-2">
                <span>Totalt:</span>
                <span>{formatCurrency(orderAmountNOK - appliedDiscount.discountAmount)}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}