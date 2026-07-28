# backend/app/services/provider_service.py

from app.models.provider import Provider
from app.repositories.provider_repository import ProviderRepository
from app.schemas.provider import (
    ProviderCreate,
    ProviderUpdate,
)


class ProviderService:
    """
    Handles CRUD operations for notification providers.

    Sprint 4:
    - Create providers
    - Update providers
    - List providers
    - Enable/Disable providers

    Sprint 5:
    - Health checks
    - Failover
    - Metrics
    """

    def __init__(
        self,
        repository: ProviderRepository,
    ):
        self.repository = repository

    def create(
        self,
        data: ProviderCreate,
    ) -> Provider:

        provider = Provider(
            name=data.name,
            channel=data.channel,
            priority=data.priority,
            is_active=data.is_active,
        )

        return self.repository.create(provider)

    def list(self) -> list[Provider]:
        return self.repository.list()

    def get(
        self,
        provider_id: str,
    ) -> Provider | None:
        return self.repository.get_by_id(provider_id)

    def update(
        self,
        provider_id: str,
        data: ProviderUpdate,
    ) -> Provider | None:

        provider = self.repository.get_by_id(provider_id)

        if provider is None:
            return None

        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(provider, field, value)

        return self.repository.update(provider)

    def delete(
        self,
        provider_id: str,
    ) -> bool:

        provider = self.repository.get_by_id(provider_id)

        if provider is None:
            return False

        self.repository.delete(provider)

        return True
