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
import { columns, StylistApplication } from "./stylist-applications-columns";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";

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
      applied: data.filter(
        (item: StylistApplication) => item.status === "applied"
      ).length,
      pending_info: data.filter(
        (item: StylistApplication) => item.status === "pending_info"
      ).length,
      approved: data.filter(
        (item: StylistApplication) => item.status === "approved"
      ).length,
      rejected: data.filter(
        (item: StylistApplication) => item.status === "rejected"
      ).length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return <DataTableSkeleton columns={columns} rows={8} />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Feil ved lasting av søknader</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Alle ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="applied">
            Nye søknader ({statusCounts.applied})
          </TabsTrigger>
          <TabsTrigger value="pending_info">
            Venter på info ({statusCounts.pending_info})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Godkjente ({statusCounts.approved})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Avviste ({statusCounts.rejected})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Søk etter navn eller e-post..."
                value={
                  (table.getColumn("full_name")?.getFilterValue() as string) ??
                  ""
                }
                onChange={(event) => {
                  table
                    .getColumn("full_name")
                    ?.setFilterValue(event.target.value);
                }}
                className="max-w-sm"
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
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
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
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} av {data.length}{" "}
              søknad(er).
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
    </div>
  );
}
