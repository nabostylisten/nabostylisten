"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown, Mail } from "lucide-react";
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
import Link from "next/link";

// Utility function to map column IDs to Norwegian display names
export const getColumnDisplayName = (columnId: string): string => {
  const columnNames: Record<string, string> = {
    full_name: "Navn",
    email: "E-post", 
    phone_number: "Telefon",
    city: "By",
    status: "Status",
    price_range_from: "Prisintervall",
    created_at: "Søknadsdato",
    actions: "Handlinger",
  };
  
  return columnNames[columnId] || columnId;
};

export type StylistApplication = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  city: string;
  status: "applied" | "pending_info" | "rejected" | "approved";
  created_at: string;
  professional_experience: string;
  price_range_from: number;
  price_range_to: number;
  price_range_currency: string;
};

const getStatusBadge = (status: StylistApplication["status"]) => {
  const variants = {
    applied: "secondary",
    pending_info: "outline",
    approved: "default",
    rejected: "destructive",
  } as const;

  const labels = {
    applied: "Ny søknad",
    pending_info: "Venter på info",
    approved: "Godkjent",
    rejected: "Avvist",
  };

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
};

export const columns: ColumnDef<StylistApplication>[] = [
  {
    accessorKey: "full_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {getColumnDisplayName("full_name")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {getColumnDisplayName("email")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const email = row.getValue("email") as string;
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{email}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            asChild
          >
            <a href={`mailto:${email}`} title="Send e-post">
              <Mail className="h-3 w-3" />
            </a>
          </Button>
        </div>
      );
    },
  },
  {
    accessorKey: "phone_number",
    header: getColumnDisplayName("phone_number"),
  },
  {
    accessorKey: "city",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {getColumnDisplayName("city")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
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
      const status = row.getValue("status") as StylistApplication["status"];
      return getStatusBadge(status);
    },
  },
  {
    accessorKey: "price_range_from",
    header: getColumnDisplayName("price_range_from"),
    cell: ({ row }) => {
      const from = row.getValue("price_range_from") as number;
      const to = row.original.price_range_to;
      const currency = row.original.price_range_currency;
      return `${from} - ${to} ${currency}`;
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
      return format(date, "PPP", { locale: nb });
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const application = row.original;

      return (
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
              onClick={() => navigator.clipboard.writeText(application.id)}
            >
              Kopier søknad-ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/admin/soknader/${application.id}`}>
                Se detaljer
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={`mailto:${application.email}`}>
                Send e-post
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];