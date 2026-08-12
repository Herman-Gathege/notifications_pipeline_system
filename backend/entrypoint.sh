#!/bin/sh

set -e

echo ""
echo "===================================="
echo "Herman El-Maestro created this..."
echo "===================================="

echo "Waiting for PostgreSQL..."

until pg_isready \
    -h "$POSTGRES_HOST" \
    -p "$POSTGRES_PORT" \
    -U "$POSTGRES_USER"
do
    sleep 2
done

echo "PostgreSQL Ready."

echo "Waiting for Redis..."

until redis-cli \
    -h "$REDIS_HOST" \
    ping
do
    sleep 2
done

echo "Redis Ready."

echo "Running database migrations..."

alembic upgrade head

echo "Migrations complete."

echo "Starting FastAPI (production mode)..."

exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 2