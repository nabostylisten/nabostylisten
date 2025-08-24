# Admin Charts and Stats Technical Implementation

## Overview

The admin dashboard uses a modern charting system built on top of shadcn/ui charts and Recharts, with a comprehensive architecture for handling statistics, data visualization, and real-time analytics.

## Architecture

### 1. Server Actions Layer (`/server/admin/stats.actions.ts`)

All admin statistics are fetched through server actions with built-in admin role validation:

```typescript
// Admin role protection on every action
await requireAdmin();

// Example server action
export async function getPlatformKPIs() {
  await requireAdmin();
  const supabase = await createClient();

  // Query logic with proper error handling
  try {
    // Database queries
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
```

#### Key Features

- **Admin Middleware**: `requireAdmin()` validates user role before any data access
- **Error Handling**: Consistent error handling and logging
- **Data Aggregation**: Efficient queries with proper joins and aggregations
- **Type Safety**: All actions return properly typed data

#### Available Actions by Category

**Overview Tab:**

- `getPlatformKPIs()` - Core platform metrics
- `getUserGrowthTrends(period, customRange)` - User registration trends
- `getBookingVolumeTrends(period, customRange)` - Booking volume over time
- `getRevenueOverview(period, customRange)` - Revenue analytics
- `getRecentActivity(limit)` - Latest platform activity

**Users Tab:**

- `getCustomerStats()` - Customer analytics and lifetime value
- `getStylistStats()` - Stylist performance metrics

**Bookings Tab:**

- `getBookingStats(period, customRange)` - Booking analytics
- `getBookingsByServiceCategory()` - Category distribution

**Services Tab:**

- `getServiceStats()` - Service catalog analytics
- `getTopServices(limit)` - Most popular services

### 2. Data Hooks Layer (`/hooks/admin/use-admin-data.ts`)

React hooks built on TanStack Query for optimized data fetching:

```typescript
export function useOverviewData() {
  const platformKPIs = useQuery({
    queryKey: ["admin", "platform-kpis"],
    queryFn: () => getPlatformKPIs(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    platformKPIs,
    isLoading: platformKPIs.isLoading,
    error: platformKPIs.error,
  };
}
```

#### Features

- **Caching Strategy**: 5-minute stale time for most queries, 1 minute for activity feeds
- **Background Refetching**: Automatic data updates without user intervention
- **Loading States**: Granular loading states for different data sets
- **Error Handling**: Comprehensive error management

### 3. Chart Components Layer

#### Base Components (`/components/charts/`)

**ChartCard** (`/components/charts/chart-card.tsx`):

```typescript
interface ChartCardProps {
  label: string;
  value?: number | string;
  unit?: string;
  icon?: LucideIconName;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}
```

Features:

- Norwegian currency formatting (NOK)
- Trend indicators with directional arrows
- Icon support from Lucide
- Loading and empty states

**Chart Skeletons** (`/components/charts/chart-skeletons.tsx`):

- `ChartCardSkeleton` - For metric cards
- `ChartSkeleton` - For chart containers
- `TableSkeleton` - For data tables

#### Specialized Chart Components

**User Trends Chart** (`/components/charts/user-trends/stacked-area-chart.tsx`):

Uses shadcn/ui chart system with theme integration:

```typescript
const chartConfig = {
  customers: {
    label: "Kunder",
    color: "hsl(var(--chart-2))", // Uses CSS custom properties
    icon: UserPlus,
  },
  stylists: {
    label: "Stylister",
    color: "hsl(var(--chart-3))",
    icon: Star,
  },
} satisfies ChartConfig;
```

Features:

- **Theme Integration**: Uses CSS custom properties from `globals.css`
- **Responsive Design**: Proper responsive container with min-height
- **Accessibility**: Screen reader support and keyboard navigation
- **Tooltips**: Norwegian-localized date formatting
- **Legend**: Automatic legend generation from chart config
- **Period Selector**: Built-in time period controls

### 4. Time Period System (`/lib/charts/`)

#### Time Period Types (`time-periods.ts`)

```typescript
export type TimePeriod =
  | "last_7_days"
  | "last_30_days"
  | "last_3_months"
  | "last_6_months"
  | "last_year"
  | "this_month"
  | "this_year"
  | "custom";
```

#### Date Utilities (`date-utils.ts`)

- `getDateRange(period, customRange)` - Convert period to actual dates
- `groupDataByPeriod(data, dateField, period, aggregator)` - Group data by time periods
- `fillMissingPeriods(data, period, defaultValue, endDate)` - Fill gaps in time series
- `calculateTrend(data, valueField)` - Calculate percentage trends

#### Features

- **Norwegian Localization**: All date formatting uses `nb-NO` locale
- **Flexible Aggregation**: Custom aggregation functions for different data types
- **Gap Filling**: Automatically fills missing periods with zero values
- **Trend Calculation**: Automatic trend calculation with positive/negative indicators

### 5. Theme Integration

The chart system integrates seamlessly with the application's theme system defined in `globals.css`:

```css
:root {
  --chart-1: hsl(260 28.9157% 67.451%);
  --chart-2: hsl(107.1429 31.5315% 56.4706%);
  --chart-3: hsl(19.5181 54.9669% 70.3922%);
  --chart-4: hsl(254.0625 37.2093% 33.7255%);
  --chart-5: hsl(106.8 28.7356% 34.1176%);
}

.dark {
  --chart-1: hsl(260 28.9157% 67.451%);
  --chart-2: hsl(107.1429 31.5315% 56.4706%);
  --chart-3: hsl(19.5181 54.9669% 70.3922%);
  --chart-4: hsl(254.0625 37.2093% 33.7255%);
  --chart-5: hsl(106.8 28.7356% 34.1176%);
}
```

Charts automatically adapt to light/dark themes without additional configuration.

## Data Flow Architecture

```
Database Query (Supabase)
  ↓
Server Action (with admin validation)
  ↓
TanStack Query Hook (with caching)
  ↓
React Component (with loading states)
  ↓
Chart Component (with theme integration)
```

## Performance Optimizations

1. **Query Caching**: 5-minute stale time reduces database load
2. **Background Refetching**: Users see cached data while fresh data loads
3. **Granular Loading**: Individual loading states prevent blocking
4. **Efficient Queries**: Proper indexing and joins in database queries
5. **Component Lazy Loading**: Charts load only when tabs are accessed

## Error Handling Strategy

1. **Server Level**: Database errors logged and re-thrown with context
2. **Hook Level**: TanStack Query provides automatic retry and error states
3. **Component Level**: Graceful fallbacks with empty states
4. **User Level**: Informative error messages in Norwegian

## Adding New Charts

To add a new chart component:

1. **Create Server Action**:

```typescript
export async function getNewMetric() {
  await requireAdmin();
  // Implementation
}
```

2. **Add Hook**:

```typescript
export function useNewMetric() {
  return useQuery({
    queryKey: ["admin", "new-metric"],
    queryFn: () => getNewMetric(),
    ...defaultQueryOptions,
  });
}
```

3. **Create Chart Component**:

```typescript
const chartConfig = {
  metric: {
    label: "New Metric",
    color: "hsl(var(--chart-1))",
    icon: Icon,
  },
} satisfies ChartConfig;
```

4. **Integrate in Tab**: Import and use in the appropriate tab component

## Security Considerations

1. **Admin Role Validation**: Every server action validates admin role
2. **Query Parameterization**: All database queries use parameterized queries
3. **Error Information**: Errors don't leak sensitive database information
4. **Rate Limiting**: TanStack Query prevents excessive requests

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live metrics
2. **Export Functionality**: CSV/PDF export for charts and tables
3. **Custom Date Ranges**: Date picker for custom period selection
4. **Advanced Analytics**: Predictive analytics and forecasting
5. **Performance Monitoring**: Query performance tracking and optimization
