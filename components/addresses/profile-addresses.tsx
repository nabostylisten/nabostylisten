"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MapPin, Plus, Trash2, Check, MoreVertical, Edit } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddressDialog } from "./address-dialog";
import {
  getUserAddresses,
  deleteAddress,
  setPrimaryAddress,
} from "@/server/addresses.actions";
import type { Database } from "@/types/database.types";

type Address = Database["public"]["Tables"]["addresses"]["Row"];

export function ProfileAddresses() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editAddress, setEditAddress] = useState<Address | null>(null);
  const [deleteConfirmAddress, setDeleteConfirmAddress] = useState<Address | null>(null);
  const queryClient = useQueryClient();

  // Fetch user addresses
  const { data: addressesData, isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: getUserAddresses,
  });

  const addresses = addressesData?.data || [];

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Adresse slettet");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Kunne ikke slette adressen"
      );
    },
  });

  // Set primary address mutation
  const setPrimaryMutation = useMutation({
    mutationFn: setPrimaryAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Primæradresse oppdatert");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Kunne ikke oppdatere primæradresse"
      );
    },
  });

  const handleAddressCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["addresses"] });
    setShowAddDialog(false);
  };

  const handleAddressUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["addresses"] });
    setEditAddress(null);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmAddress) {
      deleteAddressMutation.mutate(deleteConfirmAddress.id);
      setDeleteConfirmAddress(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mine adresser
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Mine adresser
              </CardTitle>
              <CardDescription>
                Administrer dine leveringsadresser for bookinger
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Legg til adresse
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Du har ikke lagt til noen adresser ennå
              </p>
              <Button onClick={() => setShowAddDialog(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Legg til din første adresse
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  onEdit={() => setEditAddress(address)}
                  onDelete={() => setDeleteConfirmAddress(address)}
                  onSetPrimary={() => setPrimaryMutation.mutate(address.id)}
                  isDeleting={deleteAddressMutation.isPending}
                  isSettingPrimary={setPrimaryMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddressDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleAddressCreated}
      />

      <AddressDialog
        open={!!editAddress}
        onOpenChange={(open) => !open && setEditAddress(null)}
        onSuccess={handleAddressUpdated}
        address={editAddress || undefined}
        mode="update"
      />

      <AlertDialog
        open={!!deleteConfirmAddress}
        onOpenChange={(open) => !open && setDeleteConfirmAddress(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett adresse</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette denne adressen?{" "}
              <strong>
                {deleteConfirmAddress?.nickname || deleteConfirmAddress?.street_address}
              </strong>
              <br />
              Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Slett adresse
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface AddressCardProps {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetPrimary: () => void;
  isDeleting: boolean;
  isSettingPrimary: boolean;
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetPrimary,
  isDeleting,
  isSettingPrimary,
}: AddressCardProps) {
  return (
    <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex gap-3">
        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">
              {address.nickname || address.street_address}
            </p>
            {address.is_primary && (
              <Badge variant="default" className="text-xs">
                Primær
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {address.street_address}
          </p>
          <p className="text-sm text-muted-foreground">
            {address.postal_code} {address.city}, {address.country}
          </p>
          {address.entry_instructions && (
            <p className="text-xs text-muted-foreground mt-2">
              <span className="font-medium">Adgangsinstruksjoner:</span>{" "}
              {address.entry_instructions}
            </p>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={isDeleting || isSettingPrimary}
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Åpne meny</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Handlinger</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Rediger
          </DropdownMenuItem>
          {!address.is_primary && (
            <DropdownMenuItem onClick={onSetPrimary}>
              <Check className="h-4 w-4 mr-2" />
              Sett som primær
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Slett adresse
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
