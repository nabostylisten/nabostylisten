# Data Migration Strategy: MySQL to Supabase

## Executive Summary

This document outlines the complete strategy for migrating Nabostylisten's data from the legacy MySQL Aurora RDS system to the new Supabase PostgreSQL platform. The migration involves significant architectural changes, data transformation, and business logic updates while ensuring zero data loss and minimal downtime.

## Migration Scope

### Data Volume Assessment

Based on the legacy database dump analysis:

- **26 MySQL tables** → **24+ Supabase tables**
- **Core entities**: ~10K+ users, bookings, services, payments
- **Media assets**: Images and file references
- **Historical data**: Chat messages, reviews, payment records
- **Geographic data**: Address coordinates requiring PostGIS conversion

### Business Impact

- **Zero data loss requirement** - All business-critical data must be preserved
- **Referential integrity** - All relationships must be maintained
- **Backward compatibility** - Support rollback if needed
- **Performance optimization** - Improved query performance post-migration

## Migration Architecture

### Tools and Environment

#### Database Tools

```bash
# Required tools for migration execution
mysql@8.0              # MySQL client for data extraction
postgresql              # PostgreSQL client for data loading
supabase-cli           # Supabase local development
node.js + typescript  # Migration script runtime
```

#### File Structure

```
migration/
├── scripts/
│   ├── extract/           # MySQL data extraction scripts
│   ├── transform/         # Data transformation logic
│   ├── load/             # Supabase data loading scripts
│   └── validate/         # Data validation and testing
├── config/
│   ├── mysql-connection.ts
│   ├── supabase-connection.ts
│   └── mapping-config.ts
├── temp/
│   ├── dumps/            # Raw MySQL dumps
│   ├── transformed/      # Processed JSON data
│   └── logs/            # Migration execution logs
└── docs/
    ├── runbook.md       # Step-by-step execution guide
    └── rollback.md      # Emergency rollback procedures
```

### Migration Pipeline

#### 1. Extract (MySQL → JSON)

```typescript
// Extract data from MySQL dump or live database
interface ExtractorConfig {
  source: "dump" | "live";
  dumpPath?: string;
  connectionString?: string;
  tables: string[];
  batchSize: number;
}

class MySQLExtractor {
  async extractTable(tableName: string): Promise<Record<string, any>[]>;
  async extractAll(): Promise<MigrationData>;
}
```

#### 2. Transform (JSON → JSON)

```typescript
// Apply business logic transformations
interface TransformationPipeline {
  userConsolidation: UserTransformer;
  addressMapping: AddressTransformer;
  statusMappings: StatusTransformer;
  jsonNormalization: JSONTransformer;
  referenceUpdates: ReferenceTransformer;
}

class DataTransformer {
  async transformUsers(): Promise<ProfilesData>;
  async transformBookings(): Promise<BookingsData>;
  async validateReferences(): Promise<ValidationResult>;
}
```

#### 3. Load (JSON → Supabase)

```typescript
// Load transformed data into Supabase
class SupabaseLoader {
  async loadInOrder(): Promise<LoadingResult>;
  async validateIntegrity(): Promise<IntegrityReport>;
  async enableRLS(): Promise<void>;
}
```

## Migration Execution Plan

### Phase 1: Environment Setup (Day 1)

**Duration**: 4 hours
**Risk**: Low

```bash
# 1. Prepare migration environment
npm create migration-workspace
cd migration-workspace
npm install @supabase/supabase-js mysql2 typescript

# 2. Download latest production dump
./scripts/download-production-dump.sh

# 3. Setup local Supabase instance
supabase init
supabase start
supabase db push

# 4. Verify schema compatibility
./scripts/verify-schemas.sh
```

#### Migration Script Configuration

The migration system now supports configurable SQL dump files for different environments:

```bash
# Option 1: Use default development dump
./scripts/run-full-migration.sh

# Option 2: Specify production dump file
./scripts/run-full-migration.sh ./nabostylisten_prod.sql

# Option 3: Use environment variable
export MYSQL_DUMP_PATH="./nabostylisten_prod.sql"
./scripts/run-full-migration.sh

# Option 4: Individual phase execution with custom dump
MYSQL_DUMP_PATH="./custom_dump.sql" bun scripts/migration/run-phase-1.ts
```

**Dump File Naming Convention**:
- **Development**: `nabostylisten_dump.sql` (default, for testing)
- **Production**: `nabostylisten_prod.sql` (recommended for production migration)
- **Custom**: Any `.sql` file with compatible MySQL schema structure

**Success Criteria**:

- [ ] Migration environment operational
- [ ] Latest data dump available (< 24 hours old)
- [ ] Local Supabase instance matches production schema
- [ ] All migration scripts executable

### Phase 2: Data Extraction & Analysis (Day 1-2)

**Duration**: 8 hours  
**Risk**: Low

```bash
# 1. Extract all table data
./scripts/extract-all-tables.sh

# 2. Analyze data quality
./scripts/analyze-data-quality.sh

# 3. Generate migration statistics
./scripts/generate-stats.sh
```

**Key Analysis Points**:

- Record counts per table
- Orphaned records identification
- Data quality issues
- UUID format validation
- Geographic data integrity

**Success Criteria**:

- [ ] All tables extracted successfully
- [ ] Data quality report generated
- [ ] Migration scope confirmed
- [ ] No critical blockers identified

### Phase 3: Data Transformation (Day 2-3)

**Duration**: 12 hours  
**Risk**: Medium

#### User Model Consolidation

```bash
# Transform user data: buyer + stylist → profiles + stylist_details
./scripts/transform/consolidate-users.sh

# Expected output:
# - profiles.json (unified user records)
# - stylist_details.json (stylist-specific data)
# - user_preferences.json (default preferences)
# - address_mappings.json (address ownership updates)
```

#### Service & Category Transformation

```bash
# Transform category hierarchy: category + subcategory → service_categories
./scripts/transform/migrate-categories.sh

# Transform services with new field mappings
./scripts/transform/migrate-services.sh
```

#### Booking & Payment System

```bash
# Simplify booking statuses and create payment records
./scripts/transform/migrate-bookings.sh
./scripts/transform/migrate-payments.sh

# Create booking-service relationships
./scripts/transform/create-booking-services.sh
```

#### Communication System

```bash
# Migrate chat system (booking-based only)
./scripts/transform/migrate-chats.sh

# Convert message senders to proper user references
./scripts/transform/migrate-messages.sh
```

#### Media Management

```bash
# Consolidate all image tables → media table
./scripts/transform/consolidate-media.sh

# Update file paths for Supabase Storage structure
./scripts/transform/update-media-paths.sh
```

**Success Criteria**:

- [ ] All transformations complete without errors
- [ ] Reference integrity validated
- [ ] Required field mappings applied
- [ ] Data volume matches expectations

### Phase 4: Data Loading (Day 3-4)

**Duration**: 8 hours  
**Risk**: Medium-High

#### Loading Order (Critical for referential integrity)

```bash
# 1. Users and Authentication (Foundation)
./scripts/load/01-load-profiles.sh
./scripts/load/02-load-stylist-details.sh
./scripts/load/03-load-user-preferences.sh

# 2. Geographic and Category Data
./scripts/load/04-load-addresses.sh
./scripts/load/05-load-service-categories.sh

# 3. Services and Business Logic
./scripts/load/06-load-services.sh
./scripts/load/07-load-service-categories-junction.sh

# 4. Booking and Transaction Data
./scripts/load/08-load-bookings.sh
./scripts/load/09-load-booking-services.sh
./scripts/load/10-load-payments.sh

# 5. Communication and Reviews
./scripts/load/11-load-chats.sh
./scripts/load/12-load-chat-messages.sh
./scripts/load/13-load-reviews.sh

# 6. Media and Assets
./scripts/load/14-load-media.sh
```

**Progress Monitoring**:

```bash
# Monitor loading progress
watch -n 5 './scripts/monitor-loading-progress.sh'

# Check for loading errors
tail -f logs/loading-errors.log
```

**Success Criteria**:

- [ ] All data loaded without foreign key violations
- [ ] Record counts match transformation output
- [ ] No orphaned records
- [ ] All required indexes created

### Phase 5: Validation & Testing (Day 4-5)

**Duration**: 12 hours  
**Risk**: Medium

#### Data Integrity Validation

```bash
# 1. Record count validation
./scripts/validate/count-validation.sh

# Expected output:
# MySQL buyers: 5,432 → Supabase profiles (customer): 5,432 ✓
# MySQL stylists: 1,234 → Supabase profiles (stylist): 1,234 ✓
# MySQL bookings: 12,345 → Supabase bookings: 12,345 ✓

# 2. Referential integrity checks
./scripts/validate/reference-integrity.sh

# 3. Business logic validation
./scripts/validate/business-logic-validation.sh

# 4. Sample data comparison
./scripts/validate/sample-data-comparison.sh
```

#### Application Integration Testing

```bash
# 1. Test critical user flows
npm run test:migration -- --suite=user-flows

# 2. Test payment system integration
npm run test:migration -- --suite=payments

# 3. Test booking workflow
npm run test:migration -- --suite=bookings

# 4. Test chat functionality
npm run test:migration -- --suite=communication
```

**Success Criteria**:

- [ ] 100% record count accuracy
- [ ] Zero referential integrity violations
- [ ] All critical user flows functional
- [ ] Payment system operational
- [ ] Chat system operational

### Phase 6: Production Deployment (Day 5-6)

**Duration**: 8 hours  
**Risk**: High

#### Pre-deployment Checklist

```bash
# 1. Final production dump (< 2 hours old)
./scripts/fetch-final-dump.sh nabostylisten_prod.sql

# 2. Incremental migration for new data
./scripts/migrate-incremental.sh

# 3. Production Supabase preparation
./scripts/prepare-production-supabase.sh

# 4. DNS and routing preparation
./scripts/prepare-deployment.sh
```

#### Deployment Sequence

```bash
# 1. Enable maintenance mode
./scripts/enable-maintenance.sh

# 2. Final data sync with production dump
./scripts/run-full-migration.sh ./nabostylisten_prod.sql

# 3. Switch database connections
./scripts/switch-to-supabase.sh

# 4. Smoke tests
./scripts/production-smoke-tests.sh

# 5. Disable maintenance mode
./scripts/disable-maintenance.sh
```

**Success Criteria**:

- [ ] Zero data loss during final sync
- [ ] Application fully operational on Supabase
- [ ] All integrations functional (Stripe, email, etc.)
- [ ] Performance metrics within acceptable ranges
- [ ] User authentication working

## Risk Management

### High-Risk Areas

#### 1. User Authentication Migration

**Risk**: User login failures post-migration  
**Mitigation**:

- Preserve all authentication tokens
- Test auth flows extensively
- Keep MySQL auth as backup for 48 hours

#### 2. Payment System Integration

**Risk**: Payment processing failures  
**Mitigation**:

- Validate all Stripe integration data
- Test payment flows before go-live
- Have rollback plan for payment system

#### 3. Geographic Data Conversion

**Risk**: Location-based searches broken  
**Mitigation**:

- Validate coordinate transformations
- Test geographic queries extensively
- Keep original coordinate data during transition

#### 4. File Upload References

**Risk**: Broken image/media links  
**Mitigation**:

- Migrate file paths systematically
- Test media loading across application
- Keep original file references as backup

### Rollback Strategy

#### Immediate Rollback (< 4 hours)

```bash
# 1. Switch application back to MySQL
./scripts/rollback-to-mysql.sh

# 2. Verify all systems operational
./scripts/verify-mysql-operational.sh

# 3. Notify stakeholders
./scripts/notify-rollback.sh
```

#### Partial Rollback (Individual Features)

```bash
# Rollback specific features while keeping Supabase
./scripts/partial-rollback.sh --feature=payments
./scripts/partial-rollback.sh --feature=auth
```

#### Data Recovery

```bash
# Restore specific data from MySQL backups
./scripts/restore-from-backup.sh --table=bookings --timeframe=last-24h
```

## Post-Migration Tasks

### Immediate (Day 6-7)

- [ ] Monitor application performance
- [ ] Verify all integrations operational
- [ ] Check error rates and user feedback
- [ ] Optimize slow queries
- [ ] Update documentation

### Week 1

- [ ] Performance tuning and optimization
- [ ] User feedback analysis and fixes
- [ ] Remove temporary migration infrastructure
- [ ] Update monitoring and alerting
- [ ] Train support team on new system

### Week 2-4

- [ ] Decommission MySQL infrastructure
- [ ] Archive migration data and scripts
- [ ] Conduct migration retrospective
- [ ] Document lessons learned
- [ ] Plan future improvements

## Success Metrics

### Technical Metrics

- **Data Integrity**: 100% record accuracy
- **Performance**: < 2x response time degradation
- **Availability**: < 1 hour total downtime
- **Error Rate**: < 0.1% increase in application errors

### Business Metrics

- **User Impact**: < 5% user-reported issues
- **Transaction Success**: > 99.9% payment processing success
- **Feature Adoption**: All features operational day 1
- **Support Volume**: < 50% increase in support tickets

### Operational Metrics

- **Migration Time**: Complete within 6-day window
- **Team Efficiency**: All team members productive post-migration
- **Infrastructure**: 30% cost reduction achieved
- **Scalability**: System ready for 3x growth

## Emergency Contacts

### Technical Team

- **Migration Lead**: [Name] - [Phone] - [Email]
- **Database Expert**: [Name] - [Phone] - [Email]
- **DevOps Engineer**: [Name] - [Phone] - [Email]

### Business Team

- **Product Owner**: [Name] - [Phone] - [Email]
- **Customer Support**: [Name] - [Phone] - [Email]

### External Partners

- **Supabase Support**: <support@supabase.com>
- **AWS Support**: [Support Case Number]

This migration strategy provides a comprehensive roadmap for successfully transitioning Nabostylisten from MySQL to Supabase while minimizing risk and ensuring business continuity.
