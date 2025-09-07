"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  checkAffiliateDiscount,
  validateManualAffiliateCode,
} from "@/server/affiliate/affiliate-checkout.actions";
import { transferCookieToDatabase } from "@/server/affiliate/affiliate-attribution.actions";

interface CartItem {
  serviceId: string;
  quantity: number;
}

interface AffiliateDiscountInfo {
  hasAffiliateAttribution: boolean;
  affiliateCode?: string;
  stylistName?: string;
  stylistId?: string;
  applicableServices: Array<{
    id: string;
    title: string;
    price: number;
    stylist_id: string;
  }>;
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
  enabled = true,
}: UseAffiliateAttributionProps) {
  const [manualCodeError, setManualCodeError] = useState<string | null>(null);
  const [hasAttemptedTransfer, setHasAttemptedTransfer] = useState<
    string | null
  >(null);

  // Query to check for existing affiliate attribution and applicable discounts
  const {
    data: affiliateInfo,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["affiliate-discount", cartItems, userId],
    queryFn: async () => {
      console.log("🔍 AFFILIATE HOOK - Starting query:", { cartItems, userId, enabled });
      
      if (cartItems.length === 0) {
        console.log("🔍 AFFILIATE HOOK - No cart items, returning null");
        return null;
      }

      console.log("🔍 AFFILIATE HOOK - Calling checkAffiliateDiscount");
      const result = await checkAffiliateDiscount(cartItems, userId);
      
      console.log("🔍 AFFILIATE HOOK - checkAffiliateDiscount result:", result);
      
      return result.data;
    },
    enabled: enabled && cartItems.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Mutation to store attribution when user logs in
  const storeAttributionMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      transferCookieToDatabase(userId),
    onSuccess: (result) => {
      console.log("✅ Attribution transfer result:", result);
      // Mark this user as having attempted transfer
      setHasAttemptedTransfer(userId ?? null);
      // Refetch affiliate discount info after storing attribution
      refetch();
    },
    onError: (error) => {
      console.error("Failed to store affiliate attribution:", error);
      // Still mark as attempted to prevent infinite retries
      setHasAttemptedTransfer(userId ?? null);
    },
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
        // Refetch to get updated discount info
        refetch();
      }
    },
    onError: () => {
      const errorMessage = "Kunne ikke validere partnerkode";
      setManualCodeError(errorMessage);
      toast.error(errorMessage);
    },
  });

  // Check if there's an affiliate attribution cookie before attempting transfer
  const hasAffiliateAttributionCookie = useCallback(() => {
    if (typeof document === "undefined") return false;
    return document.cookie.includes("affiliate_attribution=");
  }, []);

  // Stabilize the transfer function to prevent infinite re-renders
  const triggerTransfer = useCallback((userId: string) => {
    if (
      !storeAttributionMutation.isPending && hasAttemptedTransfer !== userId
    ) {
      // Only attempt transfer if there's actually a cookie to transfer
      if (hasAffiliateAttributionCookie()) {
        console.log(
          "🔄 Attempting to transfer affiliate attribution for user:",
          userId,
        );
        storeAttributionMutation.mutate({ userId });
      } else {
        console.log(
          "🔄 No affiliate attribution cookie found, skipping transfer for user:",
          userId,
        );
        // Mark as attempted to prevent future checks
        setHasAttemptedTransfer(userId);
      }
    }
  }, [
    hasAttemptedTransfer,
    storeAttributionMutation,
    hasAffiliateAttributionCookie,
  ]);

  // Store attribution when user ID changes (user logs in)
  useEffect(() => {
    if (userId) {
      triggerTransfer(userId);
    }
  }, [userId, triggerTransfer]);

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
    if (!discount || !discount.applicableServices || discount.applicableServices.length === 0) {
      return false;
    }
    
    // CRITICAL FIX: For auto-apply to be enabled, ALL cart services must be from the affiliate stylist
    // We cannot auto-apply when cart contains services from multiple stylists
    const allCartServicesFromAffiliateStylist = cartItems.every(cartItem => {
      const applicableService = discount.applicableServices.find(
        service => service.id === cartItem.serviceId
      );
      return !!applicableService;
    });
    
    return allCartServicesFromAffiliateStylist;
  }, [discount, cartItems]);

  // Helper function to get attribution status
  const getAttributionStatus = useCallback(() => {
    if (!discount) return "none";
    if (
      !discount.applicableServices || discount.applicableServices.length === 0
    ) return "no-applicable-services";
    return "auto-applicable";
  }, [discount]);

  // Helper function to get savings summary
  const getSavingsSummary = useCallback(() => {
    if (!discount) {
      return { discountAmount: 0, originalTotal: 0, newTotal: 0 };
    }

    return {
      discountAmount: discount.discountAmount || 0,
      originalTotal: discount.discountAmount || 0, // Simplified
      newTotal: 0,
    };
  }, [discount]);

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
    discountAmount: discount?.discountAmount || 0,
    stylistName: discount?.stylistName,
    affiliateCode: discount?.affiliateCode,
    applicableServices: discount?.applicableServices || [],
  };
}

// Helper hook for pages that don't have cart items but want to check attribution status
export function useAffiliateAttributionStatus(userId?: string) {
  return useQuery({
    queryKey: ["affiliate-attribution-status", userId],
    queryFn: async () => {
      if (!userId) return null;
      const result = await checkAffiliateDiscount([], userId);
      return result.data;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

// Types for external use
export type { AffiliateDiscountInfo, CartItem };
