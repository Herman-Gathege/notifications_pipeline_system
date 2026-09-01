# Notification Platform - System Overview

## Overview

The Notification Platform is a centralized notification delivery service responsible for sending notifications on behalf of multiple applications.

Rather than allowing every application to communicate directly with Email, SMS, Push, or WhatsApp providers, all requests are routed through a single platform that handles authentication, validation, queuing, retries, provider selection, monitoring, and delivery status tracking.

This architecture simplifies notification management, improves scalability, and provides a consistent interface for all client applications.

---

# Objectives

The platform is designed to achieve the following goals:

- Centralize all outbound notifications.
- Support multiple client applications.
- Provide secure API authentication for machine clients (API keys).
- Provide secure human authentication for platform operators (email/password + JWT).
- Deliver notifications asynchronously.
- Support multiple notification providers.
- Track notification delivery.
- Retry failed deliveries automatically.
- Scale independently from client systems.
- Provide a foundation for analytics and reporting.

---

# High-Level Architecture

```
                 Client Applications
                         │
                         │ HTTP REST API (API Key + Secret)
                         ▼
                 Notification API
                   (FastAPI Backend)
                         │
         ┌───────────────┼────────────────┐
         │               │                │
         ▼               ▼                ▼
  Authentication   Business Logic   Validation
         │               │
         │               ▼
         │         Application Mgmt
         │               │
         │               ▼
         │           PostgreSQL
         │               │
         └───────────────┼────────────────┐
                         ▼
                   Redis Queue
                         │
                         ▼
               Notification Worker
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
       Email           SMS          Push (Future)
         │
         ▼
  Notification Providers


  Human Users (Admin/Operator)
         │
         │ Browser / Frontend
         ▼
       Nginx
         │
         ▼
     Frontend (React)
         │
         │ JWT Auth (email/password)
         ▼
     Notification API
```

---

# Technology Stack

| Layer | Technology |
|---------|------------|
| Backend | FastAPI |
| ORM | SQLAlchemy |
| Database | PostgreSQL |
| Queue | Redis |
| Background Jobs | Worker Service |
| API Documentation | OpenAPI / Swagger |
| Reverse Proxy | Nginx |
| Frontend | React + Vite + TypeScript |
| Containerization | Docker |
| Orchestration | Docker Compose |

---

# Core Components

## FastAPI Backend

The backend exposes REST APIs used by client applications and human operators.

Responsibilities include:

- Machine authentication (API keys → application JWT)
- Human authentication (email/password → user JWT)
- Application registration and ownership
- Notification validation
- Notification creation
- Notification retrieval
- Queue publishing
- Status updates
- Admin user management

---

## Dual Authentication Model

The platform supports two distinct authentication identities:

### Machine / Application Identity

- Authenticates using `api_key` + `secret`
- Receives an **application JWT**
- Used for notification/event APIs
- Identity: `Application.id`

### Human / User Identity

- Authenticates using `email` + `password`
- Receives a **user JWT**
- Used for frontend/application-management UI
- Identity: `User.id` with `role: admin | user`
- Owns Applications

These two identity types are strictly separated. Application JWTs cannot access user-only endpoints. User JWTs cannot act as application credentials.

---

## PostgreSQL

PostgreSQL serves as the primary persistent data store.

It stores:

- Users (human operators)
- Applications (client systems)
- API Keys (machine credentials)
- Notifications
- Delivery history
- Provider information
- Audit data

---

## Redis

Redis acts as a lightweight message broker.

Instead of sending notifications immediately, notification jobs are pushed into Redis where background workers consume them asynchronously.

Advantages include:

- Faster API responses
- Retry capability
- Better scalability
- Load balancing

---

## Worker

The Worker continuously listens for queued notification jobs.

Its responsibilities include:

- Reading queued notifications
- Selecting providers
- Sending notifications
- Recording delivery attempts
- Updating notification status
- Retrying failed notifications

---

## Frontend

The React frontend provides a management interface for platform administrators and operators.

Responsibilities include:

- Human user login/registration
- Viewing and managing applications (owned by the logged-in user)
- Managing API keys
- Monitoring notifications
- Viewing delivery history
- Admin user management

---

# Current Features

## Health Monitoring

Endpoints:

- GET /health
- GET /

Purpose:

- Docker health checks
- Infrastructure monitoring
- Service availability verification

---

## Human Authentication

Endpoints:

- POST /api/v1/auth/register — Create human user account
- POST /api/v1/auth/login — Authenticate with email/password
- GET /api/v1/users/me — Get current user profile

Returns a user JWT with claims:

```json
{
  "sub": "user-uuid",
  "type": "user",
  "role": "admin",
  "email": "admin@example.com",
  "exp": 1234567890
}
```

---

## Machine Authentication

Endpoints:

- POST /api/v1/auth/token — Exchange API key + secret for application JWT
- POST /api/v1/auth/validate — Validate application JWT

Returns an application JWT with claims:

```json
{
  "sub": "application-uuid",
  "app": "Payment Service",
  "type": "application",
  "exp": 1234567890
}
```

---

## Application Management

Applications are now owned by human users.

Implemented CRUD operations:

- Create Application (requires authenticated human user)
- List Applications (admin sees all; user sees own)
- Get Application (admin sees any; user must own)
- Update Application (admin sees any; user must own)
- Delete Application (admin sees any; user must own)

Each application contains:

- Unique ID
- Name
- Secret
- Status
- API Key
- Owner (User)
- Creation timestamp

---

## API Key Generation

Every application automatically receives a generated API key.

Current features include:

- Secure random generation
- Expiration date
- Active status
- Association with an application

---

## Docker Deployment

The platform runs as independent containers:

- Backend
- Frontend
- PostgreSQL
- Redis
- Worker
- Nginx

---

# Security

The platform is designed with security as a core principle.

Current security measures include:

- Human user passwords (stored as hashed strings)
- Application secrets
- API Keys
- UUID identifiers
- Secure random token generation
- JWT authentication (dual: user + application)
- Role-based access control (admin / user)
- Request validation
- Ownership enforcement on application resources

---

# Design Principles

The project follows several architectural principles.

## Separation of Concerns

Business logic, repositories, APIs, and schemas remain independent.

---

## Dual Identity Isolation

Machine (application) authentication and human (user) authentication are separate systems. Tokens are typed and validated accordingly.

---

## Provider Independence

The system should not depend on a specific Email or SMS provider.

Changing providers should require minimal code changes.

---

## Asynchronous Processing

Notification delivery should never block API requests.

---

## Scalability

Each component should scale independently.

Examples:

- Multiple API instances
- Multiple workers
- Separate Redis instance
- Separate database server

---

## Maintainability

The project emphasizes:

- Clean architecture
- Small reusable services
- Repository pattern
- Dependency injection
- Strong typing
- Consistent documentation

---

# Intended Users

The platform is intended for:

- SaaS applications
- Internal enterprise systems
- E-commerce platforms
- Property management systems
- CRM platforms
- ERP platforms
- Mobile applications
- Third-party integrations
- Platform operators and administrators

---

# Future Roadmap

Phase 1
- Infrastructure
- Application management
- API Keys
- Human authentication
- Role-based access control

Status: Completed

Phase 2
- Notification APIs
- Queue publishing
- Worker processing

Status: Complete

Phase 3
- Email providers
- SMS providers
- Delivery tracking

Status: Planned

Phase 4
- Analytics
- Monitoring
- Admin Dashboard

Status: Planned

Phase 5
- High availability
- Horizontal scaling
- Multi-provider failover

Status: Planned

---

# Summary

The Notification Platform serves as a centralized notification service that enables multiple client applications to securely send notifications through a common infrastructure.

Its modular architecture, asynchronous processing model, and provider abstraction allow it to scale efficiently while remaining easy to extend with new delivery channels and providers.

The platform now supports two distinct authentication identities: machine clients (applications) and human operators (users), each with appropriate authorization boundaries.
