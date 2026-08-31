# backend/app/services/report_service.py


from datetime import datetime, timedelta, UTC
from uuid import uuid4

from app.models.notification_report import NotificationReport
from app.repositories.report_repository import ReportRepository

from app.models.user import User


class ReportService:
    def __init__(self, repository: ReportRepository):
        self.repository = repository

    def generate_report(self, user: User):
        period_end = datetime.now(UTC)
        period_start = period_end - timedelta(days=30)

        owner_id = None if user.role == "admin" else user.id

        report = NotificationReport(
            id=str(uuid4()),
            period_start=period_start,
            period_end=period_end,
            notifications_processed=self.repository.total_notifications(owner_id=owner_id),
            successful_notifications=self.repository.successful_notifications(owner_id=owner_id),
            failed_notifications=self.repository.failed_notifications(owner_id=owner_id),
            email_count=self.repository.count_by_channel("email", owner_id=owner_id),
            sms_count=self.repository.count_by_channel("sms", owner_id=owner_id),
            whatsapp_count=self.repository.count_by_channel("whatsapp", owner_id=owner_id),
            best_provider=self.repository.best_provider(owner_id=owner_id),
            provider_statistics=self.repository.provider_statistics(owner_id=owner_id),
        )

        return self.repository.save_report(report)
    

    def list_reports(self):
        return self.repository.list_reports()