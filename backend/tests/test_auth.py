"""
Tests for the AuthenticationService — login, registration, token validation.
"""

from unittest.mock import MagicMock

import pytest

from app.repositories.apikey_repository import APIKeyRepository
from app.services.apikey_service import APIKeyService
from app.services.authentication_service import AuthenticationService
from app.services.user_service import UserService


@pytest.fixture
def user_service() -> MagicMock:
    return MagicMock(spec=UserService)


@pytest.fixture
def api_key_service() -> MagicMock:
    return MagicMock(spec=APIKeyService)


@pytest.fixture
def auth_service(user_service: MagicMock, api_key_service: MagicMock) -> AuthenticationService:
    return AuthenticationService(api_key_service, user_service)


class TestApplicationToken:
    def test_returns_token_on_valid_credentials(self, auth_service, api_key_service):
        application = MagicMock()
        application.id = "app-uuid"
        application.name = "Demo"
        application.secret = "s3cr3t"
        api_key_service.validate_api_key.return_value = application

        token = auth_service.create_token("api-key", "s3cr3t")

        assert token is not None
        assert isinstance(token, str)

    def test_returns_none_for_invalid_credentials(self, auth_service, api_key_service):
        api_key_service.validate_api_key.return_value = None
        assert auth_service.create_token("api-key", "s3cr3t") is None

    def test_returns_none_for_bad_secret(self, auth_service, api_key_service):
        application = MagicMock()
        application.secret = "s3cr3t"
        api_key_service.validate_api_key.return_value = application

        assert auth_service.create_token("api-key", "wrong") is None


class TestValidateToken:
    def test_valid_token_returns_payload(self, auth_service):
        from datetime import datetime, timedelta, UTC
        from jose import jwt
        from app.config.settings import settings

        token = jwt.encode(
            {"sub": "abc", "type": "user", "exp": datetime.now(UTC) + timedelta(hours=1)},
            settings.SECRET_KEY,
            algorithm="HS256",
        )

        payload = auth_service.validate_token(token)

        assert payload is not None
        assert payload["sub"] == "abc"
        assert payload["type"] == "user"

    def test_garbage_token_returns_none(self, auth_service):
        assert auth_service.validate_token("not.a.token") is None

    def test_expired_token_returns_none(self, auth_service):
        from datetime import datetime, timedelta, UTC
        from jose import jwt
        from app.config.settings import settings

        token = jwt.encode(
            {"sub": "abc", "type": "user", "exp": datetime.now(UTC) - timedelta(hours=1)},
            settings.SECRET_KEY,
            algorithm="HS256",
        )

        assert auth_service.validate_token(token) is None


class TestRegisterUser:
    def test_delegates_to_user_service(self, auth_service, user_service):
        user_service.create_user.return_value = MagicMock()

        auth_service.register_user("a@b.com", "Password123!", "Alice")

        user_service.create_user.assert_called_once()

    def test_propagates_value_error(self, auth_service, user_service):
        user_service.create_user.side_effect = ValueError("duplicate")

        with pytest.raises(ValueError):
            auth_service.register_user("a@b.com", "Password123!", "Alice")


class TestLoginUser:
    def test_returns_token_and_user_data(self, auth_service, user_service):
        from datetime import datetime, UTC

        user = MagicMock()
        user.id = "abc"
        user.email = "a@b.com"
        user.name = "Alice"
        user.role = "user"
        user.is_active = True
        user.created_at = datetime.now(UTC)
        user.updated_at = datetime.now(UTC)

        user_service.authenticate.return_value = user
        user_service.create_access_token.return_value = "signed.token"

        result = auth_service.login_user("a@b.com", "Password123!")

        assert result is not None
        assert result["access_token"] == "signed.token"
        assert result["user"]["email"] == "a@b.com"
        assert result["user"]["role"] == "user"

    def test_returns_none_for_invalid_credentials(self, auth_service, user_service):
        user_service.authenticate.return_value = None
        assert auth_service.login_user("a@b.com", "wrong") is None

    def test_returns_none_for_inactive_user(self, auth_service, user_service):
        user = MagicMock()
        user.is_active = False
        user_service.authenticate.return_value = user

        assert auth_service.login_user("a@b.com", "Password123!") is None


class TestPasswordNotInToken:
    def test_password_field_is_not_in_token(self, auth_service, user_service):
        from datetime import datetime, UTC

        user = MagicMock()
        user.id = "abc"
        user.email = "a@b.com"
        user.name = "Alice"
        user.role = "user"
        user.is_active = True
        user.created_at = datetime.now(UTC)
        user.updated_at = datetime.now(UTC)

        user_service.authenticate.return_value = user
        user_service.create_access_token.return_value = "signed.token"

        result = auth_service.login_user("a@b.com", "Password123!")
        token_str = result["access_token"]

        assert "Password123" not in token_str
        assert "password" not in result["user"]