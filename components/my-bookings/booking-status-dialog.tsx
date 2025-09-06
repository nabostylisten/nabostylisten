"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { updateBookingStatus } from "@/server/booking/lifecycle.actions";
import type { Database } from "@/types/database.types";

type BookingStatus = Database["public"]["Tables"]["bookings"]["Row"]["status"];

const bookingStatusSchema = z.object({
  status: z.enum(["confirmed", "cancelled"]),
  message: z.string().optional(),
});

type BookingStatusFormData = z.infer<typeof bookingStatusSchema>;

interface BookingStatusDialogProps {
  bookingId: string;
  currentStatus: BookingStatus;
  customerName: string;
  serviceName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingStatusDialog({
  bookingId,
  currentStatus,
  customerName,
  serviceName,
  isOpen,
  onOpenChange,
}: BookingStatusDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<BookingStatusFormData>({
    resolver: zodResolver(bookingStatusSchema),
    defaultValues: {
      status: "confirmed",
      message: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: BookingStatusFormData) =>
      updateBookingStatus({
        bookingId,
        status: data.status,
        message: data.message,
      }),
    onSuccess: (result) => {
      if (result.error) {
        toast.error("Feil ved oppdatering av booking");
        return;
      }

      const statusText =
        form.getValues("status") === "confirmed" ? "bekreftet" : "avlyst";
      toast.success(`Booking ${statusText}`);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["user-bookings"] });

      // Close dialog and reset form
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast.error("Feil ved oppdatering av booking");
    },
  });

  const onSubmit = (data: BookingStatusFormData) => {
    mutation.mutate(data);
  };

  const selectedStatus = form.watch("status");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Oppdater booking status</DialogTitle>
          <DialogDescription>
            Endre status for booking med {customerName} - {serviceName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Status Selection */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ny status</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="confirmed" id="confirmed" />
                        <label
                          htmlFor="confirmed"
                          className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Bekreft
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cancelled" id="cancelled" />
                        <label
                          htmlFor="cancelled"
                          className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          <XCircle className="w-4 h-4 text-red-600" />
                          Avlys
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Optional Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Melding til kunde (valgfritt)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        selectedStatus === "confirmed"
                          ? "Bekreftet! Ser frem til å møte deg..."
                          : "Beklager, men jeg må avlyse denne bookingen..."
                      }
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1"
              >
                {mutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {selectedStatus === "confirmed"
                  ? "Bekreft booking"
                  : "Avlys booking"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
