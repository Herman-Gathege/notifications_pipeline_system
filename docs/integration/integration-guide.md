# Integration Guide

## Overview

This guide explains how to connect an internal application to FikaTu. FikaTu is an event-driven, provider-agnostic notification routing and delivery platform. Client applications publish events; FikaTu handles validation, template rendering, provider selection, delivery, and status tracking.

## Architecture

```
Internal Application
        │
        │ authenticated API request (Bearer JWT)
        ▼
      FikaTu API (FastAPI)
        │
        ▼
   Event Validation (Pydantic schemas)
        │
        ▼
     Event (PostgreSQL)
        │
        ▼
   Notification (one per channel)
        │
        ▼
     Redis (Celery broker)
        │
        ▼
   Celery Worker
        │
        ▼
   Routing Service
        │
        ▼
    Provider (Africa's Talking, Resend, SMTP)
        │
        ▼
External Notification Service
```

## Authentication

### Register an Application

An application must be created by a human user with access to the FikaTu dashboard or management API.

```http
POST /api/v1/applications
Authorization: Bearer <USER_TOKEN>
Content-Type: application/json
```

```json
{
  "name": "E-Files"
}
```

**Response (201):**

```json
{
  "id": "<uuid>",
  "name": "E-Files",
  "api_key": "<api_key_token>",
  "secret": "<application_secret>",
  "status": "active",
  "created_at": "...",
  "updated_at": "..."
}
```

**Important:** The `api_key` and `secret` are returned only on creation. Store them securely; they are not retrievable later.

### Obtain an Application Token

Call the token endpoint with the API key and secret:

```http
POST /api/v1/auth/token
Content-Type: application/json
```

```json
{
  "api_key": "<your_api_key>",
  "secret": "<your_secret>"
}
```

**Response:**

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

## Publishing Events

### Canonical Request

```http
POST /api/v1/events
Authorization: Bearer <APPLICATION_TOKEN>
Content-Type: application/json
```

### Example

```json
{
  "event_type": "otp.requested",
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
  "event_type": "otp.requested",
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

## Event Payloads

Payloads are free-form JSON objects validated against the event type schema.

### Supported Event Types

| Event Type | Required Fields | Supported Channels |
|------------|-----------------|-------------------|
| `payment.success` | `customer`, `email`, `phone`, `amount` | `email`, `sms` |
| `user.registered` | `name`, `email` | `email` |
| `password.reset` | `email`, `reset_link` | `email` |
| `otp.requested` | `phone`, `otp` | `sms` |
| `greetings` | `customer`, `phone` | `sms` |

### Variable Derivation

Template variables are derived automatically from the event payload. Only scalar values (string, int, float, bool) are exposed.

Example:
- Payload: `{"customer": "Alice", "otp": "123456"}`
- Template body: `"Hello {{customer}}, your code is {{otp}}."`
- Rendered: `"Hello Alice, your code is 123456."`

## Supported Channels

| Channel | Description | Recipient Field |
|---------|-------------|-----------------|
| `email` | Email notification | `payload.email` |
| `sms` | SMS notification | `payload.phone` |
| `whatsapp` | WhatsApp notification (stub) | `payload.phone` |

## Templates

Templates define the content of notifications for specific event types and channels. They use `{{variable}}` placeholders that are replaced with values from the event payload.

Templates are created and managed via the FikaTu dashboard or API. Each template is bound to a specific `event_type` + `channel` combination.

### Template API

**List Event Types**

```http
GET /api/v1/templates/event-types
Authorization: Bearer <USER_TOKEN>
```

**Create Template** (admin only)

```http
POST /api/v1/templates
Authorization: Bearer <USER_TOKEN>
Content-Type: application/json
```

```json
{
  "name": "OTP SMS",
  "event_type": "otp.requested",
  "channel": "sms",
  "subject": null,
  "body": "Your code is: {{otp}}",
  "is_active": true
}
```

## Responses

### Success Response

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

### Error Responses

| Status | Meaning | Example |
|--------|---------|---------|
| `400` | Invalid request body | `application_id missing` |
| `401` | Authentication failure | `Invalid token` |
| `403` | Permission failure | `You do not have permission...` |
| `404` | Resource not found | `Application not found` |
| `422` | Validation failure | `Unsupported event type` |

## What Happens After Publishing

1. Event is validated against its schema
2. Event is stored in PostgreSQL
3. A notification is created for each channel
4. Each notification is queued in Redis
5. The API returns immediately (`201 Created`)
6. The Celery worker processes notifications asynchronously
7. Templates are rendered and providers are invoked
8. Notification status is updated (`delivered` or `dead_letter`)

**Important:** The API response does not indicate delivery success. Delivery happens asynchronously in the worker.

## Notification Processing

Processing is asynchronous. To check status:

```http
GET /api/v1/notifications
Authorization: Bearer <USER_TOKEN>
```

Or get a specific notification:

```http
GET /api/v1/notifications/{notification_id}
Authorization: Bearer <USER_TOKEN>
```

## Retry

Manual retry is available:

```http
POST /api/v1/notifications/{notification_id}/retry
Authorization: Bearer <USER_TOKEN>
```

Automatic retry with backoff is not yet implemented (Phase 12/13 candidate).

## Observability

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

Use the following endpoints for monitoring:

```http
GET /api/v1/monitoring/statistics
GET /api/v1/monitoring/logs
GET /metrics
```

## Testing

### Prerequisites

- A FikaTu instance running
- Network access to the FikaTu API
- An application registered with valid `api_key` and `secret`

### Test Flow

1. Obtain an application token
2. Publish a test event
3. Verify the event was created (`GET /api/v1/events`)
4. Verify the notification was created (`GET /api/v1/notifications`)
5. Check worker logs for processing status
6. Verify notification status updated to `delivered` or `dead_letter`

### Example Test (curl)

```bash
# 1. Obtain application token
TOKEN=$(curl -s -X POST http://localhost/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"api_key":"<api_key>","secret":"<secret>"}' | jq -r '.access_token')

# 2. Publish event
curl -X POST http://localhost/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "otp.requested",
    "payload": {
      "phone": "+254725325915",
      "otp": "123456"
    },
    "channels": ["sms"]
  }'

# 3. Check notifications
curl -H "Authorization: Bearer $TOKEN" http://localhost/api/v1/notifications
```

## Security Considerations

- `api_key` and `secret` must be stored securely and never committed to version control
- Tokens expire after 24 hours
- Use HTTPS in production
- Configure CORS origins appropriately
- Rotate `SECRET_KEY` carefully (invalidates all existing tokens)

## Production Checklist

- [ ] HTTPS termination configured
- [ ] Strong `SECRET_KEY` set
- [ ] Default admin password changed
- [ ] Secrets managed via environment variables or secrets manager
- [ ] CORS origins restricted to known domains
- [ ] Database backup strategy in place
- [ ] Monitoring dashboard configured (Prometheus + Grafana)
- [ ] Log aggregation configured
