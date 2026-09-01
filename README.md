# FikaTu — Centralized Notification Platform

A scalable, provider-agnostic, event-driven notification platform designed to centralize communication services across multiple applications.

The platform enables client applications to publish events while delegating notification processing, routing, delivery, retries, logging, and monitoring to a dedicated service.

---

# Project Overview

FikaTu serves as the single communication gateway for all applications within the ecosystem.

Instead of individual applications implementing their own Email, SMS, or WhatsApp integrations, they simply publish events to this platform.

FikaTu is responsible for:

- Receiving notification events
- Processing notifications asynchronously
- Rendering notification templates
- Selecting notification channels
- Selecting providers
- Sending notifications
- Tracking delivery status
- Retrying failed notifications
- Logging notification history
- Exposing monitoring metrics

The initial release supports:

- Email (Resend, SMTP)
- SMS (Africa's Talking)

WhatsApp provider is planned. Future channels can easily be added without modifying existing business logic.

---

# Architecture

FikaTu follows an event-driven architecture.

```text
                Client Applications

  Rental Management
  CRM
  ERP
  HR
  School
  Hospital

          │

          ▼

    FikaTu API

          │

          ▼

  Notification Engine

          │

      Redis Queue

          │

          ▼

      Worker Services

          │

  ┌────────┼────────┬─────────┐
  │        │        │
  ▼        ▼        ▼

Email     SMS    WhatsApp

          │

          ▼

External Providers
```

Core architectural principles:

- Event-driven communication
- Queue-based processing
- Provider abstraction
- Stateless API
- Horizontal scalability
- Dockerized deployment
- RESTful APIs
- Modular architecture

---

# Tech Stack

## Backend

- Python 3.12
- FastAPI
- SQLAlchemy 2.0
- Alembic
- PostgreSQL
- Redis
- Celery
- Pydantic v2
- PyJWT / python-jose
- passlib (bcrypt)
- httpx
- structlog
- prometheus-client

## Frontend

- React 19
- Vite 8
- TypeScript ~6.0
- TanStack Table
- React Router v6
- shadcn/ui + Tailwind CSS

## Infrastructure

- Docker
- Docker Compose
- Nginx (reverse proxy)
- PostgreSQL 17
- Redis 7

## Monitoring

- Prometheus metrics endpoint at `/metrics`
- Grafana (planned)
- OpenAPI documentation at `/docs`

---

# Requirements

Before running the project ensure the following are installed:

- Docker Desktop or Docker Engine
- Docker Compose
- Git

Recommended:

- Visual Studio Code
- Bruno or Postman
- DBeaver (Database Management)

---

# Installation

Clone the repository.

```bash
git clone https://github.com/Herman-Gathege/notifications_pipeline_system
cd notification-platform
```

Copy the example environment file.

```bash
cp .env.example .env
```

Update environment variables as needed.

---

# Running Locally

## Quick Start

Build and start all services:

```bash
docker compose up --build
```

Run in detached mode:

```bash
docker compose up -d
```

strt docker:

```bash
sudo systemctl start docker
```

Stop services:

```bash
docker compose down
```

Rebuild containers:

```bash
docker compose up --build --force-recreate
```

## Service Endpoints

| Service | URL |
|---------|-----|
| API | http://localhost:8001 |
| Frontend | http://localhost:5173 |
| Nginx | http://localhost:80 |
| Swagger Docs | http://localhost:80/docs |
| Prometheus Metrics | http://localhost:80/metrics |

## Default Admin Credentials

After the initial database migration, the admin account is seeded automatically using values from `.env`:

```bash
# .env
INITIAL_ADMIN_EMAIL=admin@notification-platform
INITIAL_ADMIN_PASSWORD=admin123
```

Login at `http://localhost:80` or call the API directly:

```bash
curl -X POST http://localhost:80/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@notification-platform","password":"admin123"}'
```

## Database Access

```bash
docker compose exec notification-postgres psql -U postgres -d notification_platform
```

## Running Tests

```bash
docker compose exec notification-api python -m pytest tests/ -v
```

## Viewing Logs

```bash
docker compose logs -f
docker compose logs -f notification-api
docker compose logs -f notification-worker
```

---

# Docker

The platform is fully containerized.

Current services include:

| Service | Purpose |
|----------|---------|
| nginx | Reverse Proxy |
| api | FastAPI Backend |
| frontend | React (Vite) Frontend |
| postgres | PostgreSQL Database |
| redis | Queue Broker |
| worker | Celery Background Worker |

Future services:

- Scheduler
- Grafana
- Mailhog

> **Note:** `docker-compose.dev.yml`, `docker-compose.prod.yml`, and `Makefile` are currently empty placeholders.

---

# Folder Structure

```text
notification-platform/

├── backend/
├── frontend/
├── docker/
├── docs/
├── scripts/
├── .github/
├── docker-compose.yml
├── docker-compose.dev.yml  # empty placeholder
├── docker-compose.prod.yml # empty placeholder

├── .env
├── .env.example

├── README.md
├── Makefile                # empty placeholder
└── .gitignore
```

---

# Contributing

We follow a feature branch workflow.

1. Create a feature branch.

```bash
git checkout develop

git pull

git checkout -b feature/<feature-name>
```

Example:

```bash
git checkout -b feature/sprint-1-project-foundation
```

2. Commit using conventional commits.

Examples:

```text
feat: add application model

fix: resolve docker networking issue

docs: update README

refactor: simplify notification service

test: add event endpoint tests
```

3. Push your branch.

```bash
git push origin feature/<feature-name>
```

4. Open a Pull Request targeting the `develop` branch.

5. Request a code review.

6. Merge only after approval.

---

# Branch Strategy

The project follows a Git Flow-inspired branching strategy.

```text
main
│
└── develop
    │
    ├── feature/sprint-1-project-foundation
    ├── feature/application-auth
    ├── feature/event-processing
    ├── feature/templates
    ├── feature/sprint-5-provider-integrations
    ├── feature/sprint-6-monitoring
    └── feature/admin-dashboard
```

## Branches

### main

- Production-ready code only
- Protected branch
- Tagged releases

### develop

- Integration branch
- Default development branch

### feature/*

Used for individual features or sprint tasks.

### hotfix/*

Production fixes.

---

# License

This project is proprietary and intended for internal organizational use unless otherwise specified.

---

# Maintainers

FikaTu Team

Version: 1.0.0
