# Sprint 5 — Provider Integrations

## Sprint Goal

Replace the mocked delivery step in the notification worker with real provider integrations.

The platform now communicates with actual external providers to send notifications through Email, SMS, and WhatsApp channels.

---

# Objectives

- Implement provider adapters for real delivery
- Integrate Resend for email delivery
- Integrate SMTP for email delivery
- Integrate Africa's Talking for SMS delivery
- Add WhatsApp provider stub for future implementation
- Implement provider resolution and selection
- Implement provider CRUD via API
- Add provider health checking and testing
- Enable real email and SMS transmission

---

# Features Implemented

## Email Providers

### Resend

- Provider adapter using the Resend API
- Sends HTML email via `resend.Emails.send`
- Configured via `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`
- Returns delivery status, provider message ID, and error details

### SMTP

- Native SMTP provider using Python's `smtplib`
- Supports SSL and TLS connections
- Configured per-provider with host, port, credentials
- Falls back to plain SMTP when SSL is not enabled

## SMS Provider

### Africa's Talking

- Provider adapter using the Africa's Talking REST API
- Sends SMS via `https://api.sandbox.africastalking.com/version1/messaging`
- Configured via `AFRICASTALKING_USERNAME`, `AFRICASTALKING_API_KEY`, `AFRICASTALKING_SENDER_ID`
- Supports sandbox mode for testing

## WhatsApp Provider

- Stub provider file created at `app/providers/whatsapp/whatsapp_provider.py`
- Follows the `NotificationProvider` abstract base class interface
- Ready for Meta WhatsApp Cloud API integration

## Provider Resolution

- `ProviderResolver` service selects the correct provider implementation based on channel type
- Matches provider by `transport_type` (smtp/api) and provider name
- Returns both the Provider model and the provider client instance
- Raises `ValueError` when no matching provider is found

## Provider CRUD API

- Create, list, update, delete providers via REST endpoints
- Test provider connectivity via `POST /providers/{provider_id}/test`
- Priority-based provider selection
- Activate/deactivate providers

---

# Architecture

```
Event Service
     │
     ▼
Celery Queue
     │
     ▼
Notification Worker
     │
     ▼
Routing Service
     │
     ├── Template Service (render variables)
     │
     └── Provider Resolver (select provider)
              │
              ▼
     Provider Client (Resend / SMTP / Africa's Talking)
              │
              ▼
     External Provider
```

---

# Components Added

## Providers

```
backend/app/providers/
├── base.py                    # NotificationProvider abstract base
├── email/
│   └── resend_provider.py     # Resend email adapter
├── smtp_provider.py           # SMTP email adapter
├── sms/
│   ├── sms_provider.py        # Africa's Talking SMS adapter
│   └── africastalking_provider.py
└── whatsapp/
    └── whatsapp_provider.py   # WhatsApp stub
```

## Services

- `provider_service.py` — Provider CRUD, testing, health checks
- `provider_resolver.py` — Provider selection by channel
- `routing_service.py` — Template + provider resolution pipeline
- `template_service.py` — Variable substitution and rendering
- `retry_service.py` — Retry logic placeholder

## API Routes

- `providers.py` — Full CRUD + test endpoint

---

# Provider Resolution Flow

1. Worker receives notification task
2. Routing Service finds matching template
3. Provider Resolver looks up active provider for the notification channel
4. Provider Resolver instantiates the correct adapter (Resend, SMTP, Africa's Talking)
5. Delivery payload is built with rendered template content
6. Provider client sends the notification
7. Result is recorded (delivered or failed)
8. Notification and event statuses are updated

---

# Configuration

Environment variables in `.env`:

```
# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_FROM_NAME=

# SMS
AFRICASTALKING_USERNAME=sandbox
AFRICASTALKING_API_KEY=
AFRICASTALKING_SENDER_ID=

# WhatsApp (future)
WHATSAPP_PROVIDER=
META_ACCESS_TOKEN=
```

---

# Files Added

```
backend/app/providers/base.py
backend/app/providers/email/resend_provider.py
backend/app/providers/smtp_provider.py
backend/app/providers/sms/sms_provider.py
backend/app/providers/sms/africastalking_provider.py
backend/app/providers/whatsapp/whatsapp_provider.py
```

## Files Updated

```
backend/app/services/provider_service.py
backend/app/services/provider_resolver.py
backend/app/services/routing_service.py
backend/app/services/template_service.py
backend/app/api/v1/providers.py
backend/app/workers/notification_worker.py
backend/app/models/provider.py
backend/app/schemas/provider.py
backend/app/repositories/provider_repository.py
backend/requirements/base.txt
```

---

# Sprint 5 Acceptance Checklist

## Providers

- [x] Provider CRUD API
- [x] Resend email provider
- [x] SMTP email provider
- [x] Africa's Talking SMS provider
- [x] WhatsApp provider stub
- [x] Provider resolution by channel
- [x] Priority-based provider selection
- [x] Provider testing endpoint
- [x] Activate/deactivate providers

## Routing

- [x] Template resolution by event type and channel
- [x] Variable rendering
- [x] Provider selection
- [x] Delivery payload construction

## Worker

- [x] Real provider delivery (not mocked)
- [x] Status tracking (delivered/failed)
- [x] Error handling
- [x] Processing time tracking

---

# Sprint 5 Success Criteria

Sprint 5 is considered complete when:

- ✅ Real email can be sent via Resend or SMTP
- ✅ Real SMS can be sent via Africa's Talking
- ✅ WhatsApp provider stub exists and follows the provider interface
- ✅ Provider resolver correctly selects the right adapter by channel
- ✅ Provider CRUD API works end-to-end
- ✅ Provider test endpoint validates connectivity
- ✅ Worker processes notifications through real providers
- ✅ Delivery status is correctly tracked in the database

---

# Next Sprint

Sprint 6 will focus on monitoring and observability, adding Prometheus metrics and a monitoring API endpoint.