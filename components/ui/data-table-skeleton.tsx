"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableSkeletonProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  rows?: number;
}

export function DataTableSkeleton<TData, TValue>({
  columns,
  rows = 8,
}: DataTableSkeletonProps<TData, TValue>) {
  return (
    <div className="w-full">
      {/* Search and controls skeleton */}
      <div className="flex items-center justify-between py-4">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      
      {/* Table skeleton */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((_, index) => (
                <TableHead key={index}>
                  <Skeleton className="h-4 w-full" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination skeleton */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1">
          <Skeleton className="h-4 w-[120px]" />
        </div>
        <div className="space-x-2">
          <Skeleton className="h-8 w-[70px]" />
          <Skeleton className="h-8 w-[50px]" />
        </div>
      </div>
    </div>
  );
}