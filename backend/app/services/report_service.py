# backend/app/services/report_service.py

# from datetime import datetime, timedelta, UTC
# from uuid import uuid4

# from app.models.notification_report import NotificationReport
# from app.repositories.report_repository import ReportRepository


# class ReportService:
#     def __init__(
#         self,
#         repository: ReportRepository,
#     ):
#         self.repository = repository

#     def generate_report(self):
#         period_end = datetime.now(UTC)
#         period_start = period_end - timedelta(days=30)

#         report = NotificationReport(
#             id=str(uuid4()),
#             period_start=period_start,
#             period_end=period_end,
#             notifications_processed=self.repository.total_notifications(),
#             successful_notifications=self.repository.successful_notifications(),
#             failed_notifications=self.repository.failed_notifications(),
#             email_count=self.repository.count_by_channel("email"),
#             sms_count=self.repository.count_by_channel("sms"),
#             whatsapp_count=self.repository.count_by_channel("whatsapp"),
#             best_provider=self.repository.best_provider(),
#             provider_statistics=self.repository.provider_statistics(),
#         )

#         return self.repository.save_report(report)

# backend/app/services/report_service.py

from datetime import datetime, timedelta, UTC
from uuid import uuid4

from app.models.notification_report import NotificationReport
from app.repositories.report_repository import ReportRepository


class ReportService:
    def __init__(self, repository: ReportRepository):
        self.repository = repository

    def generate_report(self):
        period_end = datetime.now(UTC)
        period_start = period_end - timedelta(days=30)

        report = NotificationReport(
            id=str(uuid4()),
            period_start=period_start,
            period_end=period_end,
            notifications_processed=self.repository.total_notifications(),
            successful_notifications=self.repository.successful_notifications(),
            failed_notifications=self.repository.failed_notifications(),
            email_count=self.repository.count_by_channel("email"),
            sms_count=self.repository.count_by_channel("sms"),
            whatsapp_count=self.repository.count_by_channel("whatsapp"),
            best_provider=self.repository.best_provider(),
            provider_statistics=self.repository.provider_statistics(),
        )

        return self.repository.save_report(report)