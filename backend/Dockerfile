# ==================================================
# Notification Platform Backend (Production)
# Multi-stage build: shared base for API and Worker
# ==================================================

FROM python:3.12-slim-bookworm AS base

# --------------------------------------------------
# Python Configuration
# --------------------------------------------------
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# --------------------------------------------------
# System Dependencies
# --------------------------------------------------
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        libpq-dev \
        postgresql-client \
        redis-tools \
    && rm -rf /var/lib/apt/lists/*

# --------------------------------------------------
# Install Python Dependencies
# --------------------------------------------------
COPY requirements ./requirements
COPY requirements.txt .

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip \
    && pip install -r requirements.txt

# --------------------------------------------------
# Copy Application
# --------------------------------------------------
COPY . .

RUN chmod +x entrypoint.sh worker-entrypoint.sh

# --------------------------------------------------
# API Stage
# --------------------------------------------------
FROM base AS api

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]


# --------------------------------------------------
# Worker Stage
# --------------------------------------------------
FROM base AS worker

ENTRYPOINT ["./worker-entrypoint.sh"]
