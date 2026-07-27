from app.models.notification import Notification
from app.repositories.notification_repository import NotificationRepository


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

    def list_notifications(self) -> list[Notification]:
        return self.repository.list()

    def update_status(
        self,
        notification: Notification,
        status: str,
    ) -> Notification:
        notification.status = status
        return self.repository.update(notification)