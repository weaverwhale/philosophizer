# Usage Tracking

This document describes the usage tracking system implemented in Philosophizer.

## Overview

The usage tracking system automatically captures user activity to help you understand how your application is being used. It tracks:

- **User Sessions**: Login times, IP addresses, user agents, and session duration
- **User Events**: Detailed actions like messages sent, conversations created/deleted, logins/signups
- **Daily Statistics**: Aggregated metrics per user per day

## Database Schema

The system adds three new tables to your database:

### `user_sessions`
Tracks user login sessions with:
- Session token
- IP address and user agent
- Start time, last activity time, and end time

### `user_events`
Records individual user actions with:
- Event type (e.g., `message_sent`, `conversation_created`, `login`)
- Event category (e.g., `chat`, `conversation`, `authentication`)
- Event data (JSONB for additional context)
- Timestamp

### `user_daily_stats`
Aggregated daily statistics including:
- Messages sent
- Conversations created/deleted
- Tools used
- Session count and duration

## Migration

To add usage tracking to your existing database:

```bash
./scripts/migrate-usage-tracking.sh
```

Or if you're starting fresh, the schema is already included in `src/db/schema.sql`.

## Event Types

The system automatically tracks these events:

| Event Type | Category | Description | Tracked Data |
|------------|----------|-------------|--------------|
| `signup` | `authentication` | User creates account | email |
| `login` | `authentication` | User logs in | email |
| `message_sent` | `chat` | User sends a message | conversationId, philosopherId, messageLength |
| `conversation_created` | `conversation` | User creates new conversation | conversationId, title |
| `conversation_deleted` | `conversation` | User deletes conversation | conversationId |

## API Endpoints

All analytics endpoints require authentication.

### GET `/analytics/events`

Get a list of user events.

**Query Parameters:**
- `eventType` (optional): Filter by event type
- `eventCategory` (optional): Filter by event category
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Pagination offset

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:1738/analytics/events?eventType=message_sent&limit=50"
```

**Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "user-id",
    "sessionId": "session-id",
    "eventType": "message_sent",
    "eventCategory": "chat",
    "eventData": {
      "conversationId": "conv-id",
      "messageLength": 45
    },
    "createdAt": "2025-12-30T10:30:00Z"
  }
]
```

### GET `/analytics/daily-stats`

Get aggregated daily statistics for the authenticated user.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:1738/analytics/daily-stats?startDate=2025-12-01"
```

**Response:**
```json
[
  {
    "userId": "user-id",
    "date": "2025-12-30",
    "messagesSent": 15,
    "conversationsCreated": 2,
    "conversationsDeleted": 0,
    "toolsUsed": 5,
    "sessionCount": 3,
    "totalSessionDurationSeconds": 3600
  }
]
```

### GET `/analytics/summary`

Get a quick overview of user activity for the last 30 days.

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:1738/analytics/summary"
```

**Response:**
```json
{
  "period": {
    "start": "2025-11-30T00:00:00Z",
    "end": "2025-12-30T00:00:00Z",
    "days": 30
  },
  "totals": {
    "messages": 450,
    "conversations": 25,
    "sessions": 45,
    "events": 520
  },
  "averages": {
    "messagesPerDay": 15.0
  },
  "activeSessions": 2,
  "eventTypes": {
    "message_sent": 450,
    "conversation_created": 25,
    "login": 45
  },
  "dailyStats": [
    {
      "userId": "user-id",
      "date": "2025-12-30",
      "messagesSent": 15,
      "conversationsCreated": 2,
      "conversationsDeleted": 0,
      "toolsUsed": 5,
      "sessionCount": 3,
      "totalSessionDurationSeconds": 3600
    }
  ]
}
```

### GET `/analytics/aggregate`

Get system-wide aggregate statistics (admin endpoint).

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:1738/analytics/aggregate"
```

**Response:**
```json
{
  "totalUsers": 100,
  "activeUsers": 45,
  "totalMessages": 5000,
  "totalConversations": 500,
  "totalSessions": 1200,
  "averageSessionDuration": 1800,
  "topEventTypes": [
    { "eventType": "message_sent", "count": 5000 },
    { "eventType": "login", "count": 1200 },
    { "eventType": "conversation_created", "count": 500 }
  ]
}
```

## Programmatic Usage

You can also use the tracking utilities directly in your code:

```typescript
import { trackEvent, trackSession } from './utils/usageTracking';

// Track a custom event
await trackEvent(
  userId,
  'custom_action',
  'custom_category',
  { customData: 'value' },
  sessionId
);

// Track or update a session
const session = await trackSession(
  userId,
  sessionToken,
  ipAddress,
  userAgent
);
```

## Privacy Considerations

- **IP Addresses**: The system stores IP addresses for session tracking. Consider your privacy policy and local regulations (GDPR, CCPA, etc.)
- **Event Data**: Custom event data is stored as JSONB. Avoid storing sensitive information
- **Retention**: Consider implementing data retention policies and automated cleanup of old events
- **User Consent**: Depending on your jurisdiction, you may need to inform users about data collection

## Performance

The system is designed for minimal performance impact:

- Event tracking is non-blocking and won't slow down user requests
- Indexes are optimized for common query patterns
- Daily stats can be pre-aggregated using the `aggregate_user_daily_stats()` function
- Failed tracking operations are logged but don't affect the main application flow

## Monitoring and Maintenance

### Check Active Sessions

```sql
SELECT COUNT(*) FROM user_sessions 
WHERE ended_at IS NULL 
AND last_activity_at >= NOW() - INTERVAL '1 hour';
```

### Aggregate Daily Stats

Run this periodically (e.g., via cron) to pre-compute daily statistics:

```sql
SELECT aggregate_user_daily_stats(user_id, CURRENT_DATE - 1)
FROM users;
```

### Clean Up Old Sessions

```sql
-- Mark sessions as ended if inactive for 24 hours
UPDATE user_sessions 
SET ended_at = last_activity_at 
WHERE ended_at IS NULL 
AND last_activity_at < NOW() - INTERVAL '24 hours';
```

### Clean Up Old Events (Optional)

```sql
-- Delete events older than 90 days
DELETE FROM user_events 
WHERE created_at < NOW() - INTERVAL '90 days';
```

## Future Enhancements

Potential improvements to consider:

1. **Tool Usage Tracking**: Wrap tool calls to track which tools are used most frequently
2. **Performance Metrics**: Track response times and error rates
3. **User Segmentation**: Group users by usage patterns
4. **Anomaly Detection**: Alert on unusual usage patterns
5. **Export Functionality**: Export analytics data for external analysis
6. **Dashboard**: Build a frontend dashboard to visualize usage statistics
7. **Rate Limiting**: Use session data to implement rate limiting
8. **A/B Testing**: Track feature usage for experiments

## Troubleshooting

### Events Not Being Tracked

1. Check database connection
2. Verify tables were created successfully: `\dt user_*` in psql
3. Check application logs for tracking errors
4. Ensure authentication is working (tracking requires authenticated users)

### Slow Queries

1. Verify indexes exist: `\di user_*` in psql
2. Use date filters on queries to limit result sets
3. Consider archiving old events
4. Pre-aggregate daily stats for historical data

## Example Queries

### Most Active Users

```sql
SELECT u.email, COUNT(e.id) as event_count
FROM users u
JOIN user_events e ON u.id = e.user_id
WHERE e.created_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.email
ORDER BY event_count DESC
LIMIT 10;
```

### Popular Times of Day

```sql
SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as count
FROM user_events
WHERE event_type = 'message_sent'
AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY hour
ORDER BY hour;
```

### User Retention

```sql
WITH user_first_activity AS (
  SELECT user_id, MIN(DATE(created_at)) as first_active
  FROM user_events
  GROUP BY user_id
)
SELECT 
  first_active,
  COUNT(DISTINCT user_id) as new_users,
  COUNT(DISTINCT CASE 
    WHEN DATE(e.created_at) >= first_active + INTERVAL '7 days' 
    THEN e.user_id 
  END) as retained_after_7d
FROM user_first_activity ufa
JOIN user_events e ON ufa.user_id = e.user_id
WHERE first_active >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY first_active
ORDER BY first_active;
```

