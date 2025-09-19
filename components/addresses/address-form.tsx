"use client";

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Home, Building } from "lucide-react";
import type { MapboxSuggestion } from "@/types";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AddressInput } from "@/components/ui/address-input";
import { Checkbox } from "@/components/ui/checkbox";

export interface AddressFormValues {
  nickname?: string;
  fullAddress: string;
  street_address: string;
  city: string;
  postal_code: string;
  country: string;
  entry_instructions?: string;
  is_primary: boolean;
  location?: {
    lat: number;
    lng: number;
  };
}

interface AddressFormProps {
  form: UseFormReturn<AddressFormValues>;
}

export function AddressForm({ form }: AddressFormProps) {
  const [addressFieldsLocked, setAddressFieldsLocked] = useState(false);

  // Watch for changes in the full address field
  const fullAddress = form.watch("fullAddress");

  useEffect(() => {
    // Unlock fields if user clears the full address
    if (!fullAddress) {
      setAddressFieldsLocked(false);
    }
  }, [fullAddress]);

  const handleAddressSelect = (suggestion: MapboxSuggestion) => {
    // Parse the Mapbox response to extract address components
    const components = parseMapboxResponse(suggestion);

    form.setValue("street_address", components.street);
    form.setValue("city", components.city);
    form.setValue("postal_code", components.postalCode);
    form.setValue("country", components.country);

    // Store the coordinates from geometry (preferred) or center
    const coordinates = suggestion.geometry?.coordinates || suggestion.center;
    if (coordinates) {
      form.setValue("location", {
        lng: coordinates[0],
        lat: coordinates[1],
      });
    }

    // Lock the fields after selection to indicate they were auto-filled
    setAddressFieldsLocked(true);
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="nickname"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Kallenavn (valgfritt)</FormLabel>
            <FormControl>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => field.onChange("Hjemme")}
                    className="gap-1 flex-1 sm:flex-initial"
                  >
                    <Home className="h-4 w-4" />
                    Hjemme
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => field.onChange("Jobb")}
                    className="gap-1 flex-1 sm:flex-initial"
                  >
                    <Building className="h-4 w-4" />
                    Jobb
                  </Button>
                </div>
                <Input
                  placeholder="Eller skriv inn eget..."
                  {...field}
                  value={field.value || ""}
                  className="flex-1"
                />
              </div>
            </FormControl>
            <FormDescription>
              Gi adressen et kallenavn for enkel gjenkjennelse
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="fullAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Søk etter adresse</FormLabel>
            <FormControl>
              <AddressInput
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  // Clear the parsed fields when user types
                  if (!value) {
                    form.setValue("street_address", "");
                    form.setValue("city", "");
                    form.setValue("postal_code", "");
                    form.setValue("country", "Norge");
                    setAddressFieldsLocked(false);
                  }
                }}
                onSelect={handleAddressSelect}
                placeholder="Søk etter adresse..."
              />
            </FormControl>
            <FormDescription>
              Begynn å skrive for å søke etter adressen din
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-2">
        {addressFieldsLocked && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Adressefeltene ble fylt ut automatisk. Du kan redigere dem om
              nødvendig.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAddressFieldsLocked(false)}
            >
              Rediger felter
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="street_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gateadresse</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  readOnly={addressFieldsLocked}
                  className={addressFieldsLocked ? "bg-muted" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="postal_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postnummer</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  readOnly={addressFieldsLocked}
                  className={addressFieldsLocked ? "bg-muted" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>By</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  readOnly={addressFieldsLocked}
                  className={addressFieldsLocked ? "bg-muted" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Land</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  readOnly={addressFieldsLocked}
                  className={addressFieldsLocked ? "bg-muted" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="entry_instructions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Adgangsinstruksjoner (valgfritt)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="F.eks. 'Ring på dørklokka', 'Bruk sideinngangen', 'Portkodenummer 1234', etc."
                {...field}
                value={field.value || ""}
                className="min-h-[120px] sm:min-h-[80px]"
              />
            </FormControl>
            <FormDescription>
              Hjelpsom informasjon for å finne frem
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="is_primary"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Sett som primæradresse</FormLabel>
              <FormDescription>
                Denne adressen vil bli valgt som standard
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}

// Helper function to parse Mapbox response
function parseMapboxResponse(suggestion: MapboxSuggestion) {
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
  // suggestion.text = "Sandåkerveien", suggestion.address = "22e"
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
  };
}
