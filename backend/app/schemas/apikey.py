#backend/app/schemas/apikey.py
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class APIKeyResponse(BaseModel):
    id: UUID
    application_id: UUID
    token: str
    expires_at: datetime
    last_used: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)