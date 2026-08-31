# backend/app/services/event_service.py
from app.models.event import Event
from app.models.notification import Notification

from app.repositories.event_repository import EventRepository
from app.repositories.notification_repository import NotificationRepository

from app.schemas.event import EventCreate

from app.services.event_validation_service import EventValidationService

from app.models.user import User

# from app.workers.notification_worker import process_notification


class EventService:
    def __init__(
        self,
        event_repository: EventRepository,
        notification_repository: NotificationRepository,
    ):
        self.event_repository = event_repository
        self.notification_repository = notification_repository

    # def create_event(self, data: EventCreate) -> Event:

    #     event = Event(
    #         application_id=data.application_id,
    #         event_type=data.event_type,
    #         payload=data.payload,
    #     )

    def create_event(
        self,
        data: EventCreate,
        application_id: str,
    ) -> Event:

        validated_payload = EventValidationService.validate(
            data.event_type,
            data.payload,
        )

        event = Event(
            application_id=application_id,
            event_type=data.event_type,
            payload=validated_payload,
        )

        event = self.event_repository.create(event)

        from app.workers.notification_worker import process_notification

        for channel in data.channels:

            notification = Notification(
                event_id=event.id,
                channel=channel,
            )

            notification = self.notification_repository.create(
                notification
            )

            process_notification.delay(
                notification.id
            )

        return event

    def get_event(self, event_id: str) -> Event | None:
        return self.event_repository.get_by_id(event_id)

    def list_events(self, user: User) -> list[Event]:
        if user.role == "admin":
            return self.event_repository.list()
        return self.event_repository.list_by_owner(user.id)

    def mark_processed(self, event: Event) -> Event:
        event.is_processed = True
        event.status = "processed"
        return self.event_repository.update(event)