# Troubleshooting

## Common Operational Checks

### Service Status

```bash
docker compose ps
```

### API Logs

```bash
docker compose logs --tail=200 notification-api
```

### Worker Logs

```bash
docker compose logs --tail=200 notification-worker
```

### Worker Health

```bash
docker compose exec notification-worker \
  celery -A app.workers.worker.celery_app inspect ping
```

### API Health

```bash
curl http://localhost/health
```

### Database Access

```bash
docker compose exec notification-postgres psql -U postgres -d notification_platform
```

## Issue Diagnosis

### API 401 Unauthorized

- Check `Authorization: Bearer <token>` header is present
- Verify token is not expired (24h expiry)
- Verify token type matches endpoint (user vs application)
- Check `SECRET_KEY` is consistent across containers

### API 403 Forbidden

- Verify user role has permission for the endpoint
- For application actions, verify the user owns the application
- Check `is_active` flag on user or application

### API 422 Validation Error

- Check request body fields against the API schema
- For events, verify payload matches the event type schema in `EVENT_REGISTRY`
- Ensure `channels` is a non-empty array

### Worker Not Processing

```bash
# Check Redis connectivity
docker compose exec notification-worker redis-cli -h notification-redis ping

# Check Celery queue
docker compose exec notification-worker \
  celery -A app.workers.worker.celery_app inspect active

# Check for dead letters
docker compose exec notification-worker \
  celery -A app.workers.worker.celery_app inspect scheduled
```

### Redis Unavailable

```bash
docker compose ps notification-redis
docker compose logs --tail=100 notification-redis
docker compose exec notification-redis redis-cli ping
```

### PostgreSQL Unavailable

```bash
docker compose ps notification-postgres
docker compose logs --tail=100 notification-postgres
docker compose exec notification-postgres pg_isready -U postgres -d notification_platform
```

### SMS Provider Failure

- Verify `AFRICASTALKING_USERNAME` and `AFRICASTALKING_API_KEY` are set
- Check Africa's Talking sandbox dashboard for delivery reports
- Verify phone number format (E.164: `+254725325915`)
- Check worker logs for specific error messages

### Invalid Phone Number

- Ensure phone numbers include country code (e.g. `+254`)
- SMS provider expects E.164 format
- Missing phone numbers result in `dead_letter` status

### Template Validation Failure

- Ensure a template exists for the event type + channel
- Verify template `is_active=True`
- Check template body for unresolved `{{placeholder}}` variables

### Event Validation Failure

- Verify `event_type` is registered in `EVENT_REGISTRY`
- Ensure all required payload fields are present
- Check payload field types match the schema

### Authentication / Session Problems

- Clear browser localStorage and re-login
- Verify `SECRET_KEY` has not changed (invalidates all tokens)
- Check backend logs for JWT decode errors
- Ensure CORS origins include the frontend origin

## Quick Reference

| Symptom | Check |
|---------|-------|
| 401 on API | Token header, expiry, SECRET_KEY |
| 403 on API | Role, ownership, is_active |
| 422 on event | Payload schema, event type registration |
| Worker idle | Redis connection, Celery queue, task registration |
| SMS not sent | AT credentials, phone format, worker logs |
| Email not sent | Provider config, SMTP/Resend credentials |
| Template missing | Template exists, active, correct channel |
| Frontend blank | Nginx health, frontend container logs |
| DB connection error | PostgreSQL health, DATABASE_URL, migrations |
