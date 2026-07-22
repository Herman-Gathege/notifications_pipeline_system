#backend/app/schemas/auth.py
from pydantic import BaseModel


class TokenRequest(BaseModel):
    api_key: str
    secret: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ValidateTokenRequest(BaseModel):
    token: str


class ValidateTokenResponse(BaseModel):
    valid: bool
    application_id: str | None = None