"use client";

import * as React from "react";
import {
  ColumnDef,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mkConfig, generateCsv, download } from "export-to-csv";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings2,
  Download,
  RefreshCcw,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
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
import {
  getAllDiscounts,
  updateDiscount,
  deleteDiscount,
  getDiscountCounts,
} from "@/server/discounts.actions";
import {
  createDiscountColumns,
  getColumnDisplayName,
} from "./discounts-columns";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DatabaseTables } from "@/types";

type Discount = DatabaseTables["discounts"]["Row"];

type ActiveTab = "all" | "active" | "inactive" | "expired";

interface DiscountsDataTableProps {
  onCreateDiscount: () => void;
  onEditDiscount: (discount: Discount) => void;
}

export function DiscountsDataTable({
  onCreateDiscount,
  onEditDiscount,
}: DiscountsDataTableProps) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      order_limits: false,
    });
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("all");
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [discountToDelete, setDiscountToDelete] =
    React.useState<Discount | null>(null);

  const queryClient = useQueryClient();

  // Debounce search input to avoid excessive API calls
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(globalFilter);
    }, 500);

    return () => clearTimeout(timer);
  }, [globalFilter]);

  // Fetch discounts data with server-side filtering
  const {
    data: discountsData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["discounts", activeTab, debouncedSearchTerm],
    queryFn: () =>
      getAllDiscounts({
        searchTerm: debouncedSearchTerm || undefined,
        statusFilter: activeTab === "all" ? "all" : activeTab,
        limit: 1000,
      }),
    select: (data) => data.data,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch discount counts for tabs
  const {
    data: countsData,
    isLoading: countsLoading,
    refetch: refetchCounts,
  } = useQuery({
    queryKey: ["discount-counts"],
    queryFn: () => getDiscountCounts(),
    select: (data) => data.data,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const data = discountsData || [];
  const filteredData = data;

  // Toggle discount active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async (discount: Discount) => {
      return updateDiscount(discount.id, {
        is_active: !discount.is_active,
      });
    },
    onSuccess: (result, discount) => {
      if (result.error) {
        toast.error(`Feil: ${result.error}`);
      } else {
        toast.success(
          `Rabattkode ${discount.is_active ? "deaktivert" : "aktivert"}`
        );
        queryClient.invalidateQueries({ queryKey: ["discounts"] });
        queryClient.invalidateQueries({ queryKey: ["discount-counts"] });
      }
    },
    onError: (error) => {
      toast.error("Kunne ikke endre status på rabattkode");
    },
  });

  // Delete discount mutation
  const deleteMutation = useMutation({
    mutationFn: async (discountId: string) => {
      return deleteDiscount(discountId);
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(`Feil ved sletting: ${result.error}`);
      } else {
        toast.success("Rabattkode slettet");
        queryClient.invalidateQueries({ queryKey: ["discounts"] });
        queryClient.invalidateQueries({ queryKey: ["discount-counts"] });
      }
      setDeleteDialogOpen(false);
      setDiscountToDelete(null);
    },
    onError: (error) => {
      toast.error("Kunne ikke slette rabattkode");
      setDeleteDialogOpen(false);
      setDiscountToDelete(null);
    },
  });

  const handleToggleActive = (discount: Discount) => {
    toggleActiveMutation.mutate(discount);
  };

  const handleDelete = (discount: Discount) => {
    setDiscountToDelete(discount);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (discountToDelete) {
      deleteMutation.mutate(discountToDelete.id);
    }
  };

  const columns = createDiscountColumns(
    onEditDiscount,
    handleToggleActive,
    handleDelete
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
  });

  const exportToCSV = () => {
    const csvConfig = mkConfig({
      fieldSeparator: ";",
      filename: `rabattkoder-${new Date().toISOString().split("T")[0]}`,
      decimalSeparator: ",",
      useKeysAsHeaders: false,
      columnHeaders: columns
        .filter((col) => col.id !== "actions" && "accessorKey" in col)
        .map((col) => getColumnDisplayName(col.header as string)),
    });

    const csvData = filteredData.map((discount) => ({
      code: discount.code,
      description: discount.description || "",
      discount_type:
        discount.discount_percentage !== null
          ? `${discount.discount_percentage}%`
          : `${(discount.discount_amount! / 100).toLocaleString("no-NO")} kr`,
      usage: `${discount.current_uses || 0}${discount.max_uses ? ` / ${discount.max_uses}` : " / ∞"}`,
      valid_period: `Fra: ${new Date(discount.valid_from).toLocaleDateString("no-NO")}${
        discount.expires_at
          ? ` - Til: ${new Date(discount.expires_at).toLocaleDateString("no-NO")}`
          : ""
      }`,
      order_limits:
        [
          discount.minimum_order_amount
            ? `Min: ${(discount.minimum_order_amount / 100).toLocaleString("no-NO")} kr`
            : null,
          discount.maximum_order_amount
            ? `Maks: ${(discount.maximum_order_amount / 100).toLocaleString("no-NO")} kr`
            : null,
        ]
          .filter(Boolean)
          .join(", ") || "Ingen",
      is_active: discount.is_active ? "Aktiv" : "Inaktiv",
      created_at: new Date(discount.created_at).toLocaleString("no-NO"),
    }));

    const csv = generateCsv(csvConfig)(csvData);
    download(csvConfig)(csv);
    toast.success("CSV-fil lastet ned");
  };

  // Use server-fetched counts or fallback to 0
  const counts = countsData || { all: 0, active: 0, inactive: 0, expired: 0 };
  const { all: allCount, active: activeCount, inactive: inactiveCount, expired: expiredCount } = counts;

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">
          Feil ved lasting av rabattkoder. Prøv igjen senere.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex items-center justify-end">
        <Button onClick={onCreateDiscount} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Opprett ny rabattkode
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ActiveTab)}
        className="w-full"
      >
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="all" className="relative">
              Alle
              {allCount > 0 && (
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {allCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="relative">
              Aktive
              {activeCount > 0 && (
                <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                  {activeCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="inactive" className="relative">
              Inaktive
              {inactiveCount > 0 && (
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-800">
                  {inactiveCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="expired" className="relative">
              Utløpte
              {expiredCount > 0 && (
                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                  {expiredCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
              <Input
                placeholder="Søk etter kode eller beskrivelse..."
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="h-8 w-[150px] lg:w-[250px]"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetch();
                  refetchCounts();
                }}
                disabled={isRefetching}
                className="h-8 px-2 lg:px-3"
              >
                <RefreshCcw
                  className={cn("h-4 w-4", isRefetching && "animate-spin")}
                />
                <span className="sr-only lg:not-sr-only lg:whitespace-nowrap">
                  Oppdater
                </span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="h-8 px-2 lg:px-3"
              >
                <Download className="h-4 w-4" />
                <span className="sr-only lg:not-sr-only lg:whitespace-nowrap">
                  Eksporter
                </span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto h-8 lg:flex"
                  >
                    <Settings2 className="h-4 w-4" />
                    <span className="sr-only lg:not-sr-only lg:whitespace-nowrap">
                      Vis
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[150px]">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {getColumnDisplayName(column.id)}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            {isLoading ? (
              <DataTableSkeleton 
                columns={Array.from({ length: 8 }, (_, i) => ({ id: i.toString() }) as any)} 
                rows={6} 
              />
            ) : (
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        Ingen rabattkoder funnet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              Viser {table.getRowModel().rows.length} av {filteredData.length}{" "}
              rabattkoder.
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Forrige
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Neste
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett rabattkode</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette rabattkoden "
              {discountToDelete?.code}"? Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Avbryt
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Sletter..." : "Slett"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
