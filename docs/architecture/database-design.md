# Database Design

## Overview

The Notification Platform uses PostgreSQL as its primary relational database.

The database is responsible for storing:

- Registered client applications
- API Keys
- Notifications
- Delivery attempts
- Templates
- Audit logs
- User preferences
- Provider configurations

The current implementation contains the foundation tables required to identify applications and securely authenticate requests. Additional tables will be introduced as notification functionality expands.

---

# Current Database

Current Tables

```
applications
api_keys
```

Future Tables

```
notifications
notification_logs
templates
providers
channels
delivery_attempts
webhook_events
audit_logs
```

---

# Entity Relationship Diagram

Current

```
Applications
      │
      │ 1
      │
      │
      ▼
API Keys
      *
```

Future

```
Applications
      │
      │
      ▼
Notifications
      │
      ├────────► Delivery Attempts
      │
      ├────────► Audit Logs
      │
      └────────► Templates

Applications
      │
      ▼
API Keys

Notifications
      │
      ▼
Providers

Providers
      │
      ▼
Channels
```

---

# Table: applications

Purpose

Represents a client system registered with the Notification Platform.

Examples:

- Payment Service
- HR System
- CRM
- E-Commerce
- Mobile App

Each application receives credentials used to authenticate future requests.

---

## Columns

| Column | Type | Description |
|---------|------|-------------|
| id | UUID | Primary Key |
| name | VARCHAR | Application name |
| secret | VARCHAR | Secret used internally |
| status | BOOLEAN | Active / Inactive |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

---

## Relationships

One Application

↓

Many API Keys

Future:

One Application

↓

Many Notifications

---

## Example

| id | name |
|----|------|
| uuid | Payment Service |

---

# Table: api_keys

Purpose

Stores authentication tokens issued to registered applications.

API Keys allow applications to access the Notification Platform securely.

---

## Columns

| Column | Type |
|---------|------|
| id | UUID |
| application_id | UUID |
| token | TEXT |
| expires_at | TIMESTAMP |
| last_used | TIMESTAMP |
| is_active | BOOLEAN |
| created_at | TIMESTAMP |

---

## Relationships

Many API Keys

↓

One Application

---

## Notes

Each key belongs to exactly one application.

An application may own multiple API Keys.

Reasons include:

- Key rotation
- Development
- Production
- Testing
- Emergency replacement

---

# Current Relationship

```
Application

id
name
secret

        │

        │

        ▼

API Key

application_id

token
```

---

# Planned Table: notifications

Purpose

Stores every notification submitted by client applications.

---

## Proposed Columns

| Column | Description |
|---------|-------------|
| id | UUID |
| application_id | Owner |
| channel | email/sms/push |
| recipient | Destination |
| subject | Optional |
| message | Content |
| status | Delivery status |
| priority | Queue priority |
| scheduled_at | Future delivery |
| delivered_at | Success time |
| created_at | Created |
| updated_at | Updated |

---

## Relationship

One Application

↓

Many Notifications

---

# Planned Table: delivery_attempts

Purpose

Tracks every attempt made to deliver a notification.

Useful for debugging.

---

Columns

- id
- notification_id
- provider
- response_code
- response_message
- duration
- created_at

Relationship

```
Notification

↓

Delivery Attempts
```

One notification can have many delivery attempts.

---

# Planned Table: templates

Purpose

Reusable notification templates.

Example

```
Welcome Email

Password Reset

OTP SMS

Invoice Reminder

Payment Receipt
```

Applications will reference templates instead of sending large bodies repeatedly.

---

# Planned Table: providers

Purpose

Stores provider configuration.

Example

```
SendGrid

SMTP

Amazon SES

Twilio

Africa's Talking

Firebase
```

Each provider has credentials and configuration.

---

# Planned Table: channels

Supported channels.

Examples

```
EMAIL

SMS

PUSH

WHATSAPP

SLACK

WEBHOOK
```

Providers will declare which channels they support.

---

# Planned Table: webhook_events

Purpose

Stores outgoing webhook deliveries.

Useful when external systems subscribe to notification events.

Example

```
Notification Delivered

Notification Failed

Notification Opened
```

---

# Planned Table: audit_logs

Purpose

Tracks system changes.

Examples

```
Application Created

API Key Rotated

Template Updated

Provider Disabled

Notification Cancelled
```

Audit logs improve traceability and security.

---

# UUID Strategy

Every major entity uses UUIDs instead of auto-increment integers.

Benefits

- Globally unique
- Safe across distributed systems
- Harder to enumerate
- Easier service integration

Example

```
796f5c34-e454-4b76-86c7-fc138d4bca07
```

---

# Timestamps

All tables should include timestamps where appropriate.

```
created_at

updated_at
```

Some tables also include

```
deleted_at

last_used

expires_at

delivered_at
```

---

# Indexing Strategy

Indexes should exist on frequently queried columns.

Current

```
applications.id

applications.name

api_keys.token

api_keys.application_id
```

Future

```
notifications.status

notifications.created_at

notifications.recipient

notifications.application_id

delivery_attempts.notification_id

templates.name
```

---

# Constraints

Current constraints

- Primary Keys
- Foreign Keys
- Unique application names
- Unique API tokens

Future constraints

- Valid notification status
- Valid provider
- Valid channel
- Retry limits
- Notification ownership

---

# Cascade Rules

Deleting an application should remove:

- API Keys
- Notifications
- Delivery Attempts

This avoids orphaned records.

Example

```
Application

↓

Notifications

↓

Delivery Attempts
```

---

# Repository Layer

Each table has a corresponding repository responsible for database interaction.

Current repositories

```
ApplicationRepository

APIKeyRepository
```

Future repositories

```
NotificationRepository

ProviderRepository

TemplateRepository

AuditRepository

DeliveryAttemptRepository
```

Repositories should contain only persistence logic.

Business rules belong inside the Service layer.

---

# Service Layer

Current

```
ApplicationService

APIKeyService
```

Future

```
NotificationService

ProviderService

DeliveryService

TemplateService

AnalyticsService
```

Services coordinate repositories and business rules while keeping API routes thin.

---

# Scalability Considerations

The database has been designed to support:

- Millions of notifications
- Multiple worker processes
- Multiple providers
- Key rotation
- Scheduled notifications
- Analytics
- Reporting
- Horizontal scaling

Future optimizations may include:

- Table partitioning
- Read replicas
- Connection pooling
- Archiving old notifications
- Materialized views for reporting

---

# Current Implementation Status

| Component | Status |
|-----------|--------|
| Applications | ✅ Complete |
| API Keys | ✅ Complete |
| Notifications | ⏳ Planned |
| Templates | ⏳ Planned |
| Providers | ⏳ Planned |
| Delivery Attempts | ⏳ Planned |
| Audit Logs | ⏳ Planned |
| Analytics | ⏳ Planned |

---

# Summary

The Notification Platform database is intentionally modular. The current implementation provides a secure foundation for application registration and API key management, while the schema is designed to evolve cleanly as notification delivery, provider integrations, templates, analytics, and auditing are introduced in future development phases.