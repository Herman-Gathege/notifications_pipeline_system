# backend/app/repositories/report_repository.py

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.notification_report import NotificationReport


class ReportRepository:
    def __init__(self, db: Session):
        self.db = db

    def total_notifications(self):
        return (
            self.db.query(Notification)
            .count()
        )

    def successful_notifications(self):
        return (
            self.db.query(Notification)
            .filter(Notification.status == "sent")
            .count()
        )

    def failed_notifications(self):
        return (
            self.db.query(Notification)
            .filter(Notification.status == "failed")
            .count()
        )

    def count_by_channel(self, channel: str):
        return (
            self.db.query(Notification)
            .filter(Notification.channel == channel)
            .count()
        )

    def best_provider(self):
        result = (
            self.db.query(
                Notification.provider,
                func.count(Notification.id).label("total"),
            )
            .group_by(Notification.provider)
            .order_by(func.count(Notification.id).desc())
            .first()
        )

        if result:
            return result.provider

        return None

    def provider_statistics(self):
        rows = (
            self.db.query(
                Notification.provider,
                func.count(Notification.id).label("total"),
            )
            .group_by(Notification.provider)
            .all()
        )

        return {
            row.provider: row.total
            for row in rows
            if row.provider
        }

    def save_report(self, report: NotificationReport):
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)

        return report