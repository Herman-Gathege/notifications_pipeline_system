# System Architecture Diagram

```mermaid
flowchart LR

Client[Client Application]

Frontend[React Dashboard]

API[FastAPI API]

Worker[Notification Worker]

Redis[(Redis Queue)]

Postgres[(PostgreSQL)]

Email[Email Provider]

SMS[SMS Provider]

Push[Push Provider]

Client --> API

Frontend --> API

API --> Postgres

API --> Redis

Redis --> Worker

Worker --> Email

Worker --> SMS

Worker --> Push

Worker --> Postgres