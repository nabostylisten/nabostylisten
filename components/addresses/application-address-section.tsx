"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AddressInput } from "@/components/ui/address-input";
import type { MapboxSuggestion } from "@/types";
import { parseMapboxResponse } from "@/lib/mapbox";

interface ApplicationAddressSectionProps {
  onAddressChange: (address: {
    nickname?: string;
    streetAddress: string;
    city: string;
    postalCode: string;
    country: string;
    countryCode?: string; // ISO country code from Mapbox
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
    countryCode: undefined as string | undefined,
    entryInstructions: defaultValues?.entryInstructions || "",
    geometry: undefined as [number, number] | undefined,
  });

  const handleAddressSelect = (suggestion: MapboxSuggestion) => {
    // Log the complete Mapbox suggestion to see what fields are available
    console.log(
      "🗺️ [MAPBOX] Complete suggestion object:",
      JSON.stringify(suggestion, null, 2)
    );
    console.log("🗺️ [MAPBOX] suggestion.context:", suggestion.context);
    console.log("🗺️ [MAPBOX] suggestion.properties:", suggestion.properties);

    // Check for country-related fields that might contain ISO codes
    if (suggestion.context) {
      const countryContext = suggestion.context.find((item) =>
        item.id?.startsWith("country")
      );
      console.log("🗺️ [MAPBOX] Country context item:", countryContext);

      // Also log all context items to see what's available
      suggestion.context.forEach((item, index) => {
        console.log(`🗺️ [MAPBOX] Context[${index}]:`, item);
      });
    }

    const parsed = parseMapboxResponse(suggestion);
    console.log("🗺️ [MAPBOX] Parsed result:", parsed);

    // Log specifically if we got a country code
    if (parsed.countryCode) {
      console.log(
        `🗺️ [MAPBOX] ✅ Found country ISO code: "${parsed.countryCode}" for country "${parsed.country}"`
      );
    } else {
      console.log(
        `🗺️ [MAPBOX] ❌ No country ISO code found for country "${parsed.country}"`
      );
    }

    const newAddressData = {
      ...addressData,
      streetAddress: parsed.street,
      city: parsed.city,
      postalCode: parsed.postalCode,
      country: parsed.country,
      countryCode: parsed.countryCode,
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
      countryCode: newAddressData.countryCode,
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
      countryCode: newAddressData.countryCode,
      entryInstructions: newAddressData.entryInstructions || undefined,
      geometry: newAddressData.geometry,
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
