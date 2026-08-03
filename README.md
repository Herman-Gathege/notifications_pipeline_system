# Centralized Notification Platform

A scalable, provider-agnostic, event-driven notification platform designed to centralize communication services across multiple applications.

The platform enables client applications to publish events while delegating notification processing, routing, delivery, retries, logging, and monitoring to a dedicated service.

---

# Project Overview

The Centralized Notification Platform serves as the single communication gateway for all applications within the ecosystem.

Instead of individual applications implementing their own Email, SMS, or WhatsApp integrations, they simply publish events to this platform.

The platform is responsible for:

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

- Email
- SMS

WhatsApp provider is planned. Future channels can easily be added without modifying existing business logic.

---

# Architecture

The platform follows an event-driven architecture.

```text
                Client Applications

 Rental Management
 CRM
 ERP
 HR
 School
 Hospital

          │
          │
          ▼

   Notification API

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
- SQLAlchemy
- Alembic
- PostgreSQL
- Redis
- Celery
- Pydantic
- PyJWT
- Uvicorn

## Frontend

- React
- Vite
- TypeScript

## Infrastructure

- Docker
- Docker Compose
- Nginx
- PostgreSQL
- Redis

## Monitoring

- Prometheus (metrics endpoint at `/metrics`)
- Grafana (planned)
- OpenTelemetry (planned)

---

# Requirements

Before running the project ensure the following are installed:

- Docker Desktop or Docker Engine
- Docker Compose
- Git

Recommended:

- Visual Studio Code
- Postman or Bruno
- DBeaver (Database Management)

---

# Installation

Clone the repository.

```bash
https://github.com/Herman-Gathege/notifications_pipeline_system
cd notification-platform
```

Copy the example environment file.

```bash
cp .env.example .env
```

Update environment variables as needed.

---

# Running Locally

Build and start all services.

```bash
docker compose up --build
```

Run in detached mode.

```bash
docker compose up -d
```

Stop services.

```bash
docker compose down
```

Rebuild containers.

```bash
docker compose up --build --force-recreate
```

start docker.

```bash
sudo systemctl start docker
docker exec -it notification-api bash
```

Check if port is open.

```bash
sudo lsof -i :5173
```

# Docker

The platform is fully containerized.

Current services include:

| Service | Purpose |
|----------|---------|
| nginx | Reverse Proxy |
| api | FastAPI Backend |
| frontend | React Starter (Vite) |
| postgres | PostgreSQL Database |
| redis | Queue Broker |
| worker | Background Worker |

Future services:

- Scheduler
- Grafana
- Mailhog

> **Note:** `docker-compose.dev.yml`, `docker-compose.prod.yml`, and `Makefile` are currently empty placeholders.

Start all containers.

```bash
docker compose up -d
docker compose exec notification-api bash
docker compose exec notification-postgres psql -U postgres -d notification_platform

docker compose exec notification-api bash
```

View running containers.

```bash
docker ps
```

View logs.

```bash
docker compose logs -f
```

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

> **Note:** `django` and `sendgrid` are listed in `requirements/base.txt` but are not currently used in the codebase.

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
├── feature/admin-dashboard
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

Example:

```text
feature/sprint-3-events

feature/provider-routing

feature/whatsapp-provider
```

### hotfix/*

Production fixes.

Example:

```text
hotfix/fix-health-endpoint
```

---

# License

This project is proprietary and intended for internal organizational use unless otherwise specified.

---

# Maintainers

Notification Platform Team

Version: 1.0.0