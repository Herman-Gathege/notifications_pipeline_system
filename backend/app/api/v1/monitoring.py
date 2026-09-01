# backend/app/api/v1/monitoring.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.monitoring import NotificationLogResponse
from app.services.monitoring_service import MonitoringService
from app.api.security import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/monitoring",
    tags=["Monitoring"],
)


@router.get("/statistics")
def statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return MonitoringService(db).statistics(user=current_user)


@router.get(
    "/logs",
    response_model=list[NotificationLogResponse],
)
def logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return MonitoringService(db).logs(user=current_user)