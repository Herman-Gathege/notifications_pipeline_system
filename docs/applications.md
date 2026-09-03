# Applications

## Overview

Applications are internal systems registered with FikaTu. Each application receives credentials used to authenticate machine-to-machine API requests.

## Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `name` | string | Unique application name |
| `secret` | string | Shared secret for token generation |
| `status` | boolean | Active / inactive |
| `owner_id` | UUID | Foreign key to `users.id` |
| `created_at` | timestamp | Creation time |
| `updated_at` | timestamp | Last update |

## API Key Model

Each application has one or more API keys:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `application_id` | UUID | Foreign key to `applications.id` |
| `token` | string | Random API key token |
| `expires_at` | timestamp | Optional expiry |
| `last_used` | timestamp | Last authentication time |
| `is_active` | boolean | Key active flag |
| `created_at` | timestamp | Creation time |

## API Endpoints

### Create Application

`POST /api/v1/applications`

Requires: authenticated user

Request:
```json
{
  "name": "E-Files"
}
```

Response (201):
```json
{
  "id": "<uuid>",
  "name": "E-Files",
  "api_key": "<api_key_token>",
  "secret": "<application_secret>",
  "status": "active",
  "created_at": "...",
  "updated_at": "..."
}
```

**Important**: The `api_key` and `secret` are returned only on creation. Store them securely; they are not retrievable later.

### List Applications

`GET /api/v1/applications`

Requires: authenticated user

- Admins see all applications
- Regular users see only their own applications

Response: array of `ApplicationResponse` (without `api_key` or `secret`)

### Get Application

`GET /api/v1/applications/{application_id}`

Requires: authenticated user (owner or admin)

Response: `ApplicationResponse`

### Update Application

`PATCH /api/v1/applications/{application_id}`

Requires: owner or admin

Request:
```json
{
  "name": "E-Files Production",
  "status": false
}
```

Response: `ApplicationResponse`

### Delete Application

`DELETE /api/v1/applications/{application_id}`

Requires: owner or admin

Response: 204 No Content

## Authentication Flow

1. Application is created by a human user
2. FikaTu generates a random `secret` (64 hex chars)
3. FikaTu generates an `api_key` token (64 hex chars)
4. To obtain a JWT, the application calls:
   `POST /api/v1/auth/token` with `api_key` and `secret`
5. FikaTu validates the API key + secret pair
6. Returns a JWT valid for 24 hours

## Ownership

- Every application has an `owner_id` referencing the user who created it
- Only the owner or an admin can view, update, or delete the application
- Deleting a user sets `owner_id` to NULL on their applications

## Security Notes

- API keys expire after 365 days (configurable in `APIKeyService`)
- `last_used` is updated on every successful token generation
- Inactive API keys or expired keys are rejected
- Application secrets are stored as plaintext (current implementation)
