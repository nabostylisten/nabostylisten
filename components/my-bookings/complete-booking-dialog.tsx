"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { markBookingAsCompleted } from "@/server/booking/lifecycle.actions";
import type { Database } from "@/types/database.types";

type BookingStatus = Database["public"]["Tables"]["bookings"]["Row"]["status"];

interface CompleteBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    customer_id: string;
    stylist_id: string;
    start_time: string;
    end_time: string;
    total_price: number;
    status: BookingStatus;
  };
  currentUserId: string;
  userRole: Database["public"]["Enums"]["user_role"];
  serviceName?: string;
  customerName?: string;
}

export function CompleteBookingDialog({
  open,
  onOpenChange,
  booking,
  currentUserId,
  userRole,
  serviceName = "Booking",
  customerName = "Kunde",
}: CompleteBookingDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const completeMutation = useMutation({
    mutationFn: async () => {
      const result = await markBookingAsCompleted(booking.id);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: () => {
      toast.success("Booking markert som fullført");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking", booking.id] });
      queryClient.invalidateQueries({ queryKey: ["booking-details", booking.id] });
      queryClient.invalidateQueries({ queryKey: ["user-bookings"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kunne ikke markere booking som fullført");
    },
  });

  const handleComplete = () => {
    setIsLoading(true);
    completeMutation.mutate();
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <DialogTitle>Marker booking som fullført</DialogTitle>
              <DialogDescription>
                {serviceName} med {customerName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Ved å markere denne bookingen som fullført vil kunden motta en
            e-post med mulighet til å gi en anmeldelse. Du vil også motta en
            bekreftelse på at tjenesten er fullført.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading || completeMutation.isPending}
          >
            Avbryt
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isLoading || completeMutation.isPending}
          >
            {(isLoading || completeMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Marker som fullført
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
