# backend/app/workers/notification_worker.py

from app.workers.worker import celery_app

from app.database.session import SessionLocal

from app.models.notification import Notification
from app.models.event import Event


@celery_app.task(name="app.workers.notification_worker.process_notification")
def process_notification(notification_id: str):
    """
    Process a notification.

    Sprint 3:
    - Verify Celery execution
    - Update notification status
    - Update event status

    Sprint 4:
    - Send Email
    - Send SMS
    - Send WhatsApp
    - Push Notifications
    """

    db = SessionLocal()

    try:
        print("=" * 60)
        print(f"Processing notification: {notification_id}")

        notification = (
            db.query(Notification)
            .filter(Notification.id == notification_id)
            .first()
        )

        if notification is None:
            print("Notification not found.")

            return {
                "status": "failed",
                "reason": "notification not found",
            }

        # --------------------------------------------------
        # Simulate notification processing
        # --------------------------------------------------

        notification.status = "processed"

        event = (
            db.query(Event)
            .filter(Event.id == notification.event_id)
            .first()
        )

        if event:
            event.status = "processed"
            event.is_processed = True

        db.commit()

        print("Notification processed successfully.")
        print("=" * 60)

        return {
            "notification_id": str(notification.id),
            "status": notification.status,
        }

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()