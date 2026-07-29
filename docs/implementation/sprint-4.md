# Sprint 4
# Templates & Routing Engine

---

# Objective

Sprint 4 transforms the Notification Platform from a simple event receiver into an intelligent routing engine.

Instead of simply storing events, the platform can now:

1. Receive an event
2. Find the appropriate template
3. Render dynamic variables
4. Resolve the correct provider
5. Create a notification
6. Queue the notification
7. Allow Celery to process the delivery

At the end of this sprint, the Notification Platform is capable of taking business events and automatically transforming them into deliverable notifications.

---

# Sprint Deliverables

## Completed

- ✅ Template CRUD
- ✅ Provider CRUD
- ✅ Template rendering
- ✅ Variable substitution
- ✅ Routing Engine
- ✅ Provider Resolver
- ✅ Celery integration
- ✅ Notification processing
- ✅ Queue processing
- ✅ Event status updates
- ✅ Notification status updates

---

# Architecture

```
                Client
                   │
                   ▼

          POST /events

                   │

                   ▼

           Event Service

                   │

                   ▼

      Creates Event Record

                   │

                   ▼

         Celery Task Queue

                   │

                   ▼

     process_notification()

                   │

          ┌────────┴────────┐

          ▼                 ▼

   Template Service    Routing Service

          │                 │

          ▼                 ▼

  Render Template     Resolve Provider

          │                 │

          └────────┬────────┘

                   ▼

          Notification Record

                   ▼

         Delivery Payload

                   ▼

         Provider (Mock)

                   ▼

     Notification Processed
```

---

# Components Implemented

## Template Service

Responsibilities

- Create templates
- Retrieve templates
- Update templates
- Delete templates
- Render variables

Example

Template

```
Hello {{customer}}

Payment: {{amount}}
```

Payload in like JSON

```
{
    "customer":"Alice",
    "amount":"KES 5000"
}
```

Rendered

```
Hello Alice

Payment: KES 5000
```

---

## Routing Service

Responsibilities

- Determine notification channel
- Retrieve matching template
- Resolve provider
- Build notification payload

Routing Flow

```
Incoming Event

↓

Find Template

↓

Find Provider

↓

Render Variables

↓

Create Notification

↓

Queue Notification
```

---

## Provider Resolver

Responsibilities

- Find active provider
- Match notification channel
- Select highest priority provider

Example

Providers

SMTP Local
Priority 1

SendGrid
Priority 2

Selected

SMTP Local
```

---

# Project Structure

```
backend/

app/

├── api/

├── models/

│

├── repositories/

│

├── schemas/

│

├── services/

│   ├── template_service.py

│   ├── routing_service.py

│   ├── provider_resolver.py

│   └── event_service.py

│

├── workers/

│   ├── worker.py

│   └── notification_worker.py

│

└── core/
```

---

# Internal Processing Pipeline

When an event is submitted:

Step 1

API receives the event.

↓

Step 2

Event Service saves it to PostgreSQL.

↓

Step 3

Celery task is queued.

↓

Step 4

Worker receives task.

↓

Step 5

Routing Service finds matching template.

↓

Step 6

Template variables are rendered.

↓

Step 7

Provider Resolver selects SMTP Local.

↓

Step 8

Notification record is created.

↓

Step 9

Provider receives payload.

↓

Step 10

Notification marked Processed.

↓

Step 11

Event marked Processed.

---

# Starting the Platform

```
docker compose up --build
```

Expected

```
notification-api
Running

notification-worker
ready.

notification-postgres
healthy

notification-redis
healthy

notification-frontend
healthy
```

---

# Verify API

```
curl http://localhost:8001/health
```

Expected

```
{
  "status":"healthy"
}
```

---

# Verify Worker

```
docker compose logs -f notification-worker
```

Expected

```
Connected to redis

celery ready

notifications queue ready
```

Once all services are healthy, the platform is ready for the Sprint 4 demonstration.

---

# Sprint 4 Demonstration Flow

The remainder of this document walks through the complete end-to-end workflow:

1. Verify existing application
2. Create provider
3. Verify provider
4. Create template
5. Verify template
6. Publish event
7. Watch Celery process notification
8. Verify notification
9. Verify processed event
10. Validate Sprint 4 completion

Every step includes the exact curl command, expected output, and explanation of what is happening internally.

# Sprint 4 Demonstration & End-to-End Testing

---

# Demo Objective

This demonstration validates the complete notification lifecycle from the moment an application publishes an event until the worker successfully processes the notification.

By the end of this walkthrough we will have verified:

- Application registration
- Provider configuration
- Template management
- Event publishing
- Queue processing
- Notification generation
- Template rendering
- Provider selection
- Event completion

---

# Test Flow

```
Application

↓

Publish Event

↓

API receives Event

↓

Event stored

↓

Celery Queue

↓

Worker

↓

Routing Engine

↓

Template Service

↓

Provider Resolver

↓

Notification Created

↓

Notification Processed

↓

Event Updated
```

---

# Step 1 — Verify Existing Application

The Notification Platform requires an application before events can be submitted.

Run:

```bash
curl http://localhost:8001/api/v1/applications
```

Expected Response

```json
[
  {
    "id":"845b223c-6f05-45bb-b816-c20e64a2acff",
    "name":"Payment works",
    "status":"active"
  }
]
```

Explanation

The application represents an external client that is allowed to publish notification events.

Every event belongs to an application.

---

# Step 2 — Verify Providers

Providers are responsible for delivering notifications.

Run

```bash
curl http://localhost:8001/api/v1/providers
```

Expected

```json
[
  {
    "name":"SMTP Local",
    "channel":"email",
    "priority":1,
    "is_active":true
  }
]
```

Explanation

The Provider Resolver will later search this table and automatically select the highest-priority active provider for the notification channel.

Current provider

| Channel | Provider | Priority |
|----------|----------|----------|
| Email | SMTP Local | 1 |

---

# Step 3 — Verify Templates

Templates define how notifications should look.

Run

```bash
curl http://localhost:8001/api/v1/templates
```

Expected

```json
[
    {
        "name":"Payment Email",
        "event_type":"payment.success",
        "channel":"email",
        "subject":"Payment Received",
        "body":"Hello {{customer}}, we received {{amount}}."
    },
    {
        "name":"Payment Rejected Email",
        "event_type":"payment.rejected",
        "channel":"email"
    }
]
```

Explanation

Notice that the template body still contains placeholders.

These placeholders are **not** replaced until an actual event is processed.

---

# Step 4 — Publish an Event

This is where the complete routing engine begins.

Run

```bash
curl -X POST http://localhost:8001/api/v1/events \
-H "Content-Type: application/json" \
-d '{
  "application_id":"845b223c-6f05-45bb-b816-c20e64a2acff",
  "event_type":"payment.success",
  "payload":{
      "customer":"Alice",
      "amount":"KES 5,250"
  }
}'
```

Expected

```json
{
    "status":"received",
    "is_processed":false
}
```

Explanation

At this stage:

✔ Event saved

✔ Celery task queued

✔ Worker has NOT processed it yet

Database Status

| Component | Status |
|-----------|--------|
| Event | Received |
| Notification | Not created yet |
| Worker | Waiting |

---

# Internal Processing

Immediately after saving the event:

```
POST /events

↓

EventService

↓

Save Event

↓

Queue Celery Task

↓

Return HTTP Response

↓

Worker executes asynchronously
```

Notice that the API returns immediately while Celery continues working in the background.

---

# Step 5 — Observe Celery Worker

Open another terminal.

Run

```bash
docker compose logs -f notification-worker
```

Expected

```text
Task received
```

Then

```text
Processing notification
```

Next

```text
Delivery Payload
```

Expected Payload

```text
{
  'provider': 'SMTP Local',
  'channel': 'email',
  'recipient': '',
  'subject': 'Payment Received',
  'body': 'Hello Alice, we received KES 5,250.'
}
```

Explanation

Several services have worked together to produce this payload.

### Routing Service

Found template

```
payment.success
```

↓

### Template Service

Converted

```
Hello {{customer}}

we received {{amount}}
```

into

```
Hello Alice

we received KES 5,250
```

↓

### Provider Resolver

Selected

```
SMTP Local
```

↓

Notification Worker

Built delivery payload.

---

# Step 6 — Successful Processing

Expected Worker Log

```text
Notification processed successfully.
```

Followed by

```text
Task succeeded
```

Meaning

✔ Queue processed

✔ Notification updated

✔ Event updated

✔ Worker completed successfully

---

# Step 7 — Verify Notifications

Run

```bash
curl http://localhost:8001/api/v1/notifications
```

Expected

```json
[
  {
    "event_id":"448492f2-2e9f-42c7-b65b-70fea1312d80",
    "channel":"email",
    "status":"processed"
  }
]
```

Explanation

Notification lifecycle

```
Created

↓

Queued

↓

Worker Picked Up

↓

Rendered

↓

Provider Selected

↓

Processed
```

Final Status

```
processed
```

---

# Step 8 — Verify Event

Run

```bash
curl http://localhost:8001/api/v1/events
```

Expected

```json
{
    "event_type":"payment.success",
    "status":"processed",
    "is_processed":true
}
```

Explanation

Originally

```
status

received
```

After Celery

```
status

processed
```

The Event Service automatically updated the record after successful notification processing.

---

# End-to-End Lifecycle Summary

```
Application

↓

POST /events

↓

Database

↓

Celery Queue

↓

Notification Worker

↓

Routing Service

↓

Template Service

↓

Provider Resolver

↓

Delivery Payload

↓

Notification Processed

↓

Event Updated
```

---

# Sprint 4 Acceptance Checklist

## Templates

- [x] Create template
- [x] Retrieve templates
- [x] Render variables
- [x] Match template by event type

---

## Providers

- [x] Create provider
- [x] Retrieve providers
- [x] Resolve provider by channel
- [x] Priority selection

---

## Routing Engine

- [x] Event received
- [x] Queue task
- [x] Find template
- [x] Render variables
- [x] Resolve provider
- [x] Build delivery payload

---

## Worker

- [x] Receive task
- [x] Process notification
- [x] Update notification
- [x] Update event
- [x] Complete task successfully

---

# Sprint 4 Success Criteria

Sprint 4 is considered complete when the following conditions are met.

- ✅ Event accepted by API
- ✅ Event stored in PostgreSQL
- ✅ Celery task queued
- ✅ Worker receives task
- ✅ Routing engine finds matching template
- ✅ Template placeholders rendered correctly
- ✅ Provider Resolver selects active provider
- ✅ Notification record created
- ✅ Notification status updated to `processed`
- ✅ Event status updated to `processed`
- ✅ Worker exits successfully with no errors

---

# Sprint 5 Preview — Provider Integrations

Sprint 4 produced delivery payloads and routed notifications correctly.

Sprint 5 replaces the mocked delivery step with real provider integrations.

## Planned Providers

### Email

- SMTP
- SendGrid
- Mailgun
- Amazon SES

### SMS

- Africa's Talking
- Twilio

### WhatsApp

- Meta WhatsApp Cloud API

### Push Notifications

- Firebase Cloud Messaging (FCM)

---

# Sprint 5 Goals

- Implement provider adapters
- Retry failed deliveries
- Delivery receipts
- Failure handling
- Provider failover
- Rate limiting
- Logging and auditing
- Provider-specific configuration
- Delivery metrics
- Real email and SMS transmission

---

# Sprint 4 Conclusion

Sprint 4 successfully transformed the Notification Platform into an event-driven routing engine.

The platform now:

- Receives business events
- Routes events automatically
- Selects templates dynamically
- Renders notification content
- Resolves providers intelligently
- Queues asynchronous work using Celery
- Processes notifications successfully
- Tracks notification and event state throughout the lifecycle

The foundation is now in place for Sprint 5, where mock delivery will be replaced with production-ready provider integrations.