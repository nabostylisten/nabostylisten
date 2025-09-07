"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AffiliateLinkForm } from "./affiliate-link-form";
import type { Database } from "@/types/database.types";

type AffiliateLink = Database["public"]["Tables"]["affiliate_links"]["Row"];

interface AffiliateLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affiliateLink?: AffiliateLink | null;
}

export function AffiliateLinkDialog({
  open,
  onOpenChange,
  affiliateLink,
}: AffiliateLinkDialogProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {affiliateLink ? "Rediger partnerkode" : "Opprett partnerkode"}
          </DialogTitle>
          <DialogDescription>
            {affiliateLink
              ? "Oppdater detaljer for denne partnerkoden"
              : "Opprett en ny partnerkode for stylisten"}
          </DialogDescription>
        </DialogHeader>
        <AffiliateLinkForm
          affiliateLink={affiliateLink}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}