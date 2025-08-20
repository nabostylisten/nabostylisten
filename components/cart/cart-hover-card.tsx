"use client";

import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCartStore } from "@/stores/cart.store";
import { ShoppingCart, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface CartHoverCardProps {
  children: React.ReactNode;
}

export const CartHoverCard = ({ children }: CartHoverCardProps) => {
  const { items, removeFromCart, updateQuantity, getTotalItems, getTotalPrice } = useCartStore();
  const [removeServiceId, setRemoveServiceId] = useState<string | null>(null);

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  if (totalItems === 0) {
    return null;
  }

  const handleRemoveFromCart = (serviceId: string) => {
    removeFromCart(serviceId);
    setRemoveServiceId(null);
  };

  return (
    <HoverCard openDelay={10}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            <h4 className="font-semibold">Handlekurv</h4>
            <span className="text-sm text-muted-foreground">
              ({totalItems} {totalItems === 1 ? "tjeneste" : "tjenester"})
            </span>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {items.map((item) => (
              <div key={item.service.id} className="pb-3 border-b last:border-b-0">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-sm truncate">{item.service.title}</h5>
                    <p className="text-xs text-muted-foreground truncate">
                      av {item.stylist.full_name}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-medium">
                        {item.service.price} {item.service.currency}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-xs text-muted-foreground">
                          Total: {(item.service.price * item.quantity).toFixed(2)} {item.service.currency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Quantity controls and remove button */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center gap-1 flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => updateQuantity(item.service.id, item.quantity - 1)}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        if (value > 0) {
                          updateQuantity(item.service.id, value);
                        }
                      }}
                      className="h-7 w-12 text-center px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      min="1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => updateQuantity(item.service.id, item.quantity + 1)}
                    >
                      <ChevronUp className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-muted-foreground hover:text-destructive hover:border-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRemoveServiceId(item.service.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Fjern
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Fjern tjeneste</AlertDialogTitle>
                        <AlertDialogDescription>
                          Er du sikker på at du vil fjerne "{item.service.title}" fra handlekurven?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRemoveFromCart(item.service.id)}>
                          Fjern
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">Total:</span>
              <span className="font-bold">
                {totalPrice.toFixed(2)} NOK
              </span>
            </div>
            
            <Button asChild className="w-full">
              <Link href="/handlekurv">
                Gå til handlekurv
              </Link>
            </Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};