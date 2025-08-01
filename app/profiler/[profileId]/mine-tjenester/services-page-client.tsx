"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Edit, Trash2, Scissors } from "lucide-react";
import { ServiceForm } from "@/components/service-form";
import { deleteService } from "@/server/service.actions";
import type { Database } from "@/types/database.types";

type Service = Database["public"]["Tables"]["services"]["Row"] & {
  service_categories?: {
    name: string;
    description?: string | null;
  } | null;
};

interface ServicesPageClientProps {
  services: Service[];
  profileId: string;
}

export function ServicesPageClient({
  services,
  profileId,
}: ServicesPageClientProps) {
  const [serviceFormOpen, setServiceFormOpen] = React.useState(false);
  const [serviceFormMode, setServiceFormMode] = React.useState<
    "create" | "edit"
  >("create");
  const [selectedService, setSelectedService] = React.useState<
    Service | undefined
  >();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [serviceToDelete, setServiceToDelete] = React.useState<
    Service | undefined
  >();

  const queryClient = useQueryClient();

  // Delete service mutation
  const deleteMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const result = await deleteService(serviceId);
      if (result.error) {
        throw new Error(
          typeof result.error === "string" ? result.error : result.error.message
        );
      }
    },
    onSuccess: () => {
      toast.success("Tjeneste slettet!");
      setDeleteDialogOpen(false);
      setServiceToDelete(undefined);
      // Refresh the page
      window.location.reload();
    },
    onError: (error) => {
      toast.error(`Feil ved sletting: ${error.message}`);
    },
  });

  const handleCreateService = () => {
    setServiceFormMode("create");
    setSelectedService(undefined);
    setServiceFormOpen(true);
  };

  const handleEditService = (service: Service) => {
    setServiceFormMode("edit");
    setSelectedService(service);
    setServiceFormOpen(true);
  };

  const handleDeleteService = (service: Service) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (serviceToDelete) {
      deleteMutation.mutate(serviceToDelete.id);
    }
  };

  const handleFormSuccess = () => {
    // Refresh the page to show updated data
    window.location.reload();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Scissors className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Mine tjenester</h1>
            <p className="text-muted-foreground mt-1">
              Administrer dine tjenester og priser
            </p>
          </div>
        </div>
        <Button
          onClick={handleCreateService}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ny tjeneste
        </Button>
      </div>

      {services && services.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="secondary">
                        {service.service_categories?.name || "Ukategorisert"}
                      </Badge>
                      {service.at_customer_place && (
                        <Badge variant="outline">Hjemme hos kunde</Badge>
                      )}
                      {service.at_stylist_place && (
                        <Badge variant="outline">På salong</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditService(service)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteService(service)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {service.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {service.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">
                    {service.price} kr
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {service.duration_minutes} min
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Scissors className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen tjenester ennå</h3>
            <p className="text-muted-foreground text-center mb-4">
              Du har ikke lagt til noen tjenester ennå. Kom i gang ved å
              opprette din første tjeneste.
            </p>
            <Button
              onClick={handleCreateService}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Legg til første tjeneste
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Service Form Modal */}
      <ServiceForm
        open={serviceFormOpen}
        onOpenChange={setServiceFormOpen}
        mode={serviceFormMode}
        service={selectedService}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett tjeneste</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette tjenesten "
              {serviceToDelete?.title}"? Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Sletter..." : "Slett"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
