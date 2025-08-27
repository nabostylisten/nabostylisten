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
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 });
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

| Field | Range | Description |
|-------|-------|-------------|
| Minute | 0-59 | Minutes past the hour |
| Hour | 0-23 | Hour of the day (UTC) |
| Day of Month | 1-31 | Day of the month |
| Month | 1-12 | Month of the year |
| Day of Week | 0-6 | Day of week (0=Sunday) |

### Important Limitations

- All times are in UTC (no timezone configuration)
- No support for MON, SUN, JAN, DEC aliases
- Cannot specify both day of month and day of week
- Hobby accounts limited to hourly accuracy

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
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // 1. Verify authentication
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Perform scheduled task
    const result = await performTask();
    
    // 3. Return success response
    return Response.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      result 
    });
  } catch (error) {
    // 4. Handle errors
    console.error(`Cron job failed: ${error}`);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
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
**Schedule**: `0 */6 * * *` (Every 6 hours: 00:00, 06:00, 12:00, 18:00 UTC)  
**Purpose**: Capture payments 24 hours before bookings and send confirmation emails

### 3. Payout Processing

**Path**: `/api/cron/payout-processing`  
**Schedule**: `0 * * * *` (Every hour)  
**Purpose**: Process payouts to stylists after service completion and send notifications

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
  .from('chat_messages')
  .select(`
    id, 
    chat_id, 
    created_at,
    media!chat_message_id(id, file_path)
  `)
  .lt('created_at', fiveYearsAgo.toISOString());

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
  await supabase.storage.from('chat-media').remove(mediaFilesToDelete);
}

// Delete messages (media records cascade deleted automatically)
const { count } = await supabase
  .from('chat_messages')
  .delete()
  .lt('created_at', fiveYearsAgo.toISOString());
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
  .from('cron_locks')
  .insert({ job_name: 'cleanup-messages', locked_at: new Date() })
  .select()
  .single();

if (!lock) {
  return Response.json({ message: 'Job already running' }, { status: 409 });
}

try {
  await performTask();
} finally {
  await supabase.from('cron_locks').delete().eq('id', lock.id);
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
  return Response.json({ 
    success: false, 
    error: error.message 
  }, { status: 500 });
}
```

### 4. Performance Optimization

Batch operations and use efficient queries:

```typescript
// Good: Single batch delete
const { count } = await supabase
  .from('chat_messages')
  .delete()
  .lt('created_at', cutoffDate)
  .limit(1000); // Process in chunks

// Bad: Individual deletes
for (const message of messages) {
  await supabase.from('chat_messages').delete().eq('id', message.id);
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

#### Rolling Window Strategy

The payment processing cron uses a 6-hour rolling window to ensure no bookings are missed:

- **Window Size**: Checks bookings starting 24-30 hours from now
- **Overlap**: Each run has a 6-hour overlap with the next
- **Duplicate Prevention**: Uses `payment_captured_at` field to track processed payments

**Example Timeline:**
```
Monday 00:00 - Checks bookings Tuesday 00:00-06:00
Monday 06:00 - Checks bookings Tuesday 06:00-12:00
Monday 12:00 - Checks bookings Tuesday 12:00-18:00
Monday 18:00 - Checks bookings Tuesday 18:00-00:00
```

#### Technical Implementation

```typescript
// Calculate 6-hour window
const windowStart = addHours(now, 24); // 24 hours from now
const windowEnd = addHours(now, 30);   // 30 hours from now

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

#### Service Completion Window

The payout processing cron processes completed bookings:

- **Window**: Bookings that ended 1-2 hours ago
- **Status Check**: Only processes bookings with status "completed"
- **Prerequisites**: Payment must have been captured (`payment_captured_at` not null)
- **Tracking**: Uses `payout_processed_at` to prevent duplicate payouts

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

## Summary

Cron jobs are essential for maintaining data hygiene, system performance, and automated workflows in Nabostylisten. By following these patterns and best practices, we ensure reliable, secure, and efficient execution of scheduled tasks while maintaining system stability and data integrity.