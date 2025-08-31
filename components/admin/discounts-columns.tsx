"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import type { DatabaseTables } from "@/types";

type Discount = DatabaseTables["discounts"]["Row"];

interface DiscountActionsProps {
  discount: Discount;
  onEdit: (discount: Discount) => void;
  onToggleActive: (discount: Discount) => void;
  onDelete: (discount: Discount) => void;
}

function DiscountActions({ discount, onEdit, onToggleActive, onDelete }: DiscountActionsProps) {
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
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onEdit(discount)}>
          <Edit className="mr-2 h-4 w-4" />
          Rediger
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onToggleActive(discount)}>
          {discount.is_active ? (
            <>
              <ToggleLeft className="mr-2 h-4 w-4" />
              Deaktiver
            </>
          ) : (
            <>
              <ToggleRight className="mr-2 h-4 w-4" />
              Aktiver
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => onDelete(discount)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Slett
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function createDiscountColumns(
  onEdit: (discount: Discount) => void,
  onToggleActive: (discount: Discount) => void,
  onDelete: (discount: Discount) => void,
): ColumnDef<Discount>[] {
  return [
    {
      accessorKey: "code",
      header: "Kode",
      cell: ({ row }) => (
        <div className="font-mono font-medium">{row.getValue("code")}</div>
      ),
    },
    {
      accessorKey: "description",
      header: "Beskrivelse",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate">
          {row.getValue("description") || "Ingen beskrivelse"}
        </div>
      ),
    },
    {
      accessorKey: "discount_type",
      header: "Type",
      cell: ({ row }) => {
        const discount = row.original;
        if (discount.discount_percentage !== null) {
          return (
            <Badge variant="secondary">
              {discount.discount_percentage.toLocaleString('no-NO', { maximumFractionDigits: 1 })}%
            </Badge>
          );
        } else if (discount.discount_amount !== null) {
          return (
            <Badge variant="outline">
              {(discount.discount_amount / 100).toLocaleString('no-NO')} kr
            </Badge>
          );
        }
        return <Badge variant="destructive">Ugyldig</Badge>;
      },
    },
    {
      accessorKey: "usage",
      header: "Bruk",
      cell: ({ row }) => {
        const discount = row.original;
        const current = discount.current_uses || 0;
        const max = discount.max_uses;
        
        if (max === null) {
          return <span className="text-muted-foreground">{current} / ∞</span>;
        }
        
        const percentage = (current / max) * 100;
        const isNearLimit = percentage >= 90;
        
        return (
          <div className="flex items-center gap-2">
            <span className={isNearLimit ? "text-orange-600 font-medium" : "text-muted-foreground"}>
              {current} / {max}
            </span>
            {isNearLimit && (
              <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                Snart oppbrukt
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "valid_period",
      header: "Gyldig periode",
      cell: ({ row }) => {
        const discount = row.original;
        const now = new Date();
        const validFrom = new Date(discount.valid_from);
        const expiresAt = discount.expires_at ? new Date(discount.expires_at) : null;
        
        let status: "not_started" | "active" | "expired" = "active";
        
        if (now < validFrom) {
          status = "not_started";
        } else if (expiresAt && now > expiresAt) {
          status = "expired";
        }
        
        return (
          <div className="text-sm">
            <div className="flex items-center gap-2">
              {status === "not_started" && (
                <Badge variant="secondary">Ikke startet</Badge>
              )}
              {status === "active" && (
                <Badge variant="default">Aktiv</Badge>
              )}
              {status === "expired" && (
                <Badge variant="destructive">Utløpt</Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Fra: {format(validFrom, "dd.MM.yy", { locale: nb })}
              {expiresAt && (
                <>
                  {" - "}
                  Til: {format(expiresAt, "dd.MM.yy", { locale: nb })}
                </>
              )}
              {!expiresAt && " - Ingen utløpsdato"}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "order_limits",
      header: "Ordrebegrensninger",
      cell: ({ row }) => {
        const discount = row.original;
        const min = discount.minimum_order_amount;
        const max = discount.maximum_order_amount;
        
        if (!min && !max) {
          return <span className="text-muted-foreground">Ingen</span>;
        }
        
        return (
          <div className="text-sm">
            {min && (
              <div>Min: {(min / 100).toLocaleString('no-NO')} kr</div>
            )}
            {max && (
              <div>Maks: {(max / 100).toLocaleString('no-NO')} kr</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Aktiv" : "Inaktiv"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Opprettet",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return (
          <div className="text-sm text-muted-foreground">
            {format(date, "dd.MM.yy HH:mm", { locale: nb })}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Handlinger",
      cell: ({ row }) => (
        <DiscountActions
          discount={row.original}
          onEdit={onEdit}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
      ),
    },
  ];
}

// Helper function to get column display name for CSV export
export function getColumnDisplayName(columnId: string): string {
  const columnNames: Record<string, string> = {
    code: "Kode",
    description: "Beskrivelse",
    discount_type: "Type",
    usage: "Bruk",
    valid_period: "Gyldig periode",
    order_limits: "Ordrebegrensninger",
    is_active: "Status",
    created_at: "Opprettet",
  };

  return columnNames[columnId] || columnId;
}