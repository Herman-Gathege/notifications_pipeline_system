# Templates

## Overview

Templates define the content of notifications for specific event types and channels. They use `{{variable}}` placeholders that are replaced with values from the event payload.

## Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `name` | string | Human-readable name |
| `event_type` | string | Event type this template applies to |
| `channel` | string | `email`, `sms`, or `whatsapp` |
| `subject` | string | Optional subject line (email only) |
| `body` | string | Message body with `{{variable}}` placeholders |
| `is_active` | boolean | Active flag |
| `created_at` | timestamp | Creation time |
| `updated_at` | timestamp | Last update |

## Template Resolution

```
Event Type
     ↓
Template (matched by event_type + channel + is_active=True)
     ↓
Channel
     ↓
Rendered Message
     ↓
Provider
```

## API Endpoints

### List Event Types

`GET /api/v1/templates/event-types`

Requires: authenticated user

Response: array of distinct event type strings

### Create Template

`POST /api/v1/templates`

Requires: `admin`

Request:
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

Response (201): `TemplateResponse`

### List Templates

`GET /api/v1/templates`

Requires: authenticated user

Response: array of `TemplateResponse`

### Update Template

`PATCH /api/v1/templates/{template_id}`

Requires: `admin`

Request: partial `TemplateUpdate`

Response: `TemplateResponse`

### Delete Template

`DELETE /api/v1/templates/{template_id}`

Requires: `admin`

Response: 204 No Content

## Rendering

Variables are derived from the event payload. Only scalar values (string, int, float, bool) are exposed.

Example:
- Payload: `{"customer": "Alice", "otp": "123456"}`
- Template body: `"Hello {{customer}}, your code is {{otp}}."`
- Rendered: `"Hello Alice, your code is 123456."`

If a placeholder variable is missing from the payload, the placeholder is left unreplaced in the rendered text.

## Missing Template Behaviour

If no active template exists for an event type + channel combination, the worker marks the notification as `dead_letter` with failure reason `No active template for '<event_type>' (<channel>)`.

## Missing Variable Behaviour

If a template contains unresolved placeholders after rendering, the worker marks the notification as `dead_letter` with failure reason `Template contains unresolved placeholders`.
