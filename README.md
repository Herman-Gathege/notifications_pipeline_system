# FikaTu — Centralized Notification Platform

A scalable, provider-agnostic, event-driven notification platform designed to centralize communication services across multiple internal applications.

## What FikaTu Does

Instead of individual applications implementing their own Email, SMS, or WhatsApp integrations, they simply publish events to this platform. FikaTu handles:

- Event validation
- Template rendering
- Provider selection
- Asynchronous delivery
- Retry logic
- Status tracking
- Monitoring and reporting

## Current Status

- ✅ End-to-end SMS pipeline verified with Africa's Talking Sandbox
- ✅ Email (Resend, SMTP) implemented
- ✅ Authentication and user management operational
- ✅ Frontend dashboard with Tailwind + shadcn/ui
- ✅ Celery worker with Redis queue
- ✅ Prometheus metrics exposed

## Tech Stack

### Backend
- Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic
- PostgreSQL 17, Redis 7, Celery 5.5
- Pydantic v2, python-jose, passlib (bcrypt)
- httpx, structlog, prometheus-client

### Frontend
- React 19, Vite 8, TypeScript ~6.0
- shadcn/ui, Tailwind CSS v4
- React Router v7, TanStack Table, Axios

### Infrastructure
- Docker, Docker Compose, Nginx

## Quick Start

```bash
# Clone the repository
git clone https://github.com/Herman-Gathege/notifications_pipeline_system
cd notification-platform

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start all services
docker compose up --build
```

## Service Endpoints

| Service | URL |
|---------|-----|
| Application | http://localhost:80 |
| Swagger Docs | http://localhost/docs |
| Prometheus Metrics | http://localhost/metrics |

## Default Admin Credentials

After initial migration, the admin account is seeded automatically:

- Email: `admin@notification-platform`
- Password: `admin123`

**Change this password immediately after first deployment.**

## Documentation

- [Architecture](docs/architecture.md)
- [Authentication](docs/authentication.md)
- [Users](docs/users.md)
- [Applications](docs/applications.md)
- [Events](docs/events.md)
- [Templates](docs/templates.md)
- [Notifications](docs/notifications.md)
- [Providers](docs/providers.md)
- [Integrations](docs/integrations.md)
- [Deployment](docs/deployment.md)
- [Development](docs/development.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Event Catalogue](docs/event-catalogue.md)

## Project Structure

```
notification-platform/
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── api/v1/       # Route handlers
│   │   ├── middleware/   # Auth, logging, request ID
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── repositories/ # Data access layer
│   │   ├── services/     # Business logic
│   │   ├── providers/    # Notification providers
│   │   ├── workers/      # Celery workers
│   │   ├── events/       # Event registry and validation
│   │   ├── queues/       # Celery configuration
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── config/       # Settings
│   │   ├── database/     # Session, base
│   │   └── monitoring/   # Prometheus metrics
│   ├── alembic/          # Migrations
│   ├── tests/            # Backend tests
│   ├── Dockerfile
│   ├── entrypoint.sh
│   └── worker-entrypoint.sh
├── frontend/             # React + Vite + TypeScript
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── docker/               # Nginx, PostgreSQL, Redis configs
├── docs/                 # Documentation
├── docker-compose.yml
├── .env.example
└── README.md
```

## Running Tests

```bash
# Backend
docker compose exec notification-api python -m pytest tests/ -v

# Frontend
cd frontend && npm run lint && npm run build
```

## Contributing

We follow a feature branch workflow:

1. Create a feature branch from `develop`
2. Commit using conventional commits
3. Open a Pull Request targeting `develop`
4. Request review
5. Merge after approval

## License

This project is proprietary and intended for internal organizational use.
