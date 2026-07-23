# Notification Flow

## Overview

This document explains how notifications move through the Notification Platform from the moment a client application sends a request until the notification is successfully delivered (or permanently fails).

The platform is designed around asynchronous processing. Client applications should never wait for a notification to actually be delivered. Instead, the API validates the request, stores it, queues it for processing, and immediately returns a response.

This approach improves scalability, reliability, and overall response times.

---

# High-Level Flow

```
Client Application
        │
        ▼
Notification API
        │
        ▼
Authentication
        │
        ▼
Request Validation
        │
        ▼
Save Notification
        │
        ▼
Publish Job to Redis
        │
        ▼
Immediate API Response
        │
        ▼
Notification Worker
        │
        ▼
Select Provider
        │
        ▼
Send Notification
        │
        ▼
Update Delivery Status
```

---

# Step 1 — Client Request

A client application sends a request to the Notification API.

Example:

```
POST /api/v1/notifications
```

Example payload:

```json
{
    "recipient": "john@example.com",
    "channel": "email",
    "subject": "Welcome",
    "message": "Thank you for joining us."
}
```

The request must include a valid API Key so the platform can identify the calling application.

---

# Step 2 — Authentication

The API validates the incoming API Key.

Checks include:

- API Key exists
- API Key is active
- API Key has not expired
- Associated application is active

If validation fails:

```
401 Unauthorized
```

If validation succeeds:

The request proceeds to the validation stage.

---

# Step 3 — Request Validation

FastAPI validates the request against the notification schema.

Typical validation includes:

- Required fields
- Email format
- Phone number format
- Channel validity
- Maximum message length
- Subject length
- Metadata format

If validation fails:

```
422 Validation Error
```

No database changes occur.

---

# Step 4 — Create Notification Record

A notification record is created in PostgreSQL.

Initial status:

```
PENDING
```

Example:

| Field | Value |
|--------|-------|
| id | UUID |
| application_id | UUID |
| channel | email |
| recipient | john@example.com |
| status | pending |

The notification now has a permanent identifier.

---

# Step 5 — Queue Notification

Instead of sending immediately, the API publishes a lightweight job into Redis.

Example job:

```json
{
    "notification_id": "uuid"
}
```

The queue acts as a buffer between incoming API traffic and outbound provider traffic.

Advantages:

- Faster responses
- Better scalability
- Retry capability
- Reduced API load

---

# Step 6 — API Response

After the notification has been stored and queued, the API immediately returns.

Example:

```json
{
    "id":"uuid",
    "status":"pending"
}
```

The client does not wait for the notification to actually be delivered.

---

# Step 7 — Worker Processing

A background worker continuously listens to Redis.

Loop:

```
while True:

    Read Job

    Fetch Notification

    Deliver Notification

    Update Status
```

Multiple worker instances can process jobs simultaneously.

---

# Step 8 — Provider Selection

The worker selects the appropriate provider based on the notification channel.

Example mapping:

| Channel | Provider |
|----------|----------|
| Email | SMTP |
| Email | SendGrid |
| Email | Amazon SES |
| SMS | Africa's Talking |
| SMS | Twilio |
| Push | Firebase |
| WhatsApp | Meta Cloud API |

The provider layer is abstracted so that switching providers requires minimal code changes.

---

# Step 9 — Delivery Attempt

The worker sends the notification.

Possible outcomes:

## Success

Status becomes

```
DELIVERED
```

Delivery timestamp is recorded.

---

## Temporary Failure

Examples:

- Provider timeout
- Network issue
- Rate limiting

Status becomes

```
RETRYING
```

Worker schedules another attempt.

---

## Permanent Failure

Examples:

- Invalid email
- Invalid phone number
- Unknown recipient

Status becomes

```
FAILED
```

Retries stop.

---

# Step 10 — Update Database

After every attempt the worker updates PostgreSQL.

Example fields:

- status
- delivered_at
- failure_reason
- provider
- attempt_count
- updated_at

This allows users to monitor notification progress.

---

# Notification Lifecycle

```
PENDING
    │
    ▼
QUEUED
    │
    ▼
PROCESSING
    │
 ┌──┴──────────┐
 ▼             ▼
DELIVERED   RETRYING
                  │
                  ▼
             PROCESSING
                  │
                  ▼
              DELIVERED

or

FAILED
```

---

# Retry Flow

Temporary failures should automatically retry.

Example:

Attempt 1

↓

Timeout

↓

Wait 30 seconds

↓

Attempt 2

↓

Timeout

↓

Wait 2 minutes

↓

Attempt 3

↓

Delivered

Retry intervals will be configurable in future versions.

---

# Dead Letter Queue

Notifications exceeding the retry limit should not be discarded.

Instead they move into a Dead Letter Queue (DLQ).

Benefits:

- Prevents infinite retry loops
- Allows manual investigation
- Enables replay after fixes

---

# Provider Failover

Future versions will support automatic failover.

Example:

```
Primary Provider

↓

Unavailable

↓

Automatically switch

↓

Secondary Provider
```

No client-side changes are required.

---

# Delivery Tracking

Each notification progresses through clearly defined states.

Current planned statuses include:

- Pending
- Queued
- Processing
- Delivered
- Failed
- Cancelled
- Retrying

These statuses provide visibility for both administrators and client applications.

---

# Logging

Every major event should be logged.

Examples:

```
Notification Created

Notification Queued

Worker Picked Job

Sending Email

Provider Response

Retry Scheduled

Delivery Successful

Delivery Failed
```

Structured logging simplifies troubleshooting and monitoring.

---

# Error Handling

The platform separates client errors from server errors.

Client errors:

- Invalid payload
- Invalid recipient
- Missing fields
- Invalid API Key

Server errors:

- Provider unavailable
- Database outage
- Redis unavailable
- Network timeout

Only server-side failures are eligible for retries.

---

# Monitoring

The following metrics should be collected:

- Notifications created
- Notifications delivered
- Failed notifications
- Queue length
- Average delivery time
- Provider response time
- Retry count
- Worker throughput

These metrics will power the future analytics dashboard.

---

# Scalability

The notification pipeline is horizontally scalable.

Additional capacity can be added by increasing:

- API instances
- Worker instances
- Redis resources
- Database resources

No architectural changes are required to support higher notification volumes.

---

# Future Enhancements

Planned improvements include:

- Scheduled notifications
- Notification templates
- Bulk notifications
- Priority queues
- Provider failover
- Webhook callbacks
- Delivery receipts
- User notification preferences
- Message deduplication
- Rate limiting per application

---

# Summary

The Notification Platform follows an asynchronous, queue-based architecture where API requests remain lightweight while background workers handle notification delivery. This separation improves responsiveness, reliability, scalability, and provides a solid foundation for supporting multiple channels and providers as the platform evolves.