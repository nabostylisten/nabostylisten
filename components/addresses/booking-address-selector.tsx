"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AddressCombobox } from "./address-combobox";
import { useQuery } from "@tanstack/react-query";
import { getAddress } from "@/server/addresses.actions";
import type { Database } from "@/types/database.types";

type Address = Database["public"]["Tables"]["addresses"]["Row"];

interface BookingAddressSelectorProps {
  stylistCanTravel: boolean;
  stylistHasOwnPlace: boolean;
  location: "stylist" | "customer";
  onLocationChange: (location: "stylist" | "customer") => void;
  selectedAddressId?: string;
  onAddressSelect: (addressId: string, address?: Address) => void;
  customerInstructions?: string;
  onInstructionsChange?: (instructions: string) => void;
}

export function BookingAddressSelector({
  stylistCanTravel,
  stylistHasOwnPlace,
  location,
  onLocationChange,
  selectedAddressId,
  onAddressSelect,
  customerInstructions,
  onInstructionsChange,
}: BookingAddressSelectorProps) {
  const [manualAddress, setManualAddress] = useState("");
  const [useManualAddress, setUseManualAddress] = useState(false);

  // Fetch selected address details
  const { data: addressData } = useQuery({
    queryKey: ["address", selectedAddressId],
    queryFn: () => selectedAddressId ? getAddress(selectedAddressId) : null,
    enabled: !!selectedAddressId,
  });

  const selectedAddress = addressData?.data;

  const handleAddressSelect = async (addressId: string) => {
    if (addressId) {
      // We'll fetch the full address details
      const { data } = await getAddress(addressId);
      onAddressSelect(addressId, data || undefined);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Hvor skal tjenesten utføres?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={location}
          onValueChange={(value) =>
            onLocationChange(value as "stylist" | "customer")
          }
        >
          {stylistHasOwnPlace && (
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="stylist" id="stylist" />
              <Label htmlFor="stylist">Hos stylisten</Label>
            </div>
          )}
          {stylistCanTravel && (
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="customer" id="customer" />
              <Label htmlFor="customer">Hjemme hos meg</Label>
            </div>
          )}
        </RadioGroup>

        {location === "customer" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Velg adresse</Label>
              <AddressCombobox
                value={selectedAddressId}
                onSelect={handleAddressSelect}
                placeholder="Velg eller legg til adresse"
              />
            </div>

            {selectedAddress && (
              <div className="p-3 bg-muted rounded-lg space-y-1">
                <p className="text-sm font-medium">
                  {selectedAddress.nickname || "Valgt adresse"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedAddress.street_address}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedAddress.postal_code} {selectedAddress.city}
                </p>
                {selectedAddress.entry_instructions && (
                  <p className="text-xs text-muted-foreground mt-2">
                    <span className="font-medium">Adgangsinstruksjoner:</span>{" "}
                    {selectedAddress.entry_instructions}
                  </p>
                )}
              </div>
            )}

            {!useManualAddress && !selectedAddressId && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setUseManualAddress(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Eller skriv inn adresse manuelt
                </button>
              </div>
            )}

            {useManualAddress && (
              <div className="space-y-2">
                <Label htmlFor="manual-address">Adresse</Label>
                <Textarea
                  id="manual-address"
                  placeholder="Skriv inn din adresse..."
                  value={manualAddress}
                  onChange={(e) => {
                    setManualAddress(e.target.value);
                    onInstructionsChange?.(e.target.value);
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setUseManualAddress(false);
                    setManualAddress("");
                  }}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Bruk lagrede adresser i stedet
                </button>
              </div>
            )}

            {(selectedAddressId || useManualAddress) && (
              <div className="space-y-2">
                <Label htmlFor="additional-instructions">
                  Ekstra instruksjoner (valgfritt)
                </Label>
                <Textarea
                  id="additional-instructions"
                  placeholder="F.eks. spesielle parkeringsinstruksjoner, hvilket rom, etc."
                  value={customerInstructions || ""}
                  onChange={(e) => onInstructionsChange?.(e.target.value)}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}