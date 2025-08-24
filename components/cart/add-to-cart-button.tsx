"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart.store";
import { CartStylistWarningDialog } from "@/components/cart/cart-stylist-warning-dialog";
import { ShoppingCart, Check, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Database } from "@/types/database.types";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type Service = Database["public"]["Tables"]["services"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Flexible types for service and stylist that can accept partial data
interface AddToCartButtonProps {
  service:
    | Service
    | (Partial<Service> & {
        id: string;
        title: string;
        price: number;
        currency: string;
      });
  stylist:
    | Profile
    | (Partial<Profile> & { id: string; full_name: string | null });
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
  disabled?: boolean;
}

export const AddToCartButton = ({
  service,
  stylist,
  variant = "default",
  size = "default",
  className,
  children,
  showIcon = true,
  disabled = false,
}: AddToCartButtonProps) => {
  const { addToCart, items } = useCartStore();
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingService, setPendingService] = useState<{
    service: Service;
    stylist: Profile;
  } | null>(null);
  const router = useRouter();

  // Check if this service is already in cart
  const isInCart = items.some((item) => item.service.id === service.id);
  const serviceInCart = items.find((item) => item.service.id === service.id);

  const handleAddToCart = () => {
    if (disabled) return;

    // Convert to full database types with defaults
    const fullService: Service = {
      at_customer_place: false,
      at_stylist_place: true,
      created_at: new Date().toISOString(),
      description: null,
      duration_minutes: 60,
      includes: null,
      is_published: true,
      requirements: null,
      stylist_id: stylist.id,
      updated_at: new Date().toISOString(),
      ...service,
    } as Service;

    const fullStylist: Profile = {
      bankid_verified: false,
      created_at: new Date().toISOString(),
      email: null,
      phone_number: null,
      role: "stylist" as const,
      stripe_customer_id: null,
      updated_at: new Date().toISOString(),
      ...stylist,
    };

    const result = addToCart(fullService, fullStylist);

    if (result.success) {
      if (isInCart) {
        toast.success(
          `Tjeneste oppdatert i handlekurv (antall: ${serviceInCart ? serviceInCart.quantity + 1 : 1})`,
          {
            action: {
              label: (
                <div className="flex items-center gap-2">
                  Se handlekurv <ChevronRight className="w-3 h-3" />
                </div>
              ),
              onClick: () => {
                router.push("/handlekurv");
              },
            },
          }
        );
      } else {
        toast.success("Tjeneste lagt til i handlekurv", {
          action: {
            label: (
              <div className="flex items-center gap-2">
                Se handlekurv <ChevronRight className="w-3 h-3" />
              </div>
            ),
            onClick: () => {
              router.push("/handlekurv");
            },
          },
        });
      }
    } else if (result.needsConfirmation) {
      // Show warning dialog for different stylist
      setPendingService({ service: fullService, stylist: fullStylist });
      setShowWarningDialog(true);
    }
  };

  const handleCloseWarningDialog = () => {
    setShowWarningDialog(false);
    setPendingService(null);
  };

  const buttonContent = children || (
    <div className="flex items-center gap-2">
      {showIcon &&
        (isInCart ? (
          <Check className="w-4 h-4" />
        ) : (
          <ShoppingCart className="w-4 h-4" />
        ))}
      <span>{isInCart ? "Legg til flere" : "Legg til i handlekurv"}</span>
    </div>
  );

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn(className)}
        onClick={handleAddToCart}
        disabled={disabled}
      >
        {buttonContent}
      </Button>

      {pendingService && (
        <CartStylistWarningDialog
          isOpen={showWarningDialog}
          onClose={handleCloseWarningDialog}
          newService={pendingService.service}
          newStylist={pendingService.stylist}
        />
      )}
    </>
  );
};
