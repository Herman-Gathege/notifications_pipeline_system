# backend/app/services/provider_service.py

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.models.provider import Provider
from app.repositories.provider_repository import ProviderRepository
from app.schemas.provider import (
    ProviderCreate,
    ProviderTestRequest,
    ProviderUpdate,
)

from app.providers.email.resend_provider import ResendProvider

from app.services.provider_resolver import ProviderResolver

from app.providers.base import NotificationProvider

from app.providers.smtp_provider import SMTPProvider


class ProviderService:
    """
    Handles CRUD operations for notification providers.

    Sprint 4
    --------
    • CRUD
    • Enable / Disable

    Sprint 5
    --------
    • Provider selection
    • Health checks
    • Provider testing
    • Failover
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

            transport_type=data.transport_type,

            smtp_host=data.smtp_host,
            smtp_port=data.smtp_port,
            smtp_username=data.smtp_username,
            smtp_password=data.smtp_password,

            use_tls=data.use_tls,
            use_ssl=data.use_ssl,

            from_email=data.from_email,
            from_name=data.from_name,
        )

        try:
            return self.repository.create(provider)

        except IntegrityError:
            raise HTTPException(
                status_code=409,
                detail="Provider with this name already exists.",
            )

    def list(self) -> list[Provider]:
        return self.repository.list()

    def get(
        self,
        provider_id: str,
    ) -> Provider | None:

        return self.repository.get_by_id(provider_id)

    def get_default(
        self,
        channel: str,
    ) -> Provider | None:

        return self.repository.get_default_by_channel(channel)

    def test_provider(
        self,
        provider_id: str,
        recipient: str,
    ) -> dict:

        provider = self.repository.get_by_id(
            provider_id,
        )

        if provider is None:
            raise HTTPException(
                status_code=404,
                detail="Provider not found.",
            )

        if not provider.is_active:
            raise HTTPException(
                status_code=400,
                detail="Provider is disabled.",
            )

        # resolver = ProviderResolver(self.repository)

        # _, client = resolver.resolve(provider.channel)

        # return client.send(
        #     recipient=recipient,
        #     subject="Notification Platform Test",
        #     body=(
        #         "Congratulations!\n\n"
        #         "Your notification provider is configured correctly."
        #     ),
        # )

        if provider.transport_type == "smtp":

            client = SMTPProvider(provider)

        else:

            client = ResendProvider()

        return client.send(
            recipient=recipient,
            subject="Notification Platform Test",
            body=(
                "Congratulations!\n\n"
                "Your notification provider is configured correctly."
            ),
        )

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

    def enable(
        self,
        provider_id: str,
    ) -> Provider | None:

        provider = self.repository.get_by_id(provider_id)

        if provider is None:
            return None

        provider.is_active = True

        return self.repository.update(provider)

    def disable(
        self,
        provider_id: str,
    ) -> Provider | None:

        provider = self.repository.get_by_id(provider_id)

        if provider is None:
            return None

        provider.is_active = False

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