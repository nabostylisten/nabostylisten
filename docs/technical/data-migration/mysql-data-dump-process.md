# MySQL Data Dump from AWS RDS Aurora

## Overview

This document outlines the process for dumping data from the legacy MySQL Aurora RDS database on AWS to prepare for migration to the new Supabase PostgreSQL system.

## Prerequisites

- AWS Console access with RDS permissions
- MySQL client tools (specifically MySQL 8.0 client for compatibility)
- Network connectivity to AWS RDS instance

## Step-by-Step Process

### 1. Create Database Snapshot (Production Safety)

Since the source database is in production, we use a snapshot approach to avoid any performance impact:

1. **Navigate to AWS RDS Console**

   - Go to RDS → Databases → Select your Aurora cluster
   - Note existing automated snapshots (daily at 01:36 UTC)

2. **Use Latest Snapshot**
   - Select most recent snapshot: `rds:nabostylisten-prod-2025-08-25-01-36`
   - Click **Restore**

### 2. Configure Restored Instance

**Restore Settings:**

- **DB instance identifier**: `nabostylisten-dev-dump-temp`
- **DB instance class**: `db.t3.micro` (cost optimization)
- **VPC**: Same as original
- **Security group**: Same as original
- **Public access**: **Yes** (critical for external connectivity)

**Wait Time:** 10-20 minutes for instance to become "Available"

### 3. Network Configuration

**Security Group Setup:**

1. Go to restored instance → Connectivity & security
2. Click on Security group link
3. Add Inbound rule:
   - Type: MySQL/Aurora (3306)
   - Source: Your IP address or 0.0.0.0/0 for testing

**Public Access Verification:**

- Ensure "Publicly accessible" shows "Yes"
- If not, use "Modify" button to change this setting

### 4. Database Connection Details

**Connection Parameters:**

- **Endpoint**: `nabostylisten-dev-dump-temp.ckdnqlzrf5jw.eu-north-1.rds.amazonaws.com`
- **Port**: `3306`
- **Username**: `admin`
- **Password**: Same as original database
- **Database Name**: `nabostylisten-dev`

### 5. Data Export

**MySQL Client Compatibility Issue:**

- Local MySQL client 9.3.0 incompatible with RDS MySQL 8.0.40 authentication
- **Solution**: Use MySQL 8.0 client specifically

**Install MySQL 8.0 Client:**

```bash
brew install mysql@8.0
```

**Export Command:**

```bash
/opt/homebrew/opt/mysql@8.0/bin/mysqldump \
  --hex-blob -h prod-snapshot-2025-09-18.ckdnqlzrf5jw.eu-north-1.rds.amazonaws.com \
  -P 3306 \
  -u admin \
  -p nabostylisten-prod > nabostylisten_prod.sql
```

**Expected Warnings:** (These are normal and can be ignored)

- GTID warnings about partial dumps
- Consistency warnings (acceptable for migration purposes)

### 6. Cleanup

**Important:** Delete the temporary RDS instance immediately after successful dump to avoid ongoing charges:

- Go to RDS → Databases → `nabostylisten-dev-dump-temp`
- Actions → Delete
- Confirm deletion

## Troubleshooting

### Connection Issues

- **Error 2003**: Instance not yet available or security group misconfigured
- **Error 2059**: MySQL client version compatibility - use MySQL 8.0 client

### Network Issues

- Verify Public accessibility is enabled
- Check security group inbound rules
- Ensure instance status is "Available"

## Security Considerations

- Temporary instance has minimal security hardening
- Delete immediately after use
- Dump file contains sensitive production data - handle securely
- Consider encrypting dump file if storing long-term

## Cost Optimization

- Use smallest instance class (db.t3.micro) for temporary instance
- Delete instance immediately after dump
- Estimated cost: ~$0.20-0.40 for the dump process duration

## File Output

- **Dump File**: `nabostylisten_dump.sql` (or custom filename)
- **Location**: Current working directory
- **Contains**: Complete database schema and data from snapshot timestamp

## Migration Script Configuration

The migration scripts can now accept custom SQL dump file paths:

### Running Full Migration with Custom Dump File

```bash
# Use default nabostylisten_dump.sql
./scripts/run-full-migration.sh

# Use production dump file
./scripts/run-full-migration.sh ./nabostylisten_prod.sql

# Use custom path
./scripts/run-full-migration.sh /path/to/custom/dump.sql
```

### Environment Variable Configuration

All migration scripts now support the `MYSQL_DUMP_PATH` environment variable:

```bash
# Set environment variable for individual scripts
MYSQL_DUMP_PATH="./nabostylisten_prod.sql" bun scripts/migration/run-phase-1.ts

# Or export for session
export MYSQL_DUMP_PATH="./nabostylisten_prod.sql"
bun scripts/migration/run-phase-1.ts
```

### Production vs Development Dumps

- **Development Dump**: `nabostylisten_dump.sql` (default)
- **Production Dump**: `nabostylisten_prod.sql` (recommended naming)
- **Custom Dumps**: Any `.sql` file with the same schema structure

## Next Steps

1. Analyze dump file schema structure
2. Map old schema to new Supabase PostgreSQL schema
3. Create migration scripts
4. Test migration process with development dump
5. Execute production migration with production dump
