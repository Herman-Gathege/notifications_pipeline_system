# backend/app/schemas/event.py

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class EventPayload(BaseModel):
    customer: str
    email: EmailStr
    phone: str
    amount: str
    reference: str | None = None


class EventCreate(BaseModel):
    event_type: str
    payload: EventPayload

    # NEW
    channels: list[str]


class EventResponse(BaseModel):
    id: str
    application_id: str
    event_type: str
    payload: dict
    status: str
    is_processed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    