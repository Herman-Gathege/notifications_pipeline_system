# Architecture

## Overview

FikaTu is an event-driven, provider-agnostic notification routing and delivery platform. Client applications publish events; FikaTu handles validation, template rendering, provider selection, delivery, retries, logging, and monitoring.

## High-Level Flow

```
Internal Application
        │
        │ authenticated API request (Bearer token)
        ▼
     FikaTu API (FastAPI)
        │
        ▼
   Event Validation
        │
        ▼
      Event (stored in PostgreSQL)
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

## Components

### API Layer

- **Framework**: FastAPI
- **Entry**: `backend/app/main.py`
- **Routes**: All under `/api/v1`
- **Middleware**:
  - `RequestIDMiddleware` — assigns a request ID
  - `LoggingMiddleware` — structured request logging
  - `AuthenticationMiddleware` — JWT validation for protected routes

### Authentication

- **User tokens**: JWT HS256, 24-hour expiry, `type: "user"`
- **Application tokens**: JWT HS256, 24-hour expiry, `type: "application"`
- **Middleware**: `AuthenticationMiddleware` validates tokens on all non-public paths
- **Dependencies**: `get_current_user`, `get_current_application`, `require_admin`

### Database

- **ORM**: SQLAlchemy 2.0 (declarative base at `app.database.base.Base`)
- **Migrations**: Alembic (`backend/alembic/`)
- **Models**: `User`, `Application`, `APIKey`, `Event`, `Notification`, `Template`, `Provider`, `NotificationReport`
- **Session**: `SessionLocal` via `get_db` dependency

### Event System

- **Registry**: `app/events/registry.py` defines `EVENT_REGISTRY`
- **Validation**: `EventValidationService` validates payloads against Pydantic schemas
- **Supported types**: `payment.success`, `user.registered`, `password.reset`, `otp.requested`, `greetings`

### Queue & Worker

- **Broker**: Redis 7
- **Task runner**: Celery 5.5
- **Queue**: `notifications`
- **Task**: `app.workers.notification_worker.process_notification`
- **Concurrency**: 2 (worker entrypoint)

### Notification Processing

1. `EventService.create_event` validates payload, stores event, creates `Notification` per channel
2. `process_notification.delay(notification_id)` enqueues task
3. Worker loads notification + event
4. `RoutingService.build_route` resolves template + provider
5. Template rendered with payload variables
6. Provider `send()` called
7. Notification status updated (`delivered` or `dead_letter`)
8. Event marked `processed` on success

### Providers

| Channel | Transport | Implementation |
|---------|-----------|----------------|
| email | api | `ResendProvider` |
| email | smtp | `SMTPProvider` |
| sms | api | `SMSProvider` (Africa's Talking) |
| whatsapp | — | stub (not implemented) |

### Frontend

- **Framework**: React 19 + Vite 8 + TypeScript
- **UI**: shadcn/ui + Tailwind CSS v4
- **Routing**: React Router v7
- **State**: React context (`AuthContext`) + localStorage
- **API**: Axios with interceptors

### Infrastructure

- **Containerisation**: Docker + Docker Compose
- **Proxy**: Nginx (routes `/api/` to API, `/` to frontend)
- **Services**: `notification-postgres`, `notification-redis`, `notification-api`, `notification-worker`, `notification-frontend`, `notification-nginx`
