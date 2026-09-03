# E-Files Integration Readiness

## Overview

This document captures the discovery checklist and requirements for integrating E-Files with FikaTu. It is **not** an implementation plan. Integration should not begin until all required information is confirmed with the E-Files team.

## Current Status

**NOT STARTED** — E-Files integration has not begun. This document defines what must be discovered before implementation can proceed.

## Technical Discovery Checklist

### API Availability

- [ ] Does E-Files expose a REST API?
- [ ] What is the API base URL?
- [ ] Is there a sandbox/test environment? What is its URL?
- [ ] Is there a production environment? What is its URL?
- [ ] What is the API versioning strategy?
- [ ] Is the API documentation available (OpenAPI, Swagger, Postman collection)?

### Authentication

- [ ] How does E-Files authenticate to external services?
- [ ] Does E-Files support API keys?
- [ ] Does E-Files support OAuth2 / JWT?
- [ ] Does E-Files support mutual TLS (mTLS)?
- [ ] What credentials are required?
- [ ] How are credentials rotated?
- [ ] What is the token/certificate expiry period?

### Request/Response Formats

- [ ] What request formats does E-Files accept? (JSON, XML, form-data)
- [ ] What response formats does E-Files return?
- [ ] Are there any non-standard headers required?
- [ ] What is the maximum payload size?
- [ ] Are there encoding requirements (UTF-8, etc.)?

### Webhook / Callback Support

- [ ] Does E-Files support webhooks for status callbacks?
- [ ] If yes, what is the webhook registration process?
- [ ] What authentication does E-Files use for webhooks?
- [ ] What is the webhook payload format?
- [ ] Are there retry semantics for failed webhook deliveries?
- [ ] If no webhooks, how does E-Files consume status updates? (polling, pull API)

### Timeout & Retry Behaviour

- [ ] What is the expected request/response timeout?
- [ ] Does E-Files implement retries for failed outbound requests?
- [ ] What is E-Files' retry strategy? (count, backoff, jitter)
- [ ] What does E-Files consider a permanent failure vs. transient failure?

### Rate Limits

- [ ] Are there rate limits on E-Files' API?
- [ ] What are the limits? (requests per minute/second)
- [ ] What happens when limits are exceeded?
- [ ] Are there burst allowances?

### Environments

- [ ] Sandbox/test environment URL
- [ ] Production environment URL
- [ ] How are environments separated?
- [ ] Is there a staging environment?

## Business Discovery Checklist

### Events

What events should E-Files send to FikaTu? Potential categories (to be confirmed with E-Files owners):

- `document.created` — triggered when a new document is created
- `document.uploaded` — triggered when a document is uploaded
- `document.approved` — triggered when a document is approved
- `document.rejected` — triggered when a document is rejected
- `workflow.completed` — triggered when a workflow completes
- `workflow.started` — triggered when a workflow starts
- `user.mentioned` — triggered when a user is mentioned in a document
- `document.shared` — triggered when a document is shared

**Action required:** Confirm exact event types, payload schemas, and trigger conditions with the E-Files team. Do not implement speculative events.

### Recipients

For each event, determine:

- [ ] Who receives the notification? (internal users, external customers, both)
- [ ] How is the recipient address determined? (from event payload, lookup, etc.)
- [ ] What channels are used? (email, SMS, WhatsApp, push)
- [ ] Is the recipient always the document owner, or can it be any stakeholder?

### Notification Requirements

For every confirmed E-Files event, establish:

```
Event
 ↓
Trigger
 ↓
Recipient
 ↓
Channel
 ↓
Template
 ↓
Provider
```

Example (to be confirmed):

```
document.approved
 ↓
Document status changes to "approved"
 ↓
Document owner + stakeholders
 ↓
email + sms
 ↓
Template: "Document {{name}} has been approved"
 ↓
Provider: Resend (email), Africa's Talking (sms)
```

### Volume Expectations

- [ ] Approximate notifications per day
- [ ] Approximate notifications per hour
- [ ] Peak notification rate
- [ ] Expected growth trajectory

### Failure Handling

- [ ] What happens if FikaTu is temporarily unavailable?
- [ ] Does E-Files need delivery confirmation?
- [ ] What is the retry policy on E-Files' side?
- [ ] Are there idempotency requirements? (should duplicate events be deduplicated?)
- [ ] What is the maximum acceptable notification delay?

### Security & Compliance

- [ ] Are there data classification restrictions? (PII, confidential, etc.)
- [ ] Does E-Files require audit logging of all notifications?
- [ ] Are there data residency requirements?
- [ ] Is encryption at rest required for notification data?
- [ ] Who owns the notification data?

### Integration Model

How should E-Files publish events to FikaTu?

**Option A: Direct API calls** — E-Files makes HTTP POST requests to FikaTu's `/api/v1/events` endpoint.

- Pros: Simple, direct, no intermediate infrastructure
- Cons: Tight coupling, E-Files must handle retries

**Option B: Message queue** — E-Files publishes to a message queue (e.g., Redis, RabbitMQ); FikaTu consumes from the queue.

- Pros: Decoupled, built-in retry, buffering
- Cons: Additional infrastructure, more complex

**Option C: Webhook push from FikaTu** — FikaTu calls E-Files webhooks.

- Pros: FikaTu controls the integration
- Cons: Inverse of the intended direction

**Recommended:** Option A (Direct API calls) for Phase 1, unless E-Files team has strong requirements for Option B.

## Pre-Integration Requirements

The following must be completed before E-Files integration can begin:

1. **Event catalogue confirmed** — All event types, payload schemas, and channels agreed upon with E-Files team
2. **Templates created** — Message templates for each event type + channel combination
3. **Providers configured** — Email and SMS providers configured and tested
4. **Application registered** — E-Files application created in FikaTu with credentials
5. **Network access** — E-Files servers can reach FikaTu API
6. **Authentication agreed** — E-Files team has application token and understands lifecycle
7. **Error handling agreed** — E-Files team understands retry behaviour and error codes
8. **Monitoring agreed** — How both teams will observe notification delivery

## Open Questions

1. Does E-Files need to know the delivery status of each notification?
2. Should FikaTu call back to E-Files on delivery/failure, or should E-Files poll?
3. Are there bulk notification requirements? (e.g., notifying 100+ users at once)
4. Should notifications be batched?
5. Does E-Files need priority routing? (e.g., approval notifications > routine updates)
6. Is there a requirement for scheduled notifications?
7. Should FikaTu deduplicate events from E-Files?
8. What is the acceptable notification latency?

## Next Steps

1. Schedule discovery meeting with E-Files team
2. Complete technical checklist above
3. Complete business checklist above
4. Define event catalogue with E-Files
5. Create templates in FikaTu
6. Conduct integration test in sandbox
7. Move to production when ready
