# backend/app/events/registry.py

from pydantic import BaseModel, EmailStr


class PaymentSuccessPayload(BaseModel):
    customer: str
    email: EmailStr
    phone: str
    amount: str
    reference: str | None = None


class UserRegisteredPayload(BaseModel):
    name: str
    email: EmailStr


class PasswordResetPayload(BaseModel):
    email: EmailStr
    reset_link: str


class OTPRequestedPayload(BaseModel):
    phone: str
    otp: str


EVENT_REGISTRY: dict[str, type[BaseModel]] = {
    "payment.success": PaymentSuccessPayload,
    "user.registered": UserRegisteredPayload,
    "password.reset": PasswordResetPayload,
    "otp.requested": OTPRequestedPayload,
}