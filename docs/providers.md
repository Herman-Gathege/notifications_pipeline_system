# Providers

## Overview

Providers are external notification delivery services. FikaTu supports multiple providers via an abstraction layer.

## Supported Providers

| Provider | Channel | Transport | Status |
|----------|---------|-----------|--------|
| Resend | email | API | Implemented |
| SMTP | email | SMTP | Implemented |
| Africa's Talking | sms | API | Implemented |
| WhatsApp | whatsapp | — | Stub (not implemented) |

## Provider Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `name` | string | Unique provider name |
| `channel` | string | Target channel |
| `priority` | int | Selection priority (lower = higher) |
| `is_active` | boolean | Enabled flag |
| `transport_type` | string | `api` or `smtp` |
| `smtp_host` | string | SMTP host (SMTP only) |
| `smtp_port` | int | SMTP port (SMTP only) |
| `smtp_username` | string | SMTP username (SMTP only) |
| `smtp_password` | string | SMTP password (SMTP only) |
| `use_tls` | boolean | Enable TLS (SMTP only) |
| `use_ssl` | boolean | Enable SSL (SMTP only) |
| `from_email` | string | Sender email (email providers) |
| `from_name` | string | Sender name (email providers) |
| `created_at` | timestamp | Creation time |
| `updated_at` | timestamp | Last update |

## Provider Selection

`ProviderResolver.get_default_by_channel(channel)` returns the active provider with the lowest priority for the given channel.

## API Endpoints

### List Providers

`GET /api/v1/providers`

Requires: authenticated user

Response: array of `ProviderPublicResponse` (credentials excluded)

### Create Provider

`POST /api/v1/providers`

Requires: `admin`

Request:
```json
{
  "name": "Africa's Talking",
  "channel": "sms",
  "priority": 1,
  "is_active": true,
  "transport_type": "api"
}
```

Response (201): `ProviderPublicResponse`

### Update Provider

`PATCH /api/v1/providers/{provider_id}`

Requires: `admin`

Request: partial `ProviderUpdate`

Response: `ProviderPublicResponse`

### Delete Provider

`DELETE /api/v1/providers/{provider_id}`

Requires: `admin`

Response: 204 No Content

### Test Provider

`POST /api/v1/providers/{provider_id}/test`

Requires: `admin`

Request:
```json
{
  "recipient": "+254700000000"
}
```

Response:
```json
{
  "success": true,
  "status": "sent",
  "provider_message_id": "msg-abc-123",
  "status_code": 201,
  "error": null
}
```

## Africa's Talking (SMS)

### Configuration

Environment variables:
- `AFRICASTALKING_USERNAME` — defaults to `sandbox`
- `AFRICASTALKING_API_KEY` — API key
- `AFRICASTALKING_SENDER_ID` — optional sender ID

### Sandbox

The sandbox mode is enabled by setting `AFRICASTALKING_USERNAME=sandbox`. In sandbox mode:
- Messages are not billed
- Delivery is simulated
- Recipients must be verified in the Africa's Talking sandbox dashboard

### Phone Number Format

Phone numbers should be in E.164 format (e.g. `+254725325915`).

### Provider Response

HTTP `201` from Africa's Talking means the provider **accepted/queued** the message. It does **not** guarantee that the handset has received the message.

### Provider Message ID

Extracted from the first recipient's `messageId` field in the Africa's Talking response. If missing, `provider_message_id` is `null`.

### Error Handling

Network errors, authentication failures, and invalid payloads are caught and returned as:
```json
{
  "success": false,
  "status": "failed",
  "provider_message_id": null,
  "status_code": null,
  "error": "<error message>"
}
```

## Resend (Email)

### Configuration

Environment variables:
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_FROM_NAME`

### Provider Message ID

Returned from `resend.Emails.send()` response `id` field.

## SMTP (Email)

### Configuration

Configured via the Provider model fields (`smtp_host`, `smtp_port`, `smtp_username`, `smtp_password`, `use_tls`, `use_ssl`).

### Error Handling

SMTP errors are caught and returned in the standard provider response shape.

## Credential Safety

- `smtp_password` is never exposed in API responses (`ProviderPublicResponse` excludes it)
- Provider test endpoint returns only the standard send dict, never raw credentials
