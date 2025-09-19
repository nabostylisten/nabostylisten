"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { MapPin } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { AddressForm, AddressFormValues } from "./address-form";
import { createAddress, updateAddress } from "@/server/addresses.actions";
import type { Database } from "@/types/database.types";

const addressFormSchema = z.object({
  nickname: z.string().optional(),
  fullAddress: z.string().min(1, "Adresse er påkrevet"),
  street_address: z.string().min(1, "Gateadresse er påkrevet"),
  city: z.string().min(1, "By er påkrevet"),
  postal_code: z.string().min(4, "Postnummer må være minst 4 siffer"),
  country: z.string().min(1, "Land er påkrevet"),
  entry_instructions: z.string().optional(),
  is_primary: z.boolean(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});

type Address = Database["public"]["Tables"]["addresses"]["Row"];
type UpdateAddressData = Omit<
  Database["public"]["Tables"]["addresses"]["Update"],
  "id" | "user_id" | "created_at" | "updated_at"
>;

interface AddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (addressId: string) => void;
  address?: Address; // If provided, dialog will be in update mode
  mode?: "create" | "update";
}

export function AddressDialog({
  open,
  onOpenChange,
  onSuccess,
  address,
  mode = "create",
}: AddressDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const actualMode = address ? "update" : mode;

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      nickname: "",
      fullAddress: "",
      street_address: "",
      city: "",
      postal_code: "",
      country: "Norge",
      entry_instructions: "",
      is_primary: false,
    },
  });

  // Populate form when address is provided (update mode)
  useEffect(() => {
    if (address) {
      form.reset({
        nickname: address.nickname || "",
        fullAddress: `${address.street_address}, ${address.postal_code} ${address.city}`,
        street_address: address.street_address,
        city: address.city,
        postal_code: address.postal_code,
        country: address.country,
        entry_instructions: address.entry_instructions || "",
        is_primary: address.is_primary,
      });
    } else {
      // Reset form for create mode
      form.reset({
        nickname: "",
        fullAddress: "",
        street_address: "",
        city: "",
        postal_code: "",
        country: "Norge",
        entry_instructions: "",
        is_primary: false,
      });
    }
  }, [address, form]);

  const createAddressMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        toast.success("Adresse lagt til!");
        form.reset();
        onSuccess?.(result.data.id);
        onOpenChange(false);
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "En feil oppstod ved lagring av adressen"
      );
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAddressData }) =>
      updateAddress(id, data),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        toast.success("Adresse oppdatert!");
        onSuccess?.(result.data.id);
        onOpenChange(false);
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "En feil oppstod ved oppdatering av adressen"
      );
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (values: AddressFormValues) => {
    setIsSubmitting(true);

    // Prepare the data for submission
    const addressData = {
      nickname: values.nickname || undefined,
      street_address: values.street_address,
      city: values.city,
      postal_code: values.postal_code,
      country: values.country,
      entry_instructions: values.entry_instructions || undefined,
      is_primary: values.is_primary,
      // If we have coordinates, format them for PostGIS
      location: values.location
        ? (`POINT(${values.location.lng} ${values.location.lat})` as unknown as string)
        : undefined,
    };

    if (actualMode === "update" && address) {
      updateAddressMutation.mutate({ id: address.id, data: addressData });
    } else {
      createAddressMutation.mutate(addressData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] overflow-y-scroll max-h-screen">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {actualMode === "update"
              ? "Rediger adresse"
              : "Legg til ny adresse"}
          </DialogTitle>
          <DialogDescription>
            {actualMode === "update"
              ? "Oppdater adresseinformasjonen."
              : "Legg til en ny adresse som kan brukes for bookinger og leveranser."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <AddressForm form={form} />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? actualMode === "update"
                    ? "Oppdaterer..."
                    : "Lagrer..."
                  : actualMode === "update"
                    ? "Oppdater adresse"
                    : "Legg til adresse"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
