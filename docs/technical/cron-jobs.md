# Cron Jobs - Technical Documentation

## Overview

Nabostylisten uses Vercel Cron Jobs to automate time-based repetitive tasks. Cron jobs are scheduled HTTP GET requests made to specific API endpoints at regular intervals, ensuring consistent execution of maintenance and cleanup operations.

## Technology Stack

- **Vercel Cron Jobs**: Platform-provided scheduling service
- **Next.js API Routes**: Endpoints triggered by cron jobs
- **PostgreSQL**: Database operations via Supabase
- **Environment Variables**: Security through `CRON_SECRET`

## Architecture

### How It Works

1. **Scheduling**: Cron expressions defined in `vercel.json` specify execution frequency
2. **Triggering**: Vercel makes HTTP GET requests to production deployment URLs
3. **Authentication**: Requests include `Authorization: Bearer ${CRON_SECRET}` header
4. **Execution**: API routes validate authentication and perform scheduled tasks
5. **Logging**: All invocations are logged in Vercel's dashboard

### Security Model

All cron job endpoints are secured using multiple layers:

#### 1. Middleware Bypass

Cron job routes (`/api/cron/*`) are excluded from authentication middleware to prevent redirects to login pages:

```typescript
// In lib/supabase/middleware.ts
const publicRoutePatterns = [
  /^\/api\/cron(\/.*)?$/, // /api/cron and all sub-routes (for Vercel cron jobs)
];
```

#### 2. Secret Token Authentication

Each cron job endpoint validates the secret token:

```typescript
const authHeader = request.headers.get("authorization");
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response("Unauthorized", { status: 401 });
}
```

#### 3. Service Role Access

Cron jobs use Supabase service role key to bypass RLS policies:

```typescript
// lib/supabase/service.ts
export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role, not anon key
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
```

#### 4. Security Features

- **CRON_SECRET**: Minimum 16-character random string stored in environment variables
- **Service Role Key**: Bypasses RLS for automated operations (keep secret!)
- **User Agent**: Vercel adds `vercel-cron/1.0` to identify legitimate cron requests
- **Bearer Token**: Authorization header uses Bearer prefix for the secret value
- **No Cookie Dependency**: Cron jobs don't rely on user sessions

## Cron Expression Format

Vercel supports standard cron expression format with UTC timezone:

| Field        | Range | Description            |
| ------------ | ----- | ---------------------- |
| Minute       | 0-59  | Minutes past the hour  |
| Hour         | 0-23  | Hour of the day (UTC)  |
| Day of Month | 1-31  | Day of the month       |
| Month        | 1-12  | Month of the year      |
| Day of Week  | 0-6   | Day of week (0=Sunday) |

### Important Limitations

- All times are in UTC (no timezone configuration)
- No support for MON, SUN, JAN, DEC aliases
- Cannot specify both day of month and day of week
- **Hobby accounts limited to daily cron jobs** - Each job can run at most once per day
- Pro accounts support sub-daily frequencies (hourly, every few minutes, etc.)

## Configuration

### vercel.json Structure

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/cleanup-old-messages",
      "schedule": "0 3 1 * *"
    }
  ]
}
```

### API Route Pattern

All cron job endpoints follow this structure:

```typescript
// app/api/cron/[job-name]/route.ts
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // 1. Verify authentication
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // 2. Perform scheduled task
    const result = await performTask();

    // 3. Return success response
    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error) {
    // 4. Handle errors
    console.error(`Cron job failed: ${error}`);
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
```

## Implemented Cron Jobs

### 1. Chat Message Cleanup

**Path**: `/api/cron/cleanup-old-messages`  
**Schedule**: `0 3 1 * *` (3:00 AM UTC, 1st of every month)  
**Purpose**: Delete chat messages older than 5 years to comply with data retention policies

### 2. Payment Processing

**Path**: `/api/cron/payment-processing`  
**Schedule**: `0 6,18 * * *` (Daily at 6 AM & 6 PM UTC - 12h intervals)  
**Purpose**: Capture payments 24-36 hours before bookings and send confirmation emails

### 3. Payout Processing

**Path**: `/api/cron/payout-processing`  
**Schedule**: `0 9,15,21 * * *` (Daily at 9 AM, 3 PM & 9 PM UTC - 8h intervals)  
**Purpose**: Process payouts to stylists 1-9 hours after service completion and send notifications

### 4. Booking Reminders

**Path**: `/api/cron/booking-reminders`  
**Schedule**: `0 10 * * *` (Daily at 10 AM UTC)  
**Purpose**: Send booking reminders to customers 20-28 hours before appointments

### 5. Weekly Analytics Report

**Path**: `/api/cron/weekly-analytics-report`  
**Schedule**: `0 8 * * 1` (Every Monday at 8 AM UTC)  
**Purpose**: Generate and send comprehensive analytics reports to admin users

#### Business Logic

- Preserves recent chat history for customer service and dispute resolution
- Reduces database storage costs by removing obsolete data
- Maintains system performance by limiting table size
- Complies with data minimization principles

#### Technical Implementation

Uses service role client to bypass RLS policies and leverages database CASCADE for efficiency:

```typescript
// Create service client with elevated permissions
const supabase = createServiceClient();

// Identify messages older than 5 years with related media
const fiveYearsAgo = new Date();
fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

const { data: oldMessages } = await supabase
  .from("chat_messages")
  .select(
    `
    id, 
    chat_id, 
    created_at,
    media!chat_message_id(id, file_path)
  `
  )
  .lt("created_at", fiveYearsAgo.toISOString());

// Collect storage file paths before database deletion
const mediaFilesToDelete = [];
for (const message of oldMessages) {
  for (const media of message.media || []) {
    const path = media.file_path.replace(/^.*\/chat-media\//, "");
    mediaFilesToDelete.push(path);
  }
}

// Delete storage files first
if (mediaFilesToDelete.length > 0) {
  await supabase.storage.from("chat-media").remove(mediaFilesToDelete);
}

// Delete messages (media records cascade deleted automatically)
const { count } = await supabase
  .from("chat_messages")
  .delete()
  .lt("created_at", fiveYearsAgo.toISOString());
```

**Key Optimizations:**

- **Single Query**: Fetches messages and related media in one query using Supabase joins
- **Database CASCADE**: Media records deleted automatically via `ON DELETE CASCADE`
- **Storage Cleanup**: Only manual operation needed - database handles the rest
- **Batch Operations**: Deletes multiple storage files in single API call

#### Monitoring

- Log deleted message count for audit purposes
- Alert if deletion count exceeds threshold
- Track execution time for performance monitoring

## Best Practices

### 1. Idempotency

All cron jobs should be idempotent - running them multiple times should produce the same result:

```typescript
// Good: Uses absolute date comparison
const cutoffDate = new Date();
cutoffDate.setFullYear(cutoffDate.getFullYear() - 5);
await deleteOlderThan(cutoffDate);

// Bad: Relative deletion could compound
await deleteOldestPercent(10);
```

### 2. Concurrency Control

Prevent overlapping executions using distributed locks:

```typescript
// Using database-based lock
const { data: lock } = await supabase
  .from("cron_locks")
  .insert({ job_name: "cleanup-messages", locked_at: new Date() })
  .select()
  .single();

if (!lock) {
  return Response.json({ message: "Job already running" }, { status: 409 });
}

try {
  await performTask();
} finally {
  await supabase.from("cron_locks").delete().eq("id", lock.id);
}
```

### 3. Error Handling

Implement comprehensive error handling and recovery:

```typescript
try {
  const result = await performTask();
  await logSuccess(result);
  return Response.json({ success: true, result });
} catch (error) {
  await logError(error);
  await notifyAdmins(error);

  // Don't throw - return error response
  return Response.json(
    {
      success: false,
      error: error.message,
    },
    { status: 500 }
  );
}
```

### 4. Performance Optimization

Batch operations and use efficient queries:

```typescript
// Good: Single batch delete
const { count } = await supabase
  .from("chat_messages")
  .delete()
  .lt("created_at", cutoffDate)
  .limit(1000); // Process in chunks

// Bad: Individual deletes
for (const message of messages) {
  await supabase.from("chat_messages").delete().eq("id", message.id);
}
```

## Development & Testing

### Local Development

Test cron job endpoints locally by making direct HTTP requests:

```bash
# Test with curl
curl -H "Authorization: Bearer your-secret-here" \
  http://localhost:3000/api/cron/cleanup-old-messages

# Test with npm script
npm run cron:cleanup-messages
```

### Testing Strategy

1. **Unit Tests**: Test business logic separately from HTTP layer
2. **Integration Tests**: Use test database with seeded old data
3. **Manual Testing**: Trigger endpoints manually before deployment
4. **Monitoring**: Review logs after first production execution

### Debugging

Check cron job execution in Vercel dashboard:

1. Navigate to project Settings → Cron Jobs
2. Click "View Logs" for specific job
3. Review execution history and response codes
4. Check function logs for detailed error messages

## Monitoring & Maintenance

### Key Metrics

- **Execution Duration**: Track time to complete
- **Success Rate**: Monitor failure frequency
- **Resource Usage**: Database connections and query time
- **Business Impact**: Records processed/deleted

### Alerting

Set up alerts for:

- Failed executions (non-200 status codes)
- Execution time exceeding threshold
- Unexpected high/low record counts
- Missing executions

### Maintenance Tasks

- **Review Schedule**: Quarterly review of cron schedules
- **Performance Tuning**: Optimize slow-running jobs
- **Secret Rotation**: Annual rotation of CRON_SECRET
- **Documentation Updates**: Keep this document current

## Error Recovery

### Common Issues

1. **Authentication Failures**

   - Verify CRON_SECRET environment variable
   - Check for typos in authorization header

2. **Timeout Errors**

   - Reduce batch size
   - Implement pagination
   - Consider splitting into multiple jobs

3. **Database Connection Issues**
   - Implement retry logic
   - Check connection pool limits
   - Monitor Supabase status

### Manual Intervention

When automated recovery fails:

1. Disable cron job in Vercel dashboard
2. Investigate root cause via logs
3. Run cleanup manually if needed
4. Fix issue and re-enable job

## Future Enhancements

### Payment Processing Details

#### Multiple Daily Runs Strategy

Due to Vercel hobby plan limitations, payment processing uses multiple daily runs with expanded windows:

- **Window Size**: Checks bookings starting 24-36 hours from now (12-hour window)
- **Frequency**: 2x daily (6 AM & 6 PM) - 12-hour intervals
- **Duplicate Prevention**: Uses `payment_captured_at` field to track processed payments

**Example Timeline:**

```
Monday 06:00 - Checks bookings Tuesday 06:00-18:00 (12-hour window)
Monday 18:00 - Checks bookings Tuesday 18:00-06:00 (12-hour window)
Tuesday 06:00 - Checks bookings Wednesday 06:00-18:00 (12-hour window)
```

**Safety Measures:**

- Overlapping windows ensure complete coverage
- `payment_captured_at` timestamp prevents duplicate processing
- Expanded 12-hour window accommodates reduced frequency

#### Technical Implementation

```typescript
// Calculate 12-hour window for 12-hour intervals
const windowStart = addHours(now, 24); // 24 hours from now
const windowEnd = addHours(now, 36); // 36 hours from now (12-hour window)

// Query with duplicate prevention
const { data: bookings } = await supabase
  .from("bookings")
  .select(/* booking details */)
  .eq("status", "confirmed")
  .gte("start_time", windowStart.toISOString())
  .lt("start_time", windowEnd.toISOString())
  .is("payment_captured_at", null); // Only uncaptured payments
```

### Payout Processing Details

#### Multiple Daily Runs for Timely Payouts

The payout processing cron uses 3x daily runs for better stylist experience:

- **Window**: Bookings that ended 1-9 hours ago (8-hour window)
- **Frequency**: 3x daily (9 AM, 3 PM & 9 PM) - 8-hour intervals
- **Status Check**: Only processes bookings with status "completed"
- **Prerequisites**: Payment must have been captured (`payment_captured_at` not null)
- **Tracking**: Uses `payout_processed_at` to prevent duplicate payouts

**Rationale**: More frequent payouts improve stylist satisfaction while staying within Vercel's daily limits.

#### Notification Flow

1. **Stylist Notification**: "Utbetaling behandlet" with payout details
2. **Customer Notification**: "Tjeneste fullført" service completion confirmation
3. **Database Updates**: Both booking and payment tables updated with timestamps

### Planned Cron Jobs

1. **Booking Reminders** (Daily)

   - Send reminders 24 hours before appointments
   - Coordinate with payment capture process

2. **Abandoned Cart Recovery** (Daily)

   - Identify incomplete bookings
   - Send recovery emails

3. **Review Prompts** (Daily)

   - Request reviews after completed bookings
   - Follow up on unreviewed services

4. **Analytics Aggregation** (Hourly)

   - Calculate stylist metrics
   - Update service popularity scores

5. **Data Archival** (Monthly)
   - Archive completed bookings older than 2 years
   - Compress audit logs

### Infrastructure Improvements

- Implement job queue for complex operations
- Add distributed tracing for debugging
- Create admin UI for manual job triggering
- Set up job dependency management

## Compliance & Security

### Data Protection

- Follow GDPR data retention requirements
- Implement audit logging for all deletions
- Ensure secure deletion of sensitive data

### Access Control

- Restrict cron endpoints to Vercel IPs only
- Rotate secrets regularly
- Monitor for unauthorized access attempts

### Audit Trail

All cron job executions should log:

- Timestamp of execution
- Records affected
- Duration of operation
- Any errors encountered
- User agent and IP (from headers)

## Vercel Hobby Plan Adaptations

### Challenge

Vercel hobby accounts limit cron jobs to run at most once per day, which posed challenges for:

- **Payment processing**: Originally required every 6 hours for complete coverage
- **Payout processing**: Originally required hourly execution for timely payouts

### Solution

**Multiple Daily Runs Strategy**: Use multiple time slots within the daily limit:

```json
{
  "crons": [
    {
      "path": "/api/cron/payment-processing",
      "schedule": "0 6,18 * * *" // 2x daily: 6 AM & 6 PM
    },
    {
      "path": "/api/cron/payout-processing",
      "schedule": "0 9,15,21 * * *" // 3x daily: 9 AM, 3 PM, 9 PM
    }
  ]
}
```

### Safety Guarantees

- **Expanded Windows**: Larger time windows ensure no gaps between runs
- **Duplicate Prevention**: Existing timestamp checks prevent double-processing
- **Complete Coverage**: Overlapping windows guarantee no missed transactions
- **Business Continuity**: Critical payment flows remain uninterrupted

### Alternative Solutions Considered

1. **Single Daily Run**: Too risky for critical payment operations
2. **Webhook-Based Processing**: Would require significant architecture changes
3. **Queue-Based System**: Complex implementation for current needs
4. **Pro Plan Upgrade**: Multiple daily runs provide sufficient coverage for current scale

## Summary

Cron jobs are essential for maintaining data hygiene, system performance, and automated workflows in Nabostylisten. By adapting to Vercel's hobby plan constraints through multiple daily runs and expanded time windows, we maintain reliable, secure, and efficient execution of scheduled tasks while ensuring system stability and data integrity. The solution preserves all existing safety mechanisms while working within platform limitations.
