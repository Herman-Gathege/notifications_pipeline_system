# Sprint 3 – Asynchronous Event Processing

## Overview

Sprint 3 focused on transforming the notification platform from a synchronous API into an event-driven system capable of processing notifications asynchronously.

Prior to this sprint, creating an event only stored data in PostgreSQL. The API itself was responsible for all processing, making it unsuitable for long-running notification tasks such as sending emails or SMS messages.

This sprint introduced Redis as a message broker and Celery as the background task processor, allowing notification processing to occur independently of the API request lifecycle.

---

# Objectives

The primary objectives of Sprint 3 were:

* Introduce asynchronous background processing.
* Integrate Redis as the message broker.
* Configure Celery workers.
* Queue notification jobs automatically.
* Process notifications outside the API request.
* Update notification status after processing.
* Update event status after successful notification processing.
* Validate the complete asynchronous workflow.

---

# Features Implemented

## 1. Redis Integration

Redis was introduced as the application's message broker.

Responsibilities include:

* Holding queued notification jobs.
* Delivering jobs to Celery workers.
* Providing reliable communication between the API and background workers.

Redis does not permanently store notifications; it temporarily manages queued tasks awaiting execution.

---

## 2. Celery Integration

Celery was configured as the application's asynchronous task processor.

Responsibilities include:

* Receiving queued jobs.
* Executing background notification tasks.
* Running independently from the FastAPI application.
* Returning task execution results.

The worker listens continuously for new notification jobs published to Redis.

---

## 3. Notification Worker

A dedicated notification worker was implemented.

Current responsibilities:

* Receive queued notification IDs.
* Simulate notification processing.
* Update notification status.
* Update related event status.
* Return task completion information.

At this stage the worker performs simulated processing to validate the architecture.

Actual notification delivery will be implemented during Sprint 4.

---

## 4. Event Service Integration

The Event Service was updated to enqueue notification jobs automatically.

Workflow:

1. Create Event.
2. Store Event.
3. Create Notification.
4. Store Notification.
5. Queue Celery task.
6. Return API response immediately.

This ensures the API remains responsive while background work continues asynchronously.

---

## 5. Docker Worker Service

A dedicated Docker container was added for Celery.

The worker:

* Waits for PostgreSQL.
* Waits for Redis.
* Starts Celery.
* Listens continuously for queued tasks.

The worker operates independently of the FastAPI container.

---

# Architecture

The processing pipeline now follows an event-driven architecture.

```text
Client
   │
POST /events
   │
   ▼
FastAPI
   │
Create Event
   │
Create Notification
   │
Queue Celery Task
   │
Redis
   │
Celery Worker
   │
Process Notification
   │
Update Notification
   │
Update Event
   ▼
Completed
```

This architecture separates HTTP request handling from notification processing.

---

# Request Lifecycle

### Step 1

A client submits an event.

```http
POST /api/v1/events
```

---

### Step 2

The API stores the Event.

Status:

```
received
```

---

### Step 3

A Notification record is created.

Status:

```
queued
```

---

### Step 4

The Notification ID is sent to Redis using Celery.

```python
process_notification.delay(notification.id)
```

---

### Step 5

The API immediately returns a response.

The client does not wait for notification processing.

---

### Step 6

Celery receives the queued task.

---

### Step 7

The Notification Worker processes the notification.

Current implementation:

* Simulated processing
* Logging
* Status updates

---

### Step 8

Notification status becomes:

```
processed
```

---

### Step 9

The related Event is updated.

Status:

```
processed
```

is_processed:

```
true
```

---

# Components Added

Sprint 3 introduced the following components.

## Services

* EventService queue integration

---

## Workers

* notification_worker.py
* worker.py

---

## Infrastructure

* Redis
* Celery
* Worker container
* Worker entrypoint script

---

## Docker

Added:

* notification-worker service

Updated:

* Docker Compose configuration
* Environment variables
* Startup order

---

# Files Added

```
backend/app/workers/
    worker.py
    notification_worker.py

backend/worker-entrypoint.sh
```

---

# Files Updated

```
backend/app/services/event_service.py

docker-compose.yml

.env

requirements.txt
```

---

# API Endpoints Verified

The following endpoints were successfully tested.

## Health

```
GET /health
```

---

## Applications

```
POST /applications

GET /applications
```

---

## Events

```
POST /events

GET /events

GET /events/{id}
```

---

## Notifications

```
GET /notifications
```

---

# Testing Performed

The complete asynchronous workflow was validated.

### Event Creation

Verified that:

* Event is stored.

---

### Notification Creation

Verified that:

* Notification is automatically created.

---

### Queue Dispatch

Verified that:

* Celery receives queued jobs.

---

### Worker Execution

Verified through worker logs that tasks execute successfully.

Example output:

```
Processing notification:
Notification processed successfully.
Task succeeded
```

---

### Notification Update

Verified status transition:

```
queued
```

↓

```
processed
```

---

### Event Update

Verified status transition:

```
received
```

↓

```
processed
```

Verified:

```
is_processed = true
```

---

# Challenges Encountered

During implementation several issues were resolved.

## Celery task discovery

Resolved task registration and import paths to ensure workers correctly discovered notification tasks.

---

## Circular imports

Separated worker configuration from task definitions to avoid import dependency issues.

---

## Docker startup ordering

Ensured PostgreSQL and Redis were fully available before starting FastAPI and Celery workers.

---

## Database session management

Implemented proper SQLAlchemy session handling inside Celery tasks to safely update notification and event records.

---

# Sprint Deliverables

By the end of Sprint 3 the platform supports:

* Asynchronous processing
* Redis message broker
* Celery workers
* Automatic task queueing
* Independent background processing
* Notification lifecycle updates
* Event lifecycle updates
* Dockerized worker infrastructure
* End-to-end asynchronous processing

---

# Current Limitations

Notification processing is currently simulated.

The worker does not yet communicate with external providers.

Delivery channels such as Email, SMS, WhatsApp and Push Notifications will be implemented during Sprint 4.

---

# Sprint Summary

Sprint 3 successfully introduced asynchronous processing into the Notification Platform.

The system now follows an event-driven architecture where API requests remain lightweight while notification processing occurs independently in the background through Redis and Celery.

This architecture provides a scalable foundation for integrating multiple notification providers without impacting API responsiveness.

---

# Next Sprint

Sprint 4 will focus on real notification delivery.

Planned features include:

* Email delivery
* SMS integration
* WhatsApp integration
* Provider abstraction
* Notification templates
* Retry policies
* Delivery tracking
* Failure handling
* Logging and monitoring
