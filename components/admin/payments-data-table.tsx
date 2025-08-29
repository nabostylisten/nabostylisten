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
import { useQuery } from "@tanstack/react-query";
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
import { Settings2, Download, RefreshCcw } from "lucide-react";
import {
  getAllPayments,
  getStripePaymentIntent,
  PaymentWithDetails,
  type PaymentStatus,
} from "@/server/admin/payments.actions";
import { columns, getColumnDisplayName } from "./payments-columns";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PaymentsDataTable() {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      platform_fee: false,
      stylist_payout: false,
      refunded_amount: false,
      discount_amount: false,
    });
  const [activeTab, setActiveTab] = React.useState("all");
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState("");

  // Debounce search input to avoid excessive API calls
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(globalFilter);
    }, 500);

    return () => clearTimeout(timer);
  }, [globalFilter]);

  // Fetch payments data with server-side filtering
  const {
    data: paymentsData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["payments", activeTab, debouncedSearchTerm],
    queryFn: () => getAllPayments({
      searchTerm: debouncedSearchTerm || undefined,
      statusFilter: activeTab === "all" ? undefined : activeTab,
      limit: 1000, // Get all for now, can implement pagination later
    }),
    select: (data) => data.data,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const data = paymentsData || [];

  // Since filtering is now done server-side, filteredData is just the data
  const filteredData = data;

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // Remove sorting and filtering since it's handled server-side
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  // Get counts for each status
  const getStatusCounts = () => {
    const counts = {
      all: data.length,
      pending: data.filter((item) => item.status === "pending").length,
      processing: data.filter((item) => {
        const processingStatuses: PaymentStatus[] = [
          "requires_payment_method",
          "requires_confirmation",
          "requires_action",
          "processing",
          "requires_capture",
        ];
        return processingStatuses.includes(item.status);
      }).length,
      succeeded: data.filter((item) => item.status === "succeeded").length,
      cancelled: data.filter((item) => item.status === "cancelled").length,
      refunded: data.filter((item) => item.refunded_amount > 0).length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  const tabs: { value: string; label: React.ReactNode }[] = [
    {
      value: "all",
      label: `Alle (${isLoading ? "..." : statusCounts.all})`,
    },
    {
      value: "pending",
      label: `Venter (${isLoading ? "..." : statusCounts.pending})`,
    },
    {
      value: "processing",
      label: `Behandler (${isLoading ? "..." : statusCounts.processing})`,
    },
    {
      value: "succeeded",
      label: `Fullført (${isLoading ? "..." : statusCounts.succeeded})`,
    },
    {
      value: "cancelled",
      label: `Kansellert (${isLoading ? "..." : statusCounts.cancelled})`,
    },
    {
      value: "refunded",
      label: `Refundert (${isLoading ? "..." : statusCounts.refunded})`,
    },
  ];

  // Handle CSV export
  const handleExportCSV = () => {
    if (!filteredData || filteredData.length === 0) {
      toast.error("Ingen data å eksportere");
      return;
    }

    const csvConfig = mkConfig({
      fieldSeparator: ";",
      filename: `betalinger-${new Date().toISOString().split("T")[0]}`,
      columnHeaders: [
        { key: "payment_intent_id", displayLabel: "Betalings-ID" },
        { key: "customer_name", displayLabel: "Kundenavn" },
        { key: "customer_email", displayLabel: "Kunde-epost" },
        { key: "stylist_name", displayLabel: "Stylistnavn" },
        { key: "stylist_email", displayLabel: "Stylist-epost" },
        { key: "original_amount", displayLabel: "Originalbeløp" },
        { key: "discount_amount", displayLabel: "Rabatt" },
        { key: "final_amount", displayLabel: "Totalbeløp" },
        { key: "platform_fee", displayLabel: "Plattformavgift" },
        { key: "stylist_payout", displayLabel: "Stylist utbetaling" },
        { key: "status", displayLabel: "Status" },
        { key: "created_at", displayLabel: "Opprettet" },
        { key: "booking_date", displayLabel: "Behandlingsdato" },
        { key: "refunded_amount", displayLabel: "Refundert beløp" },
        { key: "discount_code", displayLabel: "Rabattkode" },
      ],
    });

    // Transform data for export
    const exportData = filteredData.map((payment) => ({
      ...payment,
      created_at: new Date(payment.created_at).toLocaleString("nb-NO"),
      booking_date: new Date(payment.booking_date).toLocaleString("nb-NO"),
    }));

    const csv = generateCsv(csvConfig)(exportData);
    download(csvConfig)(csv);

    toast.success(`Eksporterte ${filteredData.length} betalinger til CSV`);
  };

  // Refresh Stripe data for visible payments
  const handleRefreshStripeData = async () => {
    const visiblePayments = table.getRowModel().rows;

    toast.promise(
      Promise.all(
        visiblePayments.map(async (row) => {
          const payment = row.original;
          if (payment.payment_intent_id) {
            await getStripePaymentIntent(payment.payment_intent_id);
          }
        })
      ),
      {
        loading: "Oppdaterer Stripe-data...",
        success: "Stripe-data oppdatert",
        error: "Feil ved oppdatering av Stripe-data",
      }
    );

    // Refetch all data after updating Stripe
    refetch();
  };

  return (
    <div className="w-full min-w-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex w-full items-center justify-between">
          <TabsList className="inline-flex h-full w-full max-w-fit flex-col lg:h-10 lg:flex-row">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="w-full text-xs lg:text-sm"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {isLoading ? (
            <DataTableSkeleton columns={columns} rows={12} />
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-destructive">Feil ved lasting av betalinger</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <Input
                  placeholder="Søk etter kunde, stylist eller betalings-ID..."
                  value={globalFilter}
                  onChange={(event) => setGlobalFilter(event.target.value)}
                  className="max-w-sm"
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshStripeData}
                    disabled={isRefetching}
                  >
                    <RefreshCcw
                      className={cn(
                        "h-4 w-4 mr-2",
                        isRefetching && "animate-spin"
                      )}
                    />
                    Oppdater
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Eksporter CSV
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <Settings2 className="mr-2 h-4 w-4" />
                        Kolonner
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                      {table
                        .getAllColumns()
                        .filter((column) => column.getCanHide())
                        .map((column) => {
                          return (
                            <DropdownMenuCheckboxItem
                              key={column.id}
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
              <div className="rounded-md border">
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
                    {(() => {
                      const rows = table.getRowModel().rows;

                      return rows?.length ? (
                        rows.map((row) => (
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
                            Ingen betalinger funnet.
                          </TableCell>
                        </TableRow>
                      );
                    })()}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                  Viser{" "}
                  {table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                    1}{" "}
                  til{" "}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) *
                      table.getState().pagination.pageSize,
                    filteredData.length
                  )}{" "}
                  av {filteredData.length} betaling(er).
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Første
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Forrige
                  </Button>
                  <span className="flex items-center gap-1">
                    Side{" "}
                    <strong>
                      {table.getState().pagination.pageIndex + 1} av{" "}
                      {table.getPageCount()}
                    </strong>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Neste
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    Siste
                  </Button>
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
