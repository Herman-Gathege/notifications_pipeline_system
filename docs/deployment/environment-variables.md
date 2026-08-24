# Environment Variables

## Overview

The Notification Platform uses environment variables for all configuration. This document describes each variable, its purpose, and whether it is required.

Variables are loaded from `.env` files by Docker Compose. Never commit secrets to version control.

---

# Application

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APP_NAME` | No | `notification-platform` | Application name |
| `APP_ENV` | No | `development` | Environment: `development` or `production` |
| `APP_VERSION` | No | `1.0.0` | Application version |
| `LOG_LEVEL` | No | `INFO` | Logging level |

---

# Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BACKEND_HOST` | No | `0.0.0.0` | Bind host |
| `BACKEND_PORT` | No | `8001` | Bind port (development) |
| `SECRET_KEY` | **Yes** | — | Secret key for JWT signing (user + application tokens) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `60` | User JWT expiration in minutes |

---

# Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FRONTEND_PORT` | No | `5173` | Frontend port (development) |
| `VITE_API_BASE_URL` | **Yes** | — | API base URL for frontend requests (e.g., `/api/v1` or `http://localhost:8001/api/v1`) |
| `VITE_API_URL` | No | — | Alias for `VITE_API_BASE_URL` (legacy) |
| `CORS_ORIGINS` | No | — | Allowed CORS origins (JSON array) |

Notes:

- In production with nginx, set `VITE_API_BASE_URL=/api/v1`.
- In development with separate ports, set `VITE_API_BASE_URL=http://localhost:8001/api/v1`.

---

# PostgreSQL

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `POSTGRES_HOST` | **Yes** | — | PostgreSQL host |
| `POSTGRES_PORT` | No | `5432` | PostgreSQL port |
| `POSTGRES_DB` | **Yes** | — | Database name |
| `POSTGRES_USER` | **Yes** | — | Database user |
| `POSTGRES_PASSWORD` | **Yes** | — | Database password |
| `DATABASE_URL` | **Yes** | — | SQLAlchemy database URL (e.g., `postgresql+psycopg://user:pass@host:5432/db`) |

---

# Redis

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_HOST` | **Yes** | — | Redis host |
| `REDIS_PORT` | No | `6379` | Redis port |
| `REDIS_URL` | **Yes** | — | Redis URL (e.g., `redis://host:6379/0`) |

---

# Celery / Worker

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CELERY_BROKER_URL` | **Yes** | — | Celery broker URL |
| `CELERY_RESULT_BACKEND` | **Yes** | — | Celery result backend URL |

---

# Nginx

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NGINX_PORT` | No | `80` | Host port for nginx |

---

# Email Providers

## Resend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RESEND_API_KEY` | No | — | Resend API key |
| `RESEND_FROM_EMAIL` | No | — | Sender email address |
| `RESEND_FROM_NAME` | No | — | Sender display name |

## SendGrid

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SENDGRID_API_KEY` | No | — | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | No | — | Sender email address |
| `SENDGRID_FROM_NAME` | No | — | Sender display name |

---

# SMS Providers

## Africa's Talking

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMS_PROVIDER` | No | — | SMS provider name (e.g., `africastalking`) |
| `AFRICASTALKING_USERNAME` | No | — | Africa's Talking username |
| `AFRICASTALKING_API_KEY` | No | — | Africa's Talking API key |
| `AFRICASTALKING_SENDER_ID` | No | — | Sender ID |

---

# WhatsApp

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WHATSAPP_PROVIDER` | No | — | WhatsApp provider name |
| `META_ACCESS_TOKEN` | No | — | Meta WhatsApp access token |

---

# Monitoring

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PROMETHEUS_PORT` | No | `9090` | Prometheus port |
| `GRAFANA_PORT` | No | `3000` | Grafana port |

---

# Security Notes

- `SECRET_KEY` must be a strong, randomly generated string. Rotate it carefully as it invalidates all existing JWTs.
- `POSTGRES_PASSWORD`, `RESEND_API_KEY`, `SENDGRID_API_KEY`, `AFRICASTALKING_API_KEY`, and `META_ACCESS_TOKEN` are secrets. Never commit them.
- The database migration seeds a default admin user (`admin@notification-platform` / `admin123`). Change this password immediately after first deployment.
- In production, consider using a secrets manager (e.g., Docker secrets, HashiCorp Vault) instead of plain `.env` files.

---

# Migration Notes

When deploying a new version:

1. Pull the latest code.
2. Run `docker compose down`.
3. Run `docker compose up --build -d`.
4. The `entrypoint.sh` script runs `alembic upgrade head` automatically.
5. Verify health: `curl http://localhost/health`.
6. Log in as admin and change the default password.
