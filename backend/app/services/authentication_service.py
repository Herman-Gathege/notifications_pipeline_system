# #backend/app/services/authentication_service.py
# from datetime import UTC, datetime


# class AuthenticationService:
#     @staticmethod
#     def validate_api_key(api_key):
#         if api_key is None:
#             return False

#         if api_key.expires_at < datetime.now(UTC):
#             return False

#         return True


from datetime import datetime, timedelta, UTC

from jose import jwt, JWTError

from app.config.settings import settings
from app.services.apikey_service import APIKeyService


class AuthenticationService:
    def __init__(self, api_key_service: APIKeyService):
        self.apikey_service = api_key_service

    def create_token(self, api_key: str, secret: str):
        application = self.apikey_service.validate_api_key(api_key)

        if application is None:
            return None

        if application.secret != secret:
            return None

        payload = {
            "sub": str(application.id),
            "app": application.name,
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