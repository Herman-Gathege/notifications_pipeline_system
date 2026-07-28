# backend/app/schemas/provider.py
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ProviderBase(BaseModel):
    name: str
    channel: str
    priority: int = 1
    is_active: bool = True


class ProviderCreate(ProviderBase):
    pass


class ProviderUpdate(BaseModel):
    name: str | None = None
    channel: str | None = None
    priority: int | None = None
    is_active: bool | None = None


class ProviderResponse(ProviderBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)