# backend/app/schemas/event.py

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EventCreate(BaseModel):
    event_type: str
    payload: dict
    channels: list[str]
    application_id: str | None = None


class EventResponse(BaseModel):
    id: str
    application_id: str
    event_type: str
    payload: dict
    status: str
    is_processed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    