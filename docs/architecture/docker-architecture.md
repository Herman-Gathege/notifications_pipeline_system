# Step 9: Docker Compose Services

## Objective

The Notification Platform is fully containerized using Docker to provide a consistent development and deployment environment across all stages of the software lifecycle.

During Sprint 1, the goal is not to implement business functionality but to establish the infrastructure required to support future development.

Every developer should be able to clone the repository and start the complete platform using a single command:

```bash
docker compose up --build
```

Once running, all services should automatically discover and communicate with one another through an internal Docker network.

---

# Docker Architecture

The platform consists of six core services.

| Service | Purpose |
|----------|---------|
| frontend | React Admin Dashboard |
| api | FastAPI REST API |
| postgres | PostgreSQL Database |
| redis | Redis Queue Broker |
| worker | Background Worker (Celery Placeholder) |
| nginx | Reverse Proxy |

The architecture follows the diagram below.

```text
                     Browser
                        │
                        │
                localhost:80
                        │
                  ┌───────────┐
                  │   nginx   │
                  └─────┬─────┘
                        │
          ┌─────────────┴─────────────┐
          │                           │
          ▼                           ▼

   React Frontend              FastAPI Backend

                                      │
                          ┌───────────┴───────────┐
                          │                       │
                          ▼                       ▼

                    PostgreSQL                Redis
                                                   │
                                                   ▼

                                           Celery Worker
```

---

# Docker Network

All containers will communicate over a dedicated internal Docker bridge network.

Network Name

```text
notification-network
```

No service communicates using localhost.

Instead, Docker service names are used as hostnames.

Examples

| Service | Hostname |
|----------|----------|
| postgres | postgres |
| redis | redis |
| api | api |
| worker | worker |
| frontend | frontend |
| nginx | nginx |

Example

Instead of

```text
localhost:5432
```

the API connects using

```text
postgres:5432
```

Likewise,

Redis becomes

```text
redis:6379
```

This allows every container to locate other services regardless of the developer's machine.

---

# Docker Volumes

Persistent data should survive container restarts.

The following named volumes will be created.

| Volume | Purpose |
|---------|----------|
| postgres_data | PostgreSQL persistent storage |

Future volumes

| Volume | Purpose |
|---------|----------|
| redis_data | Optional Redis persistence |
| prometheus_data | Monitoring |
| grafana_data | Dashboards |

Using named volumes ensures database contents are retained even if containers are rebuilt.

---

# Service Responsibilities

## frontend

Container Name

```text
frontend
```

Responsibilities

- Hosts the React Admin Dashboard
- Communicates only with the API
- No direct database access
- Served behind Nginx

Development Port

```text
5173
```

---

## api

Container Name

```text
api
```

Responsibilities

- FastAPI application
- Authentication
- Event ingestion
- Business logic
- Queue publishing
- Database interaction
- API documentation

Development Port

```text
8000
```

Depends On

- postgres
- redis

---

## postgres

Container Name

```text
postgres
```

Responsibilities

- Primary relational database
- Stores application data
- Persists notification history
- Persists templates
- Persists provider configuration

Development Port

```text
5432
```

Uses

```text
postgres_data
```

---

## redis

Container Name

```text
redis
```

Responsibilities

- Queue broker
- Background job communication
- Temporary cache
- Worker messaging

Development Port

```text
6379
```

---

## worker

Container Name

```text
worker
```

Responsibilities

Sprint 1

- Placeholder only
- Starts successfully
- Connects to Redis
- Connects to API

Future Sprints

- Queue consumption
- Notification processing
- Provider execution
- Retry handling

Depends On

- redis
- api

---

## nginx

Container Name

```text
nginx
```

Responsibilities

- Reverse proxy
- Single entry point
- Static asset serving
- Route forwarding
- SSL termination (future)
- Compression
- Security headers

Development Port

```text
80
```

Routes

```text
/

↓

Frontend
```

```text
/api

↓

FastAPI
```

---

# Service Dependencies

The startup dependency graph should be as follows.

```text
postgres

redis

      │

      ▼

api

      │

      ▼

worker

frontend

      │

      ▼

nginx
```

This ensures infrastructure services are available before dependent application services start.

---

# Container Startup Verification

After running

```bash
docker compose up --build
```

the following containers should be running.

```text
✔ postgres

✔ redis

✔ api

✔ worker

✔ frontend

✔ nginx
```

Verify using

```bash
docker ps
```

---

# Connectivity Verification

Each service should be reachable from the Docker network.

Backend

```text
api
```

should successfully connect to

```text
postgres:5432
```

and

```text
redis:6379
```

Worker should successfully connect to

```text
redis:6379
```

Nginx should successfully proxy requests to

```text
frontend
```

and

```text
api
```

No service should reference localhost when communicating with another container.

---

# Sprint 1 Deliverables

Sprint 1 is complete when:

- Docker Compose starts all six services successfully.
- All containers join the `notification-network`.
- PostgreSQL uses the `postgres_data` named volume.
- The API can reach PostgreSQL and Redis.
- The Worker container starts without errors.
- Nginx successfully proxies frontend and backend traffic.
- The React application loads in a browser.
- The FastAPI application responds through Nginx.
- All services restart cleanly using:

```bash
docker compose down

docker compose up --build
```

At this point, the platform infrastructure is fully operational and ready for Sprint 2 (Core Platform & Authentication).