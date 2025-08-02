"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
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
  service_service_categories?: Array<{
    service_categories: {
      id: string;
      name: string;
      description?: string | null;
    };
  }>;
};

interface ServicesPageClientProps {
  services: Service[];
  profileId: string;
}

export function ServicesPageClient({ services }: ServicesPageClientProps) {
  console.log(services);
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
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((service) => (
            <Card
              key={service.id}
              className="flex flex-col hover:shadow-lg transition-shadow duration-200"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl font-semibold text-foreground mb-3 line-clamp-2">
                      {service.title}
                    </CardTitle>
                    <div className="flex flex-col gap-2">
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground mb-1 block">
                          Kategorier
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {service.service_service_categories?.length ? (
                            service.service_service_categories.map(
                              (relation) => (
                                <Badge
                                  key={relation.service_categories.id}
                                  variant="secondary"
                                  className="text-xs font-medium"
                                >
                                  {relation.service_categories.name}
                                </Badge>
                              )
                            )
                          ) : (
                            <Badge
                              variant="secondary"
                              className="text-xs font-medium"
                            >
                              Ukategorisert
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground mb-1 block">
                          Leveringssted
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {service.at_customer_place && (
                            <Badge variant="outline" className="text-xs">
                              Hjemme hos kunde
                            </Badge>
                          )}
                          {service.at_stylist_place && (
                            <Badge variant="outline" className="text-xs">
                              På salong
                            </Badge>
                          )}
                          {!service.at_customer_place &&
                            !service.at_stylist_place && (
                              <Badge variant="outline" className="text-xs">
                                Ikke spesifisert
                              </Badge>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-3 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditService(service)}
                      className="h-8 w-8 p-0 hover:bg-muted"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteService(service)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between pt-0 pb-4">
                {service.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-2">
                    {service.description}
                  </p>
                )}
                <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Pris
                    </span>
                    <span className="text-xl font-bold text-foreground">
                      {service.price} kr
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Varighet
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {service.duration_minutes} minutter
                    </span>
                  </div>
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
              Er du sikker på at du vil slette tjenesten{" "}
              <span className="font-bold">{serviceToDelete?.title}</span>? Denne
              handlingen kan ikke angres.
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
