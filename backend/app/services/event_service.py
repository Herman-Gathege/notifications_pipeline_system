from app.models.event import Event
from app.repositories.event_repository import EventRepository
from app.schemas.event import EventCreate


class EventService:
    def __init__(self, repository: EventRepository):
        self.repository = repository

    def create_event(self, data: EventCreate) -> Event:
        event = Event(
            application_id=data.application_id,
            event_type=data.event_type,
            payload=data.payload,
        )

        return self.repository.create(event)

    def get_event(self, event_id: str) -> Event | None:
        return self.repository.get_by_id(event_id)

    def list_events(self) -> list[Event]:
        return self.repository.list()

    def mark_processed(self, event: Event) -> Event:
        event.is_processed = True
        event.status = "processed"
        return self.repository.update(event)