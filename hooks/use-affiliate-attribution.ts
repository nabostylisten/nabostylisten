"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { checkAffiliateDiscount } from "@/server/affiliate/checkout.actions";
import { validateAffiliateCode, transferCookieToDatabase } from "@/server/affiliate/attribution.actions";

interface CartItem {
  serviceId: string;
  quantity: number;
}

interface AffiliateDiscountInfo {
  code: string;
  stylist_id: string;
  stylist_name: string;
  applicable_service_ids: string[];
  discount_amount: number;
  commission_percentage: number;
  attribution: {
    code: string;
    attributed_at: string;
    expires_at: string;
    original_user_id?: string;
  };
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
    queryFn: async () => {
      if (!userId || cartItems.length === 0) return null;
      
      // Convert cart items to the format expected by checkAffiliateDiscount
      const cart = {
        services: cartItems.map(item => ({
          id: item.serviceId,
          stylist_id: "", // Will be filled by the server action
          price: 0 // Will be filled by the server action
        })),
        userId
      };
      
      return await checkAffiliateDiscount({ cart, userId });
    },
    enabled: enabled && cartItems.length > 0 && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  // Mutation to store attribution when user logs in
  const storeAttributionMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      transferCookieToDatabase(userId),
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
    mutationFn: (code: string) => validateAffiliateCode(code),
    onSuccess: (result) => {
      setManualCodeError(null);
      if (!result.success) {
        const errorMsg = result.error || "Ugyldig partnerkode";
        setManualCodeError(errorMsg);
        toast.error(errorMsg);
      } else if (result.success) {
        toast.success(`Partnerkode ${result.code} er gyldig!`);
        // Refetch to get updated discount info
        refetch();
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

  const discount = affiliateInfo || null;
  const hasError = !!error;

  // Helper function to submit manual affiliate code
  const submitManualCode = useCallback((code: string) => {
    setManualCodeError(null);
    validateCodeMutation.mutate(code);
  }, [validateCodeMutation]);

  // Helper function to check if discount can be applied
  const canApplyDiscount = useCallback(() => {
    return discount && discount.applicable_service_ids.length > 0;
  }, [discount]);

  // Helper function to get attribution status
  const getAttributionStatus = useCallback(() => {
    if (!discount) return "none";
    if (discount.applicable_service_ids.length === 0) return "no-applicable-services";
    return "auto-applicable";
  }, [discount]);

  // Helper function to get savings summary
  const getSavingsSummary = useCallback(() => {
    if (!discount) {
      return { discountAmount: 0, originalTotal: 0, newTotal: 0 };
    }

    // For now, we'll use the discount amount from the server
    // In a full implementation, you'd calculate the original total from cart items
    return {
      discountAmount: discount.discount_amount,
      originalTotal: discount.discount_amount, // Simplified
      newTotal: 0
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
    hasValidAttribution: !!discount,
    canAutoApply: canApplyDiscount(),
    discountAmount: discount?.discount_amount || 0,
    stylistName: discount?.stylist_name,
    affiliateCode: discount?.code,
    applicableServices: [] // Would need to be populated with service details
  };
}

// Helper hook for pages that don't have cart items but want to check attribution status
export function useAffiliateAttributionStatus(userId?: string) {
  return useQuery({
    queryKey: ["affiliate-attribution-status", userId],
    queryFn: async () => {
      if (!userId) return null;
      const cart = { services: [], userId };
      return await checkAffiliateDiscount({ cart, userId });
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1
  });
}

// Types for external use
export type { AffiliateDiscountInfo, CartItem };