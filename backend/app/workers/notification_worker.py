# backend/app/workers/notification_worker.py

from app.workers.worker import celery_app


@celery_app.task(name="app.workers.notification_worker.process_notification")
def process_notification(notification_id: str):
    """
    Temporary notification processor.

    Sprint 3 only verifies that Celery receives
    and executes jobs successfully.

    Sprint 4 will add:
    - Email sending
    - SMS sending
    - WhatsApp
    - Push Notifications
    """

    print("=" * 60)
    print(f"Processing notification: {notification_id}")
    print("Notification processed successfully.")
    print("=" * 60)

    return {
        "notification_id": notification_id,
        "status": "processed",
    }
