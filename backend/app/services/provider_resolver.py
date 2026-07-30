# backend/app/services/provider_resolver.py

from app.providers.email.resend_provider import ResendProvider
from app.repositories.provider_repository import ProviderRepository


class ProviderResolver:
    """
    Resolves the active provider implementation
    for a notification channel.
    """

    IMPLEMENTATIONS = {
        "Resend": ResendProvider,
    }

    def __init__(
        self,
        repository: ProviderRepository,
    ):
        self.repository = repository

    def resolve(self, channel: str):
        """
        Returns:

            (
                Provider model,
                Provider implementation
            )

        Raises:
            ValueError
                if no active provider exists
                or no implementation exists.
        """

        provider = self.repository.get_default_by_channel(
            channel
        )

        if provider is None:
            raise ValueError(
                f"No active provider configured for '{channel}'."
            )

        implementation = self.IMPLEMENTATIONS.get(
            provider.name
        )

        if implementation is None:
            raise ValueError(
                f"No implementation for provider '{provider.name}'."
            )

        return (
            provider,
            implementation(),
        )

    