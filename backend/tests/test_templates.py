from unittest.mock import MagicMock

import pytest

from app.models.template import Template
from app.repositories.template_repository import TemplateRepository
from app.schemas.template import TemplateCreate, TemplateUpdate
from app.services.template_service import TemplateService


def make_template(**overrides) -> Template:
    """Create a Template model instance with sensible defaults."""
    defaults = {
        "id": "test-template-uuid",
        "name": "Test Template",
        "event_type": "user.registered",
        "channel": "email",
        "subject": "Welcome, {{name}}!",
        "body": "Hello {{name}},\nYour account is ready.",
        "is_active": True,
        "created_at": None,
        "updated_at": None,
    }
    defaults.update(overrides)
    return Template(**defaults)


@pytest.fixture
def mock_repository() -> MagicMock:
    return MagicMock(spec=TemplateRepository)


@pytest.fixture
def service(mock_repository: MagicMock) -> TemplateService:
    mock_repository.update.side_effect = lambda x: x
    return TemplateService(mock_repository)


class TestTemplateServiceCreate:

    def test_create_succeeds(self, service: TemplateService, mock_repository: MagicMock):
        data = TemplateCreate(
            name="Payment Success",
            event_type="payment.success",
            channel="email",
            subject="Payment received, {{name}}",
            body="Thank you {{name}} for your payment of {{amount}}.",
        )
        expected = make_template(**data.model_dump())
        mock_repository.create.return_value = expected

        result = service.create(data)

        mock_repository.create.assert_called_once()
        assert result == expected

    def test_create_without_subject(self, service: TemplateService, mock_repository: MagicMock):
        data = TemplateCreate(
            name="OTP SMS",
            event_type="otp.requested",
            channel="sms",
            body="Your code is: {{code}}",
        )
        expected = make_template(name="OTP SMS", event_type="otp.requested", channel="sms", subject=None, body="Your code is: {{code}}")
        mock_repository.create.return_value = expected

        result = service.create(data)

        assert result.subject is None


class TestTemplateServiceGet:

    def test_get_existing(self, service: TemplateService, mock_repository: MagicMock):
        template = make_template()
        mock_repository.get_by_id.return_value = template

        result = service.get("test-template-uuid")

        assert result == template
        mock_repository.get_by_id.assert_called_once_with("test-template-uuid")

    def test_get_nonexistent_returns_none(self, service: TemplateService, mock_repository: MagicMock):
        mock_repository.get_by_id.return_value = None

        result = service.get("nonexistent")

        assert result is None


class TestTemplateServiceGetForEvent:

    def test_get_for_event_found(self, service: TemplateService, mock_repository: MagicMock):
        template = make_template(event_type="user.registered", channel="email")
        mock_repository.get_by_event_and_channel.return_value = template

        result = service.get_for_event("user.registered", "email")

        assert result == template
        mock_repository.get_by_event_and_channel.assert_called_once_with("user.registered", "email")

    def test_get_for_event_not_found(self, service: TemplateService, mock_repository: MagicMock):
        mock_repository.get_by_event_and_channel.return_value = None

        result = service.get_for_event("unknown.event", "sms")

        assert result is None


class TestTemplateServiceList:

    def test_list_returns_all(self, service: TemplateService, mock_repository: MagicMock):
        mock_repository.list.return_value = [
            make_template(name="Template A"),
            make_template(name="Template B", id="uuid-b"),
        ]

        result = service.list()

        assert len(result) == 2


class TestTemplateServiceUpdate:

    def test_update_sets_fields(self, service: TemplateService, mock_repository: MagicMock):
        template = make_template()
        mock_repository.get_by_id.return_value = template

        data = TemplateUpdate(name="Updated", is_active=False)
        result = service.update(template.id, data)

        assert result.name == "Updated"
        assert result.is_active is False
        mock_repository.update.assert_called_once()

    def test_update_partial_fields(self, service: TemplateService, mock_repository: MagicMock):
        template = make_template()
        mock_repository.get_by_id.return_value = template

        data = TemplateUpdate(body="New body")
        result = service.update(template.id, data)

        assert result.body == "New body"


class TestTemplateServiceDelete:

    def test_delete_calls_repository(self, service: TemplateService, mock_repository: MagicMock):
        template = make_template()
        mock_repository.get_by_id.return_value = template

        service.delete(template.id)

        mock_repository.delete.assert_called_once_with(template)


class TestTemplateServiceRenderText:

    def test_render_text_replaces_variables(self, service: TemplateService):
        text = "Hello {{name}}, your code is {{code}}."
        variables = {"name": "Alice", "code": "123456"}

        result = service.render_text(text, variables)

        assert result == "Hello Alice, your code is 123456."

    def test_render_text_handles_missing_variables(self, service: TemplateService):
        text = "Hello {{name}}, your code is {{code}}."
        variables = {"name": "Bob"}

        result = service.render_text(text, variables)

        assert "{{code}}" in result
        assert "Bob" in result

    def test_render_text_none_input_returns_none(self, service: TemplateService):
        result = service.render_text(None, {})

        assert result is None

    def test_render_text_no_variables(self, service: TemplateService):
        text = "Static message with no placeholders."

        result = service.render_text(text, {})

        assert result == "Static message with no placeholders."


class TestTemplateServiceRender:

    def test_render_returns_subject_and_body(self, service: TemplateService):
        template = make_template(
            subject="Hi {{name}}",
            body="Hello {{name}}, welcome!",
        )
        variables = {"name": "Alice"}

        result = service.render(template, variables)

        assert result["subject"] == "Hi Alice"
        assert result["body"] == "Hello Alice, welcome!"

    def test_render_with_none_subject(self, service: TemplateService):
        template = make_template(subject=None, body="Body only")
        variables = {"name": "Alice"}

        result = service.render(template, variables)

        assert result["subject"] is None
        assert result["body"] == "Body only"
