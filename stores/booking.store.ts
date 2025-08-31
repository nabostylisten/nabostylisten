import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Database } from "@/types/database.types";
import type { DatabaseTables } from "@/types";

type Address = Database["public"]["Tables"]["addresses"]["Row"];

export interface AppliedDiscount {
  discount: DatabaseTables["discounts"]["Row"];
  discountAmount: number;
  code: string;
}

export interface BookingStepData {
  // Time selection step
  startTime?: Date;
  endTime?: Date;
  
  // Location step
  location: "stylist" | "customer";
  customerAddress?: string;
  customerAddressId?: string;
  customerAddressDetails?: Address;
  
  // Message and discount step
  messageToStylist?: string;
  appliedDiscount?: AppliedDiscount;
}

export interface BookingStore {
  // Current step in the booking flow
  currentStep: "time-selection" | "location-details" | "message-discount" | "payment";
  
  // Booking data across all steps
  bookingData: BookingStepData;
  
  // Context data for the booking
  stylistId?: string;
  serviceDurationMinutes?: number;
  serviceAmountNOK?: number;
  stylistCanTravel?: boolean;
  stylistHasOwnPlace?: boolean;
  
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
  }) => void;
  setProcessingState: (isProcessing: boolean) => void;
  clearBooking: () => void;
  
  // Step validation helpers
  canProceedFromStep: (stepId: string) => boolean;
  isStepAccessible: (stepId: string) => boolean;
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
      isProcessingBooking: false,

      setCurrentStep: (step) => {
        set({ currentStep: step });
      },

      updateBookingData: (updates) => {
        set((state) => ({
          bookingData: { ...state.bookingData, ...updates }
        }));
      },

      setBookingContext: (context) => {
        set((state) => ({
          ...context,
          // Update default location based on stylist capabilities
          bookingData: {
            ...state.bookingData,
            location: context.stylistHasOwnPlace ? "stylist" : "customer"
          }
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
          isProcessingBooking: false,
        });
      },

      canProceedFromStep: (stepId) => {
        const state = get();
        const { bookingData } = state;
        
        switch (stepId) {
          case "time-selection":
            return !!(bookingData.startTime && bookingData.endTime);
          case "location-details":
            return !!(
              bookingData.location &&
              (bookingData.location === "stylist" ||
                (bookingData.location === "customer" &&
                  (bookingData.customerAddressId || bookingData.customerAddress)))
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
          case "location-details":
            return state.canProceedFromStep("time-selection");
          case "message-discount":
            return (
              state.canProceedFromStep("time-selection") &&
              state.canProceedFromStep("location-details")
            );
          case "payment":
            return (
              state.canProceedFromStep("time-selection") &&
              state.canProceedFromStep("location-details") &&
              state.canProceedFromStep("message-discount")
            );
          default:
            return false;
        }
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
      }),
      // Handle Date object rehydration
      onRehydrateStorage: () => (state) => {
        if (state && state.bookingData) {
          // Convert string dates back to Date objects
          if (state.bookingData.startTime && typeof state.bookingData.startTime === 'string') {
            state.bookingData.startTime = new Date(state.bookingData.startTime);
          }
          if (state.bookingData.endTime && typeof state.bookingData.endTime === 'string') {
            state.bookingData.endTime = new Date(state.bookingData.endTime);
          }
        }
      },
    },
  ),
);