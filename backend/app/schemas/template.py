# backend/app/schemas/template.py
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TemplateBase(BaseModel):
    name: str
    event_type: str
    channel: str
    subject: str | None = None
    body: str
    is_active: bool = True


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(BaseModel):
    name: str | None = None
    event_type: str | None = None
    channel: str | None = None
    subject: str | None = None
    body: str | None = None
    is_active: bool | None = None


class TemplateResponse(TemplateBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)