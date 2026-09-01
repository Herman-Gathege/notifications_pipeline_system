# backend/app/services/monitoring_service.py

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.event import Event
from app.models.notification import Notification
from app.models.application import Application

from app.models.user import User


class MonitoringService:
    def __init__(self, db: Session):
        self.db = db

    def statistics(self, user: User):

        if user.role == "admin":
            total_events = self.db.query(func.count(Event.id)).scalar()
            total_notifications = (
                self.db.query(func.count(Notification.id)).scalar()
            )
            delivered = (
                self.db.query(func.count(Notification.id))
                .filter(Notification.status == "delivered")
                .scalar()
            )
            queued = (
                self.db.query(func.count(Notification.id))
                .filter(Notification.status == "queued")
                .scalar()
            )
            failed = (
                self.db.query(func.count(Notification.id))
                .filter(Notification.status == "failed")
                .scalar()
            )
            dead_letter = (
                self.db.query(func.count(Notification.id))
                .filter(Notification.status == "dead_letter")
                .scalar()
            )
        else:
            total_events = (
                self.db.query(func.count(Event.id))
                .join(Application, Event.application_id == Application.id)
                .filter(Application.owner_id == user.id)
                .scalar()
            )

            total_notifications = (
                self.db.query(func.count(Notification.id))
                .join(Event, Notification.event_id == Event.id)
                .join(Application, Event.application_id == Application.id)
                .filter(Application.owner_id == user.id)
                .scalar()
            )

            delivered = (
                self.db.query(func.count(Notification.id))
                .join(Event, Notification.event_id == Event.id)
                .join(Application, Event.application_id == Application.id)
                .filter(
                    Application.owner_id == user.id,
                    Notification.status == "delivered",
                )
                .scalar()
            )

            queued = (
                self.db.query(func.count(Notification.id))
                .join(Event, Notification.event_id == Event.id)
                .join(Application, Event.application_id == Application.id)
                .filter(
                    Application.owner_id == user.id,
                    Notification.status == "queued",
                )
                .scalar()
            )

            failed = (
                self.db.query(func.count(Notification.id))
                .join(Event, Notification.event_id == Event.id)
                .join(Application, Event.application_id == Application.id)
                .filter(
                    Application.owner_id == user.id,
                    Notification.status == "failed",
                )
                .scalar()
            )

            dead_letter = (
                self.db.query(func.count(Notification.id))
                .join(Event, Notification.event_id == Event.id)
                .join(Application, Event.application_id == Application.id)
                .filter(
                    Application.owner_id == user.id,
                    Notification.status == "dead_letter",
                )
                .scalar()
            )

        return {
            "events": total_events,
            "notifications": total_notifications,
            "delivered": delivered,
            "queued": queued,
            "failed": failed,
            "dead_letter": dead_letter,
        }

    def logs(self, user: User):

        if user.role == "admin":
            notifications = (
                self.db.query(Notification)
                .order_by(Notification.created_at.desc())
                .limit(100)
                .all()
            )
        else:
            notifications = (
                self.db.query(Notification)
                .join(Event, Notification.event_id == Event.id)
                .join(Application, Event.application_id == Application.id)
                .filter(Application.owner_id == user.id)
                .order_by(Notification.created_at.desc())
                .limit(100)
                .all()
            )

        return notifications