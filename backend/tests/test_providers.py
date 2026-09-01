from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.models.provider import Provider
from app.providers.base import NotificationProvider
from app.repositories.provider_repository import ProviderRepository
from app.schemas.provider import ProviderCreate, ProviderUpdate
from app.services.provider_resolver import ProviderResolver
from app.services.provider_service import ProviderService


def make_provider(**overrides) -> Provider:
    """Create a Provider model instance with sensible defaults."""
    defaults = {
        "id": "test-uuid-1234",
        "name": "Test Provider",
        "channel": "email",
        "priority": 1,
        "is_active": True,
        "transport_type": "api",
        "smtp_host": None,
        "smtp_port": None,
        "smtp_username": None,
        "smtp_password": None,
        "use_tls": True,
        "use_ssl": False,
        "from_email": None,
        "from_name": None,
        "created_at": None,
        "updated_at": None,
    }
    defaults.update(overrides)
    return Provider(**defaults)


@pytest.fixture
def mock_repository() -> MagicMock:
    """Create a mock ProviderRepository."""
    return MagicMock(spec=ProviderRepository)


@pytest.fixture
def service(mock_repository: MagicMock) -> ProviderService:
    mock_repository.update.side_effect = lambda x: x
    return ProviderService(mock_repository)


class TestProviderServiceCreate:

    def test_create_succeeds(self, service: ProviderService, mock_repository: MagicMock):
        data = ProviderCreate(name="Resend", channel="email", priority=1, transport_type="api")
        expected_provider = make_provider(name="Resend")

        mock_repository.create.return_value = expected_provider

        result = service.create(data)

        mock_repository.create.assert_called_once()
        assert result == expected_provider

    def test_create_duplicate_raises_conflict(self, service: ProviderService, mock_repository: MagicMock):
        from sqlalchemy.exc import IntegrityError

        data = ProviderCreate(name="Resend", channel="email", priority=1, transport_type="api")
        mock_repository.create.side_effect = IntegrityError(
            statement=None, params=None, orig=Exception("duplicate key")
        )

        with pytest.raises(HTTPException) as exc_info:
            service.create(data)

        assert exc_info.value.status_code == 409


class TestProviderServiceList:

    def test_list_returns_all_providers(self, service: ProviderService, mock_repository: MagicMock):
        mock_repository.list.return_value = [
            make_provider(name="Resend"),
            make_provider(name="SMTP", id="smtp-uuid"),
        ]

        result = service.list()

        assert len(result) == 2
        mock_repository.list.assert_called_once()


class TestProviderServiceGet:

    def test_get_existing(self, service: ProviderService, mock_repository: MagicMock):
        provider = make_provider()
        mock_repository.get_by_id.return_value = provider

        result = service.get("test-uuid-1234")

        assert result == provider
        mock_repository.get_by_id.assert_called_once_with("test-uuid-1234")

    def test_get_nonexistent_returns_none(self, service: ProviderService, mock_repository: MagicMock):
        mock_repository.get_by_id.return_value = None

        result = service.get("nonexistent")

        assert result is None


class TestProviderServiceGetDefault:

    def test_get_default_delegates_to_repository(self, service: ProviderService, mock_repository: MagicMock):
        provider = make_provider()
        mock_repository.get_default_by_channel.return_value = provider

        result = service.get_default("email")

        assert result == provider
        mock_repository.get_default_by_channel.assert_called_once_with("email")


class TestProviderServiceEnableDisable:

    def test_enable_sets_active_true(self, service: ProviderService, mock_repository: MagicMock):
        provider = make_provider(is_active=False)
        mock_repository.get_by_id.return_value = provider

        result = service.enable("test-id")

        assert result.is_active is True
        mock_repository.update.assert_called_once()

    def test_enable_nonexistent_returns_none(self, service: ProviderService, mock_repository: MagicMock):
        mock_repository.get_by_id.return_value = None

        result = service.enable("nonexistent")

        assert result is None

    def test_disable_sets_active_false(self, service: ProviderService, mock_repository: MagicMock):
        provider = make_provider(is_active=True)
        mock_repository.get_by_id.return_value = provider

        result = service.disable("test-id")

        assert result.is_active is False
        mock_repository.update.assert_called_once()

    def test_disable_nonexistent_returns_none(self, service: ProviderService, mock_repository: MagicMock):
        mock_repository.get_by_id.return_value = None

        result = service.disable("nonexistent")

        assert result is None


class TestProviderServiceUpdate:

    def test_update_existing(self, service: ProviderService, mock_repository: MagicMock):
        provider = make_provider()
        mock_repository.get_by_id.return_value = provider

        data = ProviderUpdate(name="Updated Name")
        result = service.update("test-id", data)

        assert result.name == "Updated Name"
        mock_repository.update.assert_called_once()

    def test_update_nonexistent_returns_none(self, service: ProviderService, mock_repository: MagicMock):
        mock_repository.get_by_id.return_value = None

        data = ProviderUpdate(name="Updated")
        result = service.update("nonexistent", data)

        assert result is None


class TestProviderServiceDelete:

    def test_delete_existing(self, service: ProviderService, mock_repository: MagicMock):
        provider = make_provider()
        mock_repository.get_by_id.return_value = provider

        result = service.delete("test-id")

        assert result is True
        mock_repository.delete.assert_called_once()

    def test_delete_nonexistent_returns_false(self, service: ProviderService, mock_repository: MagicMock):
        mock_repository.get_by_id.return_value = None

        result = service.delete("nonexistent")

        assert result is False


class TestProviderServiceTestProvider:

    def test_test_provider_not_found_raises_404(self, service: ProviderService, mock_repository: MagicMock):
        mock_repository.get_by_id.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            service.test_provider("nonexistent", "test@example.com")

        assert exc_info.value.status_code == 404

    def test_test_provider_disabled_raises_400(self, service: ProviderService, mock_repository: MagicMock):
        provider = make_provider(is_active=False)
        mock_repository.get_by_id.return_value = provider

        with pytest.raises(HTTPException) as exc_info:
            service.test_provider("test-id", "test@example.com")

        assert exc_info.value.status_code == 400

    def test_test_provider_smtp(self, service: ProviderService, mock_repository: MagicMock):
        from app.providers.smtp_provider import SMTPProvider

        provider = make_provider(
            name="SMTP",
            transport_type="smtp",
            smtp_host="smtp.example.com",
            smtp_port=587,
        )
        mock_repository.get_by_id.return_value = provider

        result = service.test_provider("test-id", "test@example.com")

        assert isinstance(result, dict)
        assert result["success"] is False
        assert result["status"] == "failed"

    def test_test_provider_resend(self, service: ProviderService, mock_repository: MagicMock):
        provider = make_provider(
            name="Resend",
            transport_type="api",
        )
        mock_repository.get_by_id.return_value = provider

        result = service.test_provider("test-id", "test@example.com")

        assert isinstance(result, dict)
        assert "success" in result


class TestProviderResolver:

    def test_resolve_smtp(self, mock_repository: MagicMock):
        provider = make_provider(name="SMTP", transport_type="smtp")
        mock_repository.get_default_by_channel.return_value = provider

        resolver = ProviderResolver(mock_repository)

        resolved_provider, implementation = resolver.resolve("email")

        from app.providers.smtp_provider import SMTPProvider
        assert resolved_provider == provider
        assert isinstance(implementation, SMTPProvider)

    def test_resolve_resend(self, mock_repository: MagicMock):
        provider = make_provider(name="Resend", transport_type="api")
        mock_repository.get_default_by_channel.return_value = provider

        resolver = ProviderResolver(mock_repository)

        resolved_provider, implementation = resolver.resolve("email")

        from app.providers.email.resend_provider import ResendProvider
        assert resolved_provider == provider
        assert isinstance(implementation, ResendProvider)

    def test_resolve_africa_stalking(self, mock_repository: MagicMock):
        provider = make_provider(
            name="Africa's Talking",
            channel="sms",
            transport_type="api",
        )
        mock_repository.get_default_by_channel.return_value = provider

        resolver = ProviderResolver(mock_repository)

        resolved_provider, implementation = resolver.resolve("sms")

        from app.providers.sms.sms_provider import SMSProvider
        assert resolved_provider == provider
        assert isinstance(implementation, SMSProvider)

    def test_resolve_no_provider_raises(self, mock_repository: MagicMock):
        mock_repository.get_default_by_channel.return_value = None

        resolver = ProviderResolver(mock_repository)

        with pytest.raises(ValueError) as exc_info:
            resolver.resolve("email")

        assert "No active provider" in str(exc_info.value)

    def test_resolve_unsupported_combination_raises(self, mock_repository: MagicMock):
        provider = make_provider(name="UnknownProvider", transport_type="api")
        mock_repository.get_default_by_channel.return_value = provider

        resolver = ProviderResolver(mock_repository)

        with pytest.raises(ValueError) as exc_info:
            resolver.resolve("email")

        assert "No implementation" in str(exc_info.value)
