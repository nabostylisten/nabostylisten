# Address System Technical Implementation

## Architecture Overview

The address management system is built on a modern stack combining PostgreSQL with PostGIS for geographic capabilities, Mapbox for geocoding and autocomplete, React components for the UI, and server actions for data management. The system provides comprehensive address storage, validation, and geographic search functionality.

## Database Schema

### Core Address Table

```sql
-- Table for addresses associated with a user
CREATE TABLE IF NOT EXISTS public.addresses (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Address Details
    nickname text, -- e.g., "Home", "Work"
    street_address text NOT NULL,
    city text NOT NULL,
    postal_code text NOT NULL,
    country text NOT NULL,
    entry_instructions text, -- For "how to enter the place"
    location gis.geography(Point, 4326), -- PostGIS geography column for efficient spatial queries

    is_primary boolean DEFAULT false NOT NULL
);
```

### PostGIS Integration

The system uses PostGIS extension for advanced geographic functionality:

```sql
-- Create a dedicated schema for PostGIS
CREATE SCHEMA IF NOT EXISTS gis;

-- Enable PostGIS extension in the gis schema for geographic queries
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA gis;

-- Grant access to the gis schema for PostGIS functions
GRANT USAGE ON SCHEMA gis TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA gis TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA gis TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA gis TO anon, authenticated, service_role;
```

### Geographic Functions

Custom function for finding nearby addresses:

```sql
-- Function to find nearby addresses within a given radius
CREATE OR REPLACE FUNCTION public.nearby_addresses(lat float, long float, radius_km float DEFAULT 10.0)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  nickname text,
  street_address text,
  city text,
  postal_code text,
  country text,
  entry_instructions text,
  is_primary boolean,
  lat float,
  long float,
  distance_meters float
)
SET search_path = ''
LANGUAGE sql
AS $$
  SELECT 
    a.id,
    a.user_id,
    a.nickname,
    a.street_address,
    a.city,
    a.postal_code,
    a.country,
    a.entry_instructions,
    a.is_primary,
    gis.st_y(a.location::gis.geometry) as lat,
    gis.st_x(a.location::gis.geometry) as long,
    gis.st_distance(a.location, gis.st_point(long, lat)::gis.geography) as distance_meters
  FROM public.addresses a
  WHERE a.location IS NOT NULL
    AND gis.st_distance(a.location, gis.st_point(long, lat)::gis.geography) <= (radius_km * 1000)
  ORDER BY a.location operator(gis.<->) gis.st_point(long, lat)::gis.geography;
$$;
```

### Performance Optimization

Spatial index for efficient geographic queries:

```sql
-- Spatial index for efficient geographic queries on addresses
CREATE INDEX IF NOT EXISTS idx_addresses_location ON public.addresses USING gist (location);
```

## Server Actions Implementation

### File Structure
```
server/addresses.actions.ts - All address-related server operations
```

### Key Functions

#### Address Creation with Geocoding
```typescript
export async function createAddress(data: Omit<AddressInsert, "user_id" | "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Check if this is the user's first address
  const { data: existingAddresses } = await supabase
    .from("addresses")
    .select("id")
    .eq("user_id", user.id);
  
  const isFirstAddress = !existingAddresses || existingAddresses.length === 0;
  
  // Auto-geocode if coordinates not provided
  let location = data.location;
  if (!location && data.street_address && data.city && data.country) {
    const coords = await geocodeAddress({
      street: data.street_address,
      city: data.city,
      postalCode: data.postal_code,
      country: data.country,
    });
    if (coords) {
      location = `POINT(${coords.lng} ${coords.lat})`;
    }
  }
  
  // First address is automatically primary
  return await supabase.from("addresses").insert({
    ...validationResult.data,
    location,
    is_primary: data.is_primary || isFirstAddress,
  });
}
```

#### Mapbox Geocoding Integration
```typescript
async function geocodeAddress({ street, city, postalCode, country }: {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}): Promise<{ lat: number; lng: number } | null> {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const query = `${street}, ${postalCode} ${city}, ${country}`;
  
  const params = new URLSearchParams({
    access_token: accessToken,
    country: country.toLowerCase() === "norge" || country.toLowerCase() === "norway" ? "no" : country,
    types: "address",
    limit: "1",
  });

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`
  );
  
  const data = await response.json();
  if (data.features && data.features.length > 0) {
    const [lng, lat] = data.features[0].center;
    return { lat, lng };
  }
  
  return null;
}
```

### Primary Address Management
```typescript
// Automatic primary address logic
if (data.is_primary || isFirstAddress) {
  await supabase
    .from("addresses")
    .update({ is_primary: false })
    .eq("user_id", user.id);
}
```

## RPC Integration

### File Structure
```
lib/supabase/rpc.ts - Wrapper functions for PostGIS operations
```

### Geographic Search Wrapper
```typescript
export async function findNearbyAddresses(
  supabase: SupabaseClient<Database>,
  lat: number,
  lng: number,
  radiusKm: number = 10
) {
  const { data, error } = await supabase.rpc('nearby_addresses', {
    lat,
    long: lng,
    radius_km: radiusKm
  });

  if (error) {
    console.error('Error finding nearby addresses:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
```

## Frontend Components

### Component Structure
```
components/
├── addresses/
│   ├── address-dialog.tsx          # Create/edit address modal
│   ├── address-form.tsx            # Reusable address form
│   ├── address-combobox.tsx        # Address selection dropdown
│   └── profile-addresses.tsx       # Address management interface
└── ui/
    └── address-input.tsx           # Mapbox autocomplete input
```

### Address Form Component
```typescript
export interface AddressFormValues {
  nickname?: string;
  fullAddress: string;
  street_address: string;
  city: string;
  postal_code: string;
  country: string;
  entry_instructions?: string;
  is_primary: boolean;
  location?: {
    lat: number;
    lng: number;
  };
}
```

### Mapbox Integration

#### Address Autocomplete Component
```typescript
// AddressInput component integrates with Mapbox Geocoding API
const handleAddressSelect = (suggestion: any) => {
  const components = parseMapboxResponse(suggestion);
  
  form.setValue("street_address", components.street);
  form.setValue("city", components.city);
  form.setValue("postal_code", components.postalCode);
  form.setValue("country", components.country);
  
  if (suggestion.center) {
    form.setValue("location", {
      lng: suggestion.center[0],
      lat: suggestion.center[1],
    });
  }
};
```

#### Mapbox Response Parser
```typescript
function parseMapboxResponse(suggestion: any) {
  const context = suggestion.context || [];
  
  let postalCode = "";
  let city = "";
  let country = "Norge";
  
  for (const item of context) {
    if (item.id.startsWith("postcode")) {
      postalCode = item.text;
    } else if (item.id.startsWith("place")) {
      city = item.text;
    } else if (item.id.startsWith("country")) {
      country = item.text;
    }
  }
  
  const street = suggestion.text || "";
  
  return { street, city, postalCode, country };
}
```

### Dialog Management

#### Create/Update Address Dialog
```typescript
interface AddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (addressId: string) => void;
  address?: Address; // If provided, dialog will be in update mode
  mode?: "create" | "update";
}

// Auto-determine mode based on address prop
const actualMode = address ? "update" : mode;

// Form population for update mode
useEffect(() => {
  if (address) {
    form.reset({
      nickname: address.nickname || "",
      fullAddress: `${address.street_address}, ${address.postal_code} ${address.city}`,
      street_address: address.street_address,
      city: address.city,
      postal_code: address.postal_code,
      country: address.country,
      entry_instructions: address.entry_instructions || "",
      is_primary: address.is_primary,
    });
  }
}, [address, form]);
```

### Delete Confirmation System
```typescript
// AlertDialog for delete confirmation
<AlertDialog open={!!deleteConfirmAddress}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Slett adresse</AlertDialogTitle>
      <AlertDialogDescription>
        Er du sikker på at du vil slette denne adressen?{" "}
        <strong>
          {deleteConfirmAddress?.nickname || deleteConfirmAddress?.street_address}
        </strong>
        <br />
        Denne handlingen kan ikke angres.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Avbryt</AlertDialogCancel>
      <AlertDialogAction onClick={handleDeleteConfirm}>
        Slett adresse
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## Data Flow Architecture

### Form Submission Flow
1. User fills out address form with Mapbox autocomplete
2. Form data includes both human-readable and coordinate data
3. Server action validates data using Zod schemas
4. If coordinates missing, server geocodes address via Mapbox API
5. Address stored with PostGIS POINT geometry
6. Geographic index automatically updated

### Address Selection Flow
1. User selects address in booking/profile interface
2. Component fetches user addresses via TanStack Query
3. Primary address shown first, sorted by creation date
4. Selected address includes all metadata and coordinates
5. Coordinates used for distance calculations and mapping

### Geographic Search Flow
1. Application needs nearby addresses (future feature)
2. Calls RPC wrapper with coordinates and radius
3. PostGIS function performs efficient spatial query using GIST index
4. Results sorted by distance using geographic operator
5. Returns addresses with calculated distances

## Performance Considerations

### Database Optimization
- **Spatial Indexing**: GIST index on location column for sub-millisecond geographic queries
- **Query Planning**: PostGIS query planner optimizes spatial operations
- **Connection Pooling**: Supabase handles database connection efficiency

### API Integration
- **Mapbox Rate Limits**: Geocoding calls are cached and minimized
- **Error Handling**: Graceful fallback when geocoding fails
- **Request Optimization**: Batch operations where possible

### Frontend Performance
- **Component Composition**: Reusable form components reduce bundle size
- **State Management**: TanStack Query provides efficient caching
- **Lazy Loading**: Address components loaded on-demand

## Security Implementation

### Data Privacy
- **Row Level Security**: Users can only access their own addresses
- **API Authentication**: All server actions require authenticated user
- **Field Sanitization**: Input validation prevents injection attacks

### Geographic Data Security
- **Coordinate Precision**: Stored with appropriate precision for service needs
- **Access Controls**: Address details only shared with confirmed bookings
- **Entry Instructions**: Sensitive information encrypted at rest

## Error Handling

### Geocoding Failures
```typescript
if (!response.ok) {
  console.error("Mapbox geocoding failed:", response.status);
  return null; // Graceful fallback to manual coordinates
}
```

### Database Errors
```typescript
if (error) {
  return { error: error.message, data: null };
}
```

### Form Validation
```typescript
const validationResult = addressesInsertSchema.safeParse(data);
if (!validationResult.success) {
  return { error: "Invalid data", data: null };
}
```

## Testing Considerations

### Unit Tests
- Server action validation logic
- Mapbox response parsing functions
- Geographic calculation accuracy

### Integration Tests
- End-to-end address creation flow
- PostGIS spatial query correctness
- Mapbox API integration reliability

### Performance Tests
- Geographic query response times
- Large dataset spatial operations
- Concurrent address operations

## Deployment and Monitoring

### Environment Variables
```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx # Mapbox public API key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx
```

### Database Migrations
```bash
# Generate migration after schema changes
bun supabase:db:diff address_system_updates

# Apply migrations
bun supabase:migrate:up
```

### Monitoring
- Track geocoding API usage and success rates
- Monitor PostGIS query performance
- Alert on address validation failures

This technical implementation provides a robust, scalable address management system that integrates seamlessly with the broader Nabostylisten platform architecture.