# backend/app/workers/worker.py

import os

from celery import Celery


celery_app = Celery(
    "notification-platform",
    broker=os.getenv("CELERY_BROKER_URL"),
    backend=os.getenv("CELERY_RESULT_BACKEND"),
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,

    task_default_queue="notifications",

    task_routes={
        "app.workers.notification_worker.process_notification": {
            "queue": "notifications"
        }
    },
)

# Import tasks so Celery discovers them
import app.workers.notification_worker  # noqa: E402,F401