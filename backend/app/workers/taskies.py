# backend/app/workers/tasks.py
from app.workers.worker import celery_app


@celery_app.task
def process_notification(notification_id: str):
    print(f"Processing notification: {notification_id}")

    # Sprint 3:
    # simulate delivery
    return {
        "notification_id": notification_id,
        "status": "processed",
    }