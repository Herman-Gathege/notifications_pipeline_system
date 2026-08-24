# API Design

## Overview

The Notification Platform exposes a RESTful HTTP API that allows:

- Human operators to authenticate and manage the platform
- External systems to register applications
- Client applications to authenticate using API Keys
- Submit notifications
- Manage templates
- Track delivery status
- Retrieve analytics

The API follows predictable REST conventions, JSON payloads, and versioned endpoints to ensure long-term compatibility.

---

# Base URL

Development

```
http://localhost:8001/api/v1
```

Production

```
https://api.notification-platform.com/api/v1
```

---

# Versioning Strategy

The platform uses URL-based versioning.

Example

```
/api/v1
```

Future versions

```
/api/v2

/api/v3
```

This allows new functionality without breaking existing integrations.

---

# Content Type

All requests and responses use JSON.

Request

```
Content-Type: application/json
```

Response

```
Content-Type: application/json
```

---

# Authentication

The platform supports two distinct authentication methods.

## Human User Authentication (JWT)

Human operators authenticate with email and password.

Request

```
POST /api/v1/auth/login
```

Request Body

```json
{
  "email": "admin@example.com",
  "password": "secure-password"
}
```

Response

```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin",
    "role": "admin"
  }
}
```

Usage

```
Authorization: Bearer eyJ...
```

## Machine / Application Authentication (API Key)

Client applications authenticate with an API Key and Secret.

Request

```
POST /api/v1/auth/token
```

Request Body

```json
{
  "api_key": "generated_key",
  "secret": "generated_secret"
}
```

Response

```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

Usage

```
Authorization: Bearer eyJ...
```

---

# Token Types

The platform uses typed JWTs to distinguish between human and machine identities.

## User JWT Claims

```json
{
  "sub": "user-uuid",
  "type": "user",
  "role": "admin",
  "email": "admin@example.com",
  "exp": 1234567890
}
```

## Application JWT Claims

```json
{
  "sub": "application-uuid",
  "app": "Payment Service",
  "type": "application",
  "exp": 1234567890
}
```

Security Note: The two token types are validated by separate FastAPI dependencies. A user JWT cannot be used to access machine-only endpoints, and an application JWT cannot be used to access user-only endpoints.

---

# Authorization / RBAC

| Role | Permissions |
|------|-------------|
| `admin` | Full access to all resources. Can manage users and view all applications. |
| `user` | Can manage own applications. Cannot access user management endpoints. |

---

# Resource Structure

Current Resources

```
Users
Applications
API Keys
```

Future Resources

```
Notifications
Templates
Providers
Analytics
Health
Audit Logs
```

---

# Users API

## Register User

```
POST /api/v1/auth/register
```

Request

```json
{
  "email": "admin@example.com",
  "password": "secure-password",
  "name": "Admin User"
}
```

Successful Response

```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "user"
  }
}
```

Status Code

```
201 Created
```

Notes

- Newly registered users default to role `user`.
- Registration cannot assign the `admin` role.

---

## Login

```
POST /api/v1/auth/login
```

Request

```json
{
  "email": "admin@example.com",
  "password": "secure-password"
}
```

Response

```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

Status Code

```
200 OK
```

---

## Get Current User

```
GET /api/v1/users/me
```

Response

```json
{
  "id": "uuid",
  "email": "admin@example.com",
  "name": "Admin User",
  "role": "admin",
  "is_active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

Status Code

```
200 OK
```

---

## List Users (Admin Only)

```
GET /api/v1/users
```

Response

```json
[
  {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin",
    "is_active": true
  }
]
```

Status Code

```
200 OK
```

---

## Get User (Admin Only)

```
GET /api/v1/users/{user_id}
```

Response

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "role": "user",
  "is_active": true
}
```

Status Codes

```
200 OK

404 Not Found
```

---

## Update User (Admin Only)

```
PATCH /api/v1/users/{user_id}
```

Request

```json
{
  "name": "New Name",
  "role": "admin",
  "is_active": false
}
```

Response

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "New Name",
  "role": "admin",
  "is_active": false
}
```

Status Codes

```
200 OK

404 Not Found
```

---

## Delete User (Admin Only)

```
DELETE /api/v1/users/{user_id}
```

Response

```
204 No Content
```

Status Codes

```
204 No Content

400 Bad Request (cannot delete self)

404 Not Found
```

---

# Applications API

Purpose

Registers client systems that will use the notification platform.

Applications are now owned by human users and require user authentication.

---

## Create Application

```
POST /api/v1/applications
```

Headers

```
Authorization: Bearer <user_jwt>
```

Request

```json
{
  "name": "Payment Service"
}
```

Successful Response

```json
{
  "id": "uuid",
  "name": "Payment Service",
  "api_key": "generated_key",
  "secret": "generated_secret",
  "status": "active",
  "owner_id": "user-uuid",
  "created_at": "...",
  "updated_at": "..."
}
```

Status Code

```
201 Created
```

Notes

- `owner_id` is set automatically from the authenticated user.
- The API key and secret are generated automatically.

---

## List Applications

```
GET /api/v1/applications
```

Headers

```
Authorization: Bearer <user_jwt>
```

Response (Admin)

```json
[
  {
    "id": "uuid",
    "name": "Payment Service",
    "api_key": "...",
    "secret": "...",
    "status": "active",
    "owner_id": "user-uuid"
  }
]
```

Response (Normal User — own applications only)

```json
[
  {
    "id": "uuid",
    "name": "My App",
    "api_key": "...",
    "secret": "...",
    "status": "active",
    "owner_id": "user-uuid"
  }
]
```

Status Code

```
200 OK
```

---

## Get Application

```
GET /api/v1/applications/{application_id}
```

Headers

```
Authorization: Bearer <user_jwt>
```

Response

```json
{
  "id": "uuid",
  "name": "Payment Service",
  "api_key": "...",
  "secret": "...",
  "status": "active",
  "owner_id": "user-uuid"
}
```

Status Codes

```
200 OK

404 Not Found

403 Forbidden (not owner and not admin)
```

---

## Update Application

```
PATCH /api/v1/applications/{application_id}
```

Headers

```
Authorization: Bearer <user_jwt>
```

Request

```json
{
  "name": "Payment Service Updated"
}
```

Response

```json
{
  "id": "uuid",
  "name": "Payment Service Updated",
  "api_key": "...",
  "secret": "...",
  "status": "active",
  "owner_id": "user-uuid"
}
```

Status Codes

```
200 OK

404 Not Found

403 Forbidden (not owner and not admin)
```

---

## Delete Application

```
DELETE /api/v1/applications/{application_id}
```

Headers

```
Authorization: Bearer <user_jwt>
```

Response

```
204 No Content
```

Status Codes

```
204 No Content

404 Not Found

403 Forbidden (not owner and not admin)
```

---

# API Keys

Current Status

Automatically generated during application creation.

Current Flow

```
Create Application

↓

Generate Secret

↓

Generate API Key

↓

Store API Key

↓

Return Credentials
```

Future Endpoints

```
POST /applications/{id}/keys

GET /applications/{id}/keys

DELETE /applications/{id}/keys/{key_id}

POST /applications/{id}/keys/rotate
```

These endpoints will support secure key rotation without requiring a new application.

---

# Notifications API (Planned)

Purpose

Accept notification requests from registered applications.

Endpoint

```
POST /notifications
```

Example

```json
{
  "channel": "email",
  "recipient": "user@example.com",
  "subject": "Welcome",
  "message": "Welcome to our platform."
}
```

Response

```json
{
  "id": "uuid",
  "status": "queued"
}
```

---

# Scheduled Notifications

Future endpoint

```
POST /notifications/scheduled
```

Example

```json
{
  "recipient": "user@example.com",
  "message": "Meeting Reminder",
  "scheduled_at": "2026-08-01T08:00:00Z"
}
```

---

# Bulk Notifications

Future endpoint

```
POST /notifications/bulk
```

Example

```json
{
  "channel": "sms",
  "recipients": [
    "...",
    "...",
    "..."
  ],
  "message": "System Maintenance"
}
```

---

# Templates

Future endpoints

```
GET /templates

POST /templates

PATCH /templates/{id}

DELETE /templates/{id}
```

Example Template

```json
{
  "name": "Password Reset",
  "subject": "Reset Password",
  "body": "Hello {{name}}..."
}
```

---

# Provider Management

Future endpoints

```
GET /providers

POST /providers

PATCH /providers/{id}

DELETE /providers/{id}
```

These endpoints will configure providers such as SMTP, SendGrid, Twilio, Africa's Talking, and Firebase.

---

# Analytics

Future endpoints

```
GET /analytics

GET /analytics/daily

GET /analytics/providers

GET /analytics/applications
```

Example Response

```json
{
  "total_notifications": 12000,
  "delivered": 11800,
  "failed": 200,
  "success_rate": 98.3
}
```

---

# Health Endpoints

Current

```
GET /health
```

Example

```json
{
  "status": "healthy",
  "service": "notification-platform",
  "version": "1.0.0"
}
```

---

Root Endpoint

```
GET /
```

Example

```json
{
  "message": "Notification Platform API",
  "status": "running"
}
```

---

# HTTP Status Codes

| Code | Meaning |
|------|----------|
| 200 | Success |
| 201 | Created |
| 204 | Deleted Successfully |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 500 | Internal Server Error |

---

# Error Response Format

Example

```json
{
  "detail": "Application not found."
}
```

Validation Example

```json
{
  "detail": [
    {
      "loc": ["body", "name"],
      "msg": "Field required",
      "type": "missing"
    }
  ]
}
```

---

# Naming Conventions

Resources

```
users

applications

notifications

templates

providers
```

Fields

```
created_at

updated_at

application_id

notification_id
```

All field names use snake_case.

---

# Pagination (Future)

Endpoints returning large datasets will support pagination.

Example

```
GET /notifications?page=1&page_size=50
```

Response

```json
{
  "items": [...],
  "page": 1,
  "page_size": 50,
  "total": 420
}
```

---

# Filtering (Future)

Example

```
GET /notifications?status=failed

GET /notifications?channel=email

GET /notifications?application=payment-service
```

---

# Rate Limiting (Future)

The API will support request throttling.

Example

```
100 requests/minute
```

per API Key.

Exceeded requests return

```
429 Too Many Requests
```

---

# API Lifecycle

```
Client

↓

Authentication

↓

Validation

↓

Business Logic

↓

Repository

↓

Database

↓

Response
```

---

# Current Implementation Status

| Feature | Status |
|----------|--------|
| Health Endpoint | ✅ |
| Root Endpoint | ✅ |
| User Registration | ✅ |
| User Login | ✅ |
| User Profile | ✅ |
| User Management (Admin) | ✅ |
| Application CRUD | ✅ |
| API Key Generation | ✅ |
| Application Secrets | ✅ |
| Application Ownership | ✅ |
| Notification API | ⏳ |
| Templates API | ⏳ |
| Provider API | ⏳ |
| Analytics API | ⏳ |

---

# Summary

The Notification Platform API follows RESTful design principles with versioned endpoints, JSON payloads, and a clear separation between resources. The current implementation provides complete human authentication, role-based access control, and application ownership management, while the API structure is designed to grow naturally into a full notification platform supporting multiple channels, providers, templates, analytics, scheduling, and high-volume delivery.
