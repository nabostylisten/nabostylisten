"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
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
import { Textarea } from "@/components/ui/textarea";
import { cancelBooking } from "@/server/booking/lifecycle.actions";
import { DEFAULT_PLATFORM_CONFIG } from "@/schemas/platform-config.schema";
import type { Database } from "@/types/database.types";

type BookingStatus = Database["public"]["Tables"]["bookings"]["Row"]["status"];

interface CancelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    customer_id: string;
    stylist_id: string;
    start_time: string;
    total_price: number;
    status: BookingStatus;
    is_trial_session?: boolean;
    main_booking_id?: string | null;
    trial_booking_id?: string | null;
  };
  currentUserId: string;
  userRole: Database["public"]["Enums"]["user_role"];
  serviceName?: string;
}

export function CancelBookingDialog({
  open,
  onOpenChange,
  booking,
  currentUserId,
  userRole,
  serviceName = "Booking",
}: CancelBookingDialogProps) {
  const [cancellationReason, setCancellationReason] = useState("");
  const queryClient = useQueryClient();

  // Calculate refund information
  const startTime = new Date(booking.start_time);
  const now = new Date();
  const hoursUntilAppointment =
    (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  const config = DEFAULT_PLATFORM_CONFIG.payment.refunds;

  // Determine who is cancelling
  const isCancellingOwnBooking = booking.customer_id === currentUserId;
  const cancelledBy = isCancellingOwnBooking ? "customer" : "stylist";

  // Calculate refund based on rules
  let refundInfo = {
    percentage: 0,
    amount: 0,
    message: "",
    warning: "",
  };

  // For trial sessions, apply special rules
  if (booking.is_trial_session) {
    if (cancelledBy === "stylist") {
      // Stylist cancels trial session = always 100% refund
      refundInfo = {
        percentage: 100,
        amount: booking.total_price,
        message: "Kunden vil motta full refusjon.",
        warning:
          "Ved å avlyse denne prøvetimen vil kunden automatisk få tilbake hele beløpet.",
      };
    } else {
      // Customer cancels trial session - standard rules apply
      if (hoursUntilAppointment >= config.fullRefundHours) {
        refundInfo = {
          percentage: 100,
          amount: booking.total_price,
          message: `Du vil motta full refusjon på ${booking.total_price.toFixed(2)} NOK.`,
          warning: "",
        };
      } else if (hoursUntilAppointment >= config.partialRefundHours) {
        const refundAmount =
          booking.total_price * config.partialRefundPercentage;
        refundInfo = {
          percentage: 50,
          amount: refundAmount,
          message: `Du vil motta 50% refusjon (${refundAmount.toFixed(2)} NOK).`,
          warning: `Siden du avlyser mellom ${config.partialRefundHours}-${config.fullRefundHours} timer før prøvessjonen, vil stylisten motta den resterende 50% som kompensasjon.`,
        };
      } else {
        refundInfo = {
          percentage: 0,
          amount: 0,
          message: "Ingen refusjon tilgjengelig.",
          warning: `Siden du avlyser mindre enn ${config.partialRefundHours} timer før prøvetimen, er det ikke mulig å få refusjon. Betalingen er allerede behandlet.`,
        };
      }
    }
  } else {
    // Regular booking refund logic
    if (cancelledBy === "stylist") {
      // Stylist cancellation = always 100% refund
      refundInfo = {
        percentage: 100,
        amount: booking.total_price,
        message: "Kunden vil motta full refusjon.",
        warning:
          "Ved å avlyse denne bookingen vil kunden automatisk få tilbake hele beløpet.",
      };
    } else {
      // Customer cancellation - check timing
      if (hoursUntilAppointment >= config.fullRefundHours) {
        refundInfo = {
          percentage: 100,
          amount: booking.total_price,
          message: `Du vil motta full refusjon på ${booking.total_price.toFixed(2)} NOK.`,
          warning: "",
        };
      } else if (hoursUntilAppointment >= config.partialRefundHours) {
        const refundAmount =
          booking.total_price * config.partialRefundPercentage;
        refundInfo = {
          percentage: 50,
          amount: refundAmount,
          message: `Du vil motta 50% refusjon (${refundAmount.toFixed(2)} NOK).`,
          warning: `Siden du avlyser mellom ${config.partialRefundHours}-${config.fullRefundHours} timer før avtalen, vil stylisten motta den resterende 50% som kompensasjon.`,
        };
      } else {
        refundInfo = {
          percentage: 0,
          amount: 0,
          message: "Ingen refusjon tilgjengelig.",
          warning: `Siden du avlyser mindre enn ${config.partialRefundHours} timer før avtalen, er det ikke mulig å få refusjon. Betalingen er allerede behandlet.`,
        };
      }
    }
  }

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const result = await cancelBooking(booking.id, cancellationReason);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking", booking.id] });
      queryClient.invalidateQueries({ queryKey: ["user-bookings"] }); // Invalidate all user bookings queries

      // Show success toast with refund info
      const entityName = booking.is_trial_session ? "Prøvetimen" : "Booking";

      if (data?.refundAmount && data.refundAmount > 0) {
        toast.success(
          `${entityName} avlyst. ${
            cancelledBy === "customer"
              ? `Refusjon på ${data.refundAmount.toFixed(2)} NOK vil bli behandlet.`
              : "Kunden vil motta full refusjon."
          }`
        );
      } else if (cancelledBy === "customer" && data?.refundAmount === 0) {
        toast.success(
          `${entityName} avlyst. Ingen refusjon tilgjengelig på grunn av sen avlysning.`
        );
      } else {
        toast.success(`${entityName} avlyst`);
      }

      onOpenChange(false);
      setCancellationReason("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kunne ikke avlyse booking");
    },
  });

  const formattedDate = format(startTime, "EEEE d. MMMM yyyy 'kl.' HH:mm", {
    locale: nb,
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {booking.is_trial_session
              ? cancelledBy === "stylist"
                ? "Avlys prøvetimen"
                : "Avlys din prøvetimen"
              : cancelledBy === "stylist"
                ? "Avlys booking"
                : "Avlys din booking"}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div>
              <p className="font-medium">{serviceName}</p>
              <p className="text-sm text-muted-foreground">{formattedDate}</p>
            </div>

            <div className="rounded-lg bg-muted p-3 space-y-2">
              <p className="font-medium text-sm">Refusjonsinformasjon:</p>
              <p className="text-sm">{refundInfo.message}</p>
              {refundInfo.warning && (
                <p className="text-sm text-yellow-600 dark:text-yellow-500">
                  {refundInfo.warning}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium">
                Årsak for avlysning (valgfritt):
              </label>
              <Textarea
                id="reason"
                placeholder={`Fortell ${cancelledBy === "customer" ? "stylisten" : "kunden"} hvorfor du må avlyse...`}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Er du sikker på at du vil avlyse denne{" "}
              {booking.is_trial_session ? "prøvessjonen" : "bookingen"}? Denne
              handlingen kan ikke angres.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelMutation.isPending}>
            Avbryt
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              cancelMutation.mutate();
            }}
            disabled={cancelMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {cancelMutation.isPending
              ? "Avlyser..."
              : booking.is_trial_session
                ? "Avlys prøvetimen"
                : "Avlys booking"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
