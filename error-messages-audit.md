# Error Messages Audit — Backend

> **Scope:** All error messages returned to users via HTTP responses, JSON bodies, or worker result dicts in the `backend/app/` directory.
> **Date:** 2026-08-03

---

## Summary

| Category | Total Messages | Vague | Clear |
|----------|---------------|-------|-------|
| Authentication & Token | 5 | 4 | 1 |
| Not Found | 15 | 0 | 15 |
| Conflict / Already Exists | 2 | 0 | 2 |
| Unsupported / Not Configured | 6 | 1 | 5 |
| Provider Test | 2 | 0 | 2 |
| Worker Results | 3 | 0 | 3 |
| Passthrough (`str(exc)`) | 2 | 0 | 2 |
| **Totals** | **35** | **5** | **30** |

**5 vague messages** identified across 4 files, plus **1 missing message** (bare `raise ValueError()` with no text) and **punctuation inconsistencies** across all "not found" messages.

---

## Vague Error Messages

### 1. `"Invalid bearer token"` — `app/api/security.py:18`

- **Endpoint:** `GET /api/v1/*` (via `get_current_application` dependency)
- **Status:** 401 Unauthorized
- **Problem:** Tells the user the token is invalid but gives no hint about *why*. Is it malformed? Expired? Missing the `Bearer ` prefix? The user has no way to self-correct.
- **Suggested replacement:**
  ```
  Authorization header must use the Bearer scheme. Example: Bearer <token>
  ```

### 2. `"Invalid token"` — `app/api/security.py:28`

- **Endpoint:** `GET /api/v1/*` (via `get_current_application` dependency)
- **Status:** 401 Unauthorized
- **Problem:** After the token passes the `Bearer ` prefix check, this is returned when `jwt.decode` fails. The message doesn't distinguish between an expired token, a malformed token, or a token signed with the wrong secret. Also duplicates the meaning of message #1 above.
- **Suggested replacement:**
  ```
  The provided token is invalid or has expired. Please obtain a new token.
  ```

### 3. `"Invalid token"` — `app/middleware/authentication.py:48`

- **Endpoint:** All routes except public prefixes (middleware-level)
- **Status:** 401 Unauthorized
- **Problem:** Same issue as #2. This is the middleware-level catch-all for `JWTError` and `ValueError`. The `ValueError` is raised by line 37 (`raise ValueError()`) with **no message at all**, so the user gets the same generic "Invalid token" for two completely different failure modes (wrong auth scheme vs. malformed/expired JWT).
- **Suggested replacement:**
  ```
  The provided token is invalid or has expired. Please obtain a new token.
  ```
- **Related issue:** The bare `raise ValueError()` on line 37 should include a descriptive message (see #5 below).

### 4. `"Invalid credentials."` — `app/api/v1/auth.py:45`

- **Endpoint:** `POST /api/v1/auth/token`
- **Status:** 401 Unauthorized
- **Problem:** Says "credentials" but doesn't specify *which* credential is wrong. The API key might be valid but the secret is incorrect, or vice versa. The user is left guessing.
- **Suggested replacement:**
  ```
  The API key or secret is incorrect. Please verify your credentials and try again.
  ```

### 5. `"Unsupported provider {provider.name}"` — `app/services/provider_service.py:136-139`

- **Endpoint:** `POST /api/v1/providers/{provider_id}/test`
- **Status:** 400 Bad Request
- **Problem:** Says the provider is "unsupported" but doesn't explain *why* or *what the user should do*. A user seeing this has no idea whether they need to change the provider type, install a dependency, or configure something else.
- **Suggested replacement:**
  ```
  Provider '{provider.name}' with transport type '{provider.transport_type}' has no supported implementation. Supported combinations: Resend (api), SMTP (smtp), Africa's Talking (api).
  ```

---

## Missing Error Message

### `raise ValueError()` — `app/middleware/authentication.py:37`

- **Problem:** A bare `ValueError` is raised with **no message at all**. This is caught by the `except (JWTError, ValueError)` block on line 45 and converted to the generic `"Invalid token"` response. The user gets no detail about what went wrong — specifically, they don't know that the `Authorization` header must use the `Bearer` scheme.
- **Suggested fix:**
  ```python
  raise ValueError("Authorization scheme must be Bearer")
  ```
  This would allow the middleware to return a more specific error, or at minimum provide a useful log entry.

---

## Punctuation Inconsistencies

All "not found" messages should follow a consistent style. Currently:

| Message | Has Period? | Location |
|---------|-------------|----------|
| `"Notification not found"` | No | `app/api/v1/notifications.py:46` |
| `"Notification not found"` | No | `app/api/v1/notifications.py:71` |
| `"Provider not found"` | No | `app/api/v1/providers.py:59` |
| `"Provider not found"` | No | `app/api/v1/providers.py:89` |
| `"Template not found"` | No | `app/api/v1/templates.py:56` |
| `"Template not found"` | No | `app/api/v1/templates.py:75` |
| `"Event not found"` | No | `app/api/v1/events.py:79` |
| `"Application not found."` | **Yes** | `app/api/v1/applications.py:88` |
| `"Application not found."` | **Yes** | `app/api/v1/applications.py:108` |
| `"Application not found."` | **Yes** | `app/api/v1/applications.py:124` |
| `"Notification not found."` | **Yes** | `app/workers/notification_worker.py:72` |
| `"event not found"` | No (lowercase) | `app/workers/notification_worker.py:92` |

**Recommendation:** Pick one style and apply it consistently. Suggested: no period, title case, e.g. `"Notification not found"`.

---

## All Error Messages — Full Inventory

### Authentication & Token Errors

| # | File | Line | Current Message | Status | Verdict |
|---|------|------|----------------|--------|---------|
| 1 | `app/api/security.py` | 18 | `"Invalid bearer token"` | 401 | Vague |
| 2 | `app/api/security.py` | 28 | `"Invalid token"` | 401 | Vague |
| 3 | `app/middleware/authentication.py` | 30 | `"Missing Authorization header"` | 401 | Clear |
| 4 | `app/middleware/authentication.py` | 48 | `"Invalid token"` | 401 | Vague |
| 5 | `app/api/v1/auth.py` | 45 | `"Invalid credentials."` | 401 | Vague |

### Not Found Errors

| # | File | Line | Current Message | Status | Verdict |
|---|------|------|----------------|--------|---------|
| 6 | `app/api/v1/notifications.py` | 46 | `"Notification not found"` | 404 | Clear |
| 7 | `app/api/v1/notifications.py` | 71 | `"Notification not found"` | 404 | Clear |
| 8 | `app/api/v1/providers.py` | 59 | `"Provider not found"` | 404 | Clear |
| 9 | `app/api/v1/providers.py` | 89 | `"Provider not found"` | 404 | Clear |
| 10 | `app/api/v1/applications.py` | 88 | `"Application not found."` | 404 | Clear |
| 11 | `app/api/v1/applications.py` | 108 | `"Application not found."` | 404 | Clear |
| 12 | `app/api/v1/applications.py` | 124 | `"Application not found."` | 404 | Clear |
| 13 | `app/api/v1/templates.py` | 56 | `"Template not found"` | 404 | Clear |
| 14 | `app/api/v1/templates.py` | 75 | `"Template not found"` | 404 | Clear |
| 15 | `app/api/v1/events.py` | 79 | `"Event not found"` | 404 | Clear |
| 16 | `app/services/notification_service.py` | 69 | `"Notification not found"` | — | Clear |
| 17 | `app/workers/notification_worker.py` | 72 | `"Notification not found."` | — | Clear |
| 18 | `app/workers/notification_worker.py` | 92 | `"event not found"` | — | Clear |

### Conflict / Already Exists Errors

| # | File | Line | Current Message | Status | Verdict |
|---|------|------|----------------|--------|---------|
| 19 | `app/services/application_service.py` | 21 | `"Application already exists."` | 400 | Clear |
| 20 | `app/services/provider_service.py` | 77 | `"Provider with this name already exists."` | 409 | Clear |

### Unsupported / Not Configured Errors

| # | File | Line | Current Message | Status | Verdict |
|---|------|------|----------------|--------|---------|
| 21 | `app/services/event_validation_service.py` | 21 | `f"Unsupported event type '{event_type}'."` | 422 | Clear |
| 22 | `app/services/provider_service.py` | 136-139 | `f"Unsupported provider {provider.name}"` | 400 | Vague |
| 23 | `app/services/provider_resolver.py` | 39 | `f"No active provider configured for '{channel}'."` | — | Clear |
| 24 | `app/services/provider_resolver.py` | 65-68 | `f"No implementation for provider '{provider.name}' ({provider.transport_type})."` | — | Clear |
| 25 | `app/services/routing_service.py` | 45-47 | `f"No active template for '{event_type}' ({channel})"` | — | Clear |
| 26 | `app/services/routing_service.py` | 52-54 | `f"No active provider for '{channel}'"` | — | Clear |

### Provider Test Errors

| # | File | Line | Current Message | Status | Verdict |
|---|------|------|----------------|--------|---------|
| 27 | `app/services/provider_service.py` | 110 | `"Provider not found."` | 404 | Clear |
| 28 | `app/services/provider_service.py` | 116 | `"Provider is disabled."` | 400 | Clear |

### Worker Result Dicts

| # | File | Line | Current Message | Verdict |
|---|------|------|----------------|---------|
| 29 | `app/workers/notification_worker.py` | 76 | `"notification not found"` | Clear |
| 30 | `app/workers/notification_worker.py` | 97 | `"event not found"` | Clear |
| 31 | `app/workers/notification_worker.py` | 163 | `str(exc)` from ValueError | Depends on source |

### Passthrough (`str(exc)`)

| # | File | Line | Current Message | Verdict |
|---|------|------|----------------|---------|
| 32 | `app/api/v1/applications.py` | 65 | `str(exc)` from `ValueError("Application already exists.")` | Clear (but fragile) |
| 33 | `app/workers/notification_worker.py` | 155/163 | `str(exc)` from `ValueError` in `provider_resolver` | Clear (messages are descriptive) |

---

## Recommendations

1. **Fix the 5 vague messages** listed above with the suggested replacements.
2. **Add a message to the bare `raise ValueError()`** on `authentication.py:37`.
3. **Standardize punctuation** on all "not found" messages — remove trailing periods for consistency.
4. **Avoid `str(exc)` passthrough** in `applications.py:65` — instead, catch the specific `ValueError` and map it to a known message, or use the service-layer message directly. This prevents potential internal detail leakage if exception messages change.
5. **Differentiate 401 sub-cases** in the auth layer: use `"Missing Authorization header"` for no header, `"Authorization header must use the Bearer scheme"` for wrong scheme, and `"The provided token is invalid or has expired"` for JWT failures. This gives users actionable feedback for each scenario.