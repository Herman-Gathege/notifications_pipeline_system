"""
Tests for the UserService and User CRUD flow.

These tests use mocked repositories (consistent with the existing template and
provider tests) so they do not require a live database.
"""

from unittest.mock import MagicMock, patch

import pytest

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import PasswordReset, UserCreate, UserUpdate
from app.services.user_service import (
    UserService,
    _hash_password,
    _verify_password,
)


def make_user(**overrides) -> User:
    defaults = {
        "id": "user-uuid",
        "email": "alice@example.com",
        "hashed_password": _hash_password("SuperSecret123!"),
        "name": "Alice",
        "role": "user",
        "is_active": True,
        "created_at": None,
        "updated_at": None,
    }
    defaults.update(overrides)
    return User(**defaults)


@pytest.fixture
def repository() -> MagicMock:
    repo = MagicMock(spec=UserRepository)
    repo.update.side_effect = lambda x: x
    return repo


@pytest.fixture
def service(repository: MagicMock) -> UserService:
    return UserService(repository)


class TestPasswordHashing:
    def test_hash_and_verify(self):
        hashed = _hash_password("Password123!")
        assert hashed != "Password123!"
        assert _verify_password("Password123!", hashed) is True

    def test_verify_rejects_wrong_password(self):
        hashed = _hash_password("Password123!")
        assert _verify_password("OtherPassword!", hashed) is False


class TestCreateUser:
    def test_creates_user_with_hashed_password(self, service, repository):
        repository.get_by_email.return_value = None
        repository.create.side_effect = lambda u: u

        data = UserCreate(
            email="new@example.com",
            password="SuperSecret123!",
            name="New User",
        )

        result = service.create_user(data)

        assert result.email == "new@example.com"
        assert result.name == "New User"
        assert result.role == "user"
        assert result.is_active is True
        assert result.hashed_password != "SuperSecret123!"
        assert _verify_password("SuperSecret123!", result.hashed_password)
        repository.create.assert_called_once()

    def test_creates_admin_when_role_specified(self, service, repository):
        repository.get_by_email.return_value = None
        repository.create.side_effect = lambda u: u

        data = UserCreate(
            email="admin@example.com",
            password="SuperSecret123!",
            name="Admin",
            role="admin",
        )

        result = service.create_user(data)
        assert result.role == "admin"

    def test_rejects_duplicate_email(self, service, repository):
        repository.get_by_email.return_value = make_user(email="dup@example.com")

        data = UserCreate(
            email="dup@example.com",
            password="SuperSecret123!",
            name="Duplicate",
        )

        with pytest.raises(ValueError):
            service.create_user(data)

    def test_rejects_invalid_role(self, service, repository):
        repository.get_by_email.return_value = None

        data = UserCreate(
            email="bad@example.com",
            password="SuperSecret123!",
            name="Bad",
            role="superuser",
        )

        with pytest.raises(ValueError):
            service.create_user(data)


class TestAuthenticate:
    def test_returns_user_on_valid_credentials(self, service, repository):
        user = make_user()
        repository.get_by_email.return_value = user

        assert service.authenticate("alice@example.com", "SuperSecret123!") == user

    def test_returns_none_for_unknown_email(self, service, repository):
        repository.get_by_email.return_value = None
        assert service.authenticate("ghost@example.com", "x") is None

    def test_returns_none_for_bad_password(self, service, repository):
        repository.get_by_email.return_value = make_user()
        assert service.authenticate("alice@example.com", "wrong") is None


class TestGetUser:
    def test_get_by_id(self, service, repository):
        user = make_user()
        repository.get_by_id.return_value = user
        assert service.get_by_id("user-uuid") == user

    def test_get_all(self, service, repository):
        repository.get_all.return_value = [make_user(), make_user(id="u2", email="b@x.com")]
        assert len(service.get_all()) == 2


class TestUpdateUser:
    def test_updates_name(self, service, repository):
        user = make_user()
        repository.get_by_id.return_value = user

        result = service.update_user("user-uuid", UserUpdate(name="Alice 2"))

        assert result.name == "Alice 2"

    def test_updates_role(self, service, repository):
        user = make_user()
        repository.get_by_id.return_value = user

        result = service.update_user("user-uuid", UserUpdate(role="admin"))

        assert result.role == "admin"

    def test_updates_is_active(self, service, repository):
        user = make_user()
        repository.get_by_id.return_value = user

        result = service.update_user("user-uuid", UserUpdate(is_active=False))

        assert result.is_active is False

    def test_rejects_invalid_role(self, service, repository):
        user = make_user()
        repository.get_by_id.return_value = user

        with pytest.raises(ValueError):
            service.update_user("user-uuid", UserUpdate(role="superuser"))

    def test_returns_none_for_missing_user(self, service, repository):
        repository.get_by_id.return_value = None
        assert service.update_user("missing", UserUpdate(name="x")) is None


class TestResetPassword:
    def test_hashes_new_password(self, service, repository):
        user = make_user()
        repository.get_by_id.return_value = user

        result = service.reset_password("user-uuid", "NewSecret123!")

        assert result is not None
        assert _verify_password("NewSecret123!", result.hashed_password)
        assert not _verify_password("SuperSecret123!", result.hashed_password)

    def test_returns_none_for_missing_user(self, service, repository):
        repository.get_by_id.return_value = None
        assert service.reset_password("missing", "NewSecret123!") is None


class TestDeleteUser:
    def test_deletes_existing(self, service, repository):
        user = make_user()
        repository.get_by_id.return_value = user

        assert service.delete_user("user-uuid") is True
        repository.delete.assert_called_once_with(user)

    def test_returns_false_for_missing(self, service, repository):
        repository.get_by_id.return_value = None
        assert service.delete_user("missing") is False


class TestAccessToken:
    def test_token_round_trip(self, service):
        user = make_user()

        token = service.create_access_token(user)
        assert isinstance(token, str)

        payload = service.validate_token(token)
        assert payload is not None
        assert payload.get("type") == "user"
        assert payload.get("sub") == user.id
        assert payload.get("role") == "user"

    def test_invalid_token_returns_none(self, service):
        assert service.validate_token("garbage.token.value") is None


class TestPasswordResetSchema:
    def test_min_length_enforced(self):
        with pytest.raises(Exception):
            PasswordReset(password="short")

    def test_valid_password_accepted(self):
        pr = PasswordReset(password="longenough123")
        assert pr.password == "longenough123"


class TestUserResponseDoesNotLeakPassword:
    def test_response_excludes_hashed_password(self):
        from datetime import datetime, timezone
        from uuid import UUID

        from app.schemas.user import UserResponse

        user = make_user(
            id=str(UUID(int=0x12345678123456781234567812345678)),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        resp = UserResponse.model_validate(user)

        # Pydantic v2 – assert attribute absence
        assert not hasattr(resp, "hashed_password")
        assert not hasattr(resp, "password")
        # Sanity: core fields visible
        assert resp.email == "alice@example.com"
        assert resp.role == "user"