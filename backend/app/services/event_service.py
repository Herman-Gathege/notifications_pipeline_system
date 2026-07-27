from app.models.event import Event
from app.models.notification import Notification

from app.repositories.event_repository import EventRepository
from app.repositories.notification_repository import NotificationRepository

from app.schemas.event import EventCreate

from app.workers.notification_worker import process_notification

class EventService:
    def __init__(
        self,
        event_repository: EventRepository,
        notification_repository: NotificationRepository,
    ):
        self.event_repository = event_repository
        self.notification_repository = notification_repository

    def create_event(self, data: EventCreate) -> Event:

        event = Event(
            application_id=data.application_id,
            event_type=data.event_type,
            payload=data.payload,
        )

        event = self.event_repository.create(event)

        notification = Notification(
            event_id=event.id,
        )


        notification = self.notification_repository.create(notification)


        # enqueue background job
        process_notification.delay(str(notification.id))

        return event

    def get_event(self, event_id: str) -> Event | None:
        return self.event_repository.get_by_id(event_id)

    def list_events(self) -> list[Event]:
        return self.event_repository.list()

    def mark_processed(self, event: Event) -> Event:
        event.is_processed = True
        event.status = "processed"
        return self.event_repository.update(event)