# Database Design

## Overview

The Notification Platform uses PostgreSQL as its primary relational database.

The database is responsible for storing:

- Users (human operators)
- Registered client applications
- API Keys
- Notifications
- Delivery attempts
- Templates
- Audit logs
- User preferences
- Provider configurations

The current implementation contains the foundation tables required to identify applications, authenticate machine clients, and manage human users. Additional tables will be introduced as notification functionality expands.

---

# Current Database

Current Tables

```
users
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
Users
  │
  │ 1
  │
  ▼
Applications
  │
  │ 1
  │
  ▼
API Keys
  *
```

Future

```
Users
  │
  │
  ▼
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

# Table: users

Purpose

Represents a human operator who logs into the Notification Platform.

Examples:

- Platform administrator
- Operations staff
- Developer managing applications

Each user has a role (`admin` or `user`) and owns zero or more applications.

---

## Columns

| Column | Type | Description |
|---------|------|-------------|
| id | VARCHAR(36) | Primary Key (UUID) |
| email | VARCHAR(255) | Unique, indexed |
| hashed_password | VARCHAR(255) | Password hash |
| name | VARCHAR(150) | Display name |
| role | VARCHAR(20) | `admin` or `user` |
| is_active | BOOLEAN | Active / Inactive |
| created_at | TIMESTAMPTZ | Creation time |
| updated_at | TIMESTAMPTZ | Last update |

---

## Relationships

One User

↓

Many Applications

---

## Notes

- Email is unique and indexed for fast lookups during login.
- Passwords are stored as hashed strings.
- Default role is `user`.
- Inactive users cannot authenticate or use protected endpoints.
- The first user is seeded by the database migration with role `admin`.

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

Each application receives credentials used to authenticate future machine requests.

---

## Columns

| Column | Type | Description |
|---------|------|-------------|
| id | VARCHAR(36) | Primary Key (UUID) |
| name | VARCHAR(150) | Application name (unique) |
| secret | VARCHAR(255) | Secret used for machine auth |
| status | BOOLEAN | Active / Inactive |
| owner_id | VARCHAR(36) | Foreign Key to `users.id` |
| created_at | TIMESTAMPTZ | Creation time |
| updated_at | TIMESTAMPTZ | Last update |

---

## Relationships

Many Applications

↓

One User (owner)

One Application

↓

Many API Keys

Future:

One Application

↓

Many Notifications

---

## Notes

- `owner_id` is assigned automatically from the authenticated human user who creates the application.
- Deleting a user sets `owner_id` to NULL on their applications (`ON DELETE SET NULL`).
- Application secrets are stored as plaintext strings. This is intentional for the current implementation but should be reviewed for production hardening.

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

- Each key belongs to exactly one application.
- An application may own multiple API Keys.
- Reasons include: key rotation, development, production, testing, emergency replacement.

---

# Current Relationships

```
User
 │
 │ 1
 │
 ▼
Application
 │
 │ 1
 │
 ▼
API Key
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

## Columns

- id
- notification_id
- provider
- response_code
- response_message
- duration
- created_at

---

## Relationship

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
users.id

users.email

applications.id

applications.name

applications.owner_id

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
- Unique user emails

Future constraints

- Valid notification status
- Valid provider
- Valid channel
- Retry limits
- Notification ownership

---

# Cascade Rules

Deleting a user should not delete applications. Instead, `owner_id` is set to NULL.

Deleting an application should remove:

- API Keys
- Notifications
- Delivery Attempts

This avoids orphaned records.

Example

```
User

↓

Applications (owner_id set to NULL on user delete)

↓

API Keys / Notifications / Delivery Attempts
```

---

# Repository Layer

Each table has a corresponding repository responsible for database interaction.

Current repositories

```
UserRepository

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
UserService

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
| Users | ✅ Complete |
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

The Notification Platform database is intentionally modular. The current implementation provides a secure foundation for application registration, API key management, and human user authentication, while the schema is designed to evolve cleanly as notification delivery, provider integrations, templates, analytics, and auditing are introduced in future development phases.
