# Sequence Diagrams

This document contains the major request lifecycles implemented in the platform.

---

# Application Registration

```text
Client
  |
  | POST /applications
  |
API
  |
  | Validate Request
  |
Application Service
  |
  | Check duplicate name
  |
Application Repository
  |
Database
  |
  | Insert Application
  |
Application Service
  |
API Key Service
  |
  | Generate API Key
  |
API Key Repository
  |
Database
  |
  | Insert API Key
  |
API
  |
Client
```

---

# Retrieve Applications

```text
Client
  |
GET /applications
  |
API
  |
Application Service
  |
Repository
  |
Database
  |
Return Applications
```

---

# Update Application

```text
Client
  |
PATCH /applications/{id}
  |
API
  |
Application Service
  |
Repository
  |
Database
  |
Return Updated Application
```

---

# Delete Application

```text
Client
  |
DELETE /applications/{id}
  |
API
  |
Application Service
  |
Repository
  |
Database
```

---

Future diagrams

Sprint 3

Notification Request

Authentication Flow

Provider Selection

Worker Queue

Retry Logic

Webhook Delivery

Delivery Tracking

Audit Logging