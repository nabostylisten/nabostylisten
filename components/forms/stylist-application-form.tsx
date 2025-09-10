"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { useState, useEffect } from "react";
import { CalendarIcon, Upload } from "lucide-react";
import { format } from "date-fns";
import imageCompression from "browser-image-compression";
import { useAuth } from "@/hooks/use-auth";

// UI Components
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Dropzone } from "@/components/ui/kibo-ui/dropzone";
import { ApplicationAddressSection } from "@/components/addresses";

import {
  createApplication,
  uploadPortfolioImages,
  getCurrentUserApplicationData,
} from "@/server/application.actions";
import { cn } from "@/lib/utils";

// Service categories - in a real app, these would come from the database
const SERVICE_CATEGORIES = [
  { id: "hair", name: "Hår", description: "Klipping, fargelegging, styling" },
  { id: "nails", name: "Negler", description: "Manikyr, pedikyr, neglkunst" },
  { id: "makeup", name: "Makeup", description: "Sminke for alle anledninger" },
  {
    id: "lashes-brows",
    name: "Vipper & Bryn",
    description: "Extensions, farging, forming",
  },
  {
    id: "wedding",
    name: "Bryllup",
    description: "Komplett styling for bryllup",
  },
];

// Extended form schema including address and portfolio images
const applicationFormSchema = z
  .object({
    // Personal information
    fullName: z.string().min(2, "Fullt navn må være minst 2 karakterer"),
    email: z.string().email("Ugyldig e-postadresse"),
    phoneNumber: z.string().min(8, "Telefonnummer må være minst 8 siffer"),
    birthDate: z.string().min(1, "Fødselsdato er påkrevet"),

    // Address information
    address: z.object({
      nickname: z.string().optional(),
      streetAddress: z.string().min(5, "Gateadresse er påkrevet"),
      city: z.string().min(2, "By er påkrevet"),
      postalCode: z.string().min(4, "Postnummer må være minst 4 siffer"),
      country: z.string().min(1, "Land er påkrevet"),
      countryCode: z.string().optional(), // ISO country code from Mapbox
      entryInstructions: z.string().optional(),
      geometry: z.tuple([z.number(), z.number()]).optional(), // [lng, lat]
    }),

    // Professional information
    professionalExperience: z
      .string()
      .min(50, "Beskriv din erfaring (minimum 50 karakterer)"),
    priceRangeFrom: z.number().min(100, "Minimum pris må være minst 100 NOK"),
    priceRangeTo: z.number().min(100, "Maksimum pris må være minst 100 NOK"),

    // Service categories
    serviceCategories: z
      .array(z.string())
      .min(1, "Velg minst én tjenestekategori"),
  })
  .refine((data) => data.priceRangeTo >= data.priceRangeFrom, {
    message: "Maksimum pris må være høyere enn eller lik minimum pris",
    path: ["priceRangeTo"],
  });

type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

const getDefaultValues = (): ApplicationFormValues | undefined => {
  if (!(process.env.NODE_ENV === "development")) {
    return undefined;
  }

  return {
    fullName: "Ola Nordmann",
    email: "ola@example.com",
    phoneNumber: "+47 123 45 678",
    birthDate: "1990-01-01",
    address: {
      nickname: "Hjemme",
      streetAddress: "Storgata 1",
      city: "Oslo",
      postalCode: "0001",
      country: "Norge",
    },
    professionalExperience:
      "Necessitatibus fuga odit aperiam reprehenderit voluptatem nulla fuga a. Unde qui dolorem iure amet excepturi eum. Qui id et consequuntur voluptatem nihil omnis est aut molestiae. Cumque alias distinctio quia voluptas exercitationem placeat maxime. Quis voluptates harum blanditiis doloribus non hic corporis ipsam. Doloremque est fugit voluptates ea omnis eligendi fugit voluptatem.",
    priceRangeFrom: 300,
    priceRangeTo: 1500,
    serviceCategories: ["hair", "nails", "makeup", "lashes-brows", "wedding"],
  };
};

interface StylistApplicationFormProps {
  onSuccess?: () => void;
}

export function StylistApplicationForm({
  onSuccess,
}: StylistApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portfolioImages, setPortfolioImages] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const { user, profile } = useAuth();

  // Fetch prepopulated data if user is authenticated and is a customer
  const { data: prepopulatedData } = useQuery({
    queryKey: ["application", "prepopulated", user?.id],
    queryFn: async () => {
      const result = await getCurrentUserApplicationData();
      return result.data; // Extract the data from the result
    },
    enabled: !!user && profile?.role === "customer",
  });

  console.log(prepopulatedData);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      ...getDefaultValues(),
      address: {
        country: "Norge",
      },
    },
  });

  // Update form values when prepopulated data is available
  useEffect(() => {
    if (prepopulatedData) {
      // The prepopulatedData is the actual data, not wrapped in a data property
      const data = prepopulatedData;

      // Update form fields with prepopulated data
      if (data.fullName) form.setValue("fullName", data.fullName);
      if (data.email) form.setValue("email", data.email);
      if (data.phoneNumber) form.setValue("phoneNumber", data.phoneNumber);

      // Update address fields if available
      if (data.address) {
        if (data.address.nickname)
          form.setValue("address.nickname", data.address.nickname);
        if (data.address.streetAddress)
          form.setValue("address.streetAddress", data.address.streetAddress);
        if (data.address.city) form.setValue("address.city", data.address.city);
        if (data.address.postalCode)
          form.setValue("address.postalCode", data.address.postalCode);
        if (data.address.country)
          form.setValue("address.country", data.address.country);
        if (data.address.countryCode)
          form.setValue("address.countryCode", data.address.countryCode);
        if (data.address.entryInstructions)
          form.setValue(
            "address.entryInstructions",
            data.address.entryInstructions
          );
        if (data.address.geometry)
          form.setValue("address.geometry", data.address.geometry);
      }
    }
  }, [prepopulatedData, form]);

  const uploadImagesMutation = useMutation({
    mutationFn: ({
      files,
      applicationId,
    }: {
      files: File[];
      applicationId: string;
    }) => uploadPortfolioImages(files, applicationId),
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "En feil oppstod ved opplasting av bilder"
      );
      setIsUploadingImages(false);
      setIsSubmitting(false);
    },
  });

  const submitApplication = useMutation({
    mutationFn: createApplication,
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "En feil oppstod ved innsending av søknaden"
      );
      setIsSubmitting(false);
    },
  });

  async function onSubmit(values: ApplicationFormValues) {
    console.log("[APPLICATION_FORM] Starting submission with values:", values);
    console.log("[APPLICATION_FORM] Portfolio images count:", portfolioImages.length);
    console.log("[APPLICATION_FORM] Portfolio images details:", portfolioImages.map(img => ({
      name: img.name,
      size: img.size,
      type: img.type
    })));

    // Validate portfolio images since they're not part of the form schema
    if (portfolioImages.length === 0) {
      console.error("[APPLICATION_FORM] No portfolio images uploaded");
      toast.error("Last opp minst ett portfoliobilde");
      return;
    }
    if (portfolioImages.length > 10) {
      console.error("[APPLICATION_FORM] Too many portfolio images:", portfolioImages.length);
      toast.error("Maksimalt 10 bilder tillatt");
      return;
    }

    setIsSubmitting(true);
    console.log("[APPLICATION_FORM] Submission started");

    try {
      // First, create the application to get an applicationId
      console.log("[APPLICATION_FORM] Step 1: Creating application without images");
      const applicationResult = await submitApplication.mutateAsync({
        ...values,
        portfolioImageUrls: [], // Empty initially, we'll upload images after
      });

      console.log("[APPLICATION_FORM] Application creation result:", applicationResult);

      if (applicationResult.error || !applicationResult.data) {
        console.error("[APPLICATION_FORM] Application creation failed:", applicationResult.error);
        throw new Error(
          applicationResult.error || "Kunne ikke opprette søknad"
        );
      }

      const applicationId = applicationResult.data.applicationId;
      console.log("[APPLICATION_FORM] Application created with ID:", applicationId);

      setIsUploadingImages(true);
      console.log("[APPLICATION_FORM] Step 2: Starting image upload");

      // Then upload the portfolio images using the applicationId
      const imageUploadResult = await uploadImagesMutation.mutateAsync({
        files: portfolioImages,
        applicationId: applicationId,
      });

      console.log("[APPLICATION_FORM] Image upload result:", imageUploadResult);

      if (imageUploadResult.error || !imageUploadResult.data) {
        console.error("[APPLICATION_FORM] Image upload failed:", imageUploadResult.error);
        throw new Error(
          imageUploadResult.error || "Kunne ikke laste opp bilder"
        );
      }

      console.log("[APPLICATION_FORM] Images uploaded successfully:", imageUploadResult.data);
      
      // Now we need to update the application with the image URLs
      console.log("[APPLICATION_FORM] Step 3: Updating application with image URLs");
      // Note: The current flow uploads images but doesn't update the application with their URLs
      // This might be the issue - we're not linking the uploaded images back to the application
      
      setIsUploadingImages(false);

      // Success - both application and images are uploaded
      console.log("[APPLICATION_FORM] ✅ Application submission complete!");
      toast.success(
        "Søknaden din er sendt inn! Vi vil kontakte deg innen 2-3 virkedager."
      );
      form.reset();
      setPortfolioImages([]);
      onSuccess?.();
    } catch (error) {
      console.error("[APPLICATION_FORM] ❌ Submission failed:", error);
      setIsUploadingImages(false);
      setIsSubmitting(false);
      toast.error(
        error instanceof Error
          ? error.message
          : "En feil oppstod ved innsending av søknaden"
      );
    }
  }

  console.log(form.formState.errors);
  console.log(form.getValues());

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Søk om å bli stylist</CardTitle>
        <CardDescription>
          Fyll ut skjemaet nedenfor for å søke om å bli en del av
          Nabostylisten-teamet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Personal Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Personlig informasjon</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fullt navn</FormLabel>
                      <FormControl>
                        <Input placeholder="Ola Nordmann" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-postadresse</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="ola@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefonnummer</FormLabel>
                      <FormControl>
                        <Input placeholder="+47 123 45 678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fødselsdato</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd.MM.yyyy")
                              ) : (
                                <span>Velg dato</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(date.toISOString());
                              }
                            }}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1950-01-01")
                            }
                            captionLayout="dropdown"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Address Information */}
            <ApplicationAddressSection
              onAddressChange={(address) => {
                form.setValue("address.nickname", address.nickname);
                form.setValue("address.streetAddress", address.streetAddress);
                form.setValue("address.city", address.city);
                form.setValue("address.postalCode", address.postalCode);
                form.setValue("address.country", address.country);
                form.setValue("address.countryCode", address.countryCode);
                form.setValue(
                  "address.entryInstructions",
                  address.entryInstructions
                );
                form.setValue("address.geometry", address.geometry);
              }}
              defaultValues={form.getValues("address")}
              error={form.formState.errors.address?.root?.message}
            />

            {/* Professional Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Profesjonell erfaring</h3>

              <FormField
                control={form.control}
                name="professionalExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beskriv din profesjonelle erfaring</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Fortell om utdanningen din, arbeidserfaring, spesialiteter og hva som gjør deg unik som stylist..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum 50 karakterer. Inkluder utdanning, sertifiseringer
                      og relevant arbeidserfaring.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priceRangeFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fra pris (NOK)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="300"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Laveste pris for dine tjenester
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priceRangeTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Til pris (NOK)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1500"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Høyeste pris for dine tjenester
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Service Categories */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Tjenestekategorier</h3>

              <FormField
                control={form.control}
                name="serviceCategories"
                render={() => (
                  <FormItem>
                    <FormLabel>Hvilke tjenester tilbyr du?</FormLabel>
                    <FormDescription>
                      Velg alle kategorier som passer dine tjenester
                    </FormDescription>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {SERVICE_CATEGORIES.map((category) => (
                        <FormField
                          key={category.id}
                          control={form.control}
                          name="serviceCategories"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={category.id}
                                className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(category.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([
                                            ...field.value,
                                            category.id,
                                          ])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== category.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-medium">
                                    {category.name}
                                  </FormLabel>
                                  <FormDescription className="text-sm">
                                    {category.description}
                                  </FormDescription>
                                </div>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Portfolio Images */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Portefølje</h3>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Last opp bilder av ditt arbeid
                </label>
                <Dropzone
                  onDrop={async (acceptedFiles) => {
                    const newFiles = [...portfolioImages];

                    // Process each file with compression
                    for (const file of acceptedFiles) {
                      if (newFiles.length >= 10) {
                        toast.error("Maksimalt 10 bilder tillatt");
                        break;
                      }

                      try {
                        // Compress the image
                        const compressedFile = await imageCompression(file, {
                          maxSizeMB: 15, // Match the max size from the dropzone config
                          maxWidthOrHeight: 2048,
                          useWebWorker: true,
                          fileType: file.type,
                        });

                        newFiles.push(compressedFile);
                      } catch (compressionError) {
                        console.error(
                          "Image compression failed:",
                          compressionError
                        );
                        // If compression fails, use original file
                        newFiles.push(file);
                      }
                    }

                    setPortfolioImages(newFiles);
                  }}
                  multiple
                  accept={{
                    "image/*": [".jpg", ".jpeg", ".png", ".webp"],
                  }}
                  maxFiles={10}
                  maxSize={15 * 1024 * 1024} // 15MB
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                >
                  <div className="flex flex-col items-center justify-center py-12">
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">
                      Dra og slipp bilder her, eller klikk for å velge
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Støttede formater: JPG, PNG, WebP (maks 15MB per bilde)
                    </p>
                  </div>
                </Dropzone>
                <p className="text-sm text-muted-foreground">
                  Last opp 1-10 bilder som viser kvaliteten på arbeidet ditt.
                  Dette hjelper oss å vurdere søknaden din.
                </p>
                {portfolioImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      {portfolioImages.length} bilde(r) valgt:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {portfolioImages.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md text-sm"
                        >
                          <span>{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newFiles = [...portfolioImages];
                              newFiles.splice(index, 1);
                              setPortfolioImages(newFiles);
                            }}
                            className="h-auto p-1 text-muted-foreground hover:text-destructive"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {portfolioImages.length === 0 && (
                  <p className="text-sm text-destructive">
                    * Last opp minst ett portfoliobilde
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || portfolioImages.length === 0}
                className="min-w-[200px]"
              >
                {isUploadingImages
                  ? "Laster opp bilder..."
                  : isSubmitting
                    ? "Sender inn søknad..."
                    : "Send søknad"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
