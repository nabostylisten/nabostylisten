"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

const statusChangeSchema = z.object({
  newStatus: z.enum(["approved", "rejected"]),
  notes: z.string().optional(),
});

type StatusChangeForm = z.infer<typeof statusChangeSchema>;

interface AffiliateStatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string | null;
  stylistName?: string;
  currentStatus?: string;
  onConfirm: (applicationId: string, newStatus: string, notes?: string) => Promise<void>;
  loading?: boolean;
}

export function AffiliateStatusChangeDialog({
  open,
  onOpenChange,
  applicationId,
  stylistName,
  currentStatus,
  onConfirm,
  loading = false,
}: AffiliateStatusChangeDialogProps) {
  const form = useForm<StatusChangeForm>({
    resolver: zodResolver(statusChangeSchema),
    defaultValues: {
      newStatus: currentStatus === "approved" ? "rejected" : "approved",
      notes: "",
    },
  });

  const watchedStatus = form.watch("newStatus");

  const getStatusDetails = (status: string) => {
    switch (status) {
      case "approved":
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          label: "Godkjent",
          color: "text-green-600",
        };
      case "rejected":
        return {
          icon: <XCircle className="w-5 h-5 text-red-600" />,
          label: "Avvist",
          color: "text-red-600",
        };
      default:
        return {
          icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
          label: "Venter",
          color: "text-yellow-600",
        };
    }
  };

  const currentStatusDetails = getStatusDetails(currentStatus || "");
  const newStatusDetails = getStatusDetails(watchedStatus);

  const handleSubmit = async (data: StatusChangeForm) => {
    if (!applicationId) return;
    
    try {
      await onConfirm(applicationId, data.newStatus, data.notes || undefined);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            Endre søknadsstatus
          </DialogTitle>
          <DialogDescription className="text-left">
            Du er i ferd med å endre statusen for {stylistName}s partnersøknad.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentStatusDetails.icon}
              <span className="text-sm font-medium">
                Nåværende: {currentStatusDetails.label}
              </span>
            </div>
            <div className="text-2xl">→</div>
            <div className="flex items-center gap-2">
              {newStatusDetails.icon}
              <span className="text-sm font-medium">
                Ny: {newStatusDetails.label}
              </span>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ny status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg ny status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="approved">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Godkjent
                        </div>
                      </SelectItem>
                      <SelectItem value="rejected">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          Avvist
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Merknad til {watchedStatus === "approved" ? "godkjenning" : "avvisning"} (valgfritt)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={
                        watchedStatus === "approved"
                          ? "Skriv en valgfri merknad som vil bli inkludert i godkjennings-e-posten..."
                          : "Skriv en valgfri merknad som forklarer hvorfor søknaden ble avvist..."
                      }
                      rows={4}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                variant={watchedStatus === "approved" ? "default" : "destructive"}
                disabled={loading}
              >
                {loading ? "Endrer..." : `Endre til ${newStatusDetails.label.toLowerCase()}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}