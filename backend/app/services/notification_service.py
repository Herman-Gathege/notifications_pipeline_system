# # backend/app/services/notification_service.py

from app.models.notification import Notification
from app.repositories.notification_repository import NotificationRepository

from app.models.user import User




class NotificationService:
    def __init__(self, repository: NotificationRepository):
        self.repository = repository

    def create_notification(
        self,
        *,
        event_id: str,
        recipient: str = "",
        channel: str = "email",
    ) -> Notification:
        notification = Notification(
            event_id=event_id,
            recipient=recipient,
            channel=channel,
        )

        return self.repository.create(notification)

    def get_notification(self, notification_id: str) -> Notification | None:
        return self.repository.get_by_id(notification_id)

    def list_notifications(self, user: User) -> list[Notification]:
        if user.role == "admin":
            return self.repository.list()
        return self.repository.list_by_owner(user.id)

    def update_status(
        self,
        notification: Notification,
        status: str,
    ) -> Notification:
        notification.status = status
        return self.repository.update(notification)

    def update_notification(
        self,
        notification: Notification,
        *,
        recipient: str,
        provider: str,
        status: str,
        processing_time_ms: int,
        failure_reason: str | None = None,
    ) -> Notification:
        notification.recipient = recipient
        notification.provider = provider
        notification.status = status
        notification.processing_time_ms = processing_time_ms
        notification.failure_reason = failure_reason

        return self.repository.update(notification)


    def retry_notification(
        self,
        notification_id: str,
    ) -> Notification:

        notification = self.repository.get_by_id(notification_id)

        if notification is None:
            raise ValueError("Notification not found")

        notification.status = "queued"
        notification.failure_reason = None

        self.repository.update(notification)

        from app.workers.notification_worker import process_notification


        process_notification.delay(notification.id)

        return notification