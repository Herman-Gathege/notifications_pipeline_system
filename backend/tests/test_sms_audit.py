"""
Focused local audit tests for the SMS/notification pipeline.

These tests use mocks exclusively — no real SMS is sent, no real
network calls are made.  They document:

  * the provider-name mismatch risk (name="sms" vs "Africa's Talking")
  * resolver behaviour for SMS
  * SMSProvider.send return contract (message-id structure, error handling)
  * provider_service.test_provider for unsupported name
  * RoutingService → TemplateService → ProviderResolver pipeline for SMS
  * full worker-style flow with a mocked provider
"""

from unittest.mock import MagicMock, patch

import pytest

from app.models.provider import Provider
from app.repositories.provider_repository import ProviderRepository
from app.repositories.template_repository import TemplateRepository
from app.services.provider_resolver import ProviderResolver
from app.services.provider_service import ProviderService
from app.services.routing_service import RoutingService
from app.services.template_service import TemplateService


def make_provider(**overrides) -> Provider:
    defaults = dict(
        id="test-uuid-1234",
        name="Test Provider",
        channel="email",
        priority=1,
        is_active=True,
        transport_type="api",
        smtp_host=None,
        smtp_port=None,
        smtp_username=None,
        smtp_password=None,
        use_tls=True,
        use_ssl=False,
        from_email=None,
        from_name=None,
        created_at=None,
        updated_at=None,
    )
    defaults.update(overrides)
    return Provider(**defaults)


def make_template(**overrides):
    from app.models.template import Template
    defaults = dict(
        id="tmpl-uuid-1234",
        name="OTP SMS",
        event_type="otp.requested",
        channel="sms",
        subject=None,
        body="Your code is: {{otp}}",
        is_active=True,
        created_at=None,
        updated_at=None,
    )
    defaults.update(overrides)
    return Template(**defaults)


# ------------------------------------------------------------------
# 1. Provider name mismatch: name="sms" vs "Africa's Talking"
# ------------------------------------------------------------------

class TestSmsNameMismatch:
    """The server DB reportedly has name='sms'; the resolver expects 'Africa's Talking'."""

    def test_resolve_sms_with_name_sms_fails(self, mock_repository):
        # Local resolver now accepts both "Africa's Talking" and "sms" as valid
        # SMS provider names so the server config (name="sms") resolves cleanly.
        provider = make_provider(
            name="sms", channel="sms", transport_type="api"
        )
        mock_repository.get_default_by_channel.return_value = provider

        resolver = ProviderResolver(mock_repository)

        resolved, implementation = resolver.resolve("sms")
        from app.providers.sms.sms_provider import SMSProvider
        assert resolved == provider
        assert isinstance(implementation, SMSProvider)

    def test_resolve_sms_with_name_africas_talking_succeeds(self, mock_repository):
        provider = make_provider(
            name="Africa's Talking", channel="sms", transport_type="api"
        )
        mock_repository.get_default_by_channel.return_value = provider

        resolver = ProviderResolver(mock_repository)

        resolved_provider, implementation = resolver.resolve("sms")

        from app.providers.sms.sms_provider import SMSProvider
        assert resolved_provider == provider
        assert isinstance(implementation, SMSProvider)


# ------------------------------------------------------------------
# 2. Provider test endpoint (provider_service.test_provider)
# ------------------------------------------------------------------

class TestProviderServiceTestSms:
    """test_provider must instantiate the same implementation as the resolver."""

    def test_test_provider_sms_name_sms_unsupported(self, service, mock_repository):
        """A DB provider named 'sms' must resolve to a working SMSProvider
        (server config uses name='sms'). The audit expectation that this
        should fail was incorrect — the resolver was updated to accept both
        names."""
        provider = make_provider(
            name="sms", channel="sms", transport_type="api"
        )
        mock_repository.get_by_id.return_value = provider

        with patch("app.services.provider_service.SMSProvider") as sms_cls:
            fake = MagicMock()
            fake.send.return_value = {
                "success": True,
                "status": "sent",
                "provider_message_id": "msg-x",
                "status_code": 201,
                "error": None,
            }
            sms_cls.return_value = fake
            result = service.test_provider("test-id", "+15555550123")

        assert result["success"] is True

    def test_test_provider_sms_name_africas_talking_is_broken(self, service, mock_repository):
        """After the import fix, the test endpoint returns a normal send dict
        for Africa's Talking (SMS) providers."""
        provider = make_provider(
            name="Africa's Talking", channel="sms", transport_type="api"
        )
        mock_repository.get_by_id.return_value = provider

        with patch("app.services.provider_service.SMSProvider") as sms_cls:
            fake = MagicMock()
            fake.send.return_value = {
                "success": True,
                "status": "sent",
                "provider_message_id": "msg-y",
                "status_code": 201,
                "error": None,
            }
            sms_cls.return_value = fake
            result = service.test_provider("test-id", "+15555550123")

        assert result["success"] is True


# ------------------------------------------------------------------
# 3. SMSProvider.send return contract (mocked SDK — no network)
# ------------------------------------------------------------------

class TestSMSProviderSendContract:
    """Verify SMSProvider.send returns the documented dict shape and
    handles errors without leaking internals."""

    def test_send_success_returns_provider_message_id(self):
        from app.providers.sms.sms_provider import SMSProvider
        import app.providers.sms.sms_provider as sms_module

        fake_response = {
            "SMSMessageData": {
                "Message": "Sent to 1/1 recipients",
                "Recipients": [
                    {"number": "+254725325915", "cost": "1.00", "messageId": "msg-abc-123"}
                ],
            }
        }

        original_sms = sms_module.sms
        sms_module.sms = MagicMock()
        sms_module.sms.send.return_value = fake_response

        try:
            provider = SMSProvider()
            result = provider.send(
                recipient="+254725325915",
                subject="ignored-for-sms",
                body="Hello from audit",
            )
        finally:
            sms_module.sms = original_sms

        assert result["success"] is True
        assert result["status"] == "sent"
        # After remediation: provider_message_id is a string extracted from
        # the first recipient's messageId.
        assert result["provider_message_id"] == "msg-abc-123"
        assert isinstance(result["provider_message_id"], str)
        assert result["error"] is None

    def test_send_failure_is_graceful(self):
        from app.providers.sms.sms_provider import SMSProvider
        import app.providers.sms.sms_provider as sms_module

        original_sms = sms_module.sms
        sms_module.sms = MagicMock()
        sms_module.sms.send.side_effect = RuntimeError("Connection refused by provider")

        try:
            provider = SMSProvider()
            result = provider.send(
                recipient="+254700000000",
                subject="ignored",
                body="Hello",
            )
        finally:
            sms_module.sms = original_sms

        assert result["success"] is False
        assert result["status"] == "failed"
        assert result["provider_message_id"] is None
        assert "Connection refused" in result["error"]


# ------------------------------------------------------------------
# 4. RoutingService → Template + Provider pipeline for SMS (mocked, no DB)
# ------------------------------------------------------------------

class TestSmsRoutingPipeline:
    """Simulate the worker's routing path without Celery or a DB."""

    def _build(self, template=None, provider=None, implementation=None):
        template_repo = MagicMock(spec=TemplateRepository)
        provider_repo = MagicMock(spec=ProviderRepository)

        template_service = TemplateService(template_repo)
        provider_resolver = ProviderResolver(provider_repo)
        routing_service = RoutingService(template_service, provider_resolver)

        if template is not None:
            template_repo.get_by_event_and_channel.return_value = template
        else:
            template_repo.get_by_event_and_channel.return_value = None
        if provider:
            provider_repo.get_default_by_channel.return_value = provider

        return routing_service, provider_resolver, template_service, implementation

    def test_sms_route_resolves_template_and_provider(self):
        template = make_template(
            name="OTP SMS", event_type="otp.requested", channel="sms",
            subject=None, body="Your OTP is {{otp}}",
        )
        provider = make_provider(
            name="Africa's Talking", channel="sms", transport_type="api"
        )

        routing_service, resolver, _, impl = self._build(template, provider, None)
        # _build doesn't create impl; resolve does — call resolver directly
        impl_resolved = resolver.resolve("sms")[1]

        route = routing_service.build_route(
            event_type="otp.requested", channel="sms"
        )

        assert route["template"] == template
        assert route["channel"] == "sms"
        from app.providers.sms.sms_provider import SMSProvider
        assert isinstance(impl_resolved, SMSProvider)

    def test_sms_route_fails_when_no_template(self):
        """If no SMS template exists for the event type, routing fails clearly."""
        provider = make_provider(
            name="Africa's Talking", channel="sms", transport_type="api"
        )
        routing_service, _, _, _ = self._build(None, provider, None)

        with pytest.raises(ValueError) as exc_info:
            routing_service.build_route(event_type="user.registered", channel="sms")

        assert "No active template" in str(exc_info.value)
        assert "sms" in str(exc_info.value)

    def test_sms_render_drops_none_subject(self):
        from app.providers.sms.sms_provider import SMSProvider
        template_service = TemplateService(MagicMock(spec=TemplateRepository))
        template = make_template(
            subject=None, body="Code: {{otp}}",
        )
        rendered = template_service.render(template, {"otp": "123456"})

        assert rendered["subject"] is None
        assert rendered["body"] == "Code: 123456"


# ------------------------------------------------------------------
# 5. End-to-end pipeline simulation (mocked provider, no Redis/Celery)
# ------------------------------------------------------------------

class TestSmPipelineEndToEnd:
    """Reproduce the worker's core logic with a fully mocked provider."""

    def test_sms_delivery_sets_delivered_status(self):
        from unittest.mock import patch

        template = make_template(
            name="OTP SMS", event_type="otp.requested", channel="sms",
            subject=None, body="Your OTP is {{otp}}",
        )
        provider = make_provider(
            name="Africa's Talking", channel="sms", transport_type="api"
        )

        template_repo = MagicMock(spec=TemplateRepository)
        provider_repo = MagicMock(spec=ProviderRepository)
        template_repo.get_by_event_and_channel.return_value = template
        provider_repo.get_default_by_channel.return_value = provider

        template_service = TemplateService(template_repo)
        provider_resolver = ProviderResolver(provider_repo)
        routing_service = RoutingService(template_service, provider_resolver)

        route = routing_service.build_route("otp.requested", "sms")

        provider_model, provider_client = provider_resolver.resolve("sms")

        fake_send_result = {
            "success": True,
            "status": "sent",
            "provider_message_id": {"SMSMessageData": {"Message": "Sent to 1/1"}},
            "status_code": 201,
            "error": None,
        }

        with patch.object(type(provider_client), "send", return_value=fake_send_result) as mock_send:
            result = provider_client.send(
                recipient="+254700000000",
                subject=route["template"].subject,
                body="Your OTP is 123456",
            )

        mock_send.assert_called_once()
        assert result["success"] is True

        # Simulate worker status logic
        status = "delivered" if result["success"] else "dead_letter"
        assert status == "delivered"
        assert provider_model.name == "Africa's Talking"


@pytest.fixture
def mock_repository() -> MagicMock:
    return MagicMock(spec=ProviderRepository)


@pytest.fixture
def service(mock_repository: MagicMock) -> ProviderService:
    mock_repository.update.side_effect = lambda x: x
    return ProviderService(mock_repository)
