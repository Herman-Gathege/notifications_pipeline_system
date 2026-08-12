# backend/app/schemas/monitoring.py

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationLogResponse(BaseModel):
    id: str
    recipient: str
    provider: str | None
    channel: str
    status: str
    processing_time_ms: int | None
    failure_reason: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)