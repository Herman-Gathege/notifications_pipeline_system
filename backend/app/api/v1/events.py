# backend/app/api/v1/events.py
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.api.security import get_current_user
from jose import jwt, JWTError

from app.database.session import get_db
from app.repositories.event_repository import EventRepository
from app.repositories.notification_repository import NotificationRepository
from app.repositories.application_repository import ApplicationRepository
from app.schemas.event import EventCreate, EventResponse
from app.services.event_service import EventService
from app.models.user import User
from app.config.settings import settings

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
    authorization: str = Header(...),
    db: Session = Depends(get_db),
    service: EventService = Depends(get_event_service),
):
    token = authorization.replace("Bearer ", "")
    
    try:
        token_payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"],
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The provided token is invalid or has expired. Please obtain a new token.",
        )
    
    token_type = token_payload.get("type")
    
    if token_type == "application":
        application_id = token_payload["sub"]
    elif token_type == "user":
        if not payload.application_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="application_id is required when using a user token.",
            )
        
        application = ApplicationRepository(db).get_by_id(payload.application_id)
        
        if application is None:
            raise HTTPException(
                status_code=404,
                detail="Application not found.",
            )
        
        if token_payload.get("role") != "admin" and application.owner_id != token_payload["sub"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to publish events for this application.",
            )
        
        application_id = payload.application_id
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type.",
        )
    
    return service.create_event(
        payload,
        application_id,
    )


@router.get(
    "",
    response_model=list[EventResponse],
)
def list_events(
    current_user: User = Depends(get_current_user),
    service: EventService = Depends(get_event_service),
):
    return service.list_events(current_user)


@router.get(
    "/{event_id}",
    response_model=EventResponse,
)
def get_event(
    event_id: str,
    service: EventService = Depends(get_event_service),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = service.get_event(event_id)

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    if current_user.role != "admin":
        application = ApplicationRepository(db).get_by_id(event.application_id)
        if application is None or application.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this event.",
            )

    return event