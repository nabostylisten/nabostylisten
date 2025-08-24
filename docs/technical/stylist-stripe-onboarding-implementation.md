# Stylist Stripe Onboarding System - Technical Implementation

## Architecture Overview

The Stylist Stripe Onboarding System implements a multi-step flow that integrates with Stripe Connect for payment processing capabilities. The architecture follows a hybrid server/client pattern to optimize performance while maintaining security.

### Core Components

```
┌─────────────────────────────────────────────────────────────────────┐
│ Application Flow                                                    │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Stylist Application Form (Client) → 2. Admin Review (Server)    │
│ 3. Approval Process (Server Actions) → 4. Stripe Onboarding (Ext.) │
│ 5. Return Verification (Hybrid) → 6. Platform Access               │
└─────────────────────────────────────────────────────────────────────┘
```

## Database Schema

### Core Tables

```sql
-- Applications table stores all application data
CREATE TABLE applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id), -- Linked after approval
    full_name text NOT NULL,
    email text NOT NULL,
    phone_number text NOT NULL,
    birth_date date NOT NULL,

    -- Address with country code for Stripe compliance
    street_address text NOT NULL,
    city text NOT NULL,
    postal_code text NOT NULL,
    country text NOT NULL,
    country_code text, -- ISO 3166-1 alpha-2 from Mapbox
    address_geometry gis.geography(Point, 4326),

    professional_experience text NOT NULL,
    price_range_from integer NOT NULL,
    price_range_to integer NOT NULL,
    status application_status DEFAULT 'applied'
);

-- Stylist details for approved stylists
CREATE TABLE stylist_details (
    profile_id uuid PRIMARY KEY REFERENCES profiles(id),
    stripe_account_id text, -- Stripe Connect account ID
    can_travel boolean DEFAULT true,
    has_own_place boolean DEFAULT true,
    travel_distance_km integer
);

-- User profiles with Stripe customer integration
CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    role user_role DEFAULT 'customer',
    stripe_customer_id text -- For purchasing services
);
```

### Country Code Implementation

Critical for Stripe Connect compliance:

- Mapbox API returns `short_code` field in country context
- Extracted and normalized to uppercase (e.g., "no" → "NO")
- Stored in both `applications.country_code` and `addresses.country_code`
- Used during Stripe Connect account creation

## API Integration

### Stripe Connect Integration

#### Account Creation

```typescript
// server/application.actions.ts - Line 699-727
const { createConnectedAccountWithDatabase } = await import(
  "@/lib/stripe/connect"
);

// Uses stored country code from application
const countryCode = getCountryCode(application.country_code || "NO");

const stripeResult = await createConnectedAccountWithDatabase({
  supabaseClient: serviceSupabaseClient,
  profileId: authUser.user.id,
  email: application.email,
  name: application.full_name,
  address: {
    addressLine1: application.street_address,
    city: application.city,
    postalCode: application.postal_code,
    country: countryCode, // ISO code required by Stripe
  },
});
```

#### Status Verification

```typescript
// server/stripe.actions.ts - Line 125-224
export async function getCurrentUserStripeStatus() {
  // Comprehensive auth and permission checks
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch Stripe account status from API
  const statusResult = await getStripeAccountStatusService({
    stripeAccountId: stylistDetails.stripe_account_id,
  });

  // Determine onboarding completion
  const isFullyOnboarded =
    statusResult.data.charges_enabled &&
    statusResult.data.details_submitted &&
    statusResult.data.payouts_enabled;
}
```

### Mapbox Geocoding Integration

#### Address Processing

```typescript
// lib/mapbox.ts - Line 71-132
export function parseMapboxResponse(
  suggestion: MapboxSuggestion
): ParsedMapboxResponse {
  const context = suggestion.context || [];
  let countryCode: string | undefined;

  for (const item of context) {
    if (item.id.startsWith("country")) {
      country = item.text;
      // Critical: Extract ISO country code for Stripe compliance
      countryCode = item.short_code?.toUpperCase();
    }
  }

  return {
    street,
    city,
    postalCode,
    country,
    countryCode, // ISO 3166-1 alpha-2 (e.g., "NO", "DK", "SE")
    geometry: suggestion.center,
  };
}
```

## Component Architecture

### Application Form

**File**: `components/forms/stylist-application-form.tsx`

```typescript
// Form schema with address validation
const applicationFormSchema = z.object({
  address: z.object({
    streetAddress: z.string().min(5),
    city: z.string().min(2),
    postalCode: z.string().min(4),
    country: z.string().min(1),
    countryCode: z.string().optional(), // From Mapbox
    geometry: z.tuple([z.number(), z.number()]).optional(),
  }),
});

// Address selection handler
const handleAddressSelect = (suggestion: MapboxSuggestion) => {
  const parsed = parseMapboxResponse(suggestion);
  form.setValue("address.countryCode", parsed.countryCode);
  // ... other field updates
};
```

### Admin Review Interface

**File**: `app/admin/soknader/[applicationId]/page.tsx`

- Server-side rendered application details
- Portfolio image display with Supabase storage integration
- Status management form with validation
- Admin-only access control via `isAdmin()` helper

### Stripe Onboarding Page

**File**: `app/stylist/stripe/page.tsx`

```typescript
// Server-side status determination
let needsOnboarding = true;
if (stylistDetails.stripe_account_id) {
  const statusResult = await getStripeAccountStatus({
    stripeAccountId: stylistDetails.stripe_account_id,
  });

  needsOnboarding = !(
    statusResult.data.charges_enabled &&
    statusResult.data.details_submitted &&
    statusResult.data.payouts_enabled
  );
}
```

### Return Page (Hybrid Architecture)

**File**: `app/stylist/stripe/return/page.tsx`

#### Server Component (Fast Checks)

```typescript
// Optimized for performance - only essential checks
const { data: profile } = await supabase
  .from("profiles")
  .select("role") // Only role needed
  .eq("id", user.id)
  .single();

// Fast authorization validation
if (profile.role !== "stylist") redirect("/");
```

#### Client Component (Slow API Calls)

**File**: `components/stripe/stripe-return-content.tsx`

```typescript
// TanStack Query for Stripe API calls
const { data: stripeData, isLoading } = useQuery({
    queryKey: ["stripe-return-status"],
    queryFn: getCurrentUserStripeStatus,
    refetchOnWindowFocus: false,
    retry: 2,
});

// Skeleton loading state matching final layout
if (isLoading) return <StripeReturnSkeleton />;
```

## Server Actions

### Application Processing

**File**: `server/application.actions.ts`

#### Application Creation

```typescript
export async function createApplication(data: ApplicationFormData) {
  // Validate with Zod schema
  const applicationValidation =
    applicationsInsertSchema.safeParse(applicationData);

  // Create application record
  const { data: applicationResult } = await supabase
    .from("applications")
    .insert(applicationValidation.data);

  // Process portfolio images
  const mediaPromises = data.portfolioImageUrls.map(async (imageUrl) => {
    return supabase.from("media").insert({
      application_id: applicationResult.id,
      file_path: extractedPath,
      media_type: "application_image",
    });
  });
}
```

#### Approval Process

```typescript
export async function updateApplicationStatus({ status }) {
  if (status === "approved") {
    // 1. Create Supabase auth user
    const { data: authUser } =
      await serviceSupabaseClient.auth.admin.createUser({
        email: application.email,
        user_metadata: { role: "stylist" },
      });

    // 2. Create address record
    const addressData = {
      user_id: authUser.user.id,
      country_code: application.country_code, // Use stored ISO code
    };

    // 3. Create Stripe Customer (for purchasing)
    const customerResult = await createCustomerWithDatabase({
      profileId: authUser.user.id,
      email: application.email,
    });

    // 4. Create Stripe Connect Account (for payments)
    const stripeResult = await createConnectedAccountWithDatabase({
      profileId: authUser.user.id,
      address: {
        country: getCountryCode(application.country_code),
      },
    });

    // 5. Create stylist_details record
    await serviceSupabaseClient.from("stylist_details").insert({
      profile_id: authUser.user.id,
      stripe_account_id: stripeResult.data.stripeAccountId,
    });
  }
}
```

## Error Handling & Performance

### Client-Side Error Handling

```typescript
// Comprehensive error states in stripe-return-content.tsx
if (queryError || stripeData?.error || !stripeData?.data) {
    const errorMessage =
        queryError?.message ||
        stripeData?.error ||
        "Kunne ikke laste Stripe-status";

    return <ErrorDisplay message={errorMessage} />;
}
```

### Performance Optimizations

#### Hybrid Loading Pattern

- **Server**: Fast auth/permission checks (< 100ms)
- **Client**: Slow Stripe API calls with loading states
- **Result**: Immediate page load with progressive data loading

#### Query Configuration

```typescript
const { data, isLoading } = useQuery({
  queryKey: ["stripe-return-status"],
  queryFn: getCurrentUserStripeStatus,
  refetchOnWindowFocus: false, // Prevent unnecessary calls
  retry: 2, // Limited retry for failed requests
});
```

## Security Implementation

### Authentication Flow

1. **Server-side auth verification** for page access
2. **Role-based authorization** (stylist-only pages)
3. **Supabase RLS policies** for data access
4. **Service client usage** for admin operations

### Data Validation

```typescript
// Zod schema validation at multiple levels
const applicationsInsertSchema = z.object({
  email: z.string().email(),
  country_code: z.string().optional(),
  // ... comprehensive validation
});

// Form validation
const applicationFormSchema = z
  .object({
    address: z.object({
      countryCode: z.string().optional(),
    }),
  })
  .refine((data) => data.priceRangeTo >= data.priceRangeFrom);
```

## Monitoring & Logging

### Stripe Integration Logging

```typescript
// Comprehensive logging throughout approval process
console.log(
  `[STRIPE_CONNECT] Creating connected account for user ${authUser.user.id}`
);
console.log(
  `[STRIPE_CONNECT] Converting country "${application.country}" to ISO code "${countryCode}"`
);
console.log(`[STRIPE_CONNECT] Successfully created account ${stripeAccountId}`);
```

### Error Tracking

- Server action error returns with structured error messages
- Client-side error boundaries for component failures
- PostHog integration for error analytics

## Deployment Considerations

### Environment Variables

```bash
# Stripe configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Mapbox integration
NEXT_PUBLIC_MAPBOX_TOKEN=pk.ey...

# Email notifications
ADMIN_EMAIL=admin@nabostylisten.no
```

### Database Migrations

Country code support requires schema updates:

```sql
-- Add country_code columns
ALTER TABLE applications ADD COLUMN country_code text;
ALTER TABLE addresses ADD COLUMN country_code text;

-- Update existing records with country code mapping
UPDATE applications SET country_code = 'NO' WHERE country = 'Norge';
```

### Stripe Webhook Configuration

Required endpoints for real-time status updates:

- `account.updated` - Account status changes
- `account.application.authorized` - Onboarding completion
- `account.application.deauthorized` - Account deactivation

## Testing Strategy

### Unit Tests

- Form validation logic
- Country code extraction from Mapbox responses
- Server action error handling

### Integration Tests

- Stripe Connect account creation flow
- Application approval process
- Email notification delivery

### End-to-End Tests

- Complete onboarding flow from application to platform access
- Admin approval workflow
- Error scenarios and recovery paths

## Future Enhancements

### Technical Improvements

- **Real-time status updates** via Stripe webhooks
- **Background job processing** for heavy operations
- **Caching layer** for frequent Stripe API calls
- **Rate limiting** for API protection

### Feature Extensions

- **Multi-region support** with localized payment methods
- **Bulk operations** for admin efficiency
- **Advanced analytics** for onboarding funnel optimization
- **Mobile app integration** for stylist onboarding
