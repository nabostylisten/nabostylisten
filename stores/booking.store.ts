import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Database } from "@/types/database.types";
import type { DatabaseTables } from "@/types";

type Address = Database["public"]["Tables"]["addresses"]["Row"];

export interface AppliedDiscount {
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

export interface AffiliateAttribution {
  affiliateCode: string;
  stylistName: string;
  discountAmount: number;
  applicableServices: string[];
}

export interface BookingStepData {
  // Time selection step
  startTime?: Date;
  endTime?: Date;

  // Trial session step
  trialSessionDate?: Date;
  trialSessionStartTime?: Date;
  trialSessionEndTime?: Date;
  wantsTrialSession?: boolean;

  // Location step
  location: "stylist" | "customer";
  customerAddress?: string;
  customerAddressId?: string;
  customerAddressDetails?: Address;

  // Message and discount step
  messageToStylist?: string;
  appliedDiscount?: AppliedDiscount;
  affiliateAttribution?: AffiliateAttribution;
}

export interface BookingStore {
  // Current step in the booking flow
  currentStep:
    | "time-selection"
    | "trial-session"
    | "location-details"
    | "message-discount"
    | "payment";

  // Booking data across all steps
  bookingData: BookingStepData;

  // Context data for the booking
  stylistId?: string;
  serviceDurationMinutes?: number;
  serviceAmountNOK?: number;
  stylistCanTravel?: boolean;
  stylistHasOwnPlace?: boolean;
  hasTrialSession?: boolean;
  trialSessionPrice?: number;
  trialSessionDurationMinutes?: number;
  trialSessionDescription?: string;

  // Processing state
  isProcessingBooking: boolean;

  // Actions
  setCurrentStep: (step: BookingStore["currentStep"]) => void;
  updateBookingData: (updates: Partial<BookingStepData>) => void;
  setBookingContext: (context: {
    stylistId: string;
    serviceDurationMinutes: number;
    serviceAmountNOK: number;
    stylistCanTravel?: boolean;
    stylistHasOwnPlace?: boolean;
    hasTrialSession?: boolean;
    trialSessionPrice?: number;
    trialSessionDurationMinutes?: number;
    trialSessionDescription?: string;
  }) => void;
  setProcessingState: (isProcessing: boolean) => void;
  clearBooking: () => void;

  // Step validation helpers
  canProceedFromStep: (stepId: string) => boolean;
  isStepAccessible: (stepId: string) => boolean;

  // Total calculation helpers
  getTotalAmount: () => number;
  getTrialSessionAmount: () => number;
}

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      currentStep: "time-selection",
      bookingData: {
        location: "stylist", // Default value, will be updated based on stylist capabilities
      },
      stylistId: undefined,
      serviceDurationMinutes: undefined,
      serviceAmountNOK: undefined,
      stylistCanTravel: undefined,
      stylistHasOwnPlace: undefined,
      hasTrialSession: undefined,
      trialSessionPrice: undefined,
      trialSessionDurationMinutes: undefined,
      trialSessionDescription: undefined,
      isProcessingBooking: false,

      setCurrentStep: (step) => {
        set({ currentStep: step });
      },

      updateBookingData: (updates) => {
        set((state) => ({
          bookingData: { ...state.bookingData, ...updates },
        }));
      },

      setBookingContext: (context) => {
        set((state) => ({
          ...context,
          // Update default location based on stylist capabilities
          bookingData: {
            ...state.bookingData,
            location: context.stylistHasOwnPlace ? "stylist" : "customer",
          },
        }));
      },

      setProcessingState: (isProcessing) => {
        set({ isProcessingBooking: isProcessing });
      },

      clearBooking: () => {
        set({
          currentStep: "time-selection",
          bookingData: {
            location: "stylist",
          },
          stylistId: undefined,
          serviceDurationMinutes: undefined,
          serviceAmountNOK: undefined,
          stylistCanTravel: undefined,
          stylistHasOwnPlace: undefined,
          hasTrialSession: undefined,
          trialSessionPrice: undefined,
          trialSessionDurationMinutes: undefined,
          trialSessionDescription: undefined,
          isProcessingBooking: false,
        });
      },

      canProceedFromStep: (stepId) => {
        const state = get();
        const { bookingData } = state;

        switch (stepId) {
          case "time-selection":
            return !!(bookingData.startTime && bookingData.endTime);
          case "trial-session":
            // If trial session is not wanted, can proceed
            if (!bookingData.wantsTrialSession) return true;
            // If trial session is wanted, must have selected date/time
            return !!(
              bookingData.trialSessionDate &&
              bookingData.trialSessionStartTime &&
              bookingData.trialSessionEndTime
            );
          case "location-details":
            return !!(
              bookingData.location &&
              (bookingData.location === "stylist" ||
                (bookingData.location === "customer" &&
                  (bookingData.customerAddressId ||
                    bookingData.customerAddress)))
            );
          case "message-discount":
            return true; // Optional fields
          case "payment":
            return true; // Final step
          default:
            return true;
        }
      },

      isStepAccessible: (stepId) => {
        const state = get();

        switch (stepId) {
          case "time-selection":
            return true; // First step is always accessible
          case "trial-session":
            return state.canProceedFromStep("time-selection");
          case "location-details":
            return (
              state.canProceedFromStep("time-selection") &&
              (state.hasTrialSession
                ? state.canProceedFromStep("trial-session")
                : true)
            );
          case "message-discount":
            return (
              state.canProceedFromStep("time-selection") &&
              (state.hasTrialSession
                ? state.canProceedFromStep("trial-session")
                : true) &&
              state.canProceedFromStep("location-details")
            );
          case "payment":
            return (
              state.canProceedFromStep("time-selection") &&
              (state.hasTrialSession
                ? state.canProceedFromStep("trial-session")
                : true) &&
              state.canProceedFromStep("location-details") &&
              state.canProceedFromStep("message-discount")
            );
          default:
            return false;
        }
      },

      getTotalAmount: () => {
        const state = get();
        const serviceAmount = state.serviceAmountNOK || 0;
        const trialAmount = state.getTrialSessionAmount();
        const discountAmount =
          state.bookingData.appliedDiscount?.discountAmount || 0;
        return serviceAmount + trialAmount - discountAmount;
      },

      getTrialSessionAmount: () => {
        const state = get();
        if (state.bookingData.wantsTrialSession && state.trialSessionPrice) {
          return state.trialSessionPrice;
        }
        return 0;
      },
    }),
    {
      name: "nabostylisten:booking-storage",
      storage: createJSONStorage(() => sessionStorage),
      // Only persist certain fields, not processing state
      partialize: (state) => ({
        currentStep: state.currentStep,
        bookingData: state.bookingData,
        stylistId: state.stylistId,
        serviceDurationMinutes: state.serviceDurationMinutes,
        serviceAmountNOK: state.serviceAmountNOK,
        stylistCanTravel: state.stylistCanTravel,
        stylistHasOwnPlace: state.stylistHasOwnPlace,
        hasTrialSession: state.hasTrialSession,
        trialSessionPrice: state.trialSessionPrice,
        trialSessionDurationMinutes: state.trialSessionDurationMinutes,
        trialSessionDescription: state.trialSessionDescription,
      }),
      // Handle Date object rehydration
      onRehydrateStorage: () => (state) => {
        if (state && state.bookingData) {
          // Convert string dates back to Date objects
          if (
            state.bookingData.startTime &&
            typeof state.bookingData.startTime === "string"
          ) {
            state.bookingData.startTime = new Date(state.bookingData.startTime);
          }
          if (
            state.bookingData.endTime &&
            typeof state.bookingData.endTime === "string"
          ) {
            state.bookingData.endTime = new Date(state.bookingData.endTime);
          }
          // Handle trial session dates
          if (
            state.bookingData.trialSessionDate &&
            typeof state.bookingData.trialSessionDate === "string"
          ) {
            state.bookingData.trialSessionDate = new Date(
              state.bookingData.trialSessionDate,
            );
          }
          if (
            state.bookingData.trialSessionStartTime &&
            typeof state.bookingData.trialSessionStartTime === "string"
          ) {
            state.bookingData.trialSessionStartTime = new Date(
              state.bookingData.trialSessionStartTime,
            );
          }
          if (
            state.bookingData.trialSessionEndTime &&
            typeof state.bookingData.trialSessionEndTime === "string"
          ) {
            state.bookingData.trialSessionEndTime = new Date(
              state.bookingData.trialSessionEndTime,
            );
          }
        }
      },
    },
  ),
);
