# backend/app/repositories/report_repository.py

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.notification_report import NotificationReport
from app.models.event import Event
from app.models.application import Application


class ReportRepository:
    def __init__(self, db: Session):
        self.db = db

    def _notifications_query(self, owner_id: str | None = None):
        query = self.db.query(Notification)

        if owner_id is not None:
            query = (
                query.join(Event, Notification.event_id == Event.id)
                .join(Application, Event.application_id == Application.id)
                .filter(Application.owner_id == owner_id)
            )

        return query

    def total_notifications(self, owner_id: str | None = None):
        return self._notifications_query(owner_id).count()

    def successful_notifications(self, owner_id: str | None = None):
        return (
            self._notifications_query(owner_id)
            .filter(Notification.status == "delivered")
            .count()
        )

    def failed_notifications(self, owner_id: str | None = None):
        return (
            self._notifications_query(owner_id)
            .filter(Notification.status == "failed")
            .count()
        )

    def count_by_channel(self, channel: str, owner_id: str | None = None):
        return (
            self._notifications_query(owner_id)
            .filter(Notification.channel == channel)
            .count()
        )

    def best_provider(self, owner_id: str | None = None):
        query = (
            self.db.query(
                Notification.provider,
                func.count(Notification.id).label("total"),
            )
            .filter(Notification.status == "delivered")
        )

        if owner_id is not None:
            query = (
                query.join(Event, Notification.event_id == Event.id)
                .join(Application, Event.application_id == Application.id)
                .filter(Application.owner_id == owner_id)
            )

        result = (
            query
            .group_by(Notification.provider)
            .order_by(func.count(Notification.id).desc())
            .first()
        )

        return result.provider if result else None

    def provider_statistics(self, owner_id: str | None = None):
        query = (
            self.db.query(
                Notification.provider,
                func.count(Notification.id).label("total"),
            )
            .filter(Notification.provider.is_not(None))
        )

        if owner_id is not None:
            query = (
                query.join(Event, Notification.event_id == Event.id)
                .join(Application, Event.application_id == Application.id)
                .filter(Application.owner_id == owner_id)
            )

        rows = query.group_by(Notification.provider).all()

        return {
            row.provider: row.total
            for row in rows
        }

    def save_report(self, report: NotificationReport):
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)

        return report

    def list_reports(self):
        return (
            self.db.query(NotificationReport)
            .order_by(NotificationReport.created_at.desc())
            .all()
        )
