"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";

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
import { Settings2 } from "lucide-react";
import { getAllApplications } from "@/server/admin/applications.actions";
import { columns, getColumnDisplayName } from "./stylist-applications-columns";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function StylistApplicationDataTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [activeTab, setActiveTab] = React.useState("all");

  // Fetch applications data
  const {
    data: applicationsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["applications"],
    queryFn: () => getAllApplications(),
    select: (data) => data.data,
  });

  const data = applicationsData || [];

  // Filter data based on status tab
  const filteredData = React.useMemo(() => {
    if (activeTab === "all") return data;
    return data.filter((item) => item.status === activeTab);
  }, [activeTab, data]);

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  // Get counts for each status
  const getStatusCounts = () => {
    const counts = {
      all: data.length,
      applied: data.filter((item) => item.status === "applied").length,
      pending_info: data.filter((item) => item.status === "pending_info")
        .length,
      approved: data.filter((item) => item.status === "approved").length,
      rejected: data.filter((item) => item.status === "rejected").length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  const tabs: { value: string; label: React.ReactNode }[] = [
    {
      value: "all",
      label: `Alle (${isLoading ? <Skeleton className="w-4 h-4" /> : statusCounts.all})`,
    },
    {
      value: "applied",
      label: `Nye søknader (${isLoading ? <Skeleton className="w-4 h-4" /> : statusCounts.applied})`,
    },
    {
      value: "pending_info",
      label: `Venter på info (${isLoading ? <Skeleton className="w-4 h-4" /> : statusCounts.pending_info})`,
    },
    {
      value: "approved",
      label: `Godkjente (${isLoading ? <Skeleton className="w-4 h-4" /> : statusCounts.approved})`,
    },
    {
      value: "rejected",
      label: `Avviste (${isLoading ? <Skeleton className="w-4 h-4" /> : statusCounts.rejected})`,
    },
  ];

  return (
    <div className="w-full min-w-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex w-full items-center justify-center md:justify-start">
          <TabsList className="inline-flex h-full w-full flex-col md:h-10 md:flex-row">
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
            <DataTableSkeleton columns={columns} rows={8} />
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-destructive">Feil ved lasting av søknader</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Søk etter navn eller e-post..."
                    value={
                      (table
                        .getColumn("full_name")
                        ?.getFilterValue() as string) ?? ""
                    }
                    onChange={(event) => {
                      table
                        .getColumn("full_name")
                        ?.setFilterValue(event.target.value);
                    }}
                    className="w-64"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                      <Settings2 className="mr-2 h-4 w-4" />
                      Kolonner
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
              <div className="overflow-hidden rounded-md border">
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
                          Ingen søknader funnet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 py-4">
                <div className="text-sm text-muted-foreground">
                  {table.getFilteredRowModel().rows.length} av {data.length}{" "}
                  søknad(er).
                </div>
                <div className="flex items-center space-x-2">
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
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
