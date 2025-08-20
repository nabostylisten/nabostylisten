import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Database } from "@/types/database.types";

type Service = Database["public"]["Tables"]["services"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface CartItem {
  service: Service;
  stylist: Profile;
  quantity: number;
}

export interface CartStore {
  items: CartItem[];
  currentStylistId: string | null;

  // Actions
  addToCart: (
    service: Service,
    stylist: Profile,
  ) => { success: boolean; needsConfirmation: boolean };
  removeFromCart: (serviceId: string) => void;
  clearCart: () => void;
  updateQuantity: (serviceId: string, quantity: number) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getCurrentStylist: () => Profile | null;

  // For handling multi-stylist scenario
  replaceCartWithNewService: (service: Service, stylist: Profile) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      currentStylistId: null,

      addToCart: (service, stylist) => {
        const state = get();

        // If cart is empty, add the item
        if (state.items.length === 0) {
          set({
            items: [{ service, stylist, quantity: 1 }],
            currentStylistId: stylist.id,
          });
          return { success: true, needsConfirmation: false };
        }

        // If adding from same stylist
        if (state.currentStylistId === stylist.id) {
          const existingItemIndex = state.items.findIndex(
            (item) => item.service.id === service.id,
          );

          if (existingItemIndex >= 0) {
            // Update quantity if service already in cart
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += 1;
            set({ items: updatedItems });
          } else {
            // Add new service from same stylist
            set({
              items: [...state.items, { service, stylist, quantity: 1 }],
            });
          }
          return { success: true, needsConfirmation: false };
        }

        // Adding from different stylist - needs confirmation
        return { success: false, needsConfirmation: true };
      },

      removeFromCart: (serviceId) => {
        const state = get();
        const updatedItems = state.items.filter(
          (item) => item.service.id !== serviceId,
        );

        set({
          items: updatedItems,
          currentStylistId: updatedItems.length > 0
            ? state.currentStylistId
            : null,
        });
      },

      clearCart: () => {
        set({
          items: [],
          currentStylistId: null,
        });
      },

      updateQuantity: (serviceId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(serviceId);
          return;
        }

        const state = get();
        const updatedItems = state.items.map((item) =>
          item.service.id === serviceId ? { ...item, quantity } : item
        );

        set({ items: updatedItems });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + (item.service.price * item.quantity),
          0,
        );
      },

      getCurrentStylist: () => {
        const state = get();
        if (!state.currentStylistId || state.items.length === 0) {
          return null;
        }
        return state.items[0].stylist;
      },

      replaceCartWithNewService: (service, stylist) => {
        set({
          items: [{ service, stylist, quantity: 1 }],
          currentStylistId: stylist.id,
        });
      },
    }),
    {
      name: "nabostylisten:cart-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
