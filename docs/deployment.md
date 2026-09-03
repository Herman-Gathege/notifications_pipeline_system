# Deployment

## Overview

FikaTu is deployed as a set of Docker containers orchestrated by Docker Compose.

## Services

| Service | Image | Purpose |
|---------|-------|---------|
| `notification-nginx` | custom | Reverse proxy, only exposed port |
| `notification-api` | custom | FastAPI backend |
| `notification-frontend` | custom | React frontend |
| `notification-postgres` | `postgres:17-alpine` | PostgreSQL database |
| `notification-redis` | `redis:7-alpine` | Celery broker / backend |
| `notification-worker` | custom | Celery worker |

## Running Locally

```bash
docker compose up --build
```

Access:
- Nginx: `http://localhost:80`
- Swagger: `http://localhost/docs`
- Metrics: `http://localhost/metrics`

## Environment Variables

See `docs/deployment/environment-variables.md` for the full list.

Key variables:
- `SECRET_KEY` — JWT signing key (required)
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `CELERY_BROKER_URL` — Redis URL for Celery
- `CELERY_RESULT_BACKEND` — Redis URL for Celery results
- `AFRICASTALKING_USERNAME` / `AFRICASTALKING_API_KEY` — SMS provider
- `RESEND_API_KEY` — Email provider

## Health Checks

### API

```bash
curl http://localhost/health
```

Expected:
```json
{
  "status": "healthy",
  "service": "fikatu",
  "version": "1.0.0"
}
```

### Worker

```bash
docker compose exec notification-worker \
  celery -A app.workers.worker.celery_app inspect ping
```

Expected:
```json
{"notification-worker@...": {"ok": "pong"}}
```

## Database Migrations

Migrations run automatically on API container startup via `entrypoint.sh`:

```bash
alembic upgrade head
```

## Production Considerations

- Do not expose database or Redis ports on the host
- Use strong `SECRET_KEY`
- Change default admin password after first deployment
- Use a secrets manager instead of `.env` files
- Configure log rotation (`json-file` with size limits in compose)
- Set appropriate CPU/memory limits
- Use HTTPS in front of Nginx

## Restart Behaviour

All services use `restart: unless-stopped`.

## Nginx Routing

- `/` → frontend static files
- `/api/` → FastAPI backend
- `/health` → API health
- `/docs`, `/openapi.json` → API docs
- `/metrics` → Prometheus metrics
