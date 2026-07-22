#backend/app/schemas/application.py
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ApplicationCreate(BaseModel):
    name: str


class ApplicationUpdate(BaseModel):
    name: str | None = None
    status: bool | None = None


class ApplicationResponse(BaseModel):
    id: UUID
    name: str
    api_key: str
    secret: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)