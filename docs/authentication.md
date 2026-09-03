# Authentication

## Overview

FikaTu uses two distinct authentication mechanisms:

1. **User authentication** — for human operators (admins, staff) accessing the dashboard or management APIs.
2. **Application authentication** — for internal systems publishing events via the API.

Both use JWT HS256 tokens signed with the platform `SECRET_KEY`.

## User Authentication

### Login

`POST /api/v1/auth/login`

Request:
```json
{
  "email": "admin@notification-platform",
  "password": "admin123"
}
```

Response:
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": {
    "id": "<uuid>",
    "email": "admin@notification-platform",
    "name": "Admin User",
    "role": "admin",
    "is_active": true,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

### Register

`POST /api/v1/auth/register`

Creates a new user and returns a token in the same shape as login.

### Get Current User

`GET /api/v1/auth/me`

Requires `Authorization: Bearer <user_token>`.

Returns the current user profile.

### Logout

`POST /api/v1/auth/logout`

**Current behaviour**: Stateless. FikaTu JWTs are self-contained and signed. There is no server-side revocation list. The endpoint returns a success message; clients must discard the stored token locally.

### Token Structure

User tokens contain:
```json
{
  "sub": "<user_id>",
  "type": "user",
  "role": "admin|user",
  "email": "user@example.com",
  "exp": 1756900000
}
```

Expiry: 24 hours.

## Application Authentication

### Obtain Token

`POST /api/v1/auth/token`

Request:
```json
{
  "api_key": "<application_api_key>",
  "secret": "<application_secret>"
}
```

Response:
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

### Validate Token

`POST /api/v1/auth/validate`

Request:
```json
{
  "token": "<jwt>"
}
```

Response:
```json
{
  "valid": true,
  "application_id": "<uuid>"
}
```

### Token Structure

Application tokens contain:
```json
{
  "sub": "<application_id>",
  "app": "Application Name",
  "type": "application",
  "exp": 1756900000
}
```

Expiry: 24 hours.

## Middleware

`AuthenticationMiddleware` (`app/middleware/authentication.py`) runs on every request.

Public paths (no auth required):
- `/`
- `/health`
- `/api/v1/health`
- `/metrics`
- `/docs`
- `/redoc`
- `/openapi.json`
- `/api/v1/auth/token`
- `/api/v1/auth/login`
- `/api/v1/auth/register`
- `/api/v1/auth/validate`
- `/api/v1/auth/logout`

All other paths require a valid `Authorization: Bearer <token>` header.

## 401 / 403 Behaviour

| Scenario | Status | Detail |
|----------|--------|--------|
| Missing `Authorization` header | 401 | `Missing Authorization header` |
| Wrong scheme (not `Bearer`) | 401 | `Authorization scheme must be Bearer` |
| Invalid / expired JWT | 401 | `The provided token is invalid or has expired. Please obtain a new token.` |
| Inactive user | 403 | `Inactive user.` |
| Non-admin accessing admin endpoint | 403 | `Admin access required.` |

## RBAC

| Role | Capabilities |
|------|-------------|
| `admin` | Full access to all users, applications, events, notifications, templates, providers, reports, monitoring |
| `user` | Own applications, own events, own notifications, templates (read), providers (read), reports (own), monitoring (own) |

## Password Handling

- Passwords hashed with bcrypt (`passlib`)
- Minimum length: 8 characters
- Hashed passwords never exposed in API responses
- Admin bootstrap: seeded via Alembic migration using `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`

## Security Considerations

- `SECRET_KEY` must be a strong random string in production
- Tokens are stored in browser `localStorage` on the frontend
- No refresh tokens or token revocation currently implemented
- CORS origins configured via `CORS_ORIGINS` in settings
