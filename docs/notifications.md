# Notifications

## Overview

Notifications are individual delivery instructions created from events. Each event can generate one or more notifications, one per requested channel.

## Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `event_id` | UUID | Foreign key to `events.id` |
| `recipient` | string | Destination (email or phone) |
| `channel` | string | `email`, `sms`, or `whatsapp` |
| `status` | string | `queued`, `delivered`, `failed`, `dead_letter` |
| `provider` | string | Provider name used for delivery |
| `processing_time_ms` | int | Time taken to process |
| `failure_reason` | string | Error description on failure |
| `created_at` | timestamp | Creation time |
| `updated_at` | timestamp | Last update |

## Status Lifecycle

```
queued
  │
  ▼
delivered          (provider accepted)
  │
  ▼
processed (event level)

OR

failed / dead_letter
```

## API Endpoints

### List Notifications

`GET /api/v1/notifications`

Requires: authenticated user

- Admins see all notifications
- Regular users see notifications for their applications only

Response: array of `NotificationResponse`

### Get Notification

`GET /api/v1/notifications/{notification_id}`

Requires: authenticated user

Response: `NotificationResponse`

### Retry Notification

`POST /api/v1/notifications/{notification_id}/retry`

Requires: authenticated user

Resets the notification status to `queued` and re-enqueues the Celery task.

Response: `NotificationResponse`

## Worker Processing

The worker (`process_notification`) performs the following steps:

1. Load notification and its parent event
2. Resolve template via `RoutingService`
3. Resolve provider via `ProviderResolver`
4. Determine recipient:
   - `email` channel → `payload.email`
   - `sms` / `whatsapp` channels → `payload.phone`
5. Render template with payload variables
6. Validate no unresolved placeholders remain
7. Call `provider.send()`
8. Update notification status:
   - `delivered` on success
   - `dead_letter` on failure
9. Mark event as `processed` on success

## Recipient Determination

| Channel | Payload Field |
|---------|---------------|
| `email` | `email` |
| `sms` | `phone` |
| `whatsapp` | `phone` |

Missing recipients for SMS/WhatsApp result in `dead_letter` status with reason `Missing recipient phone number`.
