# Development

## Prerequisites

- Docker Desktop or Docker Engine
- Docker Compose
- Git
- Python 3.12 (for local backend development)
- Node.js 22 (for local frontend development)

## Project Structure

```
notification-platform/
├── backend/
│   ├── app/
│   │   ├── api/v1/       # Route handlers
│   │   ├── middleware/    # Auth, logging, request ID
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── repositories/ # Data access layer
│   │   ├── services/     # Business logic
│   │   ├── providers/    # Notification provider implementations
│   │   ├── workers/      # Celery workers
│   │   ├── events/       # Event payloads, registry, validator
│   │   ├── queues/       # Celery app configuration
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── config/       # Settings
│   │   ├── database/     # Session, base
│   │   └── monitoring/   # Prometheus metrics
│   ├── alembic/          # Database migrations
│   ├── tests/            # Backend tests
│   ├── Dockerfile
│   ├── entrypoint.sh
│   └── worker-entrypoint.sh
├── frontend/
│   ├── src/
│   │   ├── components/   # UI components and pages
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom hooks
│   │   └── lib/          # Utilities
│   ├── Dockerfile
│   └── package.json
├── docker/
│   ├── nginx/
│   ├── postgres/
│   └── redis/
├── docs/
├── docker-compose.yml
└── .env.example
```

## Running Tests

### Backend

```bash
docker compose exec notification-api python -m pytest tests/ -v
```

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

## Coding Conventions

- **Branching**: Git Flow — `main`, `develop`, `feature/*`, `hotfix/*`
- **Commits**: Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)
- **PRs**: Target `develop`, require review before merge
- **Python**: PEP 8, type hints preferred
- **TypeScript**: Strict mode, ESLint enforced

## Database Migrations

```bash
# Generate a new migration
docker compose exec notification-api alembic revision --autogenerate -m "description"

# Apply migrations
docker compose exec notification-api alembic upgrade head
```

## Adding a New Event Type

1. Add a Pydantic payload schema in `backend/app/events/registry.py`
2. Register it in `EVENT_REGISTRY`
3. Create a template for the event type + channel via the API or dashboard
4. Document the event in `docs/event-catalogue.md`

## Adding a New Provider

1. Create a provider class in `backend/app/providers/` implementing `NotificationProvider`
2. Register it in `ProviderResolver.resolve()`
3. Add environment variables in `.env.example`
4. Document in `docs/providers.md`

## Logs

```bash
docker compose logs -f
docker compose logs -f notification-api
docker compose logs -f notification-worker
```
