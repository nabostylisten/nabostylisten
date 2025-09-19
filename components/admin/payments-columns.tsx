"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  ArrowUpDown,
  Copy,
  ExternalLink,
  CreditCard,
  Receipt,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import {
  PaymentWithDetails,
  type PaymentStatus,
} from "@/server/admin/payments.actions";
import { AdminRefundDialog } from "./admin-refund-dialog";
import { toast } from "sonner";

// Utility function to map column IDs to Norwegian display names
export const getColumnDisplayName = (columnId: string): string => {
  const columnNames: Record<string, string> = {
    payment_intent_id: "Betalings-ID",
    customer_name: "Kunde",
    stylist_name: "Stylist",
    original_amount: "Beløp",
    status: "Status",
    created_at: "Opprettet",
    booking_date: "Behandlingsdato",
    discount_amount: "Rabatt",
    final_amount: "Totalt",
    platform_fee: "Plattformavgift",
    stylist_payout: "Stylist utbetaling",
    refunded_amount: "Refundert",
    actions: "Handlinger",
  };

  return columnNames[columnId] || columnId;
};

const getStatusBadge = (status: PaymentStatus) => {
  const variants: Record<
    PaymentStatus,
    "outline" | "secondary" | "destructive" | "default"
  > = {
    pending: "outline",
    requires_payment_method: "secondary",
    requires_confirmation: "secondary",
    requires_action: "secondary",
    processing: "secondary",
    requires_capture: "outline",
    cancelled: "destructive",
    succeeded: "default",
  };

  const labels: Record<PaymentStatus, string> = {
    pending: "Venter",
    requires_payment_method: "Krever betalingsmetode",
    requires_confirmation: "Krever bekreftelse",
    requires_action: "Krever handling",
    processing: "Behandler",
    requires_capture: "Krever fangst",
    cancelled: "Kansellert",
    succeeded: "Fullført",
  };

  const variant = variants[status] || "secondary";
  const label = labels[status] || status;

  return <Badge variant={variant}>{label}</Badge>;
};

const formatCurrency = (amount: number, currency: string = "NOK") => {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const columns: ColumnDef<PaymentWithDetails>[] = [
  {
    accessorKey: "payment_intent_id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {getColumnDisplayName("payment_intent_id")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const paymentId = row.getValue("payment_intent_id") as string;
      const shortId = paymentId.slice(-8);

      return (
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-mono text-sm">{shortId}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-mono text-xs">{paymentId}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => {
              navigator.clipboard.writeText(paymentId);
              toast.success("Betalings-ID kopiert");
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      );
    },
  },
  {
    accessorKey: "customer_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {getColumnDisplayName("customer_name")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.getValue("customer_name") as string;
      const email = row.original.customer_email;

      return (
        <div className="flex flex-col">
          <span className="font-medium">{name}</span>
          <span className="text-xs text-muted-foreground">{email}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "stylist_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {getColumnDisplayName("stylist_name")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.getValue("stylist_name") as string;
      const email = row.original.stylist_email;

      return (
        <div className="flex flex-col">
          <span className="font-medium">{name}</span>
          <span className="text-xs text-muted-foreground">{email}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "final_amount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {getColumnDisplayName("final_amount")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const final = row.getValue("final_amount") as number;
      const original = row.original.original_amount;
      const discount = row.original.discount_amount;
      const currency = row.original.currency;

      return (
        <div className="flex flex-col">
          <span className="font-medium">{formatCurrency(final, currency)}</span>
          {discount > 0 && (
            <span className="text-xs text-muted-foreground">
              <span className="line-through">
                {formatCurrency(original, currency)}
              </span>{" "}
              -{formatCurrency(discount, currency)}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {getColumnDisplayName("status")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as PaymentStatus;
      const refunded = row.original.refunded_amount;

      return (
        <div className="flex items-center gap-2">
          {getStatusBadge(status)}
          {refunded > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Refundert: {formatCurrency(refunded, row.original.currency)}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {getColumnDisplayName("created_at")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return (
        <div className="flex flex-col">
          <span>{format(date, "dd.MM.yyyy", { locale: nb })}</span>
          <span className="text-xs text-muted-foreground">
            {format(date, "HH:mm", { locale: nb })}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "booking_date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {getColumnDisplayName("booking_date")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("booking_date"));
      return (
        <div className="flex flex-col">
          <span>{format(date, "dd.MM.yyyy", { locale: nb })}</span>
          <span className="text-xs text-muted-foreground">
            {format(date, "HH:mm", { locale: nb })}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original;
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [refundDialogOpen, setRefundDialogOpen] = React.useState(false);

      // Calculate if refund is possible
      const remainingRefundable =
        payment.final_amount - (payment.refunded_amount || 0);
      const canRefund = remainingRefundable > 0;

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Åpne meny</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Handlinger</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(payment.payment_intent_id);
                  toast.success("Betalings-ID kopiert");
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Kopier betalings-ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/admin/betalinger/${payment.id}`}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Se detaljer
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/bookinger/${payment.booking_id}`} target="_blank">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Se booking
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const stripeUrl = `https://dashboard.stripe.com/payments/${payment.payment_intent_id}`;
                  window.open(stripeUrl, "_blank");
                }}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Åpne i Stripe
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-muted-foreground">
                <Receipt className="mr-2 h-4 w-4" />
                Send kvittering (kommer)
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canRefund}
                className={canRefund ? "" : "text-muted-foreground"}
                onClick={() => canRefund && setRefundDialogOpen(true)}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {canRefund ? "Refunder" : "Fullstendig refundert"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AdminRefundDialog
            payment={payment}
            open={refundDialogOpen}
            onOpenChange={setRefundDialogOpen}
            onRefundProcessed={() => {
              // Trigger a refresh of the payments table
              window.location.reload();
            }}
          />
        </>
      );
    },
  },
];
