# Integrations

## Overview

This guide explains how to connect an internal application to FikaTu.

## Prerequisites

- A FikaTu user account with permission to create applications
- Network access to the FikaTu API

## 1. Register an Application

1. Log in to the FikaTu dashboard
2. Navigate to **Applications**
3. Click **Create Application**
4. Enter a name (e.g. `E-Files`)
5. Save the returned `api_key` and `secret` securely

Alternatively, use the API:

`POST /api/v1/applications`
```json
{
  "name": "E-Files"
}
```

## 2. Obtain an Application Token

Call the token endpoint with the API key and secret:

`POST /api/v1/auth/token`
```json
{
  "api_key": "<your_api_key>",
  "secret": "<your_secret>"
}
```

Response:
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

## 3. Publish an Event

`POST /api/v1/events`
```http
Authorization: Bearer <APPLICATION_TOKEN>
Content-Type: application/json
```

```json
{
  "event_type": "greetings",
  "payload": {
    "customer": "John",
    "phone": "+254725325915",
    "otp": "123456"
  },
  "channels": [
    "sms"
  ]
}
```

### With User Token

If publishing with a user token, include `application_id` in the body:

```json
{
  "event_type": "greetings",
  "payload": {
    "customer": "John",
    "phone": "+254725325915",
    "otp": "123456"
  },
  "channels": ["sms"],
  "application_id": "<application_uuid>"
}
```

The user must own the application or be an admin.

## 4. Payload Structure

Payloads are free-form JSON objects validated against the event type schema.

Required fields depend on the event type:

| Event Type | Required Fields |
|------------|-----------------|
| `payment.success` | `customer`, `email`, `phone`, `amount` |
| `user.registered` | `name`, `email` |
| `password.reset` | `email`, `reset_link` |
| `otp.requested` | `phone`, `otp` |
| `greetings` | `customer`, `phone` |

## 5. Channels

Specify one or more channels in the `channels` array:

- `email`
- `sms`
- `whatsapp`

The platform creates one notification per channel.

## 6. Response

On success, the API returns `201 Created` with the event object:

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

## 7. What Happens After Publishing

1. Event is validated against its schema
2. Event is stored in PostgreSQL
3. A notification is created for each channel
4. Each notification is queued in Redis
5. The API returns immediately
6. The Celery worker processes notifications asynchronously
7. Templates are rendered and providers are invoked
8. Notification status is updated

## 8. Notification Processing

Processing is asynchronous. To check status:

`GET /api/v1/notifications`

Or get a specific notification:

`GET /api/v1/notifications/{notification_id}`

## 9. Failure Representation

| Status | Meaning |
|--------|---------|
| `queued` | Waiting for worker |
| `delivered` | Provider accepted the message |
| `failed` | Permanent failure |
| `dead_letter` | Validation or delivery failure |

## 10. Troubleshooting

- `401` — Invalid or expired token. Re-authenticate.
- `403` — Insufficient permissions. Check application ownership or role.
- `404` — Resource not found. Verify IDs.
- `422` — Payload validation failed. Check required fields for the event type.
- `application_id required` — User token missing `application_id` in body.

## 11. Observability

Trace an event through the system:

```
Event ID
   ↓
Notification ID
   ↓
Celery Task ID (in worker logs)
   ↓
Provider
   ↓
Provider Message ID
   ↓
Notification Status
```

## Example: Complete Flow

```bash
# 1. Login
curl -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@notification-platform","password":"admin123"}'

# 2. Create application
curl -X POST http://localhost/api/v1/applications \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"E-Files"}'

# 3. Get application token
curl -X POST http://localhost/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"api_key":"<api_key>","secret":"<secret>"}'

# 4. Publish event
curl -X POST http://localhost/api/v1/events \
  -H "Authorization: Bearer <app_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "greetings",
    "payload": {"customer":"John","phone":"+254725325915","otp":"123456"},
    "channels": ["sms"]
  }'
```
