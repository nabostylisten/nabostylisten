# Discount System - Technical Documentation

## Architecture Overview

The Nabostylisten discount system is built using PostgreSQL, Supabase, and Next.js with comprehensive validation, tracking, and integration with the booking system. The architecture ensures data consistency, prevents fraud, and provides real-time validation.

## Database Schema

### Core Tables

#### `discounts` Table

Primary table storing discount configurations:

```sql
CREATE TABLE IF NOT EXISTS public.discounts (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Discount identification
    code text NOT NULL UNIQUE,
    description text,

    -- Discount configuration (mutually exclusive)
    discount_percentage numeric(5, 2) CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    discount_amount integer, -- In øre/cents
    currency text DEFAULT 'NOK' NOT NULL,

    -- Usage limits
    max_uses integer, -- NULL means unlimited
    current_uses integer DEFAULT 0 NOT NULL,
    max_uses_per_user integer DEFAULT 1 NOT NULL,

    -- Validity period
    is_active boolean DEFAULT true NOT NULL,
    valid_from timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,

    -- Order amount requirements
    minimum_order_amount integer, -- In øre/cents
    maximum_order_amount integer, -- In øre/cents

    CONSTRAINT discount_check CHECK (
        (discount_percentage IS NOT NULL AND discount_amount IS NULL) OR
        (discount_percentage IS NULL AND discount_amount IS NOT NULL)
    )
);
```

**Key Design Decisions:**

- `code` is unique and case-insensitive (normalized to uppercase)
- Monetary values stored in øre (Norwegian cents) for precision
- Mutually exclusive percentage vs. fixed amount discounts
- `current_uses` denormalized for performance
- `expires_at` nullable for permanent discounts

#### `discount_restrictions` Table

User-specific access control:

```sql
CREATE TABLE IF NOT EXISTS public.discount_restrictions (
    discount_id uuid NOT NULL REFERENCES public.discounts(id) ON DELETE CASCADE,
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (discount_id, profile_id)
);
```

**Purpose**: Enables VIP/exclusive discounts restricted to specific users.

#### `discount_usage` Table

Usage tracking and audit trail:

```sql
CREATE TABLE IF NOT EXISTS public.discount_usage (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    discount_id uuid NOT NULL REFERENCES public.discounts(id) ON DELETE CASCADE,
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
    used_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Prevent duplicate tracking
    UNIQUE(discount_id, profile_id, booking_id)
);
```

**Purpose**: Tracks per-user usage for limit enforcement and analytics.

### Database Indexes

Performance optimization indexes:

```sql
-- Efficient discount code lookups
CREATE INDEX IF NOT EXISTS idx_discounts_code ON public.discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_active_valid ON public.discounts(is_active, valid_from, expires_at);

-- User restriction lookups
CREATE INDEX IF NOT EXISTS idx_discount_restrictions_discount_id ON public.discount_restrictions(discount_id);
CREATE INDEX IF NOT EXISTS idx_discount_restrictions_profile_id ON public.discount_restrictions(profile_id);

-- Usage tracking queries
CREATE INDEX IF NOT EXISTS idx_discount_usage_discount_profile ON public.discount_usage(discount_id, profile_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_booking ON public.discount_usage(booking_id);
```

## Server-Side Implementation

### Validation Logic (`server/discounts.actions.ts`)

#### `validateDiscountCode` Function

Comprehensive validation with all business rules:

```typescript
export async function validateDiscountCode({
  code,
  orderAmountCents,
  profileId,
}: {
  code: string;
  orderAmountCents: number;
  profileId?: string;
}): Promise<DiscountValidationResult>;
```

**Validation Steps:**

1. **Code Existence**: Verify discount exists and is active
2. **Time Validity**: Check `valid_from` and `expires_at` timestamps
3. **Global Limits**: Verify `current_uses < max_uses`
4. **User Limits**: Count user's previous usage vs. `max_uses_per_user`
5. **User Restrictions**: Check `discount_restrictions` if applicable
6. **Order Amount**: Validate against `minimum_order_amount`
7. **Discount Calculation**: Apply percentage or fixed amount with `maximum_order_amount` cap

**Return Type:**

```typescript
interface DiscountValidationResult {
  isValid: boolean;
  error?: string;
  discount?: Discount;
  discountAmount?: number; // Final discount in øre
}
```

#### `trackDiscountUsage` Function

Atomic usage tracking with consistency guarantees:

```typescript
export async function trackDiscountUsage({
  discountId,
  profileId,
  bookingId,
}: {
  discountId: string;
  profileId: string;
  bookingId?: string;
});
```

**Operations:**

1. Insert usage record in `discount_usage`
2. Increment `current_uses` in `discounts` table
3. Handle race conditions with database constraints

### Error Handling

**Localized Error Messages (Norwegian):**

- `"Rabattkoden finnes ikke"` - Code doesn't exist
- `"Rabattkoden er ikke aktiv"` - Inactive discount
- `"Rabattkoden har utløpt"` - Expired discount
- `"Rabattkoden er ikke gyldig ennå"` - Future start date
- `"Du har ikke tilgang til å bruke denne rabattkoden"` - User restriction

## Client-Side Implementation

### Booking Integration (`components/booking/apply-discount-form.tsx`)

#### Form Validation

```typescript
const applyDiscountSchema = z.object({
  code: z
    .string()
    .min(1, "Rabattkode er påkrevd")
    .max(50, "Rabattkode kan ikke være lengre enn 50 tegn"),
});
```

#### Real-Time Validation

```typescript
const validateMutation = useMutation({
  mutationFn: async (data: ApplyDiscountFormData) => {
    // Convert NOK to øre for backend
    const orderAmountCents = Math.round(orderAmountNOK * 100);

    return await validateDiscountCode({
      code: data.code.trim().toUpperCase(),
      orderAmountCents,
    });
  },
  onSuccess: (result) => {
    if (result.isValid) {
      // Update booking totals
      onDiscountApplied({
        discount: result.discount,
        discountAmount: result.discountAmount,
        code: result.discount.code,
      });
    }
  },
});
```

#### User Experience States

- **Loading**: Spinner during validation
- **Success**: Green checkmark with savings display
- **Error**: Red error message with specific validation failure
- **Applied**: Discount details in order summary with removal option

### Admin Management (`components/admin/discounts-data-table.tsx`)

#### Table Features

- **Filtering**: Active, inactive, expired discount tabs
- **Search**: Global filter across code and description
- **Sorting**: All columns with client-side sorting
- **Export**: CSV export for analytics
- **Bulk Actions**: Toggle active status, delete selected

#### Column Definitions

```typescript
const discountColumns = [
  { accessorKey: "code", header: "Code" },
  { accessorKey: "description", header: "Description" },
  { accessorKey: "discount_type", header: "Type" }, // Computed: percentage vs. amount
  { accessorKey: "usage_stats", header: "Usage" }, // "current_uses / max_uses"
  { accessorKey: "validity_period", header: "Valid Period" },
  { accessorKey: "order_limits", header: "Order Limits", visible: false },
  { accessorKey: "status", header: "Status" }, // Active/Inactive/Expired
];
```

## Integration Points

### Booking System Integration

#### Order Total Calculation

```typescript
// In booking flow
interface BookingTotals {
  subtotal: number; // Before discount
  discountAmount: number; // Applied discount
  finalAmount: number; // After discount
  currency: "NOK";
}
```

#### Stripe Payment Integration

```typescript
// Payment intent creation
const paymentAmount = bookingTotals.finalAmount * 100; // Convert to øre
await stripe.paymentIntents.create({
  amount: paymentAmount,
  currency: "nok",
  metadata: {
    booking_id: booking.id,
    discount_code: appliedDiscount?.code,
    discount_amount: appliedDiscount?.discountAmount,
  },
});
```

### Database Triggers

#### Auto-Update `updated_at`

```sql
CREATE TRIGGER update_discounts_updated_at
BEFORE UPDATE ON public.discounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

## Data Consistency & Integrity

### Race Condition Prevention

1. **Unique Constraints**: Prevent duplicate usage tracking
2. **Atomic Operations**: Usage tracking with database transactions
3. **Optimistic Locking**: Frontend re-validation before payment

### Data Validation Constraints

1. **Discount Type**: CHECK constraint ensures percentage XOR amount
2. **Usage Limits**: `current_uses <= max_uses` validation
3. **Date Logic**: `valid_from <= expires_at` validation
4. **Monetary Values**: Non-negative amounts, øre precision

## Performance Considerations

### Query Optimization

1. **Code Lookups**: Indexed `code` column for O(log n) searches
2. **Usage Counting**: Denormalized `current_uses` for fast validation
3. **User Restrictions**: Efficient EXISTS queries with indexes

### Caching Strategy

1. **Server Components**: Static discount lists cached at build time
2. **Client Queries**: TanStack Query with 5-minute cache TTL
3. **Database**: PostgreSQL query plan caching for repeated validations

### Scalability Patterns

1. **Read Replicas**: Usage analytics queries on read replicas
2. **Connection Pooling**: Supabase connection pooling for high concurrency
3. **Background Jobs**: Usage statistics updates via cron jobs

## Security Implementation

### Input Validation

```typescript
// Server-side validation with Zod
const discountCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]+$/, "Only alphanumeric characters allowed")
  .min(3)
  .max(50);
```

### Access Control

1. **Row Level Security**: Customer can only see their own usage
2. **Admin Permissions**: Discount management restricted to admin role
3. **API Authentication**: All discount endpoints require authentication

### Audit Trail

```sql
-- Usage tracking provides complete audit trail
SELECT
  du.used_at,
  d.code,
  p.email,
  b.id as booking_id,
  d.discount_amount
FROM discount_usage du
JOIN discounts d ON du.discount_id = d.id
JOIN profiles p ON du.profile_id = p.id
LEFT JOIN bookings b ON du.booking_id = b.id
ORDER BY du.used_at DESC;
```

## Testing Strategy

### Unit Tests

```typescript
describe("validateDiscountCode", () => {
  test("validates expired discount", async () => {
    const result = await validateDiscountCode({
      code: "EXPIRED2023",
      orderAmountCents: 50000,
    });

    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Rabattkoden har utløpt");
  });
});
```

### Integration Tests

1. **Database Constraints**: Test unique violations and foreign key constraints
2. **Race Conditions**: Concurrent usage tracking simulation
3. **Edge Cases**: Boundary value testing for order amounts and dates

### Seed Data Testing

The comprehensive seed data covers all edge cases:

- **Expired Discounts**: `EXPIRED2023`, `JUSTEXPIRED`
- **Future Discounts**: `FUTURE2025`, `STARTSTOMORROW`
- **Usage Limits**: `SOLDOUT` (max uses reached)
- **User Restrictions**: `VIP50` (limited users)
- **Order Limits**: `NARROW200TO300` (specific range)
- **Edge Percentages**: `MINIMAL1` (1%), `MAXIMAL99` (99%)

## Monitoring & Analytics

### Metrics Collection

```sql
-- Discount performance analytics
WITH discount_stats AS (
  SELECT
    d.code,
    d.description,
    COUNT(du.id) as total_uses,
    COUNT(DISTINCT du.profile_id) as unique_users,
    AVG(p.final_amount - p.original_amount) as avg_discount_amount,
    SUM(p.final_amount - p.original_amount) as total_discount_value
  FROM discounts d
  LEFT JOIN discount_usage du ON d.id = du.discount_id
  LEFT JOIN payments p ON du.booking_id = p.booking_id
  GROUP BY d.id, d.code, d.description
)
SELECT * FROM discount_stats
ORDER BY total_uses DESC;
```

### Real-Time Dashboards

1. **Admin Analytics**: Discount usage trends, top performing codes
2. **Revenue Impact**: Total discounted vs. full-price revenue
3. **Customer Metrics**: New vs. returning customer discount usage

## Deployment & Operations

### Database Migrations

```bash
# Create new discount
bun supabase:db:diff add_discount_feature

# Apply migration
bun supabase:migrate:up
```

### Environment Configuration

```typescript
// Environment-specific settings
const DISCOUNT_CONFIG = {
  MAX_PERCENTAGE: process.env.NODE_ENV === "production" ? 80 : 99,
  MAX_USES_DEFAULT: process.env.NODE_ENV === "production" ? 1000 : 10000,
  VALIDATION_TIMEOUT: 5000, // ms
};
```

### Error Monitoring

```typescript
// PostHog error tracking
import { capture } from '@/lib/posthog';

// In discount validation
catch (error) {
  capture('discount_validation_error', {
    error: error.message,
    code: discountCode,
    userId: profileId,
  });

  return {
    isValid: false,
    error: "Kunne ikke validere rabattkode"
  };
}
```

## API Reference

### Server Actions

#### `getDiscountByCode(code: string)`

Retrieves discount by code for validation.

**Returns**: `{ data: Discount | null, error: PostgrestError | null }`

#### `validateDiscountCode(params)`

Comprehensive validation with business logic.

**Parameters**:

```typescript
{
  code: string;
  orderAmountCents: number;
  profileId?: string;
}
```

**Returns**: `Promise<DiscountValidationResult>`

#### `trackDiscountUsage(params)`

Records discount usage and updates counters.

**Parameters**:

```typescript
{
  discountId: string;
  profileId: string;
  bookingId?: string;
}
```

#### Admin Functions

- `getAllDiscounts(filters?)`: Paginated discount list
- `createDiscount(data)`: Create new discount
- `updateDiscount(id, data)`: Modify existing discount
- `deleteDiscount(id)`: Remove discount
- `getDiscountCounts()`: Statistics for admin dashboard

### Type Definitions

```typescript
// Core types from database
type Discount = DatabaseTables["discounts"]["Row"];
type DiscountInsert = DatabaseTables["discounts"]["Insert"];
type DiscountUpdate = DatabaseTables["discounts"]["Update"];

// Validation result
interface DiscountValidationResult {
  isValid: boolean;
  error?: string;
  discount?: Discount;
  discountAmount?: number;
}

// Applied discount for booking
interface AppliedDiscount {
  discount: Discount;
  discountAmount: number;
  code: string;
}
```

## Future Technical Enhancements

### Performance Optimizations

1. **Redis Caching**: Cache validation results for repeated code checks
2. **Database Partitioning**: Partition `discount_usage` by date for analytics
3. **Background Workers**: Async usage tracking via job queues

### Advanced Features

1. **GraphQL API**: Alternative API for mobile app integration
2. **Webhook System**: Real-time notifications for discount events
3. **ML Analytics**: Predictive modeling for discount effectiveness

### Monitoring Improvements

1. **Distributed Tracing**: OpenTelemetry for request tracing
2. **Custom Metrics**: Prometheus metrics for discount operations
3. **Alert System**: Automated alerts for unusual discount patterns
