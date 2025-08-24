"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCartStore, type CartItem } from "@/stores/cart.store";
import type { Database } from "@/types/database.types";
import { ChevronRight, ShoppingCart, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Service = Database["public"]["Tables"]["services"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface CartStylistWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  newService: Service;
  newStylist: Profile;
}

export const CartStylistWarningDialog = ({
  isOpen,
  onClose,
  newService,
  newStylist,
}: CartStylistWarningDialogProps) => {
  const { items, getCurrentStylist, replaceCartWithNewService } =
    useCartStore();
  const currentStylist = getCurrentStylist();
  const router = useRouter();

  const handleKeepCurrent = () => {
    onClose();
  };

  const handleReplaceCart = () => {
    replaceCartWithNewService(newService, newStylist);
    onClose();

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
  };

  if (!currentStylist) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Du har allerede tjenester i handlekurven
          </DialogTitle>
          <DialogDescription className="text-left space-y-4">
            <p>
              Bookingflyten med valg av tidspunkt og alle alternativene oppleves
              best ved å booke tjenester hos én stylist om gangen.
            </p>
            <p>
              Du har for øyeblikket <strong>{items.length}</strong> tjeneste
              {items.length > 1 ? "r" : ""}
              fra <strong>{currentStylist.full_name}</strong> i handlekurven.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Cart */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4" />
              <h4 className="font-medium">Nåværende handlekurv</h4>
            </div>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.service.id} className="text-sm">
                  <span className="font-medium">{item.service.title}</span>
                  {item.quantity > 1 && (
                    <span className="text-muted-foreground">
                      {" "}
                      x{item.quantity}
                    </span>
                  )}
                  <div className="text-muted-foreground">
                    {item.service.price} {item.service.currency}
                  </div>
                </div>
              ))}
              <div className="text-sm text-muted-foreground pt-1 border-t">
                Stylist: {currentStylist.full_name}
              </div>
            </div>
          </div>

          {/* New Service */}
          <div className="bg-primary/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart className="w-4 h-4" />
              <h4 className="font-medium">Ny tjeneste du valgte</h4>
            </div>
            <div className="text-sm">
              <span className="font-medium">{newService.title}</span>
              <div className="text-muted-foreground">
                {newService.price} {newService.currency}
              </div>
              <div className="text-muted-foreground pt-1 border-t">
                Stylist: {newStylist.full_name}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleKeepCurrent}
            className="w-full sm:w-auto"
          >
            Behold nåværende handlekurv
          </Button>
          <Button onClick={handleReplaceCart} className="w-full sm:w-auto">
            Erstatt med ny tjeneste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
