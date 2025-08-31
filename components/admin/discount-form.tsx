"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { CalendarIcon, Dices } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/kibo-ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  createDiscount,
  updateDiscount,
  generateDiscountCode,
} from "@/server/discounts.actions";
import type { DatabaseTables } from "@/types";

type Discount = DatabaseTables["discounts"]["Row"];

const discountFormSchema = z
  .object({
    code: z
      .string()
      .min(3, "Rabattkoden må være minst 3 tegn")
      .max(20, "Rabattkoden kan ikke være lengre enn 20 tegn")
      .regex(
        /^[A-Z0-9-_]+$/,
        "Rabattkoden kan kun inneholde store bokstaver, tall, bindestrek og understrek"
      ),
    description: z
      .string()
      .max(200, "Beskrivelsen kan ikke være lengre enn 200 tegn")
      .optional(),

    // Discount type - either percentage or fixed amount
    discountType: z.enum(["percentage", "fixed"]),
    discountPercentage: z
      .number()
      .min(0.01, "Prosent må være større enn 0")
      .max(100, "Prosent kan ikke være større enn 100")
      .optional(),
    discountAmount: z.number().min(1, "Beløp må være større enn 0").optional(),

    // Usage limits
    maxUses: z
      .number()
      .min(1, "Maksimalt antall bruk må være minst 1")
      .optional(),
    maxUsesPerUser: z
      .number()
      .min(1, "Maksimalt antall bruk per bruker må være minst 1")
      .default(1),

    // Validity period
    validFrom: z.date(),
    expiresAt: z.date().optional(),

    // Order requirements
    minimumOrderAmount: z
      .number()
      .min(1, "Minimum ordrebeløp må være større enn 0")
      .optional(),
    maximumOrderAmount: z
      .number()
      .min(1, "Maksimum ordrebeløp må være større enn 0")
      .optional(),

    // Status
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // Ensure discount type has corresponding value
      if (data.discountType === "percentage" && !data.discountPercentage) {
        return false;
      }
      if (data.discountType === "fixed" && !data.discountAmount) {
        return false;
      }
      return true;
    },
    {
      message: "Du må angi rabattverdi",
      path: ["discountType"],
    }
  )
  .refine(
    (data) => {
      // Ensure expiry date is after start date
      if (data.expiresAt && data.expiresAt <= data.validFrom) {
        return false;
      }
      return true;
    },
    {
      message: "Utløpsdato må være etter startdato",
      path: ["expiresAt"],
    }
  )
  .refine(
    (data) => {
      // Ensure max order amount is greater than min order amount
      if (
        data.minimumOrderAmount &&
        data.maximumOrderAmount &&
        data.maximumOrderAmount <= data.minimumOrderAmount
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Maksimum ordrebeløp må være større enn minimum ordrebeløp",
      path: ["maximumOrderAmount"],
    }
  );

type DiscountFormData = z.infer<typeof discountFormSchema>;

interface DiscountFormProps {
  existingDiscount?: Discount | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DiscountForm({
  existingDiscount,
  onSuccess,
  onCancel,
}: DiscountFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<DiscountFormData>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      code: existingDiscount?.code || "",
      description: existingDiscount?.description || "",
      discountType:
        existingDiscount?.discount_percentage !== null ? "percentage" : "fixed",
      discountPercentage: existingDiscount?.discount_percentage || undefined,
      discountAmount: existingDiscount?.discount_amount
        ? existingDiscount.discount_amount / 100
        : undefined,
      maxUses: existingDiscount?.max_uses || undefined,
      maxUsesPerUser: existingDiscount?.max_uses_per_user || 1,
      validFrom: existingDiscount
        ? new Date(existingDiscount.valid_from)
        : new Date(),
      expiresAt: existingDiscount?.expires_at
        ? new Date(existingDiscount.expires_at)
        : undefined,
      minimumOrderAmount: existingDiscount?.minimum_order_amount
        ? existingDiscount.minimum_order_amount / 100
        : undefined,
      maximumOrderAmount: existingDiscount?.maximum_order_amount
        ? existingDiscount.maximum_order_amount / 100
        : undefined,
      isActive: existingDiscount?.is_active ?? true,
    },
  });

  const discountType = form.watch("discountType");
  const validFrom = form.watch("validFrom");
  const expiresAt = form.watch("expiresAt");

  const mutation = useMutation({
    mutationFn: async (data: DiscountFormData) => {
      const discountData = {
        code: data.code.toUpperCase(),
        description: data.description || null,
        discount_percentage:
          data.discountType === "percentage" ? data.discountPercentage! : null,
        discount_amount:
          data.discountType === "fixed"
            ? Math.round(data.discountAmount! * 100)
            : null,
        max_uses: data.maxUses || null,
        max_uses_per_user: data.maxUsesPerUser,
        valid_from: data.validFrom.toISOString(),
        expires_at: data.expiresAt?.toISOString() || null,
        minimum_order_amount: data.minimumOrderAmount
          ? Math.round(data.minimumOrderAmount * 100)
          : null,
        maximum_order_amount: data.maximumOrderAmount
          ? Math.round(data.maximumOrderAmount * 100)
          : null,
        is_active: data.isActive,
        currency: "NOK",
      };

      if (existingDiscount) {
        return await updateDiscount(existingDiscount.id, discountData);
      } else {
        return await createDiscount(discountData as any);
      }
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(
          typeof result.error === "string" ? result.error : result.error.message
        );
      } else {
        toast.success(
          existingDiscount ? "Rabattkode oppdatert!" : "Rabattkode opprettet!"
        );

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ["discounts"] });

        form.reset();
        onSuccess?.();
      }
    },
    onError: (error) => {
      toast.error(
        `Feil ved ${existingDiscount ? "oppdatering" : "opprettelse"} av rabattkode: ${error.message}`
      );
    },
  });

  const generateMutation = useMutation({
    mutationFn: generateDiscountCode,
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        form.setValue("code", result.data);
        toast.success("Rabattkode generert!");
      }
    },
    onError: (error) => {
      toast.error(`Feil ved generering av rabattkode: ${error.message}`);
    },
  });

  const handleGenerateCode = () => {
    generateMutation.mutate();
  };

  const handleSubmit = (data: DiscountFormData) => {
    mutation.mutate(data);
  };

  const isLoading = mutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Grunnleggende informasjon</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rabattkode *</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        placeholder={`VELKOMMEN${new Date().getFullYear()}`}
                        {...field}
                        value={field.value.toUpperCase()}
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleGenerateCode}
                        disabled={generateMutation.isPending}
                        title="Generer rabattkode"
                      >
                        {generateMutation.isPending ? (
                          <Spinner className="h-4 w-4" />
                        ) : (
                          <Dices className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    3-20 tegn, kun store bokstaver, tall og bindestreker
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Aktiv</FormLabel>
                    <FormDescription>
                      Om rabattkoden skal være tilgjengelig for bruk
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Beskrivelse</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Sommertilbud for alle kunder..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Valgfri beskrivelse av rabattkoden (maks 200 tegn)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Discount Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Rabatt-konfigurasjon</h3>

          <FormField
            control={form.control}
            name="discountType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Rabatttype *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="percentage" id="percentage" />
                      <label htmlFor="percentage">Prosent (%)</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fixed" id="fixed" />
                      <label htmlFor="fixed">Fast beløp (kr)</label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {discountType === "percentage" && (
              <FormField
                control={form.control}
                name="discountPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rabatt-prosent *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0.01"
                        max="100"
                        step="0.01"
                        placeholder="20"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Prosent rabatt (0.01 - 100%)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {discountType === "fixed" && (
              <FormField
                control={form.control}
                name="discountAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rabattbeløp (NOK) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="200"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Fast rabattbeløp i norske kroner
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        <Separator />

        {/* Usage Limits */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Bruksgrenser</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="maxUses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maksimalt totalt antall bruk</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="100"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    La stå tom for ubegrenset bruk
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxUsesPerUser"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maksimalt antall bruk per bruker *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      {...field}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 1)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Hvor mange ganger samme bruker kan bruke koden
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Validity Period */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Gyldig periode</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="validFrom"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Gyldig fra *</FormLabel>
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
                            format(field.value, "dd.MM.yyyy", { locale: nb })
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
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Når rabattkoden begynner å gjelde
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Utløper</FormLabel>
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
                            format(field.value, "dd.MM.yyyy", { locale: nb })
                          ) : (
                            <span>Ingen utløpsdato</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          validFrom ? date <= validFrom : date < new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    La stå tom for ingen utløpsdato
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Order Requirements */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Ordrebegrensninger</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="minimumOrderAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum ordrebeløp (NOK)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="500"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Minste ordrebeløp for å bruke rabattkoden
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maximumOrderAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maksimum ordrebeløp (NOK)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="5000"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Største ordrebeløp for å bruke rabattkoden
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Avbryt
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading && <Spinner className="w-4 h-4 mr-2" />}
            {isLoading
              ? existingDiscount
                ? "Oppdaterer rabattkode..."
                : "Oppretter rabattkode..."
              : existingDiscount
                ? "Oppdater rabattkode"
                : "Opprett rabattkode"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
