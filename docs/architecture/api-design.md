# API Design

## Overview

The Notification Platform exposes a RESTful HTTP API that allows external systems to:

- Register applications
- Authenticate using API Keys
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

Client applications authenticate using an API Key.

Request Header

```
Authorization: Bearer <API_KEY>
```

Example

```
Authorization: Bearer 67be61966c7f851ad0320...
```

Currently, authentication middleware is present in the project. Future notification endpoints will require valid API keys before processing requests.

---

# Resource Structure

Current Resources

```
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

# Applications API

Purpose

Registers client systems that will use the notification platform.

---

## Create Application

```
POST /applications
```

Request

```json
{
    "name":"Payment Service"
}
```

Successful Response

```json
{
    "id":"uuid",
    "name":"Payment Service",
    "api_key":"generated_key",
    "secret":"generated_secret",
    "status":"active",
    "created_at":"...",
    "updated_at":"..."
}
```

Status Code

```
201 Created
```

---

## List Applications

```
GET /applications
```

Response

```json
[
    {
        "id":"...",
        "name":"Payment Service",
        "api_key":"...",
        "secret":"...",
        "status":"active"
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
GET /applications/{application_id}
```

Response

```json
{
    "id":"...",
    "name":"Payment Service",
    "api_key":"...",
    "secret":"...",
    "status":"active"
}
```

Status Codes

```
200 OK

404 Not Found
```

---

## Update Application

```
PATCH /applications/{application_id}
```

Example

```json
{
    "name":"Payment Service Updated"
}
```

Response

```json
{
    "id":"...",
    "name":"Payment Service Updated",
    "api_key":"...",
    "secret":"...",
    "status":"active"
}
```

Status Codes

```
200 OK

404 Not Found
```

---

## Delete Application

```
DELETE /applications/{application_id}
```

Response

```
204 No Content
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
    "channel":"email",
    "recipient":"user@example.com",
    "subject":"Welcome",
    "message":"Welcome to our platform."
}
```

Response

```json
{
    "id":"uuid",
    "status":"queued"
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
    "recipient":"user@example.com",
    "message":"Meeting Reminder",
    "scheduled_at":"2026-08-01T08:00:00Z"
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
    "channel":"sms",
    "recipients":[
        "...",
        "...",
        "..."
    ],
    "message":"System Maintenance"
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
    "name":"Password Reset",
    "subject":"Reset Password",
    "body":"Hello {{name}}..."
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
    "total_notifications":12000,
    "delivered":11800,
    "failed":200,
    "success_rate":98.3
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
    "status":"healthy",
    "service":"notification-platform",
    "version":"1.0.0"
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
    "message":"Notification Platform API",
    "status":"running"
}
```

---

# HTTP Status Codes

| Code | Meaning |
|------|----------|
|200|Success|
|201|Created|
|204|Deleted Successfully|
|400|Bad Request|
|401|Unauthorized|
|403|Forbidden|
|404|Not Found|
|409|Conflict|
|422|Validation Error|
|500|Internal Server Error|

---

# Error Response Format

Example

```json
{
    "detail":"Application not found."
}
```

Validation Example

```json
{
    "detail":[
        {
            "loc":["body","name"],
            "msg":"Field required",
            "type":"missing"
        }
    ]
}
```

---

# Naming Conventions

Resources

```
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
    "items":[...],
    "page":1,
    "page_size":50,
    "total":420
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
|Health Endpoint|✅|
|Root Endpoint|✅|
|Application CRUD|✅|
|API Key Generation|✅|
|Application Secrets|✅|
|Notification API|⏳|
|Templates API|⏳|
|Provider API|⏳|
|Analytics API|⏳|

---

# Summary

The Notification Platform API follows RESTful design principles with versioned endpoints, JSON payloads, and a clear separation between resources. The current implementation provides a complete CRUD workflow for application registration and credential generation, while the API structure is designed to grow naturally into a full notification platform supporting multiple channels, providers, templates, analytics, scheduling, and high-volume delivery.