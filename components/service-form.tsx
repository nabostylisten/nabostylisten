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
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/kibo-ui/dropzone";
import { ServiceCategoryCombobox } from "@/components/service-category-combobox";
import { ServiceImageCarousel } from "@/components/service-image-carousel";
import { useUploadServiceImages } from "@/hooks/use-upload-service-images";
import {
  createService,
  updateService,
  getServiceCategories,
} from "@/server/service.actions";
import { servicesInsertSchema } from "@/schemas/database.schema";
import type { Database } from "@/types/database.types";

type Service = Database["public"]["Tables"]["services"]["Row"] & {
  service_service_categories?: Array<{
    service_categories: {
      id: string;
      name: string;
      description?: string | null;
    };
  }>;
  includes?: string[] | null;
  requirements?: string[] | null;
};

// Create a form schema based on the database schema but with some modifications
const serviceFormSchema = servicesInsertSchema
  .omit({
    id: true,
    stylist_id: true,
    created_at: true,
    updated_at: true,
  })
  .extend({
    category_ids: z.array(z.string()).min(1, "Du må velge minst én kategori"),
    title: z
      .string()
      .min(1, "Tittel er påkrevd")
      .max(100, "Tittel kan ikke være lengre enn 100 tegn"),
    description: z
      .string()
      .max(500, "Beskrivelse kan ikke være lengre enn 500 tegn")
      .optional()
      .nullable(),
    price: z.number().min(1, "Pris må være større enn 0"),
    duration_minutes: z
      .number()
      .min(15, "Varighet må være minst 15 minutter")
      .max(480, "Varighet kan ikke være mer enn 8 timer"),
    at_customer_place: z.boolean().optional(),
    at_stylist_place: z.boolean().optional(),
    includes: z.array(z.string().min(1)).optional(),
    requirements: z.array(z.string().min(1)).optional(),
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
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);
  const [fileProcessing, setFileProcessing] = React.useState(false);
  
  // State for includes and requirements management
  const [newInclude, setNewInclude] = React.useState("");
  const [newRequirement, setNewRequirement] = React.useState("");
  const [deleteIncludeIndex, setDeleteIncludeIndex] = React.useState<number | null>(null);
  const [deleteRequirementIndex, setDeleteRequirementIndex] = React.useState<number | null>(null);
  const [editIncludeIndex, setEditIncludeIndex] = React.useState<number | null>(null);
  const [editRequirementIndex, setEditRequirementIndex] = React.useState<number | null>(null);
  const [editIncludeValue, setEditIncludeValue] = React.useState("");
  const [editRequirementValue, setEditRequirementValue] = React.useState("");

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      title: service?.title || "",
      description: service?.description || "",
      price: service?.price || undefined,
      duration_minutes: service?.duration_minutes || undefined,
      category_ids:
        service?.service_service_categories?.map(
          (rel) => rel.service_categories.id
        ) || [],
      at_customer_place: service?.at_customer_place || false,
      at_stylist_place: service?.at_stylist_place || true,
      includes: service?.includes || [],
      requirements: service?.requirements || [],
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

  // Upload service images mutation
  const uploadImagesMutation = useUploadServiceImages();

  // Create service mutation
  const createMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      const result = await createService(data);
      if (result.error) {
        throw new Error(
          typeof result.error === "string" ? result.error : result.error.message
        );
      }
      return result.data;
    },
    onSuccess: async (data) => {
      toast.success("Tjeneste opprettet!");

      // Upload images if any were selected
      if (uploadedFiles.length > 0 && data?.id) {
        try {
          toast.info(`Laster opp ${uploadedFiles.length} bilde(r)...`);
          await uploadImagesMutation.mutateAsync({
            serviceId: data.id,
            files: uploadedFiles,
          });
        } catch (error) {
          console.error("Failed to upload images:", error);
          toast.error("Kunne ikke laste opp bilder");
        }
      }

      form.reset();
      setUploadedFiles([]);
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
    onSuccess: async () => {
      toast.success("Tjeneste oppdatert!");

      // Upload images if any were selected
      if (uploadedFiles.length > 0 && service?.id) {
        try {
          toast.info(`Laster opp ${uploadedFiles.length} bilde(r)...`);
          await uploadImagesMutation.mutateAsync({
            serviceId: service.id,
            files: uploadedFiles,
          });
        } catch (error) {
          console.error("Failed to upload images:", error);
          toast.error("Kunne ikke laste opp bilder");
        }
      }

      setUploadedFiles([]);
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Feil ved oppdatering: ${error.message}`);
    },
  });

  const handleDrop = async (files: File[]) => {
    setFileProcessing(true);
    const processedFiles: File[] = [];

    try {
      for (const file of files) {
        // Validate file type immediately
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
          toast.error(
            `Filtype ${file.type} er ikke tillatt. Tillatte typer: JPG, PNG, WebP`
          );
          continue;
        }

        // Validate file size
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          toast.error(
            `Filen "${file.name}" er for stor. Maksimal størrelse er 10MB`
          );
          continue;
        }

        toast.success(`Behandler bilde: ${file.name}`);

        try {
          // Compress the image
          const { default: imageCompression } = await import(
            "browser-image-compression"
          );
          const compressedFile = await imageCompression(file, {
            maxSizeMB: 10,
            maxWidthOrHeight: 2048,
            useWebWorker: true,
            fileType: file.type,
          });

          const compressionRatio = (
            ((file.size - compressedFile.size) / file.size) *
            100
          ).toFixed(1);
          if (compressedFile.size < file.size) {
            toast.success(
              `Bilde komprimert: ${file.name} (${compressionRatio}% mindre)`
            );
          } else {
            toast.success(`Bilde klar: ${file.name}`);
          }

          processedFiles.push(compressedFile);
        } catch (compressionError) {
          console.error("Compression failed:", compressionError);
          toast.warning(`Kunne ikke komprimere ${file.name}, bruker original`);
          processedFiles.push(file);
        }
      }

      if (processedFiles.length > 0) {
        setUploadedFiles(processedFiles);
        toast.success(`${processedFiles.length} bilde(r) klar for opplasting`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Feil ved behandling av filer";
      toast.error("En feil oppstod ved behandling av filer", {
        description: message,
      });
    } finally {
      setFileProcessing(false);
    }
  };

  const onSubmit = (data: ServiceFormData) => {
    if (mode === "create") {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const isLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    uploadImagesMutation.isPending ||
    fileProcessing;

  // Reset form when service prop changes (for edit mode)
  React.useEffect(() => {
    if (service && mode === "edit") {
      form.reset({
        title: service.title,
        description: service.description,
        price: service.price,
        duration_minutes: service.duration_minutes,
        category_ids:
          service.service_service_categories?.map(
            (rel) => rel.service_categories.id
          ) || [],
        at_customer_place: service.at_customer_place,
        at_stylist_place: service.at_stylist_place,
        includes: service.includes || [],
        requirements: service.requirements || [],
      });
    } else if (mode === "create") {
      form.reset({
        title: "",
        description: "",
        price: undefined,
        duration_minutes: undefined,
        category_ids: [],
        at_customer_place: false,
        at_stylist_place: true,
        includes: [],
        requirements: [],
      });
    }
    setUploadedFiles([]);
  }, [service, mode, form]);

  // Helper functions for managing includes and requirements
  const addInclude = () => {
    if (newInclude.trim()) {
      const currentIncludes = form.getValues().includes || [];
      form.setValue("includes", [...currentIncludes, newInclude.trim()]);
      setNewInclude("");
    }
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      const currentRequirements = form.getValues().requirements || [];
      form.setValue("requirements", [...currentRequirements, newRequirement.trim()]);
      setNewRequirement("");
    }
  };

  const deleteInclude = (index: number) => {
    const currentIncludes = form.getValues().includes || [];
    if (index >= 0 && index < currentIncludes.length) {
      const updatedIncludes = currentIncludes.filter((_, i) => i !== index);
      form.setValue("includes", updatedIncludes);
    }
    setDeleteIncludeIndex(null);
  };

  const deleteRequirement = (index: number) => {
    const currentRequirements = form.getValues().requirements || [];
    if (index >= 0 && index < currentRequirements.length) {
      const updatedRequirements = currentRequirements.filter((_, i) => i !== index);
      form.setValue("requirements", updatedRequirements);
    }
    setDeleteRequirementIndex(null);
  };

  const startEditInclude = (index: number, value: string) => {
    setEditIncludeIndex(index);
    setEditIncludeValue(value);
  };

  const startEditRequirement = (index: number, value: string) => {
    setEditRequirementIndex(index);
    setEditRequirementValue(value);
  };

  const saveEditInclude = () => {
    if (editIncludeIndex !== null && editIncludeValue.trim()) {
      const currentIncludes = form.getValues().includes || [];
      if (editIncludeIndex < currentIncludes.length) {
        const updatedIncludes = [...currentIncludes];
        updatedIncludes[editIncludeIndex] = editIncludeValue.trim();
        form.setValue("includes", updatedIncludes);
      }
      setEditIncludeIndex(null);
      setEditIncludeValue("");
    }
  };

  const saveEditRequirement = () => {
    if (editRequirementIndex !== null && editRequirementValue.trim()) {
      const currentRequirements = form.getValues().requirements || [];
      if (editRequirementIndex < currentRequirements.length) {
        const updatedRequirements = [...currentRequirements];
        updatedRequirements[editRequirementIndex] = editRequirementValue.trim();
        form.setValue("requirements", updatedRequirements);
      }
      setEditRequirementIndex(null);
      setEditRequirementValue("");
    }
  };

  const cancelEdit = () => {
    setEditIncludeIndex(null);
    setEditRequirementIndex(null);
    setEditIncludeValue("");
    setEditRequirementValue("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
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
              name="category_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategorier *</FormLabel>
                  <FormControl>
                    {categoriesLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Spinner className="w-4 h-4" />
                        <span className="ml-2">Laster kategorier...</span>
                      </div>
                    ) : (
                      <ServiceCategoryCombobox
                        selectedCategories={field.value || []}
                        onSelectedCategoriesChange={(categories) => {
                          field.onChange(categories);
                        }}
                        categories={categoriesData || []}
                        placeholder="Velg kategorier"
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Includes Section */}
            <div className="space-y-4">
              <FormLabel>Hva er inkludert i tjenesten</FormLabel>
              <FormDescription>
                Legg til hva kunder får inkludert når de bestiller denne tjenesten
              </FormDescription>
              
              {/* Add new include */}
              <div className="flex gap-2">
                <Input
                  placeholder="F.eks. Konsultasjon og fargeråd"
                  value={newInclude}
                  onChange={(e) => setNewInclude(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addInclude();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addInclude}
                  disabled={!newInclude.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Display current includes */}
              {(form.watch("includes")?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  {form.watch("includes")?.map((include: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      {editIncludeIndex === index ? (
                        <>
                          <Input
                            value={editIncludeValue}
                            onChange={(e) => setEditIncludeValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                saveEditInclude();
                              } else if (e.key === "Escape") {
                                cancelEdit();
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={saveEditInclude}
                            disabled={!editIncludeValue.trim()}
                          >
                            Lagre
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                          >
                            Avbryt
                          </Button>
                        </>
                      ) : (
                        <>
                          <Badge variant="secondary" className="flex-1 justify-start cursor-pointer"
                            onClick={() => startEditInclude(index, include)}
                          >
                            {include}
                          </Badge>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteIncludeIndex(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Requirements Section */}
            <div className="space-y-4">
              <FormLabel>Krav for hjemmetjeneste</FormLabel>
              <FormDescription>
                Legg til krav som må være oppfylt når tjenesten utføres hjemme hos kunden
              </FormDescription>
              
              {/* Add new requirement */}
              <div className="flex gap-2">
                <Input
                  placeholder="F.eks. Tilgang til vask og strøm"
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRequirement();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRequirement}
                  disabled={!newRequirement.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Display current requirements */}
              {(form.watch("requirements")?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  {form.watch("requirements")?.map((requirement: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      {editRequirementIndex === index ? (
                        <>
                          <Input
                            value={editRequirementValue}
                            onChange={(e) => setEditRequirementValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                saveEditRequirement();
                              } else if (e.key === "Escape") {
                                cancelEdit();
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={saveEditRequirement}
                            disabled={!editRequirementValue.trim()}
                          >
                            Lagre
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                          >
                            Avbryt
                          </Button>
                        </>
                      ) : (
                        <>
                          <Badge variant="secondary" className="flex-1 justify-start cursor-pointer"
                            onClick={() => startEditRequirement(index, requirement)}
                          >
                            {requirement}
                          </Badge>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteRequirementIndex(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <FormLabel>Bilder av tjenesten</FormLabel>
              <FormDescription>
                Last opp bilder som viser resultatet av tjenesten din
              </FormDescription>
              <Dropzone
                accept={{ "image/*": [] }}
                maxFiles={5}
                maxSize={1024 * 1024 * 10} // 10MB
                minSize={1024} // 1KB
                onDrop={handleDrop}
                onError={(error) => {
                  toast.error(`Feil ved opplasting: ${error.message}`);
                }}
                src={uploadedFiles}
                disabled={isLoading}
              >
                <DropzoneEmptyState>
                  {fileProcessing ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      </div>
                      <p className="my-2 w-full truncate text-wrap font-medium text-sm">
                        Behandler bilder...
                      </p>
                      <p className="w-full truncate text-wrap text-muted-foreground text-xs">
                        Komprimerer og validerer filer
                      </p>
                    </div>
                  ) : null}
                </DropzoneEmptyState>
                <DropzoneContent />
              </Dropzone>

              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">
                    {uploadedFiles.length} bilde(r) klar for opplasting:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md text-sm"
                      >
                        <span className="truncate max-w-[200px]">
                          {file.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(1)}MB
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = [...uploadedFiles];
                            newFiles.splice(index, 1);
                            setUploadedFiles(newFiles);
                            toast.success("Bilde fjernet");
                          }}
                          className="text-muted-foreground hover:text-destructive ml-1"
                          disabled={isLoading}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Existing images section (only in edit mode) */}
            {mode === "edit" && service?.id && (
              <div className="space-y-4">
                <FormLabel>Eksisterende bilder</FormLabel>
                <FormDescription>
                  Administrer eksisterende bilder for tjenesten. Klikk på
                  stjernen for å sette hovedbilde, eller søppelbøtta for å
                  slette.
                </FormDescription>
                <div onSubmit={(e) => e.preventDefault()}>
                  <ServiceImageCarousel
                    serviceId={service.id}
                    isEditable={true}
                    className="w-full"
                  />
                </div>
              </div>
            )}

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

        {/* Delete Include Confirmation Dialog */}
        <AlertDialog open={deleteIncludeIndex !== null} onOpenChange={() => setDeleteIncludeIndex(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Slett inkludert element</AlertDialogTitle>
              <AlertDialogDescription>
                Er du sikker på at du vil slette dette elementet? Denne handlingen kan ikke angres.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteIncludeIndex(null)}>
                Avbryt
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  if (deleteIncludeIndex !== null) {
                    deleteInclude(deleteIncludeIndex);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Slett
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Requirement Confirmation Dialog */}
        <AlertDialog open={deleteRequirementIndex !== null} onOpenChange={() => setDeleteRequirementIndex(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Slett krav</AlertDialogTitle>
              <AlertDialogDescription>
                Er du sikker på at du vil slette dette kravet? Denne handlingen kan ikke angres.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteRequirementIndex(null)}>
                Avbryt
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  if (deleteRequirementIndex !== null) {
                    deleteRequirement(deleteRequirementIndex);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Slett
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
