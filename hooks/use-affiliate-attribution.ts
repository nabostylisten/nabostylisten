"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { checkAffiliateDiscount, validateManualAffiliateCode } from "@/server/affiliate/affiliate-checkout.actions";
import { storeUserAttribution } from "@/server/affiliate/affiliate-attribution.actions";

interface CartItem {
  serviceId: string;
  quantity: number;
}

interface AffiliateDiscountInfo {
  hasAffiliateAttribution: boolean;
  affiliateCode?: string;
  stylistName?: string;
  stylistId?: string;
  applicableServices: any[];
  discountAmount: number;
  commissionAmount: number;
  isAutoApplicable: boolean;
}

interface UseAffiliateAttributionProps {
  cartItems: CartItem[];
  userId?: string;
  enabled?: boolean;
}

export function useAffiliateAttribution({
  cartItems,
  userId,
  enabled = true
}: UseAffiliateAttributionProps) {
  const queryClient = useQueryClient();
  const [manualCodeError, setManualCodeError] = useState<string | null>(null);

  // Query to check for existing affiliate attribution and applicable discounts
  const {
    data: affiliateInfo,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["affiliate-discount", cartItems, userId],
    queryFn: () => checkAffiliateDiscount(cartItems, userId),
    enabled: enabled && cartItems.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  // Mutation to store attribution when user logs in
  const storeAttributionMutation = useMutation({
    mutationFn: ({ userId, sessionId }: { userId: string; sessionId?: string }) =>
      storeUserAttribution(userId, sessionId),
    onSuccess: () => {
      // Refetch affiliate discount info after storing attribution
      refetch();
    },
    onError: (error) => {
      console.error("Failed to store affiliate attribution:", error);
    }
  });

  // Mutation to validate manually entered affiliate codes
  const validateCodeMutation = useMutation({
    mutationFn: (code: string) => validateManualAffiliateCode(code, cartItems),
    onSuccess: (result) => {
      setManualCodeError(null);
      if (result.error) {
        setManualCodeError(result.error);
        toast.error(result.error);
      } else if (result.data) {
        toast.success(`Partnerkode ${result.data.affiliateCode} er gyldig!`);
        // Update the query cache with the new affiliate info
        queryClient.setQueryData(
          ["affiliate-discount", cartItems, userId],
          { data: result.data, error: null }
        );
      }
    },
    onError: () => {
      const errorMessage = "Kunne ikke validere partnerkode";
      setManualCodeError(errorMessage);
      toast.error(errorMessage);
    }
  });

  // Store attribution when user ID changes (user logs in)
  useEffect(() => {
    if (userId && !storeAttributionMutation.isPending) {
      storeAttributionMutation.mutate({ userId });
    }
  }, [userId]);

  // Clear manual code error when cart changes
  useEffect(() => {
    setManualCodeError(null);
  }, [cartItems]);

  const discount = affiliateInfo?.data || null;
  const hasError = error || affiliateInfo?.error;

  // Helper function to submit manual affiliate code
  const submitManualCode = useCallback((code: string) => {
    setManualCodeError(null);
    validateCodeMutation.mutate(code);
  }, [validateCodeMutation]);

  // Helper function to check if discount can be applied
  const canApplyDiscount = useCallback(() => {
    return discount?.hasAffiliateAttribution && 
           discount?.isAutoApplicable && 
           discount?.applicableServices.length > 0;
  }, [discount]);

  // Helper function to get attribution status
  const getAttributionStatus = useCallback(() => {
    if (!discount) return "none";
    if (!discount.hasAffiliateAttribution) return "none";
    if (discount.applicableServices.length === 0) return "no-applicable-services";
    if (discount.isAutoApplicable) return "auto-applicable";
    return "manual-code-valid";
  }, [discount]);

  // Helper function to get savings summary
  const getSavingsSummary = useCallback(() => {
    if (!discount || !discount.isAutoApplicable) {
      return { discountAmount: 0, originalTotal: 0, newTotal: 0 };
    }

    const originalTotal = discount.applicableServices.reduce(
      (sum, service) => sum + (Number(service.price) * (cartItems.find(item => item.serviceId === service.id)?.quantity || 1)),
      0
    );

    return {
      discountAmount: discount.discountAmount,
      originalTotal,
      newTotal: originalTotal - discount.discountAmount
    };
  }, [discount, cartItems]);

  return {
    // Data
    discount,
    affiliateInfo: discount,
    
    // Loading states
    isLoading,
    isValidatingCode: validateCodeMutation.isPending,
    isStoringAttribution: storeAttributionMutation.isPending,
    
    // Error states
    error: hasError,
    manualCodeError,
    
    // Actions
    submitManualCode,
    refetch,
    
    // Helper functions
    canApplyDiscount,
    getAttributionStatus,
    getSavingsSummary,
    
    // Computed values
    hasValidAttribution: discount?.hasAffiliateAttribution || false,
    canAutoApply: canApplyDiscount(),
    discountAmount: discount?.discountAmount || 0,
    stylistName: discount?.stylistName,
    affiliateCode: discount?.affiliateCode,
    applicableServices: discount?.applicableServices || []
  };
}

// Helper hook for pages that don't have cart items but want to check attribution status
export function useAffiliateAttributionStatus(userId?: string) {
  return useQuery({
    queryKey: ["affiliate-attribution-status", userId],
    queryFn: () => checkAffiliateDiscount([], userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1
  });
}

// Types for external use
export type { AffiliateDiscountInfo, CartItem };