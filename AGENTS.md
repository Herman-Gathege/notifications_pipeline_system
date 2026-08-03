# Agent Instructions — Notification Platform

## Project Overview

Centralized Notification Platform — an event-driven, provider-agnostic notification routing and delivery system.

- **Backend**: FastAPI (Python 3.12) with Celery, SQLAlchemy, PostgreSQL, Redis
- **Frontend**: React + Vite + TypeScript (still a starter template)
- **Infrastructure**: Docker + Docker Compose + Nginx

## Repository Layout

```
notification-platform/
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── api/v1/       # Route handlers (auth, events, notifications, providers, templates, reports, monitoring, applications)
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── services/     # Business logic
│   │   ├── repositories/ # Data access layer
│   │   ├── providers/    # Notification provider implementations (email, sms, whatsapp)
│   │   ├── workers/      # Celery workers
│   │   ├── middleware/   # Auth, logging, request ID
│   │   ├── config/       # Settings (pydantic-settings)
│   │   ├── events/       # Event payloads, registry, validator
│   │   ├── queues/       # Celery app configuration
│   │   ├── schemas/      # Pydantic schemas
│   │   └── database/     # Session, base
│   ├── alembic/          # Migrations
│   ├── requirements/     # base.txt
│   ├── Dockerfile
│   ├── entrypoint.sh
│   └── worker-entrypoint.sh
├── frontend/             # React + Vite + TypeScript
│   ├── src/              # Minimal starter (App.tsx, main.tsx, index.css)
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── docker/               # Nginx, PostgreSQL, Redis, Worker configs
├── docs/                 # Architecture, ADRs, deployment, sprint docs
├── .github/              # PR template
├── scripts/              # Empty
├── docker-compose.yml    # Full multi-service compose
├── docker-compose.dev.yml  # EMPTY — placeholder
├── docker-compose.prod.yml # EMPTY — placeholder
├── Makefile              # EMPTY — placeholder
├── .env                  # Local environment (gitignored)
└── .env.example          # Template for environment variables
```

## Tech Stack

### Backend
- Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic
- PostgreSQL, Redis (Celery broker/backend)
- Pydantic v2, python-jose (JWT), passlib (bcrypt)
- httpx for HTTP calls, structlog for logging
- prometheus-client for metrics
- Providers: Resend (email), SMTP (email), Africa's Talking (SMS), WhatsApp (stub)

### Frontend
- React 19, Vite 8, TypeScript ~6.0
- ESLint + TypeScript-ESLint
- No CSS framework or state management installed yet (despite README mentioning Tailwind, Zustand, TanStack Query)

### Infrastructure
- Docker, Docker Compose, Nginx (reverse proxy)
- PostgreSQL 17, Redis 7

## Key Conventions

- **Branching**: Git Flow — `main`, `develop`, `feature/*`, `hotfix/*`
- **Commits**: Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)
- **PRs**: Target `develop`, require review before merge
- **Config**: Environment variables via `.env` file, `pydantic-settings` with `extra="ignore"`
- **Database**: SQLAlchemy declarative base at `app.database.base.Base`
- **Celery**: Tasks defined in `app/workers/notification_worker.py`, broker/backend via env vars
- **API versioning**: All routes under `/api/v1` prefix
- **Auth**: JWT Bearer token via `AuthenticationMiddleware`

## Running the Project

```bash
docker compose up --build
```

Services:
- API: `http://localhost:8000` (or `BACKEND_PORT`)
- Frontend: `http://localhost:5173` (or `FRONTEND_PORT`)
- Nginx: `http://localhost:80` (or `NGINX_PORT`)
- Swagger: `http://localhost/docs`

## Testing

- Backend tests in `backend/tests/` (test_providers.py, test_templates.py)
- Standalone test scripts at `backend/test_africastalking.py` and `backend/test_sendgrid.py`
- Uses `pytest` + `pytest-asyncio`

## Important Notes

- `docker-compose.dev.yml` and `docker-compose.prod.yml` are empty placeholders — not yet configured
- `Makefile` is empty — not yet configured
- `pyproject.toml` is empty — not yet configured
- WhatsApp provider file (`app/providers/whatsapp/whatsapp_provider.py`) does not exist yet
- Frontend is a blank Vite template — no application code, no CSS framework, no state management
- `requirements.txt` at backend root points to `requirements/base.txt` for actual dependencies
- `django` and `sendgrid` are listed in `requirements/base.txt` but are not used in the codebase