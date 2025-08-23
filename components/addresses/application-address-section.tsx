"use client";

import { MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { AddressCombobox } from "./address-combobox";
import { AddressDialog } from "./address-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getAddress } from "@/server/addresses.actions";
import type { Database } from "@/types/database.types";

type Address = Database["public"]["Tables"]["addresses"]["Row"];

interface ApplicationAddressSectionProps {
  onAddressChange: (address: {
    nickname?: string;
    streetAddress: string;
    city: string;
    postalCode: string;
    country: string;
    entryInstructions?: string;
  }) => void;
  defaultValues?: {
    nickname?: string;
    streetAddress?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    entryInstructions?: string;
  };
  error?: string;
}

export function ApplicationAddressSection({
  onAddressChange,
  defaultValues,
  error,
}: ApplicationAddressSectionProps) {
  const [selectedAddressId, setSelectedAddressId] = useState<string>();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [customInstructions, setCustomInstructions] = useState(
    defaultValues?.entryInstructions || ""
  );

  // Fetch selected address details
  const { data: addressData } = useQuery({
    queryKey: ["address", selectedAddressId],
    queryFn: () => selectedAddressId ? getAddress(selectedAddressId) : null,
    enabled: !!selectedAddressId,
  });

  const selectedAddress = addressData?.data;

  // Update parent form when address changes
  useEffect(() => {
    if (selectedAddress) {
      onAddressChange({
        nickname: selectedAddress.nickname || undefined,
        streetAddress: selectedAddress.street_address,
        city: selectedAddress.city,
        postalCode: selectedAddress.postal_code,
        country: selectedAddress.country,
        entryInstructions: customInstructions || selectedAddress.entry_instructions || undefined,
      });
    }
  }, [selectedAddress, customInstructions, onAddressChange]);

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
  };

  const handleAddressCreated = (addressId: string) => {
    setSelectedAddressId(addressId);
    setShowAddDialog(false);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MapPin className="h-5 w-5" />
        Din adresse
      </h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Velg en eksisterende adresse eller legg til ny</Label>
          <AddressCombobox
            value={selectedAddressId}
            onSelect={handleAddressSelect}
            placeholder="Velg adresse..."
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        {selectedAddress && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p className="font-medium">
              {selectedAddress.nickname || "Valgt adresse"}
            </p>
            <p className="text-sm text-muted-foreground">
              {selectedAddress.street_address}
            </p>
            <p className="text-sm text-muted-foreground">
              {selectedAddress.postal_code} {selectedAddress.city}, {selectedAddress.country}
            </p>
            {selectedAddress.entry_instructions && (
              <p className="text-xs text-muted-foreground mt-2">
                <span className="font-medium">Adgangsinstruksjoner:</span>{" "}
                {selectedAddress.entry_instructions}
              </p>
            )}
          </div>
        )}

        {selectedAddress && (
          <div className="space-y-2">
            <Label htmlFor="custom-instructions">
              Ekstra adgangsinstruksjoner for kunder (valgfritt)
            </Label>
            <Textarea
              id="custom-instructions"
              placeholder="F.eks. 'Ring på dørklokka merket med etternavn', 'Parkering tilgjengelig i bakgården', etc."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Disse instruksjonene vil bli vist til kunder når de booker hjemmebesøk hos deg
            </p>
          </div>
        )}

        {!selectedAddressId && (
          <div className="flex items-center justify-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Du må velge eller legge til en adresse for å fortsette
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(true)}
              >
                Legg til adresse
              </Button>
            </div>
          </div>
        )}
      </div>

      <AddressDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleAddressCreated}
      />
    </div>
  );
}