# backend/app/api/v1/events.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.repositories.event_repository import EventRepository
from app.repositories.notification_repository import NotificationRepository
from app.schemas.event import EventCreate, EventResponse
from app.services.event_service import EventService

router = APIRouter(
    prefix="/events",
    tags=["Events"],
)


def get_event_service(db: Session = Depends(get_db)) -> EventService:
    event_repository = EventRepository(db)
    notification_repository = NotificationRepository(db)

    return EventService(
        event_repository=event_repository,
        notification_repository=notification_repository,
    )


@router.post(
    "",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_event(
    payload: EventCreate,
    service: EventService = Depends(get_event_service),
):
    return service.create_event(payload)


@router.get(
    "",
    response_model=list[EventResponse],
)
def list_events(
    service: EventService = Depends(get_event_service),
):
    return service.list_events()


@router.get(
    "/{event_id}",
    response_model=EventResponse,
)
def get_event(
    event_id: str,
    service: EventService = Depends(get_event_service),
):
    event = service.get_event(event_id)

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    return event