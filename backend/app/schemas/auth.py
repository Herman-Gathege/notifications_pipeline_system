# backend/app/schemas/auth.py
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


class UserLogin(BaseModel):
    email: str
    password: str


class UserRegister(BaseModel):
    email: str
    password: str
    name: str


class UserTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class LogoutRequest(BaseModel):
    token: str | None = None


class LogoutResponse(BaseModel):
    detail: str
