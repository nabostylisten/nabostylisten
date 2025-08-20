# Database Seeding - Technical Documentation

## Overview

The Nabostylisten platform uses **Snaplet Seed** to generate realistic test data for local development and testing environments. This document provides technical details on how database seeding is implemented, configured, and maintained.

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

## Architecture

### File Structure

```
nabostylisten/
├── seed.ts                    # Main seed script
├── seed.config.ts             # Snaplet configuration
├── package.json               # Scripts and dependencies
├── .snaplet/                  # Generated Snaplet files
│   ├── dataModel.json         # Database structure analysis
│   └── config.json            # Runtime configuration
└── supabase/
    ├── seed.sql              # Generated SQL output
    └── schemas/              # Database schema definitions
```

### Configuration Architecture

The seeding system consists of three main configuration layers:

1. **Snaplet Configuration** (`seed.config.ts`)
2. **Seed Logic** (`seed.ts`)
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

### Package Scripts

```json
{
  "seed:sync": "bunx @snaplet/seed sync",
  "seed": "bunx tsx seed.ts > supabase/seed.sql"
}
```

## Database Schema Integration

### Supported Schemas

The seeding system is configured to work with:

1. **Public Schema (`public*`)**:

   - All application tables
   - Business logic entities
   - User-generated content

2. **Auth Schema (`auth.users`, `auth.identities`, `auth.sessions`)**:
   - Supabase authentication tables
   - User authentication data
   - Session management

### Schema Analysis Process

```bash
# Analyze database structure
bunx @snaplet/seed sync
```

This command:

1. Connects to the local Supabase database
2. Analyzes table schemas and relationships
3. Generates TypeScript types in `.snaplet/dataModel.json`
4. Creates seed client with proper type definitions

## Seed Data Structure

### Core Entities

The seed script populates the following core entities in dependency order:

#### 1. Service Categories

- **Main Categories**: Hair, Nails, Makeup, Brows & Lashes, Wedding
- **Subcategories**: Hierarchical structure with parent-child relationships
- **Purpose**: Foundation for service classification

#### 2. Users & Authentication

- **Admin User**: System administrator with full access
- **Stylists**: 3 stylists with varied profiles and specializations
- **Customers**: 2 customers for testing booking flows

#### 3. Stylist Profiles & Details

- **Professional Information**: Bio, travel preferences, service areas
- **Social Media**: Instagram, Facebook, TikTok profiles
- **Addresses**: Primary business locations with geographic coordinates

#### 4. Services

- **Service Offerings**: 9 services across different categories
- **Pricing**: Realistic Norwegian pricing (650-2500 NOK)
- **Location Options**: At customer place, at stylist place, or both
- **Publishing Status**: All services published for testing

#### 5. Availability Management

- **Work Schedules**: Different patterns for each stylist
- **One-off Unavailability**: Specific time blocks (lunch, appointments)
- **Recurring Patterns**: Weekly/monthly recurring unavailability
- **iCalendar Rules**: RRULE format for complex recurrence patterns

#### 6. Applications

- **Various Statuses**: Applied, pending_info, approved
- **Realistic Data**: Norwegian addresses, phone numbers, experience descriptions
- **Category Mapping**: Applications linked to service categories

#### 7. System Configuration

- **Discount Codes**: Percentage and fixed amount discounts
- **Validation Rules**: Usage limits, expiration dates

## Seed Script Implementation

### Basic Structure

```typescript
import { createSeedClient } from "@snaplet/seed";

async function main() {
  const seed = await createSeedClient({ dryRun: true });

  // Clear existing data
  await seed.$resetDatabase();

  // Create entities in dependency order
  await seed.users([...]);
  await seed.service_categories([...]);
  // ... additional entities

  console.log("Database seeded successfully! 🌱");
  process.exit(0);
}
```

### Key Implementation Patterns

#### 1. Dry Run Mode

```typescript
const seed = await createSeedClient({ dryRun: true });
```

- Generates SQL without executing
- Perfect for Supabase integration
- Allows manual review of generated queries

#### 2. Entity Relationships

```typescript
// Capture returned entities for relationships
const { users: stylists } = await seed.users([...]);
const { service_categories: mainCategories } = await seed.service_categories([...]);

// Use in dependent entities
await seed.services([
  {
    stylist_id: stylists[0].profiles.id,
    service_service_categories: [
      { category_id: mainCategories[0].id },
    ],
  },
]);
```

#### 3. Type Safety

```typescript
// @ts-ignore for complex nested relationships
const mariaId = stylists[0].profiles.id;
```

### Availability System Integration

#### Work Schedule Seeding

```typescript
await seed.stylist_availability_rules([
  // Different patterns for each stylist
  {
    stylist_id: mariaId,
    day_of_week: "monday",
    start_time: "09:00",
    end_time: "17:00",
  },
  {
    stylist_id: emmaId,
    day_of_week: "tuesday",
    start_time: "12:00",
    end_time: "20:00",
  },
  {
    stylist_id: sophiaId,
    day_of_week: "wednesday",
    start_time: "10:00",
    end_time: "18:00",
  },
]);
```

#### Recurring Unavailability

```typescript
await seed.stylist_recurring_unavailability([
  {
    stylist_id: mariaId,
    title: "Lunsj pause",
    start_time: "12:00:00",
    end_time: "13:00:00",
    series_start_date: seriesStartDate,
    series_end_date: null, // Continues indefinitely
    rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", // Every weekday
  },
]);
```

**RRULE Patterns Used:**

- `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR` - Every weekday
- `FREQ=WEEKLY;BYDAY=TU` - Every Tuesday
- `FREQ=MONTHLY;BYMONTHDAY=1` - First day of every month

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

### 2. Seed Data Generation

```bash
# Generate seed SQL
bun run seed

# Reset database with seed data
supabase db reset
```

### 3. Schema Changes

When database schema changes:

```bash
# Re-sync Snaplet types
bun run seed:sync

# Update seed script as needed
# Regenerate seed SQL
bun run seed
```

## Data Consistency

### Referential Integrity

The seed script maintains referential integrity by:

1. **Dependency Ordering**: Creates parent entities before children
2. **Foreign Key Management**: Captures and reuses entity IDs
3. **Constraint Validation**: Respects database constraints and triggers

### Realistic Data Patterns

#### Norwegian Localization

- **Phone Numbers**: +47 format
- **Addresses**: Real Norwegian cities and postal codes
- **Names**: Norwegian naming conventions
- **Currency**: NOK (Norwegian Kroner)

#### Business Logic Compliance

- **Pricing**: Realistic service pricing in Norwegian market
- **Availability**: Realistic work schedules and patterns
- **Applications**: Realistic professional experience descriptions

## Performance Considerations

### Optimization Strategies

1. **Batch Operations**: Insert multiple records in single operations
2. **Relationship Mapping**: Efficient foreign key assignment
3. **Minimal Data Set**: Only essential data for testing

### Resource Usage

- **Generation Time**: ~2-5 seconds for complete seed
- **Database Size**: ~50-100 records across all tables
- **Memory Usage**: Minimal due to streaming approach

## Error Handling

### Common Issues

#### 1. Connection Errors

```bash
SnapletError: 9302
Unable to connect to the database
```

**Solution**: Verify Supabase is running and connection string is correct

#### 2. Schema Sync Issues

```bash
Database analysis failed
```

**Solution**: Run `bun run seed:sync` after schema changes

#### 3. Type Errors

```typescript
// Use @ts-ignore for complex nested types
// @ts-ignore
const userId = users[0].profiles.id;
```

### Debugging Strategies

1. **Dry Run Inspection**: Review generated SQL before execution
2. **Incremental Testing**: Comment out sections to isolate issues
3. **Database Logs**: Check Supabase logs for constraint violations

## Integration with Supabase

### Reset Integration

The seed data integrates with Supabase's database reset functionality:

```bash
supabase db reset
```

This command:

1. Drops and recreates the database
2. Applies all migrations
3. Executes `supabase/seed.sql`
4. Triggers database functions (user profile creation, etc.)

### Development Benefits

- **Consistent State**: Every reset produces identical data
- **Feature Testing**: Comprehensive test scenarios
- **Performance Testing**: Realistic data volumes and relationships

## Maintenance

### Regular Updates

#### 1. Schema Evolution

- Update `seed.ts` when adding new tables
- Adjust relationships when schema changes
- Re-sync Snaplet types after migrations

#### 2. Data Relevance

- Update Norwegian addresses and phone numbers
- Adjust pricing to market rates
- Refresh realistic business scenarios

#### 3. Feature Coverage

- Add seed data for new features
- Expand test scenarios as application grows
- Maintain representative user journeys

### Version Management

```bash
# Update Snaplet Seed
bun add -D @snaplet/seed@latest

# Re-sync after updates
bun run seed:sync
```

## Security Considerations

### Local Development Only

- **Environment Isolation**: Seed data only for local development
- **No Production Data**: Never run seeds against production databases
- **Safe Defaults**: Test data uses example.com domains

### Data Privacy

- **Synthetic Data**: All personal information is fictional
- **No Real Credentials**: Authentication uses test passwords
- **GDPR Compliance**: No actual personal data stored

## Future Enhancements

### Planned Improvements

1. **Dynamic Scaling**: Configure data volume via environment variables
2. **Scenario Templates**: Predefined test scenarios for different features
3. **Performance Testing**: Large data sets for performance evaluation
4. **Multi-tenant Support**: Multiple studio configurations

### Integration Opportunities

1. **CI/CD Pipeline**: Automated seeding in test environments
2. **E2E Testing**: Consistent data for automated tests
3. **Performance Monitoring**: Baseline metrics from seed data
4. **Documentation**: Interactive demos with seed data

## Troubleshooting Guide

### Common Commands

```bash
# Full reset and reseed
supabase db reset

# Sync types only
bun run seed:sync

# Generate SQL only
bun run seed

# Check Supabase status
supabase status

# View database logs
supabase logs -f db
```

### Validation Queries

After seeding, verify data integrity:

```sql
-- Check user counts by role
SELECT role, COUNT(*) FROM profiles GROUP BY role;

-- Verify service-category relationships
SELECT sc.name, COUNT(s.id) as service_count
FROM service_categories sc
LEFT JOIN service_service_categories ssc ON sc.id = ssc.category_id
LEFT JOIN services s ON ssc.service_id = s.id
GROUP BY sc.name;

-- Check availability rules coverage
SELECT p.full_name, COUNT(sar.id) as availability_rules
FROM profiles p
LEFT JOIN stylist_availability_rules sar ON p.id = sar.stylist_id
WHERE p.role = 'stylist'
GROUP BY p.full_name;
```

This technical documentation provides a complete reference for maintaining and extending the Nabostylisten database seeding system.
