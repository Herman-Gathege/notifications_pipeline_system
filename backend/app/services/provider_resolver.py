# backend/app/services/provider_resolver.py
from app.providers.email.resend_provider import ResendProvider
from app.providers.smtp_provider import SMTPProvider
from app.repositories.provider_repository import ProviderRepository


class ProviderResolver:
    """
    Resolves the active provider implementation
    for a notification channel.
    """

    def __init__(
        self,
        repository: ProviderRepository,
    ):
        self.repository = repository

    def resolve(
        self,
        channel: str,
    ):
        """
        Returns:

            (
                Provider model,
                Provider implementation
            )
        """

        provider = self.repository.get_default_by_channel(
            channel
        )

        if provider is None:
            raise ValueError(
                f"No active provider configured for '{channel}'."
            )

        if provider.transport_type == "smtp":

            implementation = SMTPProvider(
                provider,
            )

        elif (
            provider.transport_type == "api"
            and provider.name == "Resend"
        ):

            implementation = ResendProvider()

        else:

            raise ValueError(
                f"No implementation for provider "
                f"'{provider.name}' "
                f"({provider.transport_type})."
            )

        return (
            provider,
            implementation,
        )