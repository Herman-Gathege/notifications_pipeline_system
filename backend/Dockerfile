# ==================================================
# Notification Platform Backend
# ==================================================

FROM python:3.12-slim

# --------------------------------------------------
# Python Configuration
# --------------------------------------------------
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

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
# Copy Project
# --------------------------------------------------
COPY . .

RUN chmod +x entrypoint.sh
RUN chmod +x worker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]