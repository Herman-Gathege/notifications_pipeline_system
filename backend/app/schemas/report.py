# backend/app/schemas/report.py

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ReportResponse(BaseModel):
    id: str

    period_start: datetime
    period_end: datetime

    notifications_processed: int
    successful_notifications: int
    failed_notifications: int

    email_count: int
    sms_count: int
    whatsapp_count: int

    best_provider: str | None
    provider_statistics: dict

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )