# backend/app/services/provider_resolver.py

from app.models.provider import Provider
from app.repositories.provider_repository import ProviderRepository


class ProviderResolver:
    """
    Chooses the best provider for a channel.

    Sprint 4:
    - Active providers only
    - Lowest priority number wins

    Sprint 5:
    - Failover
    - Health checks
    - Provider weights
    """

    def __init__(self, repository: ProviderRepository):
        self.repository = repository

    def resolve(
        self,
        channel: str,
    ) -> Provider | None:

        providers = self.repository.get_active_by_channel(channel)

        if not providers:
            return None

        return providers[0]