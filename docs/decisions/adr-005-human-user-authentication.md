# ADR-005: Human User Authentication and Application Ownership

## Status

Accepted

## Date

2026-08-21

## Context

The Notification Platform originally supported only machine-to-machine authentication via API keys and secrets. Applications were the only identity in the system, and any valid application JWT could create or manage applications.

This created several problems:

1. No human users existed in the system, making it impossible to build an admin UI with proper login/logout.
2. Application creation endpoints were accessible to any application token, with no ownership or authorization model.
3. There was no way to distinguish between a platform operator and a notification client.
4. The frontend had hardcoded user data, indicating the UI was designed for human users but the backend did not support them.
5. No RBAC or role-based restrictions existed.

## Decision

Introduce a dual-identity authentication model:

1. **Human Users** — Authenticate with email/password, receive a user JWT, and have a role (`admin` or `user`). Users own applications.
2. **Machine Applications** — Continue authenticating with API key + secret, receive an application JWT. Used for notification/event APIs.

Key implementation choices:

- **Separate JWT types**: User JWTs carry `type: "user"` and application JWTs carry `type: "application"`. Each FastAPI dependency validates the appropriate type.
- **Ownership enforcement**: Applications have an `owner_id` foreign key to `users.id`. Application management endpoints require user authentication and enforce ownership server-side.
- **Preserve existing behavior**: The application creation logic, API key generation, secret generation, and notification pipeline remain unchanged. We only add authentication and ownership around them.
- **Plaintext password storage (initial)**: For this pass, passwords are stored as plaintext strings. This is acknowledged as a technical debt item to be addressed with `passlib[bcrypt]` hashing before production hardening.
- **Default admin bootstrap**: The Alembic migration seeds a default admin user (`admin@notification-platform` / `admin123`) and assigns all existing applications to it.

## Consequences

### Positive

- Platform operators can log in with email/password.
- Role-based access control limits normal users to their own applications.
- Admin users can manage all applications and users.
- Application creation is no longer open to any application token.
- Frontend can use a proper auth context with login/logout.
- Existing machine clients continue working without changes.

### Negative

- Increased complexity: two authentication systems must be maintained.
- Plaintext password storage is a security risk until bcrypt hashing is implemented.
- Default admin credentials must be changed after deployment.
- Existing application data is reassigned to the seeded admin during migration.

### Neutral

- `POST /api/v1/auth/token` remains the machine authentication endpoint.
- Application JWT payload remains compatible with existing consumers.
- Frontend token storage remains in `localStorage`.

## Alternatives Considered

1. **Single JWT with roles**: Rejected because it blurs the boundary between human and machine identities, making authorization harder to reason about.
2. **OAuth2 / external identity provider**: Rejected as over-engineering for the current scope. The platform needs simple email/password auth, not a full OAuth flow.
3. **API keys for humans**: Rejected because the platform already uses API keys for machines, and mixing the two would create security confusion.
4. **Refresh tokens**: Rejected because the existing architecture does not require them, and the added complexity is not justified for the current user base.

## References

- Sprint 7 plan: `docs/implementation/sprint-7.md`
- Existing system overview: `docs/architecture/system-overview.md`
- Database design: `docs/architecture/database-design.md`
- API design: `docs/architecture/api-design.md`
