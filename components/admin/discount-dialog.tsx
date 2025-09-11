"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DiscountForm } from "./discount-form";
import type { DatabaseTables } from "@/types";

type Discount = DatabaseTables["discounts"]["Row"];

interface DiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingDiscount?: Discount | null;
}

export function DiscountDialog({
  open,
  onOpenChange,
  existingDiscount,
}: DiscountDialogProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] overflow-y-scroll max-h-screen">
        <DialogHeader>
          <DialogTitle>
            {existingDiscount ? "Rediger rabattkode" : "Opprett ny rabattkode"}
          </DialogTitle>
          <DialogDescription>
            {existingDiscount 
              ? "Oppdater rabattkode-detaljene og innstillingene"
              : "Opprett en ny rabattkode for kampanjer og tilbud"
            }
          </DialogDescription>
        </DialogHeader>
        <DiscountForm
          existingDiscount={existingDiscount}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}