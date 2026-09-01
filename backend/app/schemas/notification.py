# backend/app/schemas/notification.py
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    id: str
    event_id: str
    recipient: str
    channel: str
    status: str
    provider: str | None = None
    processing_time_ms: int | None = None
    failure_reason: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)