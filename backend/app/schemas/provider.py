# backend/app/schemas/provider.py
from datetime import datetime
from uuid import UUID


    
from pydantic import BaseModel, ConfigDict, EmailStr


class ProviderBase(BaseModel):
    name: str
    channel: str

    priority: int = 1
    is_active: bool = True

    transport_type: str = "api"

    smtp_host: str | None = None
    smtp_port: int | None = None
    smtp_username: str | None = None
    smtp_password: str | None = None

    use_tls: bool = True
    use_ssl: bool = False

    from_email: str | None = None
    from_name: str | None = None


class ProviderCreate(ProviderBase):
    pass


class ProviderUpdate(BaseModel):
    name: str | None = None
    channel: str | None = None
    priority: int | None = None
    is_active: bool | None = None
    transport_type: str | None = None
    smtp_host: str | None = None
    smtp_port: int | None = None
    smtp_username: str | None = None
    smtp_password: str | None = None
    use_tls: bool | None = None
    use_ssl: bool | None = None
    from_email: str | None = None
    from_name: str | None = None


class ProviderResponse(ProviderBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProviderTestRequest(BaseModel):
    provider: str
    recipient: EmailStr


class ProviderTestResponse(BaseModel):
    success: bool
    status: str
    provider_message_id: str | None
    status_code: int | None
    error: str | None


class ProviderTestRequest(BaseModel):
    recipient: EmailStr