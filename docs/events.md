# Events

## Overview

Events are the primary input to FikaTu. Client applications publish events; the platform validates them, stores them, creates notifications, and queues them for delivery.

## Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `application_id` | UUID | Foreign key to `applications.id` |
| `event_type` | string | Event type identifier (e.g. `payment.success`) |
| `payload` | JSON | Event payload (validated against schema) |
| `status` | string | `received`, `processed` |
| `is_processed` | boolean | Processing flag |
| `created_at` | timestamp | Creation time |

## API Endpoints

### Create Event

`POST /api/v1/events`

Requires: either a user token or an application token

Request:
```json
{
  "event_type": "greetings",
  "payload": {
    "customer": "John",
    "phone": "+254725325915",
    "otp": "123456"
  },
  "channels": ["sms"],
  "application_id": "<optional-for-user-tokens>"
}
```

Response (201):
```json
{
  "id": "<event_uuid>",
  "application_id": "<app_uuid>",
  "event_type": "greetings",
  "payload": { ... },
  "status": "received",
  "is_processed": false,
  "created_at": "..."
}
```

**Authentication**:
- Application token: `Authorization: Bearer <app_jwt>` — `application_id` taken from token
- User token: `Authorization: Bearer <user_jwt>` — `application_id` must be provided in body; user must own the application or be admin

### List Events

`GET /api/v1/events`

Requires: authenticated user

- Admins see all events
- Regular users see events for their applications only

Response: array of `EventResponse`

### Get Event

`GET /api/v1/events/{event_id}`

Requires: authenticated user (owner or admin)

Response: `EventResponse`

## Event Validation

Events are validated against Pydantic schemas defined in `app/events/registry.py`.

If the event type is not registered or the payload fails validation, the API returns `422 Unprocessable Entity`.

## Event Processing

After an event is created:

1. For each channel in `channels`, a `Notification` record is created with status `queued`
2. `process_notification.delay(notification_id)` is called
3. The Celery worker picks up the task and processes delivery

## Status Transitions

| Status | Meaning |
|--------|---------|
| `received` | Event stored, not yet processed |
| `processed` | All notifications for the event have been processed |
