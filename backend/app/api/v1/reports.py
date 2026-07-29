# backend/app/api/v1/reports.py

from fastapi import APIRouter, Depends

from app.api.dependencies import get_report_service
from app.schemas.report import ReportResponse
from app.services.report_service import ReportService

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


@router.post(
    "/generate",
    response_model=ReportResponse,
)
def generate_report(
    service: ReportService = Depends(
        get_report_service,
    ),
):
    return service.generate_report()