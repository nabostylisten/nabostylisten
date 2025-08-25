# Database Seeding - Technical Documentation

## Overview

The Nabostylisten platform uses **Snaplet Seed** with a modular architecture to generate realistic test data for local development and testing environments. The system has been refactored from a monolithic 2,300+ line script into a well-organized, maintainable structure with clear separation of concerns.

## Technology Stack

### Core Technologies

- **Snaplet Seed v0.98.0**: AI-powered database seeding tool
- **TypeScript**: Seed scripts written in TypeScript for type safety
- **PostgreSQL**: Target database running in local Supabase instance
- **Supabase**: Local development stack with Docker containers

### Dependencies

```json
{
  "@snaplet/seed": "0.98.0",
  "@snaplet/copycat": "^6.0.0",
  "postgres": "^3.4.7",
  "tsx": "^4.20.3"
}
```

## Modular Architecture

### New File Structure

The seed system has been completely restructured for maintainability and clarity:

```
nabostylisten/
├── seed/                           # New modular seed directory
│   ├── seed.ts                     # Main orchestrator (138 lines)
│   └── utils/                      # Utility functions by domain
│       ├── index.ts                # Centralized exports
│       ├── shared.ts               # Constants & utility functions
│       ├── users.ts                # User creation & authentication
│       ├── categories.ts           # Service categories
│       ├── stylists.ts             # Stylist profiles & availability
│       ├── addresses.ts            # PostGIS location data
│       ├── services.ts             # Service templates & media
│       ├── applications.ts         # Stylist applications
│       ├── discounts.ts            # Discount codes
│       ├── bookings.ts             # Booking system
│       ├── chats.ts                # Messaging system
│       ├── affiliates.ts           # Affiliate tracking
│       ├── payments.ts             # Payment records
│       └── reviews.ts              # Review system
├── seed.config.ts                  # Snaplet configuration
├── package.json                    # Updated script paths
├── .snaplet/                       # Generated Snaplet files
│   ├── dataModel.json             # Database structure analysis
│   └── config.json                # Runtime configuration
└── supabase/
    ├── seed.sql                   # Generated SQL output
    └── schemas/                   # Database schema definitions
```

### Architecture Benefits

1. **Maintainability**: Each domain has its own focused file
2. **Readability**: Main orchestrator reads like documentation
3. **Modularity**: Easy to modify specific areas without touching others
4. **Type Safety**: Full TypeScript support with proper imports
5. **Future-Proofing**: Easy to add new domains or modify existing ones

### Configuration Architecture

The seeding system consists of three main configuration layers:

1. **Snaplet Configuration** (`seed.config.ts`)
2. **Modular Seed Logic** (`seed/seed.ts` + `seed/utils/`)
3. **Package Scripts** (`package.json`)

## Configuration

### Snaplet Configuration (`seed.config.ts`)

```typescript
import { SeedPostgres } from "@snaplet/seed/adapter-postgres";
import { defineConfig } from "@snaplet/seed/config";
import postgres from "postgres";

export default defineConfig({
  adapter: () => {
    const client = postgres(
      "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
    );
    return new SeedPostgres(client);
  },
  select: [
    // Exclude all tables by default
    "!*",
    // Include only specific schemas
    "public*",
    "auth.users",
    "auth.identities",
    "auth.sessions",
  ],
});
```

**Key Configuration Options:**

- **adapter**: PostgreSQL connection configuration
- **select**: Schema and table selection patterns
- **exclusions**: Tables to ignore during analysis

### Updated Package Scripts

```json
{
  "seed:sync": "bunx @snaplet/seed sync",
  "seed": "bunx tsx seed/seed.ts > supabase/seed.sql"
}
```

**Note**: Script path updated from `seed.ts` to `seed/seed.ts`

## Modular Seed Implementation

### Main Orchestrator (`seed/seed.ts`)

The main seed file now serves as a clear, high-level orchestrator:

```typescript
import { createSeedClient } from "@snaplet/seed";
import {
  // User management
  createTestUsersWithAuth,
  createUserEmailIdentities,
  separateUsersByRole,

  // Service categories
  createMainServiceCategories,
  createServiceSubcategories,

  // ... other domain imports
} from "./utils";

async function main() {
  console.log("-- Starting comprehensive database seeding...");
  const seed = await createSeedClient({ dryRun: true });

  // Clear existing data
  await seed.$resetDatabase();

  // 1. Create service category hierarchy
  console.log("-- Phase 1: Service Categories");
  const mainCategories = await createMainServiceCategories(seed);
  await createServiceSubcategories(seed, mainCategories);

  // 2. Create users with authentication
  console.log("-- Phase 2: User Management");
  const allUsers = await createTestUsersWithAuth(seed);
  await createUserEmailIdentities(seed, allUsers);
  const { stylistUsers, customerUsers } = separateUsersByRole(allUsers);

  // ... additional phases

  console.log("-- ✅ Database seeding completed successfully!");
  process.exit(0);
}
```

### Domain-Specific Utilities

Each utility file contains focused, descriptive functions:

#### Users Utility (`seed/utils/users.ts`)

```typescript
/**
 * Creates test users with proper Supabase authentication setup
 * Profiles will be created automatically by database trigger
 */
export async function createTestUsersWithAuth(seed: SeedClient) {
  console.log("-- Creating test users with authentication setup...");

  const { users: allUsers } = await seed.users(
    testUsersData.map(createAuthUserWithSupabaseMetadata)
  );

  return allUsers;
}

/**
 * Separates users by role for easier reference in other seed functions
 */
export function separateUsersByRole(allUsers: any[]) {
  const stylistUsers = allUsers.slice(1, 11); // All 10 stylists (skip admin)
  const customerUsers = allUsers.slice(11, 15); // All 4 customers

  return { stylistUsers, customerUsers };
}
```

#### Services Utility (`seed/utils/services.ts`)

```typescript
/**
 * Generates randomized services based on templates for all stylists
 * Each service gets random pricing, duration, and includes/requirements
 */
export async function createRandomizedServices(
  seed: SeedClient,
  stylistUsers: any[],
  mainCategories: any[]
) {
  console.log("-- Creating randomized services from templates...");

  // Implementation...

  return { services, serviceCategoryLinks };
}

/**
 * Adds curated images to services based on their category
 * Each service gets 3-5 relevant images from the curated collection
 */
export async function addImagesToServices(seed: SeedClient, services: any[]) {
  console.log("-- Adding curated images to services...");
  // Implementation...
}
```

### Shared Constants (`seed/utils/shared.ts`)

Common utilities and constants are centralized:

```typescript
// Service category types
export type ServiceCategoryKey =
  | "hair"
  | "nails"
  | "makeup"
  | "browsLashes"
  | "wedding";

// Curated images organized by main category
export const categoryImages: Record<ServiceCategoryKey, string[]> = {
  hair: [
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800",
    "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800",
    // ... more URLs
  ],
  // ... other categories
};

// Utility functions
export function generateValidPercentage(min = 0.05, max = 0.5): number {
  const value = Math.random() * (max - min) + min;
  return Math.round(value * 100) / 100;
}
```

## Comprehensive Seed Data Structure

### Enhanced Data Volume

The modular system now generates significantly more comprehensive test data:

#### Core Entities (Expanded)

1. **Service Categories**

   - **5 Main Categories**: Hair, Nails, Makeup, Brows & Lashes, Wedding
   - **11 Subcategories**: Hierarchical structure with Norwegian names
   - **Purpose**: Foundation for service classification and filtering

2. **Users & Authentication** (Expanded)

   - **1 Admin User**: System administrator with full access
   - **10 Stylists**: Distributed across Norway's main cities (Oslo, Bergen, Trondheim, Stavanger, Kristiansand)
   - **4 Customers**: For testing various booking scenarios
   - **Proper Auth Setup**: Complete Supabase authentication with identities

3. **Stylist Management System**

   - **Detailed Profiles**: Bio, travel preferences, social media links
   - **Availability Rules**: Varied schedules across all 10 stylists
   - **Unavailability Periods**: One-off blocks and recurring patterns
   - **Geographic Distribution**: Real Norwegian addresses with PostGIS coordinates

4. **Services** (Massive Expansion)

   - **55+ Services**: Comprehensive offerings across all categories
   - **Realistic Pricing**: Norwegian market rates (800-3000 NOK)
   - **Service Templates**: 35+ different service types with variations
   - **Curated Images**: Category-appropriate images from Unsplash
   - **Location Flexibility**: Mix of in-salon and mobile services

5. **Comprehensive Booking System**

   - **205+ Bookings**: Various statuses and time periods
   - **Specific Test Scenarios**: Known bookings for testing workflows
   - **Realistic Distribution**: Past, current, and future bookings
   - **Service Linking**: Bookings properly linked to specific services

6. **Communication System**

   - **3 Active Chats**: Different conversation scenarios
   - **Current Messages**: Realistic customer-stylist conversations
   - **Cron Test Data**: Old messages for cleanup testing (5+ years old)

7. **Reviews & Ratings System**

   - **Comprehensive Coverage**: Every service has multiple reviews
   - **Cross-Reviews**: Stylists reviewing each other's services
   - **Review Images**: Visual variety with customer photos
   - **Rating Distribution**: Weighted towards positive reviews

8. **Business Systems**
   - **Affiliate Program**: Applications, links, and click tracking
   - **Payment Records**: Various payment statuses and commission structures
   - **Discount Codes**: Multiple types with usage tracking
   - **Application Workflow**: Various application statuses for testing

### Data Consistency & Relationships

The modular system maintains strict referential integrity:

1. **Dependency Ordering**: Each phase depends on previous phases
2. **Foreign Key Management**: Proper ID capture and reuse
3. **Business Logic Compliance**: Realistic Norwegian market data
4. **Constraint Validation**: Respects all database constraints and triggers

## Development Workflow

### 1. Database Setup

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase migration up

# Sync Snaplet with current schema
bun run seed:sync
```

### 2. Modular Seed Data Generation

```bash
# Generate comprehensive seed SQL
bun run seed

# Reset database with all seed data
supabase db reset
```

### 3. Schema Changes Workflow

When database schema changes:

```bash
# Re-sync Snaplet types
bun run seed:sync

# Update relevant utility files in seed/utils/
# Regenerate seed SQL
bun run seed
```

### 4. Modular Development

To modify specific domains:

- **User Management**: Edit `seed/utils/users.ts`
- **Service System**: Edit `seed/utils/services.ts`
- **Booking Logic**: Edit `seed/utils/bookings.ts`
- **Review System**: Edit `seed/utils/reviews.ts`
- **etc.**

Main orchestrator (`seed/seed.ts`) rarely needs changes.

## Performance & Scale

### Optimized Performance

1. **Efficient Generation**: ~5-10 seconds for complete seed
2. **Large Dataset**: 200+ entities across all tables
3. **Batch Operations**: Optimized bulk inserts
4. **Memory Efficient**: Streaming approach with minimal memory usage

### Comprehensive Coverage

- **15 Users** with complete authentication setup
- **55+ Services** with images and category relationships
- **205+ Bookings** covering all test scenarios
- **Comprehensive Reviews** ensuring every service has coverage
- **Real Geographic Data** with PostGIS coordinates

## Error Handling & Debugging

### Enhanced Error Context

The modular structure provides better error isolation:

```typescript
// Phase-based error handling
console.log("-- Phase 5: Service Management");
try {
  const { services } = await createRandomizedServices(
    seed,
    stylistUsers,
    mainCategories
  );
  await addImagesToServices(seed, services);
} catch (error) {
  console.error("-- Error in Service Management phase:", error);
  process.exit(1);
}
```

### Debugging Strategies

1. **Phase Isolation**: Comment out phases to isolate issues
2. **Function-Level Testing**: Test individual utility functions
3. **Incremental Building**: Add complexity gradually
4. **SQL Review**: Inspect generated SQL before execution

## Integration Benefits

### Supabase Integration

The enhanced system provides:

- **Consistent State**: Every reset produces identical, comprehensive data
- **Feature Testing**: Full coverage of all platform features
- **Performance Testing**: Realistic data volumes and relationships
- **User Journey Testing**: Complete customer and stylist workflows

### Development Benefits

1. **Quick Setup**: Single command creates full test environment
2. **Realistic Testing**: Norwegian market data with proper relationships
3. **Feature Development**: Comprehensive scenarios for all features
4. **Bug Reproduction**: Consistent data for issue investigation

## Future Maintenance

### Modular Maintenance Advantages

1. **Targeted Updates**: Modify only relevant utility files
2. **Easy Extensions**: Add new domains without touching existing code
3. **Clear Responsibilities**: Each file has a single, clear purpose
4. **Type Safety**: Full TypeScript support prevents runtime errors

### Regular Maintenance Tasks

#### 1. Domain-Specific Updates

- **User Management** (`users.ts`): Update authentication patterns
- **Service Management** (`services.ts`): Add new service types or adjust pricing
- **Geographic Data** (`addresses.ts`): Update Norwegian addresses and coordinates
- **Review System** (`reviews.ts`): Enhance review scenarios

#### 2. Schema Evolution Support

- Update relevant utility files when schema changes
- Maintain foreign key relationships
- Preserve business logic compliance

#### 3. Feature Coverage Expansion

- Add new utility files for new features
- Extend existing utilities for feature enhancements
- Maintain comprehensive test scenario coverage

## Troubleshooting Guide

### Enhanced Validation

After seeding, verify the comprehensive data:

```sql
-- Check comprehensive user distribution
SELECT role, COUNT(*) FROM profiles GROUP BY role;
-- Expected: admin(1), stylist(10), customer(4)

-- Verify service distribution across categories
SELECT sc.name, COUNT(s.id) as service_count
FROM service_categories sc
LEFT JOIN service_service_categories ssc ON sc.id = ssc.category_id
LEFT JOIN services s ON ssc.service_id = s.id
WHERE sc.parent_category_id IS NULL
GROUP BY sc.name;

-- Check booking status distribution
SELECT status, COUNT(*) FROM bookings GROUP BY status;

-- Verify review coverage
SELECT COUNT(*) as total_reviews FROM reviews;

-- Check comprehensive availability coverage
SELECT p.full_name, COUNT(sar.id) as availability_rules
FROM profiles p
LEFT JOIN stylist_availability_rules sar ON p.id = sar.stylist_id
WHERE p.role = 'stylist'
GROUP BY p.full_name;
```

### Common Modular Issues

#### 1. Import Errors

```bash
Error: Cannot resolve module './utils/...'
```

**Solution**: Verify all exports in `seed/utils/index.ts`

#### 2. Phase Dependency Issues

```bash
Error: Cannot read property 'id' of undefined
```

**Solution**: Ensure proper phase ordering and entity capture

#### 3. Type Errors in Utilities

```bash
Type error in seed/utils/services.ts
```

**Solution**: Update specific utility file types after schema changes

## Security & Best Practices

### Modular Security

- **Isolated Concerns**: Security issues contained to specific domains
- **Clear Data Sources**: All test data clearly marked and documented
- **No Production Risk**: Modular structure prevents accidental production seeding

### Development Best Practices

1. **Single Responsibility**: Each utility file has one clear purpose
2. **Descriptive Functions**: Function names clearly indicate their purpose
3. **Type Safety**: Full TypeScript support prevents runtime errors
4. **Documentation**: Each function includes clear documentation
5. **Error Handling**: Proper error context and recovery strategies

This enhanced modular architecture provides a robust, maintainable foundation for database seeding that will scale with the Nabostylisten platform's growth while remaining easy to understand and modify.
