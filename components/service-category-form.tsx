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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/kibo-ui/spinner";
import {
  createServiceCategory,
  updateServiceCategory,
  getAllServiceCategories,
} from "@/server/service-category.actions";
import { serviceCategoriesInsertSchema } from "@/schemas/database.schema";
import type { Database } from "@/types/database.types";

type ServiceCategory =
  Database["public"]["Tables"]["service_categories"]["Row"];

// Create a form schema based on the database schema
const categoryFormSchema = serviceCategoriesInsertSchema
  .omit({
    id: true,
  })
  .extend({
    name: z
      .string()
      .min(1, "Navn er påkrevd")
      .max(50, "Navn kan ikke være lengre enn 50 tegn"),
    description: z
      .string()
      .max(200, "Beskrivelse kan ikke være lengre enn 200 tegn")
      .optional()
      .nullable(),
    parent_category_id: z.string().optional().nullable(),
  });

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface ServiceCategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  category?: ServiceCategory;
  onSuccess?: () => void;
}

export function ServiceCategoryForm({
  open,
  onOpenChange,
  mode,
  category,
  onSuccess,
}: ServiceCategoryFormProps) {
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
      parent_category_id: category?.parent_category_id || null,
    },
  });

  // Fetch all categories for parent selection
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["all-service-categories"],
    queryFn: async () => {
      const result = await getAllServiceCategories();
      if (result.error) {
        throw new Error(
          typeof result.error === "string" ? result.error : result.error.message
        );
      }
      return result.data || [];
    },
  });

  // Filter out current category and its descendants from parent options
  const availableParentCategories = React.useMemo(() => {
    if (!categoriesData || mode === "create") return categoriesData || [];

    // For edit mode, exclude the current category and its descendants
    const excludeIds = new Set<string>();
    excludeIds.add(category!.id);

    // Find all descendants
    const findDescendants = (parentId: string) => {
      categoriesData.forEach((cat) => {
        if (cat.parent_category_id === parentId && !excludeIds.has(cat.id)) {
          excludeIds.add(cat.id);
          findDescendants(cat.id);
        }
      });
    };

    findDescendants(category!.id);

    return categoriesData.filter((cat) => !excludeIds.has(cat.id));
  }, [categoriesData, category, mode]);

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const result = await createServiceCategory({
        ...data,
        parent_category_id: data.parent_category_id || null,
      });
      if (result.error) {
        throw new Error(
          typeof result.error === "string" ? result.error : result.error.message
        );
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Kategori opprettet!");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Feil ved opprettelse: ${error.message}`);
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      if (!category?.id) {
        throw new Error("Category ID is required for updates");
      }
      const result = await updateServiceCategory(category.id, {
        ...data,
        parent_category_id: data.parent_category_id || null,
      });
      if (result.error) {
        throw new Error(
          typeof result.error === "string" ? result.error : result.error.message
        );
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Kategori oppdatert!");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Feil ved oppdatering: ${error.message}`);
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    if (mode === "create") {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Reset form when category prop changes (for edit mode)
  React.useEffect(() => {
    if (category && mode === "edit") {
      form.reset({
        name: category.name,
        description: category.description,
        parent_category_id: category.parent_category_id,
      });
    } else if (mode === "create") {
      form.reset({
        name: "",
        description: "",
        parent_category_id: null,
      });
    }
  }, [category, mode, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Ny kategori" : "Rediger kategori"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Opprett en ny tjenestekategori"
              : "Oppdater informasjonen om kategorien"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Navn *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="F.eks. Hår, Negler, Sminke"
                      {...field}
                    />
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
                      placeholder="Beskriv kategorien..."
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parent_category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overordnet kategori</FormLabel>
                  <FormControl>
                    {categoriesLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Spinner className="w-4 h-4" />
                        <span className="ml-2">Laster kategorier...</span>
                      </div>
                    ) : (
                      <Select
                        value={field.value || "none"}
                        onValueChange={(value) =>
                          field.onChange(value === "none" ? null : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Velg overordnet kategori (valgfritt)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            Ingen overordnet kategori
                          </SelectItem>
                          {availableParentCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormControl>
                  <FormDescription>
                    La stå tom for å lage en hovedkategori
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {mode === "create" ? "Opprett kategori" : "Oppdater kategori"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
