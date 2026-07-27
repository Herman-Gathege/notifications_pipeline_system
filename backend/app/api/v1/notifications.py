from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.repositories.notification_repository import NotificationRepository
from app.schemas.notification import NotificationResponse
from app.services.notification_service import NotificationService

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


def get_notification_service(
    db: Session = Depends(get_db),
) -> NotificationService:
    repository = NotificationRepository(db)
    return NotificationService(repository)


@router.get(
    "",
    response_model=list[NotificationResponse],
)
def list_notifications(
    service: NotificationService = Depends(get_notification_service),
):
    return service.list_notifications()


@router.get(
    "/{notification_id}",
    response_model=NotificationResponse,
)
def get_notification(
    notification_id: str,
    service: NotificationService = Depends(get_notification_service),
):
    notification = service.get_notification(notification_id)

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    return notification