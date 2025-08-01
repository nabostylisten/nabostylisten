"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/kibo-ui/spinner";
import { ServiceCategoryCombobox } from "@/components/service-category-combobox";
import {
  createService,
  updateService,
  getServiceCategories,
} from "@/server/service.actions";
import { servicesInsertSchema } from "@/schemas/database.schema";
import type { Database } from "@/types/database.types";

type Service = Database["public"]["Tables"]["services"]["Row"];

// Create a form schema based on the database schema but with some modifications
const serviceFormSchema = servicesInsertSchema
  .omit({
    id: true,
    stylist_id: true,
    created_at: true,
    updated_at: true,
  })
  .extend({
    category_id: z.string().min(1, "Du må velge minst én kategori"),
    title: z
      .string()
      .min(1, "Tittel er påkrevd")
      .max(100, "Tittel kan ikke være lengre enn 100 tegn"),
    description: z
      .string()
      .max(500, "Beskrivelse kan ikke være lengre enn 500 tegn")
      .optional()
      .nullable(),
    price: z
      .number()
      .min(1, "Pris må være større enn 0")
      .max(10000, "Pris kan ikke være mer enn 10 000 kr"),
    duration_minutes: z
      .number()
      .min(15, "Varighet må være minst 15 minutter")
      .max(480, "Varighet kan ikke være mer enn 8 timer"),
    at_customer_place: z.boolean().optional(),
    at_stylist_place: z.boolean().optional(),
  })
  .refine((data) => data.at_customer_place || data.at_stylist_place, {
    message: "Du må velge minst ett sted hvor tjenesten kan utføres",
    path: ["at_customer_place"],
  });

type ServiceFormData = z.infer<typeof serviceFormSchema>;

interface ServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  service?: Service;
  onSuccess?: () => void;
}

export function ServiceForm({
  open,
  onOpenChange,
  mode,
  service,
  onSuccess,
}: ServiceFormProps) {
  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      title: service?.title || "",
      description: service?.description || "",
      price: service?.price || undefined,
      duration_minutes: service?.duration_minutes || undefined,
      category_id: service?.category_id || "",
      at_customer_place: service?.at_customer_place || false,
      at_stylist_place: service?.at_stylist_place || true,
    },
  });

  // Fetch service categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const result = await getServiceCategories();
      if (result.error) {
        throw new Error(
          typeof result.error === "string" ? result.error : result.error.message
        );
      }
      return result.data || [];
    },
  });

  // Create service mutation
  const createMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      const result = await createService({
        ...data,
        stylist_id: "", // Will be set by server action
      });
      if (result.error) {
        throw new Error(
          typeof result.error === "string" ? result.error : result.error.message
        );
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Tjeneste opprettet!");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Feil ved opprettelse: ${error.message}`);
    },
  });

  // Update service mutation
  const updateMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      if (!service?.id) {
        throw new Error("Service ID is required for updates");
      }
      const result = await updateService(service.id, data);
      if (result.error) {
        throw new Error(
          typeof result.error === "string" ? result.error : result.error.message
        );
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Tjeneste oppdatert!");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Feil ved oppdatering: ${error.message}`);
    },
  });

  const onSubmit = (data: ServiceFormData) => {
    if (mode === "create") {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Reset form when service prop changes (for edit mode)
  React.useEffect(() => {
    if (service && mode === "edit") {
      form.reset({
        title: service.title,
        description: service.description,
        price: service.price,
        duration_minutes: service.duration_minutes,
        category_id: service.category_id,
        at_customer_place: service.at_customer_place,
        at_stylist_place: service.at_stylist_place,
      });
    } else if (mode === "create") {
      form.reset({
        title: "",
        description: "",
        price: undefined,
        duration_minutes: undefined,
        category_id: "",
        at_customer_place: false,
        at_stylist_place: true,
      });
    }
  }, [service, mode, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Ny tjeneste" : "Rediger tjeneste"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Legg til en ny tjeneste du tilbyr"
              : "Oppdater informasjonen om tjenesten din"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tittel *</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. Klipp og føn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beskrivelse</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Beskriv tjenesten din i detalj..."
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pris (kr) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="500"
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === "" ? undefined : Number(value)
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Varighet (minutter) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="15"
                        max="480"
                        step="15"
                        placeholder="60"
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === "" ? undefined : Number(value)
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori *</FormLabel>
                  <FormControl>
                    {categoriesLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Spinner className="w-4 h-4" />
                        <span className="ml-2">Laster kategorier...</span>
                      </div>
                    ) : (
                      <ServiceCategoryCombobox
                        selectedCategories={field.value ? [field.value] : []}
                        onSelectedCategoriesChange={(categories) => {
                          field.onChange(categories[0] || "");
                        }}
                        categories={categoriesData || []}
                        placeholder="Velg en kategori"
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Hvor kan tjenesten utføres? *</FormLabel>

              <FormField
                control={form.control}
                name="at_stylist_place"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>På min salong/arbeidssted</FormLabel>
                      <FormDescription>Kunden kommer til deg</FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="at_customer_place"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Hjemme hos kunden</FormLabel>
                      <FormDescription>Du reiser til kunden</FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormMessage>
                {form.formState.errors.at_customer_place?.message}
              </FormMessage>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Spinner className="w-4 h-4 mr-2" />}
                {mode === "create" ? "Opprett tjeneste" : "Oppdater tjeneste"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
