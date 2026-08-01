# #backend/app/services/apikey_service.py
from datetime import UTC, datetime, timedelta

from secrets import token_hex

from app.models.api_key import APIKey
from app.repositories.apikey_repository import APIKeyRepository


class APIKeyService:
    def __init__(self, repository: APIKeyRepository):
        self.repository = repository

    def create_key(self, application_id: str):
        api_key = APIKey(
            application_id=application_id,
            token=token_hex(32),
            expires_at=datetime.now(UTC) + timedelta(days=365),
        )

        return self.repository.create(api_key)

    def get_by_token(self, token: str):
        return self.repository.get_by_token(token)

    def update(self, api_key):
        return self.repository.update(api_key)



    def validate_api_key(self, token: str):
        api_key = self.get_by_token(token)

        if api_key is None:
            return None

        if not api_key.is_active:
            return None

        if (
            api_key.expires_at is not None
            and api_key.expires_at < datetime.now(UTC)
        ):
            return None

        api_key.last_used = datetime.now(UTC)
        self.update(api_key)

        return api_key.application