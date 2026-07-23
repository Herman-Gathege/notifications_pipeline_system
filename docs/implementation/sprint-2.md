# Sprint 2 – Application Management

## Sprint Goal

Implement application registration and lifecycle management.

This sprint introduces the concept of client applications.

Every external system that wants to send notifications must first register itself.

Each application receives:

- unique application id
- secret
- API Key
- active status

This becomes the identity of every future notification request.

---

# Features Delivered

## Application CRUD

Implemented endpoints

POST /applications

GET /applications

GET /applications/{id}

PATCH /applications/{id}

DELETE /applications/{id}

---

## API Key Generation

When an application is created the platform automatically generates

- secure secret
- secure API key

API keys are stored separately from the application.

One application can eventually own multiple API keys.

---

## Repository Layer

ApplicationRepository

Responsibilities

Create

Read

Update

Delete

Search by name

Search by id

---

APIKeyRepository

Responsibilities

Store generated keys

Retrieve keys

Support future key rotation

---

## Service Layer

ApplicationService

Business rules

No duplicate application names

Generate secret

Generate API Key

Create application

Update application

Delete application

---

APIKeyService

Business rules

Generate cryptographically secure keys

Persist API keys

Support future rotation

---

## Response Serialization

Application responses return

```json
{
  "id": "...",
  "name": "...",
  "api_key": "...",
  "secret": "...",
  "status": "active",
  "created_at": "...",
  "updated_at": "..."
}
```

---

## Validation

Duplicate application names rejected.

404 returned for missing resources.

PATCH supports partial updates.

DELETE returns HTTP 204.

---

## Testing

Endpoints tested using curl.

Verified

Create

Read One

Read All

Update

Delete

Duplicate protection

Response serialization

Database persistence

---

## Database Tables

applications

api_keys

Relationship

Application

↓

API Keys

One-to-many

---

## Important Fixes

### UUID mismatch

Initial implementation stored IDs as VARCHAR while repository queried UUID objects.

Repository adjusted to work correctly with database schema.

---

### API Key serialization

Applications without API keys caused response validation failures.

Serializer updated to safely handle missing relationships.

---

### Orphan records

Legacy records without API keys caused failures during list endpoint testing.

Database cleaned.

---

## Current Status

Completed

Application CRUD

API Key generation

Repository layer

Service layer

API endpoints

Validation

Documentation

Integration testing

---

## Remaining Work

Sprint 3

Notification creation

Notification model

Redis queue

Celery worker

Provider abstraction

Delivery pipeline