# backend/app/api/v1/monitoring.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.monitoring import NotificationLogResponse
from app.services.monitoring_service import MonitoringService

router = APIRouter(
    prefix="/monitoring",
    tags=["Monitoring"],
)


@router.get("/statistics")
def statistics(
    db: Session = Depends(get_db),
):
    return MonitoringService(db).statistics()


@router.get(
    "/logs",
    response_model=list[NotificationLogResponse],
)
def logs(
    db: Session = Depends(get_db),
):
    return MonitoringService(db).logs()