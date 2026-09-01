#!/bin/sh

set -e

echo "🚀 ---------------------------------- 🚀"
echo "  🔥 FikaTu — Notification Worker 🔥  "
echo "🚀 ---------------------------------- 🚀"

echo "Waiting for PostgreSQL to be ready..."


until pg_isready \
    -h "$POSTGRES_HOST" \
    -p "$POSTGRES_PORT" \
    -U "$POSTGRES_USER"
do
    sleep 2
done

echo "PostgreSQL Ready."

echo "Waiting for Redis..."

until redis-cli -h "$REDIS_HOST" ping
do
    sleep 2
done

echo "Redis Ready."

echo "Starting Celery Worker..."

exec celery \
    -A app.workers.worker.celery_app \
    worker \
    --loglevel=info \
    --concurrency=2