"use client";

import { useState } from "react";
import { DiscountsDataTable } from "@/components/admin/discounts-data-table";
import { DiscountDialog } from "@/components/admin/discount-dialog";
import { BlurFade } from "@/components/magicui/blur-fade";
import type { DatabaseTables } from "@/types";

type Discount = DatabaseTables["discounts"]["Row"];

export function DiscountsPageContent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);

  const handleCreateDiscount = () => {
    setSelectedDiscount(null);
    setDialogOpen(true);
  };

  const handleEditDiscount = (discount: Discount) => {
    setSelectedDiscount(discount);
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <BlurFade delay={0.1} duration={0.5} inView>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Rabattkoder
          </h1>
          <p className="text-muted-foreground">
            Administrer rabattkoder og kampanjer
          </p>
        </div>
      </BlurFade>

      <BlurFade delay={0.15} duration={0.5} inView>
        <DiscountsDataTable
          onCreateDiscount={handleCreateDiscount}
          onEditDiscount={handleEditDiscount}
        />
      </BlurFade>
      
      <DiscountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        existingDiscount={selectedDiscount}
      />
    </div>
  );
}