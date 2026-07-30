# backend/app/services/provider_resolver.py

from app.models.provider import Provider
from app.providers.email.resend_provider import ResendProvider
from app.repositories.provider_repository import ProviderRepository


class ProviderResolver:
    def __init__(self, repository: ProviderRepository):
        self.repository = repository

    def resolve(self, channel: str):
        providers = self.repository.get_active_by_channel(channel)

        if not providers:
            return None, None

        provider = providers[0]

        implementation = {
            "Resend": ResendProvider,
        }.get(provider.name)

        if implementation is None:
            raise ValueError(
                f"No implementation for provider '{provider.name}'"
            )

        return provider, implementation()