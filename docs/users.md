# Users

## Overview

Users are human operators who log into the FikaTu dashboard or consume management APIs.

## Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `email` | string | Unique, indexed |
| `hashed_password` | string | bcrypt hash |
| `name` | string | Display name |
| `role` | string | `admin` or `user` |
| `is_active` | boolean | Account active flag |
| `created_at` | timestamp | Creation time |
| `updated_at` | timestamp | Last update |

## API Endpoints

### List Users

`GET /api/v1/users`

Requires: `admin`

Response: array of `UserResponse`

### Get Current User

`GET /api/v1/users/me`

Requires: authenticated user

Response: `UserResponse`

### Get User by ID

`GET /api/v1/users/{user_id}`

Requires: `admin`

Response: `UserResponse`

### Create User

`POST /api/v1/users`

Requires: `admin`

Request:
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "name": "New User",
  "role": "user",
  "is_active": true
}
```

Response: `UserResponse`

### Update User

`PATCH /api/v1/users/{user_id}`

Requires: `admin`

Request:
```json
{
  "name": "Updated Name",
  "role": "admin",
  "is_active": false
}
```

Response: `UserResponse`

### Reset Password

`POST /api/v1/users/{user_id}/reset-password`

Requires: `admin`

Request:
```json
{
  "password": "NewSecurePass123!"
}
```

Response: 204 No Content

### Delete User

`DELETE /api/v1/users/{user_id}`

Requires: `admin`

Response: 204 No Content

## Self-Modification Restrictions

- Users cannot change their own role
- Users cannot deactivate their own account
- Users cannot delete their own account

## Password Policy

- Minimum length: 8 characters
- Maximum length: 128 characters
- Hashed with bcrypt before storage
- Never returned in API responses
