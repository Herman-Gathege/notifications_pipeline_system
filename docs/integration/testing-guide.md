# Testing Guide

## Overview

This guide explains how to test integrations with FikaTu. It covers authentication, event publishing, the notification pipeline, and error scenarios.

## Test Environment

### Prerequisites

- FikaTu instance running (Docker Compose or local)
- Admin access to create applications and templates
- curl or HTTP client for API calls
- Access to worker logs

### Starting the Platform

```bash
docker compose up --build
```

Verify services are healthy:

```bash
docker compose ps
```

## Authentication Tests

### Test 1: Valid Application Token

```bash
curl -X POST http://localhost/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"api_key":"<valid_api_key>","secret":"<valid_secret>"}'
```

**Expected:** `200 OK` with `access_token` in response body.

### Test 2: Invalid API Key

```bash
curl -X POST http://localhost/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"api_key":"invalid","secret":"<valid_secret>"}'
```

**Expected:** `401 Unauthorized`

### Test 3: Invalid Secret

```bash
curl -X POST http://localhost/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"api_key":"<valid_api_key>","secret":"wrong"}'
```

**Expected:** `401 Unauthorized`

### Test 4: Missing Token on Protected Endpoint

```bash
curl -X POST http://localhost/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{"event_type":"greetings","payload":{},"channels":["sms"]}'
```

**Expected:** `401 Unauthorized`

### Test 5: Expired Token

Use a token with an expired `exp` claim.

**Expected:** `401 Unauthorized`

### Test 6: Wrong Token Type

Use a user token on an application-only endpoint (if applicable).

**Expected:** `401 Unauthorized`

## Event Publishing Tests

### Test 7: Valid Event

```bash
TOKEN="<application_token>"
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
```

**Expected:** `201 Created` with event object.

### Test 8: Missing Event Type

```bash
curl -X POST http://localhost/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {},
    "channels": ["sms"]
  }'
```

**Expected:** `422 Unprocessable Entity`

### Test 9: Invalid Payload

```bash
curl -X POST http://localhost/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "otp.requested",
    "payload": {},
    "channels": ["sms"]
  }'
```

**Expected:** `422 Unprocessable Entity` (missing required `phone` and `otp` fields)

### Test 10: Missing Channels

```bash
curl -X POST http://localhost/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "otp.requested",
    "payload": {
      "phone": "+254725325915",
      "otp": "123456"
    }
  }'
```

**Expected:** `422 Unprocessable Entity`

### Test 11: Invalid Channel

```bash
curl -X POST http://localhost/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "otp.requested",
    "payload": {
      "phone": "+254725325915",
      "otp": "123456"
    },
    "channels": ["telegram"]
  }'
```

**Expected:** Event is created, but notification may fail or be queued depending on provider availability. Check notification status.

### Test 12: Unauthorized Application

Publish an event for an application the token does not belong to (using user token).

```bash
curl -X POST http://localhost/api/v1/events \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "otp.requested",
    "payload": {
      "phone": "+254725325915",
      "otp": "123456"
    },
    "channels": ["sms"],
    "application_id": "<other_app_id>"
  }'
```

**Expected:** `403 Forbidden`

### Test 13: Valid Multi-Channel Event

```bash
curl -X POST http://localhost/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "payment.success",
    "payload": {
      "customer": "Alice",
      "email": "alice@example.com",
      "phone": "+254725325915",
      "amount": "KES 5,250"
    },
    "channels": ["email", "sms"]
  }'
```

**Expected:** `201 Created` with two notifications created (one per channel).

## Pipeline Tests

### Test 14: End-to-End Pipeline

1. Publish a valid event with `otp.requested` + `sms` channel
2. Verify event was created: `GET /api/v1/events`
3. Verify notification was created: `GET /api/v1/notifications`
4. Check worker logs:

```bash
docker compose logs --tail=300 notification-worker
```

**Expected:** Notification status changes from `queued` to `delivered` (or `dead_letter` if provider not configured).

### Test 15: Missing Template

Publish an event for an event type that has no template configured.

```bash
curl -X POST http://localhost/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "document.uploaded",
    "payload": {
      "customer": "Alice",
      "phone": "+254725325915"
    },
    "channels": ["sms"]
  }'
```

**Expected:** Event is created, notification status becomes `dead_letter` with reason `No active template for 'document.uploaded' (sms)`.

### Test 16: Missing Provider

Publish an event for a channel that has no active provider configured.

**Expected:** Event is created, notification status becomes `dead_letter` with reason `No active provider for '<channel>'`.

### Test 17: Missing Recipient

Publish an SMS event without a phone number.

```bash
curl -X POST http://localhost/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "otp.requested",
    "payload": {
      "otp": "123456"
    },
    "channels": ["sms"]
  }'
```

**Expected:** Notification status becomes `dead_letter` with reason `Missing recipient phone number`.

## Worker Health Tests

### Test 18: Celery Ping

```bash
docker compose exec notification-worker \
  celery -A app.workers.worker.celery_app inspect ping
```

**Expected:**

```json
{"notification-worker@...": {"ok": "pong"}}
```

### Test 19: Worker Logs

```bash
docker compose logs --tail=300 notification-worker
```

**Look for:**

- No `ERROR` or `Traceback` lines
- No `SSL` or `SSLError` or `WRONG_VERSION` errors
- Normal processing logs for test events

## Frontend Tests

### Test 20: Frontend Build

```bash
cd frontend
npm run build
```

**Expected:** Build succeeds without errors.

### Test 21: TypeScript Compilation

```bash
cd frontend
npx tsc -b
```

**Expected:** No type errors.

## Integration Test Checklist

Before declaring an integration ready:

- [ ] Application token obtained successfully
- [ ] Test event published successfully (`201 Created`)
- [ ] Event appears in event list
- [ ] Notification created for each channel
- [ ] Worker processes notification
- [ ] Provider receives request (check provider dashboard/logs)
- [ ] Notification status updates to `delivered` or `dead_letter`
- [ ] No errors in worker logs
- [ ] No errors in API logs

## Mock Testing

For automated tests, mock external provider calls. Do not make real production provider calls in tests.

Example mock pattern:

```python
from unittest.mock import MagicMock, patch

with patch("app.providers.sms.sms_provider.SMSProvider") as mock_cls:
    fake = MagicMock()
    fake.send.return_value = {
        "success": True,
        "status": "sent",
        "provider_message_id": "msg-123",
        "status_code": 201,
        "error": None,
    }
    mock_cls.return_value = fake
    # ... run test
```
