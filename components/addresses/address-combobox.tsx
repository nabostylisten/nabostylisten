"use client";

import { useState } from "react";
import { Plus, MapPin, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxSeparator,
  ComboboxTrigger,
} from "@/components/ui/kibo-ui/combobox";
import { getUserAddresses } from "@/server/addresses.actions";
import { AddressDialog } from "./address-dialog";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type Address = Database["public"]["Tables"]["addresses"]["Row"];

interface AddressComboboxProps {
  value?: string;
  onSelect: (addressId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  triggerClassName?: string;
}

export function AddressCombobox({
  value,
  onSelect,
  placeholder = "Velg adresse",
  className,
  disabled,
  triggerClassName,
}: AddressComboboxProps) {
  const [open, setOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Fetch user addresses
  const { data: addressesData, refetch } = useQuery({
    queryKey: ["addresses"],
    queryFn: getUserAddresses,
  });

  const addresses = addressesData?.data || [];

  // Filter addresses based on search
  const filteredAddresses = addresses.filter((address) => {
    const searchLower = searchValue.toLowerCase();
    return (
      address.nickname?.toLowerCase().includes(searchLower) ||
      address.street_address.toLowerCase().includes(searchLower) ||
      address.city.toLowerCase().includes(searchLower) ||
      address.postal_code.toLowerCase().includes(searchLower)
    );
  });

  const selectedAddress = addresses.find((addr) => addr.id === value);

  const handleAddNewAddress = async () => {
    setOpen(false);
    setShowAddDialog(true);
  };

  const handleAddressCreated = async (addressId: string) => {
    await refetch();
    onSelect(addressId);
    setShowAddDialog(false);
  };

  return (
    <>
      <Combobox
        data={filteredAddresses.map((address) => ({
          label: formatAddressLabel(address),
          value: address.id,
        }))}
        type="adresse"
        value={value || ""}
        onValueChange={onSelect}
        open={open}
        onOpenChange={setOpen}
      >
        <ComboboxTrigger
          className={cn("w-full justify-between", triggerClassName)}
          disabled={disabled}
        >
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {selectedAddress ? (
              <span className="text-left">
                {selectedAddress.nickname || selectedAddress.street_address}
                {selectedAddress.is_primary && (
                  <span className="ml-2 text-xs text-muted-foreground">(Primær)</span>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
        </ComboboxTrigger>

        <ComboboxContent className={className}>
          <ComboboxInput
            placeholder="Søk i dine adresser..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <ComboboxList>
            <ComboboxEmpty>
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground mb-2">
                  Ingen adresser funnet
                </p>
              </div>
            </ComboboxEmpty>

            <ComboboxGroup>
              {filteredAddresses.map((address) => (
                <ComboboxItem key={address.id} value={address.id}>
                  <div className="flex items-start gap-2 w-full">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {address.nickname || address.street_address}
                        </span>
                        {address.is_primary && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            Primær
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {address.street_address}, {address.postal_code} {address.city}
                      </p>
                      {address.entry_instructions && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {address.entry_instructions}
                        </p>
                      )}
                    </div>
                    {value === address.id && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                </ComboboxItem>
              ))}
            </ComboboxGroup>

            <ComboboxSeparator />

            <button
              type="button"
              onClick={handleAddNewAddress}
              className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>Legg til ny adresse</span>
            </button>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      <AddressDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleAddressCreated}
      />
    </>
  );
}

function formatAddressLabel(address: Address): string {
  if (address.nickname) {
    return `${address.nickname} - ${address.street_address}`;
  }
  return `${address.street_address}, ${address.city}`;
}