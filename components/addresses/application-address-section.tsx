"use client";

import { MapPin, X } from "lucide-react";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AddressInput } from "@/components/ui/address-input";
import type { MapboxSuggestion } from "@/types";

interface ApplicationAddressSectionProps {
  onAddressChange: (address: {
    nickname?: string;
    streetAddress: string;
    city: string;
    postalCode: string;
    country: string;
    entryInstructions?: string;
    geometry?: [number, number]; // [lng, lat] from Mapbox
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
  const [addressQuery, setAddressQuery] = useState("");
  const [addressData, setAddressData] = useState({
    nickname: defaultValues?.nickname || "",
    streetAddress: defaultValues?.streetAddress || "",
    city: defaultValues?.city || "",
    postalCode: defaultValues?.postalCode || "",
    country: defaultValues?.country || "Norge",
    entryInstructions: defaultValues?.entryInstructions || "",
    geometry: undefined as [number, number] | undefined,
  });

  // Helper function to parse Mapbox response (copied from address-form.tsx)
  const parseMapboxResponse = (suggestion: MapboxSuggestion) => {
    const placeNameParts = suggestion.place_name
      .split(",")
      .map((s: string) => s.trim());
    const context = suggestion.context || [];

    // Extract components from context
    let postalCode = "";
    let city = "";
    let country = "Norge";

    for (const item of context) {
      if (item.id.startsWith("postcode")) {
        postalCode = item.text;
      } else if (item.id.startsWith("place")) {
        city = item.text;
      } else if (item.id.startsWith("country")) {
        country = item.text;
      }
    }

    // Construct the full street address: street name + house number
    let street = suggestion.text;
    if (suggestion.address) {
      street = `${suggestion.text} ${suggestion.address}`;
    }

    // Fallback to first part of place_name if no proper street/address fields
    if (!street) {
      street = placeNameParts[0] || "";
    }

    // Fallback to parsing from place_name if context doesn't have all info
    if (!city && placeNameParts.length > 1) {
      // Try to find city from place_name
      const possibleCity = placeNameParts.find(
        (part: string) =>
          !part.match(/^\d{4}/) && part !== street && part !== country
      );
      if (possibleCity) city = possibleCity;
    }

    if (!postalCode && placeNameParts.length > 1) {
      // Look for 4-digit postal code
      const possiblePostal = placeNameParts.find((part: string) =>
        part.match(/^\d{4}/)
      );
      if (possiblePostal) postalCode = possiblePostal;
    }

    return {
      street,
      city,
      postalCode,
      country,
      geometry: suggestion.center, // [lng, lat]
    };
  };

  const handleAddressSelect = (suggestion: MapboxSuggestion) => {
    const parsed = parseMapboxResponse(suggestion);
    const newAddressData = {
      ...addressData,
      streetAddress: parsed.street,
      city: parsed.city,
      postalCode: parsed.postalCode,
      country: parsed.country,
      geometry: parsed.geometry,
    };
    setAddressData(newAddressData);

    // Notify parent immediately
    onAddressChange({
      nickname: newAddressData.nickname || undefined,
      streetAddress: newAddressData.streetAddress,
      city: newAddressData.city,
      postalCode: newAddressData.postalCode,
      country: newAddressData.country,
      entryInstructions: newAddressData.entryInstructions || undefined,
      geometry: newAddressData.geometry,
    });
  };

  const handleFieldChange = (
    field: keyof typeof addressData,
    value: string
  ) => {
    const newAddressData = { ...addressData, [field]: value };
    setAddressData(newAddressData);

    // Notify parent of changes (except geometry which comes from Mapbox)
    onAddressChange({
      nickname: newAddressData.nickname || undefined,
      streetAddress: newAddressData.streetAddress,
      city: newAddressData.city,
      postalCode: newAddressData.postalCode,
      country: newAddressData.country,
      entryInstructions: newAddressData.entryInstructions || undefined,
      geometry: newAddressData.geometry,
    });
  };

  const clearMapboxSelection = () => {
    const newAddressData = {
      ...addressData,
      geometry: undefined,
    };
    setAddressData(newAddressData);
    setAddressQuery("");

    // Notify parent
    onAddressChange({
      nickname: newAddressData.nickname || undefined,
      streetAddress: newAddressData.streetAddress,
      city: newAddressData.city,
      postalCode: newAddressData.postalCode,
      country: newAddressData.country,
      entryInstructions: newAddressData.entryInstructions || undefined,
      geometry: undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Søk etter din adresse</Label>
          <AddressInput
            value={addressQuery}
            onChange={setAddressQuery}
            onSelect={handleAddressSelect}
            placeholder="Skriv inn din adresse..."
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">
            Start å skrive adressen din, så vil du få forslag fra Mapbox
          </p>
        </div>

        {/* Manual address fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">Adresse-kallenavn (valgfritt)</Label>
            <Input
              id="nickname"
              placeholder="F.eks. 'Hjemme', 'Salon', etc."
              value={addressData.nickname}
              onChange={(e) => handleFieldChange("nickname", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="street-address">Gateadresse *</Label>
            <Input
              id="street-address"
              placeholder="Gatenavn og nummer"
              value={addressData.streetAddress}
              onChange={(e) =>
                handleFieldChange("streetAddress", e.target.value)
              }
              disabled={!!addressData.geometry}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="postal-code">Postnummer *</Label>
            <Input
              id="postal-code"
              placeholder="0123"
              value={addressData.postalCode}
              onChange={(e) => handleFieldChange("postalCode", e.target.value)}
              disabled={!!addressData.geometry}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">By *</Label>
            <Input
              id="city"
              placeholder="Oslo"
              value={addressData.city}
              onChange={(e) => handleFieldChange("city", e.target.value)}
              disabled={!!addressData.geometry}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Land *</Label>
          <Input
            id="country"
            placeholder="Norge"
            value={addressData.country}
            onChange={(e) => handleFieldChange("country", e.target.value)}
            disabled={!!addressData.geometry}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="entry-instructions">
            Adgangsinstruksjoner for kunder (valgfritt)
          </Label>
          <Textarea
            id="entry-instructions"
            placeholder="F.eks. 'Ring på dørklokka merket med etternavn', 'Parkering tilgjengelig i bakgården', etc."
            value={addressData.entryInstructions}
            onChange={(e) =>
              handleFieldChange("entryInstructions", e.target.value)
            }
          />
          <p className="text-xs text-muted-foreground">
            Disse instruksjonene vil bli vist til kunder når de booker
            hjemmebesøk hos deg
          </p>
        </div>
      </div>
    </div>
  );
}
