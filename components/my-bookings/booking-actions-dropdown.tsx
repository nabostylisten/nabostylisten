"use client";

import { MoreHorizontal, CalendarCheck } from "lucide-react";
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

interface BookingActionsDropdownProps {
  bookingId: string;
  bookingStatus: string;
  disabled?: boolean;
}

export function BookingActionsDropdown({
  bookingId,
  bookingStatus,
  disabled = false,
}: BookingActionsDropdownProps) {
  const router = useRouter();

  // Don't show actions for cancelled or completed bookings
  const canReschedule =
    bookingStatus === "pending" || bookingStatus === "confirmed";

  if (!canReschedule) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span>Handlinger</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Handlinger</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push(`/bookinger/${bookingId}/flytt`)}
          className="cursor-pointer"
        >
          <CalendarCheck className="mr-2 h-4 w-4" />
          Flytt booking
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
