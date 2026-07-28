# backend/app/repositories/notification_repository.py
from sqlalchemy import select
from sqlalchemy.orm import Session

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