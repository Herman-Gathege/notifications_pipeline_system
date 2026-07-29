# backend/app/services/notification_report_service.py

from app.repositories.notification_report_repository import (
    NotificationReportRepository,
)


class NotificationReportService:
    def __init__(
        self,
        repository: NotificationReportRepository,
    ):
        self.repository = repository

    def list_reports(self):
        return self.repository.list()