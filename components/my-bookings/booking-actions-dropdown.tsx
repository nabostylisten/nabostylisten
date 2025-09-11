"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  CalendarCheck,
  X,
  Settings,
  CheckCircle,
  CheckSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CancelBookingDialog } from "./cancel-booking-dialog";
import { BookingStatusDialog } from "./booking-status-dialog";
import { CompleteBookingDialog } from "./complete-booking-dialog";
import type { Database } from "@/types/database.types";

type BookingStatus = Database["public"]["Tables"]["bookings"]["Row"]["status"];

interface BookingActionsDropdownProps {
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
  disabled?: boolean;
  onStatusDialogOpen?: () => void;
}

export function BookingActionsDropdown({
  booking,
  currentUserId,
  userRole,
  serviceName = "Booking",
  customerName = "Kunde",
  disabled = false,
  onStatusDialogOpen,
}: BookingActionsDropdownProps) {
  const router = useRouter();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);

  // Don't show actions for cancelled or completed bookings
  if (booking.status === "cancelled" || booking.status === "completed") {
    return null;
  }

  // Determine available actions based on role and booking status
  const now = new Date();
  const bookingEndTime = new Date(booking.end_time);

  const canConfirm = userRole === "stylist" && booking.status === "pending";

  const canReschedule =
    (userRole === "stylist" || userRole === "admin") &&
    (booking.status === "pending" || booking.status === "confirmed");

  const canCancel =
    booking.status === "pending" || booking.status === "confirmed";

  const canComplete =
    userRole === "stylist" &&
    booking.status === "confirmed" &&
    now > bookingEndTime;

  const canAdminister =
    userRole === "stylist" &&
    booking.status === "pending" &&
    onStatusDialogOpen;

  // Count available actions
  const availableActions = [
    canAdminister && "administer",
    canConfirm && "confirm",
    canReschedule && "reschedule",
    canComplete && "complete",
    canCancel && "cancel",
  ].filter(Boolean);

  if (availableActions.length === 0) {
    return null;
  }

  // If only cancel action is available, render as a single button
  if (availableActions.length === 1 && availableActions[0] === "cancel") {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCancelDialogOpen(true)}
          disabled={disabled}
          className="flex gap-2 w-full sm:w-auto"
        >
          <X className="h-4 w-4" />
          Avlys booking
        </Button>
        <CancelBookingDialog
          open={isCancelDialogOpen}
          onOpenChange={setIsCancelDialogOpen}
          booking={booking}
          currentUserId={currentUserId}
          userRole={userRole}
          serviceName={serviceName}
        />
      </>
    );
  }

  // If only reschedule action is available, render as a single button
  if (availableActions.length === 1 && availableActions[0] === "reschedule") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(`/bookinger/${booking.id}/flytt`)}
        disabled={disabled}
        className="flex items-center gap-2 w-full sm:w-auto"
      >
        <CalendarCheck className="h-4 w-4" />
        Flytt booking
      </Button>
    );
  }

  // Multiple actions available - render as dropdown
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span>Handlinger</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Handlinger</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {canAdminister && (
            <DropdownMenuItem
              onClick={() => onStatusDialogOpen?.()}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              Administrer
            </DropdownMenuItem>
          )}

          {canConfirm && (
            <DropdownMenuItem
              onClick={() => setIsStatusDialogOpen(true)}
              className="cursor-pointer"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Bekreft
            </DropdownMenuItem>
          )}

          {canReschedule && (
            <DropdownMenuItem
              onClick={() => router.push(`/bookinger/${booking.id}/flytt`)}
              className="cursor-pointer"
            >
              <CalendarCheck className="mr-2 h-4 w-4" />
              Flytt booking
            </DropdownMenuItem>
          )}

          {canComplete && (
            <DropdownMenuItem
              onClick={() => setIsCompleteDialogOpen(true)}
              className="cursor-pointer"
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Marker som fullført
            </DropdownMenuItem>
          )}

          {canCancel && (
            <DropdownMenuItem
              onClick={() => setIsCancelDialogOpen(true)}
              className="cursor-pointer"
            >
              <X className="mr-2 h-4 w-4" />
              Avlys booking
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CancelBookingDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        booking={booking}
        currentUserId={currentUserId}
        userRole={userRole}
        serviceName={serviceName}
      />

      <BookingStatusDialog
        bookingId={booking.id}
        currentStatus={booking.status}
        customerName={customerName}
        serviceName={serviceName}
        isOpen={isStatusDialogOpen}
        onOpenChange={setIsStatusDialogOpen}
      />

      <CompleteBookingDialog
        open={isCompleteDialogOpen}
        onOpenChange={setIsCompleteDialogOpen}
        booking={booking}
        currentUserId={currentUserId}
        userRole={userRole}
        serviceName={serviceName}
        customerName={customerName}
      />
    </>
  );
}
