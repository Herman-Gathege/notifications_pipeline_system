# backend/app/repositories/event_repository.py
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.event import Event


class EventRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, event: Event) -> Event:
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def get_by_id(self, event_id: str) -> Event | None:
        return self.db.get(Event, event_id)

    def list(self) -> list[Event]:
        stmt = (
            select(Event)
            .order_by(Event.created_at.desc())
        )
        return list(self.db.scalars(stmt).all())

    def update(self, event: Event) -> Event:
        self.db.commit()
        self.db.refresh(event)
        return event