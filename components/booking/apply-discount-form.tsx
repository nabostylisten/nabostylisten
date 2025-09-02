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
import { CheckCircle, Percent, X } from "lucide-react";
import { validateDiscountCode } from "@/server/discounts.actions";
import type { DatabaseTables } from "@/types";

const applyDiscountSchema = z.object({
  code: z.string().min(1, "Rabattkode er påkrevd").max(50, "Rabattkode kan ikke være lengre enn 50 tegn"),
});

type ApplyDiscountFormData = z.infer<typeof applyDiscountSchema>;

interface AppliedDiscount {
  discount: DatabaseTables["discounts"]["Row"];
  discountAmount: number;
  code: string;
}

interface ApplyDiscountFormProps {
  orderAmountNOK: number;
  onDiscountApplied: (discount: AppliedDiscount | null) => void;
  initialDiscountCode?: string;
  className?: string;
}

export function ApplyDiscountForm({
  orderAmountNOK,
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
            Rabattkoder er ikke tilgjengelige for øyeblikket.
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
      console.log("Validating discount with orderAmountNOK:", orderAmountNOK);
      
      if (!orderAmountNOK || isNaN(orderAmountNOK)) {
        throw new Error(`Invalid order amount: ${orderAmountNOK}`);
      }
      
      const result = await validateDiscountCode({
        code: data.code.trim(),
        orderAmountNOK,
      });
      return result;
    },
    onSuccess: (result) => {
      if (result.isValid && result.discount && result.discountAmount !== undefined) {
        const discountData = {
          discount: result.discount,
          discountAmount: result.discountAmount, // Already in NOK
          code: result.discount.code,
        };
        setAppliedDiscount(discountData);
        onDiscountApplied(discountData);
        toast.success("Rabattkode aktivert!");
      } else {
        toast.error(result.error || "Ugyldig rabattkode");
      }
    },
    onError: (error) => {
      console.error("Error validating discount:", error);
      toast.error("Kunne ikke validere rabattkode");
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
          Rabattkode
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
                    Rabattkode aktivert: {appliedDiscount.code}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    {appliedDiscount.discount.description}
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
                {appliedDiscount.discount.discount_percentage !== null ? (
                  <Badge variant="secondary">
                    {formatPercentage(appliedDiscount.discount.discount_percentage)}
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    {formatCurrency(appliedDiscount.discount.discount_amount || 0)}
                  </Badge>
                )}
                <span className="font-medium text-green-600 dark:text-green-400">
                  -{formatCurrency(appliedDiscount.discountAmount)}
                </span>
              </div>
            </div>
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
                      Har du en rabattkode? (valgfritt)
                    </FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="Skriv inn rabattkode..."
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