# backend/app/repositories/notification_report_repository.py

from sqlalchemy.orm import Session

from app.models.notification_report import NotificationReport


class NotificationReportRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, report: NotificationReport):
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        return report

    def list(self):
        return (
            self.db.query(NotificationReport)
            .order_by(NotificationReport.created_at.desc())
            .all()
        )

    def get_latest(self):
        return (
            self.db.query(NotificationReport)
            .order_by(NotificationReport.created_at.desc())
            .first()
        )