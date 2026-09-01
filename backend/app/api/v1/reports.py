# backend/app/api/v1/reports.py

from fastapi import APIRouter, Depends

from app.api.dependencies import get_report_service
from app.api.security import get_current_user
from app.schemas.report import ReportResponse
from app.services.report_service import ReportService
from app.models.user import User

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


@router.post(
    "/generate",
    response_model=ReportResponse,
)
def generate_report(
    current_user: User = Depends(get_current_user),
    service: ReportService = Depends(
        get_report_service,
    ),
):
    return service.generate_report(user=current_user)


@router.get(
    "",
    response_model=list[ReportResponse],
)
def list_reports(
    current_user: User = Depends(get_current_user),
    service: ReportService = Depends(get_report_service),
):
    return service.list_reports()
