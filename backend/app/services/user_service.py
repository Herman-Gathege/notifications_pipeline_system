# backend/app/services/user_service.py
import bcrypt

from datetime import datetime, timedelta, UTC

from jose import jwt, JWTError

from app.config.settings import settings
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed_password.encode())


class UserService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    def create_user(self, data: UserCreate) -> User:
        existing = self.repository.get_by_email(data.email)

        if existing:
            raise ValueError("User with this email already exists.")

        user = User(
            email=data.email,
            hashed_password=_hash_password(data.password),
            name=data.name,
            role="user",
        )

        return self.repository.create(user)

    def authenticate(self, email: str, password: str) -> User | None:
        user = self.repository.get_by_email(email)

        if user is None:
            return None

        if not _verify_password(password, user.hashed_password):
            return None

        return user

    def get_by_email(self, email: str) -> User | None:
        return self.repository.get_by_email(email)

    def get_by_id(self, user_id: str) -> User | None:
        return self.repository.get_by_id(user_id)

    def get_all(self) -> list[User]:
        return self.repository.get_all()

    def update_user(self, user_id: str, data: UserUpdate) -> User | None:
        user = self.repository.get_by_id(user_id)

        if user is None:
            return None

        if data.name is not None:
            user.name = data.name

        if data.role is not None:
            user.role = data.role

        if data.is_active is not None:
            user.is_active = data.is_active

        return self.repository.update(user)

    def delete_user(self, user_id: str) -> bool:
        user = self.repository.get_by_id(user_id)

        if user is None:
            return False

        self.repository.delete(user)
        return True

    def create_access_token(self, user: User) -> str:
        payload = {
            "sub": str(user.id),
            "type": "user",
            "role": user.role,
            "email": user.email,
            "exp": datetime.now(UTC) + timedelta(hours=24),
        }

        return jwt.encode(
            payload,
            settings.SECRET_KEY,
            algorithm="HS256",
        )

    def validate_token(self, token: str) -> dict | None:
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=["HS256"],
            )

            if payload.get("type") != "user":
                return None

            return payload

        except JWTError:
            return None
