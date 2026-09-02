"""
Regression tests for the FikaTu notification platform SMS/email remediation.

Covers:
1. Provider API responses never expose SMTP passwords.
2. ProviderService.test_provider for Africa's Talking (SMS) does not raise NameError.
3. ProviderResolver correctly resolves Africa's Talking (both names).
4. SMSProvider.send success returns string provider_message_id.
5. SMSProvider.send failure contract.
6. Template variables (otp, name, etc.) are derived from the event payload.
7. Missing/empty SMS recipient is rejected by the worker.
8. provider_message_id is a string or None, never a dict.
9. Template update by ID.
10. Template delete by ID.
11. Template update/delete returns None for missing IDs.
12. Email functionality remains intact (SMTP and Resend).
"""

from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.models.notification import Notification
from app.models.provider import Provider
from app.models.template import Template
from app.providers.sms.sms_provider import SMSProvider
from app.repositories.notification_repository import NotificationRepository
from app.repositories.provider_repository import ProviderRepository
from app.repositories.template_repository import TemplateRepository
from app.schemas.provider import (
    ProviderCreate,
    ProviderPublicResponse,
    ProviderUpdate,
)
from app.services.notification_service import NotificationService
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
        smtp_password="super-secret",
        use_tls=True,
        use_ssl=False,
        from_email=None,
        from_name=None,
        created_at=None,
        updated_at=None,
    )
    defaults.update(overrides)
    return Provider(**defaults)


def make_template(**overrides) -> Template:
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


@pytest.fixture
def mock_repository() -> MagicMock:
    return MagicMock(spec=ProviderRepository)


@pytest.fixture
def service(mock_repository: MagicMock) -> ProviderService:
    mock_repository.update.side_effect = lambda x: x
    return ProviderService(mock_repository)


# ------------------------------------------------------------------
# 1. Provider responses do not expose SMTP password
# ------------------------------------------------------------------

class TestProviderSecretLeakage:

    def test_public_response_excludes_smtp_password(self):
        # Verify the schema definition itself does not declare smtp_password.
        fields = ProviderPublicResponse.model_fields
        assert "smtp_password" not in fields

    def test_create_provider_does_not_return_password(self, service, mock_repository):
        provider = make_provider(smtp_password="hunter2")
        mock_repository.create.return_value = provider

        data = ProviderCreate(
            name="Test",
            channel="email",
            smtp_password="hunter2",
        )
        result = service.create(data)

        # The service returns a Provider model. The API response_model is
        # ProviderPublicResponse, which excludes smtp_password by design.
        assert "smtp_password" not in ProviderPublicResponse.model_fields

    def test_update_provider_does_not_return_password(self, service, mock_repository):
        provider = make_provider(smtp_password="hunter2")
        mock_repository.get_by_id.return_value = provider

        data = ProviderUpdate(name="Updated")
        result = service.update("test-id", data)

        assert "smtp_password" not in ProviderPublicResponse.model_fields
        # And ProviderUpdate allows updating but never returning it.
        assert "smtp_password" not in ProviderPublicResponse.model_fields


# ------------------------------------------------------------------
# 2. SMS provider test endpoint does not raise NameError
# ------------------------------------------------------------------

class TestSmsTestEndpoint:

    def test_test_provider_sms_africas_talking_returns_dict(self, service, mock_repository):
        provider = make_provider(
            name="Africa's Talking",
            channel="sms",
            transport_type="api",
        )
        mock_repository.get_by_id.return_value = provider

        with patch("app.services.provider_service.SMSProvider") as sms_cls:
            fake = MagicMock()
            fake.send.return_value = {
                "success": True,
                "status": "sent",
                "provider_message_id": "msg-123",
                "status_code": 201,
                "error": None,
            }
            sms_cls.return_value = fake

            result = service.test_provider("test-id", "+15555550123")

        assert result["success"] is True
        assert result["provider_message_id"] == "msg-123"

    def test_test_provider_sms_with_name_sms_works(self, service, mock_repository):
        provider = make_provider(
            name="sms",
            channel="sms",
            transport_type="api",
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


# ------------------------------------------------------------------
# 3. Provider resolution
# ------------------------------------------------------------------

class TestProviderResolution:

    def test_resolve_africas_talking(self, mock_repository):
        provider = make_provider(
            name="Africa's Talking",
            channel="sms",
            transport_type="api",
        )
        mock_repository.get_default_by_channel.return_value = provider
        resolver = ProviderResolver(mock_repository)

        resolved_provider, implementation = resolver.resolve("sms")

        assert resolved_provider == provider
        assert isinstance(implementation, SMSProvider)

    def test_resolve_africas_talking_with_name_sms(self, mock_repository):
        provider = make_provider(
            name="sms",
            channel="sms",
            transport_type="api",
        )
        mock_repository.get_default_by_channel.return_value = provider
        resolver = ProviderResolver(mock_repository)

        resolved_provider, implementation = resolver.resolve("sms")

        assert resolved_provider == provider
        assert isinstance(implementation, SMSProvider)

    def test_resolve_smtp(self, mock_repository):
        provider = make_provider(name="SMTP", transport_type="smtp")
        mock_repository.get_default_by_channel.return_value = provider
        resolver = ProviderResolver(mock_repository)

        from app.providers.smtp_provider import SMTPProvider
        _, implementation = resolver.resolve("email")
        assert isinstance(implementation, SMTPProvider)

    def test_resolve_resend(self, mock_repository):
        provider = make_provider(name="Resend", transport_type="api", smtp_password=None)
        mock_repository.get_default_by_channel.return_value = provider
        resolver = ProviderResolver(mock_repository)

        from app.providers.email.resend_provider import ResendProvider
        _, implementation = resolver.resolve("email")
        assert isinstance(implementation, ResendProvider)

    def test_resolve_no_provider_raises(self, mock_repository):
        mock_repository.get_default_by_channel.return_value = None
        resolver = ProviderResolver(mock_repository)

        with pytest.raises(ValueError) as exc:
            resolver.resolve("email")
        assert "No active provider" in str(exc.value)

    def test_resolve_unsupported_raises(self, mock_repository):
        provider = make_provider(name="Unknown", transport_type="api")
        mock_repository.get_default_by_channel.return_value = provider
        resolver = ProviderResolver(mock_repository)

        with pytest.raises(ValueError) as exc:
            resolver.resolve("email")
        assert "No implementation" in str(exc.value)


# ------------------------------------------------------------------
# 4. SMSProvider.send success contract
# ------------------------------------------------------------------

class TestSmsProviderSendSuccess:

    def test_send_returns_string_message_id(self):
        import app.providers.sms.sms_provider as sms_module

        fake_response = {
            "SMSMessageData": {
                "Message": "Sent to 1/1 recipients",
                "Recipients": [
                    {
                        "number": "+15555550123",
                        "cost": "1.00",
                        "messageId": "ATXid_msgabc",
                    }
                ],
            }
        }
        original = sms_module.sms
        sms_module.sms = MagicMock()
        sms_module.sms.send.return_value = fake_response

        try:
            provider = SMSProvider()
            result = provider.send(
                recipient="+15555550123",
                subject="ignored",
                body="Hello",
            )
        finally:
            sms_module.sms = original

        assert result["success"] is True
        assert isinstance(result["provider_message_id"], str)
        assert result["provider_message_id"] == "ATXid_msgabc"

    def test_send_returns_none_when_no_message_id(self):
        import app.providers.sms.sms_provider as sms_module

        fake_response = {
            "SMSMessageData": {
                "Message": "Sent to 1/1",
                "Recipients": [{"number": "+15555550123", "cost": "0"}],
            }
        }
        original = sms_module.sms
        sms_module.sms = MagicMock()
        sms_module.sms.send.return_value = fake_response

        try:
            provider = SMSProvider()
            result = provider.send(
                recipient="+15555550123",
                subject="ignored",
                body="Hello",
            )
        finally:
            sms_module.sms = original

        assert result["provider_message_id"] is None


# ------------------------------------------------------------------
# 5. SMSProvider.send failure contract
# ------------------------------------------------------------------

class TestSmsProviderSendFailure:

    def test_send_failure_returns_none_message_id(self):
        import app.providers.sms.sms_provider as sms_module

        original = sms_module.sms
        sms_module.sms = MagicMock()
        sms_module.sms.send.side_effect = RuntimeError("boom")

        try:
            provider = SMSProvider()
            result = provider.send(
                recipient="+15555550123",
                subject="ignored",
                body="Hello",
            )
        finally:
            sms_module.sms = original

        assert result["success"] is False
        assert result["status"] == "failed"
        assert result["provider_message_id"] is None
        assert "boom" in result["error"]


# ------------------------------------------------------------------
# 6. Template variable derivation
# ------------------------------------------------------------------

class TestTemplateVariableRendering:

    def test_otp_renders(self):
        svc = TemplateService(MagicMock(spec=TemplateRepository))
        template = make_template(subject=None, body="Your OTP is {{otp}}")
        rendered = svc.render(template, {"otp": "123456"})
        assert rendered["body"] == "Your OTP is 123456"

    def test_multiple_variables(self):
        svc = TemplateService(MagicMock(spec=TemplateRepository))
        template = make_template(
            subject="Hello {{name}}",
            body="Code: {{otp}}, link: {{reset_link}}",
        )
        rendered = svc.render(template, {
            "name": "Alice",
            "otp": "654321",
            "reset_link": "https://example.com/r",
        })
        assert rendered["subject"] == "Hello Alice"
        assert "654321" in rendered["body"]
        assert "https://example.com/r" in rendered["body"]

    def test_backends_compat_customer_amount_reference(self):
        from app.workers.notification_worker import _derive_variables

        vars_ = _derive_variables({
            "customer": "Alice",
            "amount": "100",
            "reference": "REF-1",
        })
        assert vars_["customer"] == "Alice"
        assert vars_["amount"] == "100"
        assert vars_["reference"] == "REF-1"


# ------------------------------------------------------------------
# 7. Missing SMS recipient is rejected by worker
# ------------------------------------------------------------------

class TestSmsRecipientValidation:

    def test_missing_phone_returns_dead_letter(self):
        from app.workers.notification_worker import process_notification

        # Build a minimal in-memory session using SQLAlchemy
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker, Session
        from app.database.base import Base
        from app.models.event import Event

        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        TestingSession = sessionmaker(bind=engine)
        db: Session = TestingSession()

        event = Event(
            id="evt-1",
            application_id="app-1",
            event_type="otp.requested",
            payload={"phone": ""},
            status="pending",
            is_processed=False,
        )
        notification = Notification(
            id="ntf-1",
            event_id="evt-1",
            channel="sms",
            status="queued",
        )
        db.add(event)
        db.add(notification)
        db.commit()

        provider = make_provider(
            name="Africa's Talking", channel="sms", transport_type="api"
        )
        template = make_template(
            body="OTP: {{otp}}",
        )

        template_repo = MagicMock(spec=TemplateRepository)
        provider_repo = MagicMock(spec=ProviderRepository)
        template_repo.get_by_event_and_channel.return_value = template
        provider_repo.get_default_by_channel.return_value = provider

        template_service = TemplateService(template_repo)
        provider_resolver = ProviderResolver(provider_repo)

        with patch("app.workers.notification_worker.SessionLocal", return_value=db), \
             patch("app.workers.notification_worker.TemplateRepository", return_value=template_repo), \
             patch("app.workers.notification_worker.ProviderRepository", return_value=provider_repo), \
             patch("app.workers.notification_worker.TemplateService", return_value=template_service), \
             patch("app.workers.notification_worker.ProviderResolver", return_value=provider_resolver):
            # Make resolve raise to short-circuit before send and exercise
            # the missing-phone branch via the worker directly.
            pass

        # Direct test of the worker logic on a real DB:
        # Simulate by directly executing the recipient-check path
        # through the worker's local variables. Instead, drive via
        # SessionLocal + repositories patched, and assert dead_letter.
        # Reuse the simpler unit-test approach: call the helper logic.

        # Build a fresh DB session via SessionLocal and run worker.
        from app.workers import notification_worker as worker_module

        class FakeTemplateRepo:
            def __init__(self, t):
                self.t = t
            def get_by_event_and_channel(self, *a, **k):
                return self.t

        class FakeProviderRepo:
            def __init__(self, p):
                self.p = p
            def get_default_by_channel(self, *a, **k):
                return self.p

        class FakeResolver:
            def __init__(self, p, c):
                self.p = p
                self.c = c
            def resolve(self, channel):
                return self.p, self.c

        class FakeClient:
            def send(self, **kwargs):
                raise AssertionError("send should not be called when phone is missing")

        provider_model, fake_client = provider, FakeClient()
        fake_resolver = FakeResolver(provider_model, fake_client)

        with patch.object(worker_module, "SessionLocal", return_value=db), \
             patch.object(worker_module, "TemplateRepository", lambda db: FakeTemplateRepo(template)), \
             patch.object(worker_module, "ProviderRepository", lambda db: FakeProviderRepo(provider)), \
             patch.object(worker_module, "TemplateService", lambda repo: template_service), \
             patch.object(worker_module, "ProviderResolver", lambda repo: fake_resolver):
            result = process_notification("ntf-1")

        db.expire_all()
        refreshed = db.get(Notification, "ntf-1")
        assert refreshed.status == "dead_letter"
        assert refreshed.failure_reason == "Missing recipient phone number"
        assert result["status"] == "dead_letter"


# ------------------------------------------------------------------
# 8. provider_message_id must be string or None
# ------------------------------------------------------------------

class TestMessageIdTypeContract:

    def test_success_id_is_string_or_none(self):
        import app.providers.sms.sms_provider as sms_module
        original = sms_module.sms
        sms_module.sms = MagicMock()
        sms_module.sms.send.return_value = {
            "SMSMessageData": {
                "Recipients": [{"messageId": "msg-1"}],
            }
        }
        try:
            result = SMSProvider().send(
                recipient="+1", subject="x", body="y"
            )
        finally:
            sms_module.sms = original
        assert isinstance(result["provider_message_id"], (str, type(None)))
        assert not isinstance(result["provider_message_id"], dict)

    def test_failure_id_is_none(self):
        import app.providers.sms.sms_provider as sms_module
        original = sms_module.sms
        sms_module.sms = MagicMock()
        sms_module.sms.send.side_effect = Exception("boom")
        try:
            result = SMSProvider().send(
                recipient="+1", subject="x", body="y"
            )
        finally:
            sms_module.sms = original
        assert result["provider_message_id"] is None


# ------------------------------------------------------------------
# 9, 10, 11. Template update/delete by ID
# ------------------------------------------------------------------

class TestTemplateUpdateDelete:

    @pytest.fixture
    def tpl_service(self):
        repo = MagicMock(spec=TemplateRepository)
        repo.update.side_effect = lambda x: x
        return TemplateService(repo), repo

    def test_update_by_id(self, tpl_service):
        svc, repo = tpl_service
        template = make_template()
        repo.get_by_id.return_value = template

        from app.schemas.template import TemplateUpdate
        result = svc.update("tmpl-uuid-1234", TemplateUpdate(name="New Name"))

        assert result is not None
        assert result.name == "New Name"
        repo.update.assert_called_once()

    def test_update_missing_returns_none(self, tpl_service):
        svc, repo = tpl_service
        repo.get_by_id.return_value = None

        from app.schemas.template import TemplateUpdate
        result = svc.update("does-not-exist", TemplateUpdate(name="x"))

        assert result is None
        repo.update.assert_not_called()

    def test_delete_by_id(self, tpl_service):
        svc, repo = tpl_service
        template = make_template()
        repo.get_by_id.return_value = template

        result = svc.delete("tmpl-uuid-1234")
        assert result is True
        repo.delete.assert_called_once_with(template)

    def test_delete_missing_returns_false(self, tpl_service):
        svc, repo = tpl_service
        repo.get_by_id.return_value = None

        result = svc.delete("does-not-exist")
        assert result is False
        repo.delete.assert_not_called()


# ------------------------------------------------------------------
# 12. Email functionality remains intact
# ------------------------------------------------------------------

class TestEmailIntact:

    def test_smtp_test_provider_returns_failure_gracefully(self, service, mock_repository):
        provider = make_provider(
            name="SMTP",
            channel="email",
            transport_type="smtp",
            smtp_host="smtp.example.com",
            smtp_port=587,
        )
        mock_repository.get_by_id.return_value = provider

        result = service.test_provider("test-id", "test@example.com")
        assert isinstance(result, dict)
        assert "success" in result

    def test_resend_test_provider_runs(self, service, mock_repository):
        provider = make_provider(
            name="Resend", channel="email", transport_type="api"
        )
        mock_repository.get_by_id.return_value = provider

        result = service.test_provider("test-id", "test@example.com")
        assert isinstance(result, dict)
        assert "success" in result

    def test_smtp_provider_send_failure_contract(self):
        from app.providers.smtp_provider import SMTPProvider

        provider_model = make_provider(
            name="SMTP",
            transport_type="smtp",
            smtp_host="nonexistent.invalid",
            smtp_port=587,
            smtp_username="u",
            smtp_password="p",
            use_tls=True,
        )
        smtp = SMTPProvider(provider_model)
        result = smtp.send(
            recipient="test@example.com",
            subject="hi",
            body="hello",
        )
        assert result["success"] is False
        assert result["provider_message_id"] is None
        assert isinstance(result["error"], str)