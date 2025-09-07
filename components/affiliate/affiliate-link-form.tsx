"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Spinner } from "@/components/ui/kibo-ui/spinner";

import { updateAffiliateLink, reactivateAffiliateCode, deactivateAffiliateCode } from "@/server/affiliate/affiliate-codes.actions";
import type { Database } from "@/types/database.types";

const affiliateLinkFormSchema = z.object({
  is_active: z.boolean(),
  expires_at: z.date().optional(),
  notes: z.string().max(500, "Notater kan ikke være lengre enn 500 tegn").optional(),
});

type AffiliateLinkFormData = z.infer<typeof affiliateLinkFormSchema>;

type AffiliateLink = Database["public"]["Tables"]["affiliate_links"]["Row"];

interface AffiliateLinkFormProps {
  affiliateLink?: AffiliateLink | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AffiliateLinkForm({
  affiliateLink,
  onSuccess,
  onCancel,
}: AffiliateLinkFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<AffiliateLinkFormData>({
    resolver: zodResolver(affiliateLinkFormSchema),
    defaultValues: {
      is_active: affiliateLink?.is_active || true,
      expires_at: affiliateLink?.expires_at ? new Date(affiliateLink.expires_at) : undefined,
      notes: affiliateLink?.notes || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: AffiliateLinkFormData) => {
      if (!affiliateLink?.id) {
        throw new Error("Ingen partnerkode å oppdatere");
      }

      // Handle activation/deactivation separately
      if (data.is_active !== affiliateLink.is_active) {
        if (data.is_active) {
          const result = await reactivateAffiliateCode(affiliateLink.id);
          if (result.error) {
            throw new Error(result.error);
          }
        } else {
          const result = await deactivateAffiliateCode(affiliateLink.id);
          if (result.error) {
            throw new Error(result.error);
          }
        }
      }

      // Update expiration date and notes
      const result = await updateAffiliateLink(affiliateLink.id, {
        expires_at: data.expires_at?.toISOString() || null,
        notes: data.notes || null,
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: () => {
      toast.success("Partnerkode oppdatert!");

      // Invalidate relevant queries using the same keys as the components
      queryClient.invalidateQueries({ queryKey: ["affiliate-codes"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate-applications"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate-metrics"] });

      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Feil ved oppdatering av partnerkode: ${error.message}`);
    },
  });

  const handleSubmit = (data: AffiliateLinkFormData) => {
    updateMutation.mutate(data);
  };

  const isLoading = updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Display read-only info */}
        {affiliateLink && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Partnerkode:</span>
                <p className="font-mono">{affiliateLink.link_code}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Provisjon:</span>
                <p>{Math.round(affiliateLink.commission_percentage * 100)}%</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Klikk:</span>
                <p>{affiliateLink.click_count}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Konverteringer:</span>
                <p>{affiliateLink.conversion_count}</p>
              </div>
            </div>
          </div>
        )}

        {/* Active status */}
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Aktiv status</FormLabel>
                <FormDescription>
                  Når deaktivert kan partnerkoden ikke brukes til å henvise kunder
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Expiration date */}
        <FormField
          control={form.control}
          name="expires_at"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Utløpsdato</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: nb })
                      ) : (
                        <span>Velg dato (valgfritt)</span>
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
                      date < new Date() || date < new Date("1900-01-01")
                    }
                    autoFocus
                  />
                  {field.value && (
                    <div className="border-t p-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => field.onChange(undefined)}
                        className="w-full"
                      >
                        Fjern utløpsdato
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              <FormDescription>
                La stå tom for ingen utløpsdato
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Administrative notater</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Interne notater om denne partnerkoden..."
                  rows={3}
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Interne notater synlige kun for administratorer
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action buttons */}
        <div className="flex gap-3">
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
            {isLoading ? "Oppdaterer..." : "Oppdater partnerkode"}
          </Button>
        </div>
      </form>
    </Form>
  );
}