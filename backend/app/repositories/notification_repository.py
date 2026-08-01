# backend/app/repositories/notification_repository.py
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.notification import Notification
from datetime import datetime, timedelta, UTC

from app.models.notification import Notification

class NotificationRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, notification: Notification) -> Notification:
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def get_by_id(self, notification_id: str) -> Notification | None:
        return self.db.get(Notification, notification_id)

    def list(self) -> list[Notification]:
        stmt = (
            select(Notification)
            .order_by(Notification.created_at.desc())
        )
        return list(self.db.scalars(stmt).all())

    def update(self, notification: Notification) -> Notification:
        self.db.commit()
        self.db.refresh(notification)
        return notification
    

    def get_processed_older_than_days(
        self,
        days: int = 30,
    ):
        cutoff = datetime.now(UTC) - timedelta(days=days)

        return (
            self.db.query(Notification)
            .filter(
                Notification.status == "processed",
                Notification.created_at < cutoff,
            )
            .all()
        )

    
    def delete_processed_older_than_days(
        self,
        days: int = 30,
    ):
        cutoff = datetime.now(UTC) - timedelta(days=days)

        return (
            self.db.query(Notification)
            .filter(
                Notification.status == "processed",
                Notification.created_at < cutoff,
            )
            .delete(synchronize_session=False)
        )

    def update(self, notification: Notification):
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification