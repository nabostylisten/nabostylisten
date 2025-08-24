# Data Table System Technical Implementation

## Overview

The data table system provides a comprehensive, reusable architecture for displaying and managing tabular data throughout the application. Built on top of TanStack Table and shadcn/ui components, it offers advanced features like search, filtering, sorting, pagination, column visibility, and loading states with Norwegian localization.

## Architecture

### 1. Core Components

The data table system consists of four main components:

#### Base Data Table (`/components/ui/data-table.tsx`)

Basic table component with minimal features for simple use cases:

```typescript
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  // Basic table rendering
}
```

#### Data Table Skeleton (`/components/ui/data-table-skeleton.tsx`)

Reusable loading skeleton that matches any data table structure:

```typescript
interface DataTableSkeletonProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  rows?: number;
}

export function DataTableSkeleton<TData, TValue>({
  columns,
  rows = 8,
}: DataTableSkeletonProps<TData, TValue>) {
  // Skeleton structure matching actual table layout
}
```

**Key Features:**

- **Dynamic column matching**: Uses actual column definitions to create accurate skeleton
- **Configurable rows**: Default 8 rows, customizable via props
- **Complete UI skeleton**: Search bar, table, and pagination skeletons
- **Consistent styling**: Matches shadcn/ui table appearance

#### Feature-Rich Data Table (Custom Implementation)

Advanced table with full feature set - implemented per use case.

#### Column Definitions (Custom Implementation)

Type-safe column definitions with Norwegian localization and actions.

### 2. Implementation Pattern

Every data table implementation follows this consistent pattern:

```
/components/[feature]/
├── [entity]-columns.tsx          # Column definitions and utilities
├── [entity]-data-table.tsx       # Feature-rich table component
└── [supporting-files].tsx        # Additional components if needed
```

## Naming Conventions

### File Naming

- **Column definitions**: `[entity]-columns.tsx` (e.g., `stylist-applications-columns.tsx`)
- **Data table components**: `[entity]-data-table.tsx` (e.g., `stylist-application-data-table.tsx`)
- **Use kebab-case** for multi-word entities
- **Singular entity names** in file names

### Component Naming

- **Data table components**: `[Entity][Purpose]DataTable` (e.g., `StylistApplicationDataTable`)
- **Column arrays**: `columns` (exported constant)
- **Type definitions**: `[Entity]` (e.g., `StylistApplication`)
- **Utility functions**: `get[Purpose]` (e.g., `getColumnDisplayName`)

### Variable Naming

```typescript
// State variables
const [sorting, setSorting] = useState<SortingState>([]);
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

// Data fetching
const { data: [entity]Data, isLoading, error } = useQuery(...);

// Table instance
const table = useReactTable(...);
```

## Column Display Name Mapping System

### Implementation Pattern

Every column definition file must include a centralized display name mapper:

```typescript
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
```

### Usage in Column Headers

```typescript
export const columns: ColumnDef<EntityType>[] = [
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
  // Static headers for non-sortable columns
  {
    accessorKey: "phone_number",
    header: getColumnDisplayName("phone_number"),
  },
];
```

### Usage in Column Visibility

```typescript
// In the data table component
import { getColumnDisplayName } from "./entity-columns";

// In the dropdown menu
<DropdownMenuContent align="end">
  {table
    .getAllColumns()
    .filter((column) => column.getCanHide())
    .map((column) => {
      return (
        <DropdownMenuCheckboxItem
          key={column.id}
          checked={column.getIsVisible()}
          onCheckedChange={(value) => column.toggleVisibility(!!value)}
        >
          {getColumnDisplayName(column.id)}
        </DropdownMenuCheckboxItem>
      );
    })}
</DropdownMenuContent>
```

### Benefits

- **Single source of truth** for column display names
- **Consistency** between headers and column visibility dropdown
- **Easy maintenance** - update names in one place
- **Norwegian localization** throughout the interface

## Data Fetching Pattern

### Server Actions

Create dedicated server actions with admin validation:

```typescript
// /server/admin/[entity].actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/server/admin/middleware";

export async function getAll[EntityPlural]() {
  await requireAdmin();

  const supabase = await createClient();

  try {
    const { data: [entity]s, error } = await supabase
      .from("[table_name]")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching [entity]s:", error);
      throw error;
    }

    return { data: [entity]s || [], error: null };
  } catch (error) {
    console.error("Error in getAll[EntityPlural]:", error);
    throw error;
  }
}
```

### Client-Side Data Fetching

Use TanStack Query for optimized data fetching:

```typescript
// In the data table component
import { useQuery } from "@tanstack/react-query";
import { getAll[EntityPlural] } from "@/server/admin/[entity].actions";

export function [Entity]DataTable() {
  const { data: [entity]Data, isLoading, error } = useQuery({
    queryKey: ["[entity]s"],
    queryFn: () => getAll[EntityPlural](),
    select: (data) => data.data,
  });

  const data = [entity]Data || [];
  // Rest of implementation
}
```

## Search, Filter, Sort & Pagination Implementation

### Search Implementation

```typescript
// Single column search
<Input
  placeholder="Søk etter [field]..."
  value={(table.getColumn("[column_key]")?.getFilterValue() as string) ?? ""}
  onChange={(event) => {
    table.getColumn("[column_key]")?.setFilterValue(event.target.value);
  }}
  className="w-64"
/>

// Multi-column search (implement custom filter function if needed)
const table = useReactTable({
  // ... other config
  getFilteredRowModel: getFilteredRowModel(),
  globalFilterFn: "includesString", // or custom filter function
});
```

### Sorting Implementation

```typescript
// In column definitions - sortable header
{
  accessorKey: "[field_name]",
  header: ({ column }) => {
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {getColumnDisplayName("[field_name]")}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    );
  },
},

// In table configuration
const [sorting, setSorting] = useState<SortingState>([]);

const table = useReactTable({
  // ... other config
  onSortingChange: setSorting,
  getSortedRowModel: getSortedRowModel(),
  state: {
    sorting,
    // ... other state
  },
});
```

### Filtering with Tabs

```typescript
// Status-based filtering with tabs
const [activeTab, setActiveTab] = useState("all");

const filteredData = useMemo(() => {
  if (activeTab === "all") return data;
  return data.filter((item: EntityType) => item.status === activeTab);
}, [activeTab, data]);

// Tab implementation
<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
  <TabsList className="grid w-full grid-cols-5">
    <TabsTrigger value="all">
      Alle ({isLoading ? "..." : statusCounts.all})
    </TabsTrigger>
    <TabsTrigger value="[status_1]">
      [Label] ({isLoading ? "..." : statusCounts.[status_1]})
    </TabsTrigger>
    {/* Additional tabs */}
  </TabsList>
  <TabsContent value={activeTab}>
    {/* Table content */}
  </TabsContent>
</Tabs>
```

### Pagination Implementation

```typescript
// Table configuration
const table = useReactTable({
  // ... other config
  getPaginationRowModel: getPaginationRowModel(),
});

// Pagination controls
<div className="flex items-center justify-end space-x-2 py-4">
  <div className="flex-1 text-sm text-muted-foreground">
    {table.getFilteredRowModel().rows.length} av {data.length} [entity](er).
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
```

### Column Visibility

```typescript
// State management
const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

// Table configuration
const table = useReactTable({
  // ... other config
  onColumnVisibilityChange: setColumnVisibility,
  state: {
    columnVisibility,
    // ... other state
  },
});

// Column visibility dropdown
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
            onCheckedChange={(value) => column.toggleVisibility(!!value)}
          >
            {getColumnDisplayName(column.id)}
          </DropdownMenuCheckboxItem>
        );
      })}
  </DropdownMenuContent>
</DropdownMenu>
```

## Loading States and Error Handling

### Loading State Implementation

```typescript
// Within tabs - preserve UI structure during loading
<TabsContent value={activeTab} className="space-y-4">
  {isLoading ? (
    <DataTableSkeleton columns={columns} rows={8} />
  ) : error ? (
    <div className="flex items-center justify-center h-64">
      <p className="text-destructive">Feil ved lasting av [entity]</p>
    </div>
  ) : (
    <>
      {/* Search and controls */}
      <div className="flex items-center justify-between">
        {/* Search input and column visibility */}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          {/* Table content */}
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        {/* Pagination controls */}
      </div>
    </>
  )}
</TabsContent>
```

### Tab Counts During Loading

```typescript
// Show loading indicator in tab counts
<TabsTrigger value="all">
  Alle ({isLoading ? "..." : statusCounts.all})
</TabsTrigger>
```

## Norwegian Localization

### Text Labels

All user-facing text must be in Norwegian:

```typescript
const norwegianLabels = {
  // Search placeholders
  searchPlaceholder: "Søk etter [field]...",

  // Table states
  noResults: "Ingen [entity] funnet.",
  loading: "Laster [entity]...",
  error: "Feil ved lasting av [entity]",

  // Pagination
  previous: "Forrige",
  next: "Neste",
  resultsCount: "{filtered} av {total} [entity](er).",

  // Column visibility
  columns: "Kolonner",

  // Common actions
  details: "Se detaljer",
  actions: "Handlinger",
};
```

### Date Formatting

Use Norwegian locale for all date displays:

```typescript
import { format } from "date-fns";
import { nb } from "date-fns/locale";

// In cell renderer
cell: ({ row }) => {
  const date = new Date(row.getValue("created_at"));
  return format(date, "PPP", { locale: nb });
},
```

## Action Patterns

### Row Actions Implementation

```typescript
// Actions column
{
  id: "actions",
  cell: ({ row }) => {
    const [entity] = row.original;

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
            onClick={() => navigator.clipboard.writeText([entity].id)}
          >
            Kopier ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/admin/[route]/${[entity].id}`}>
              Se detaljer
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`mailto:${[entity].email}`}>
              Send e-post
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
}
```

### Inline Actions

For common actions like email links:

```typescript
// In email column
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
```

## Performance Considerations

### TanStack Query Configuration

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ["[entity]s"],
  queryFn: () => getAll[EntityPlural](),
  select: (data) => data.data,
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: false,
});
```

### Memoization

```typescript
// Memoize filtered data
const filteredData = useMemo(() => {
  if (activeTab === "all") return data;
  return data.filter((item: EntityType) => item.status === activeTab);
}, [activeTab, data]);

// Memoize status counts
const statusCounts = useMemo(() => {
  const counts = {
    all: data.length,
    [status1]: data.filter((item: EntityType) => item.status === "[status1]")
      .length,
    // ... other statuses
  };
  return counts;
}, [data]);
```

## Security Considerations

### Admin Role Validation

Every server action must validate admin access:

```typescript
export async function getAll[EntityPlural]() {
  await requireAdmin(); // Must be first line
  // ... rest of implementation
}
```

### Data Sanitization

Ensure all data is properly typed and validated:

```typescript
export type [Entity] = {
  id: string;
  // ... properly typed fields
  status: "status1" | "status2" | "status3" | "status4";
  created_at: string;
};
```

## Testing Considerations

### Component Testing

Test key functionality:

```typescript
// Test data loading states
it("should show skeleton while loading", () => {
  // Mock loading state
  // Assert skeleton is rendered
});

// Test filtering
it("should filter data by status", () => {
  // Mock data with different statuses
  // Test tab switching
  // Assert correct data is displayed
});

// Test search
it("should search by name and email", () => {
  // Mock data
  // Test search input
  // Assert filtered results
});
```

## Example Implementation Reference

The stylist applications data table (`/components/admin/stylist-application-data-table.tsx` and `/components/admin/stylist-applications-columns.tsx`) serves as the canonical example of this system, implementing all patterns and conventions described above.

### Key Features Demonstrated

- Admin role validation with server actions
- Norwegian localization throughout
- Tab-based status filtering with counts
- Search functionality with proper placeholders
- Sortable columns with consistent headers
- Column visibility management
- Loading states that preserve UI structure
- Pagination with Norwegian labels
- Inline and dropdown actions
- Proper error handling
- Type safety throughout

## Future Enhancements

### Planned Features

1. **Export functionality**: CSV/Excel export capabilities
2. **Advanced filtering**: Date range pickers, multi-select filters
3. **Bulk actions**: Multi-row selection with bulk operations
4. **Real-time updates**: WebSocket integration for live data
5. **Custom column widths**: User-adjustable column sizing
6. **Saved views**: User preferences for column visibility and sorting

### Performance Improvements

1. **Virtual scrolling**: For large datasets
2. **Server-side filtering**: Move filtering to database queries
3. **Infinite scrolling**: Replace pagination for better UX
4. **Optimistic updates**: Immediate UI feedback for actions

This data table system provides a robust, scalable foundation for all tabular data presentation needs while maintaining consistency, performance, and excellent user experience throughout the application.
