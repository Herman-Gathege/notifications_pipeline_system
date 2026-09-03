# API Contract

## Overview

This document defines the canonical API contract for internal applications integrating with FikaTu. It is the single source of truth for request/response shapes, status codes, authentication, and error behaviour.

## Base URL

```
http://<fikatu-host>/api/v1
```

All endpoints are prefixed with `/api/v1`.

## Authentication

FikaTu uses two distinct authentication mechanisms:

1. **User authentication** — for human operators accessing the dashboard or management APIs.
2. **Application authentication** — for internal systems publishing events via the API.

Both use JWT HS256 tokens signed with the platform `SECRET_KEY`.

### User Authentication

**Login**

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "email": "admin@notification-platform",
  "password": "admin123"
}
```

**Response**

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": {
    "id": "<uuid>",
    "email": "admin@notification-platform",
    "name": "Admin User",
    "role": "admin",
    "is_active": true,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

**Token Structure**

User tokens contain:

```json
{
  "sub": "<user_id>",
  "type": "user",
  "role": "admin|user",
  "email": "user@example.com",
  "exp": 1756900000
}
```

Expiry: 24 hours.

### Application Authentication

**Obtain Token**

```http
POST /api/v1/auth/token
Content-Type: application/json
```

```json
{
  "api_key": "<application_api_key>",
  "secret": "<application_secret>"
}
```

**Response**

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

**Validate Token**

```http
POST /api/v1/auth/validate
Content-Type: application/json
```

```json
{
  "token": "<jwt>"
}
```

**Response**

```json
{
  "valid": true,
  "application_id": "<uuid>"
}
```

**Token Structure**

Application tokens contain:

```json
{
  "sub": "<application_id>",
  "app": "Application Name",
  "type": "application",
  "exp": 1756900000
}
```

Expiry: 24 hours.

### Required Headers

All authenticated requests require:

```http
Authorization: Bearer <token>
```

### Token Lifecycle

- Tokens are self-contained JWT HS256 signed tokens.
- No server-side revocation list exists.
- Expired or invalid tokens must be refreshed by re-authenticating.
- Clients must discard stored tokens after logout.

## Event Publishing

### Endpoint

```http
POST /api/v1/events
Authorization: Bearer <APPLICATION_TOKEN>
Content-Type: application/json
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event_type` | string | Yes | Event type identifier (e.g. `payment.success`) |
| `payload` | object | Yes | Event payload (validated against event type schema) |
| `channels` | array of strings | Yes | Notification channels (`email`, `sms`, `whatsapp`) |
| `application_id` | string | No | Required when using a user token; ignored for application tokens |

### Example Request

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

### Success Response

**Status:** `201 Created`

```json
{
  "id": "<event_uuid>",
  "application_id": "<app_uuid>",
  "event_type": "otp.requested",
  "payload": { ... },
  "status": "received",
  "is_processed": false,
  "created_at": "..."
}
```

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| `400` | `application_id` missing with user token | `{"detail": "application_id is required when using a user token."}` |
| `401` | Invalid or expired token | `{"detail": "The provided token is invalid or has expired. Please obtain a new token."}` |
| `401` | Invalid token type | `{"detail": "Invalid token type."}` |
| `403` | User does not own the application | `{"detail": "You do not have permission to publish events for this application."}` |
| `404` | Application not found | `{"detail": "Application not found."}` |
| `422` | Unsupported event type or invalid payload | `{"detail": "Unsupported event type '...'."}` |

## Event Validation

Events are validated against Pydantic schemas defined in `app/events/registry.py`.

Supported event types:

| Event Type | Required Fields |
|------------|-----------------|
| `payment.success` | `customer`, `email`, `phone`, `amount` |
| `user.registered` | `name`, `email` |
| `password.reset` | `email`, `reset_link` |
| `otp.requested` | `phone`, `otp` |
| `greetings` | `customer`, `phone` |

## Notification Status Lifecycle

| Status | Meaning |
|--------|---------|
| `queued` | Waiting for worker |
| `delivered` | Provider accepted the message |
| `failed` | Permanent failure |
| `dead_letter` | Validation or delivery failure |
| `processed` | Event-level status; all notifications processed |

## Error Contract

| Status | Category | Meaning |
|--------|----------|---------|
| `400` | Bad Request | Invalid request body or missing required field |
| `401` | Unauthorized | Missing, invalid, or expired token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource does not exist |
| `409` | Conflict | Duplicate resource |
| `422` | Validation Failure | Payload validation failed |
| `500` | Internal Server Error | Unexpected server error |

All error responses follow FastAPI's default shape:

```json
{
  "detail": "<error message>"
}
```

## Rate Limiting

No rate limiting is currently implemented. This is a Phase 12/13 candidate.

## Versioning

The API version is encoded in the URL path: `/api/v1/...`. Breaking changes will be introduced via a new path prefix.
