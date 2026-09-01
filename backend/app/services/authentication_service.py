# backend/app/services/authentication_service.py
from datetime import datetime, timedelta, UTC

from jose import jwt, JWTError

from app.config.settings import settings
from app.services.apikey_service import APIKeyService
from app.services.user_service import UserService
from app.schemas.user import UserCreate


class AuthenticationService:
    def __init__(self, api_key_service: APIKeyService, user_service: UserService):
        self.apikey_service = api_key_service
        self.user_service = user_service

    def create_token(self, api_key: str, secret: str):
        application = self.apikey_service.validate_api_key(api_key)

        if application is None:
            return None

        if application.secret != secret:
            return None

        payload = {
            "sub": str(application.id),
            "app": application.name,
            "type": "application",
            "exp": datetime.now(UTC) + timedelta(hours=24),
        }

        return jwt.encode(
            payload,
            settings.SECRET_KEY,
            algorithm="HS256",
        )

    def validate_token(self, token: str):
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=["HS256"],
            )

            return payload

        except JWTError:
            return None

    def register_user(self, email: str, password: str, name: str):
        return self.user_service.create_user(
            UserCreate(email=email, password=password, name=name)
        )

    def login_user(self, email: str, password: str):
        user = self.user_service.authenticate(email, password)

        if user is None:
            return None

        if not user.is_active:
            return None

        token = self.user_service.create_access_token(user)

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "is_active": user.is_active,
                "created_at": user.created_at,
                "updated_at": user.updated_at,
            },
        }
