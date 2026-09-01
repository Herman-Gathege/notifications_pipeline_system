# app/api/security.py

from fastapi import Depends, Header, HTTPException, status

from app.api.dependencies import get_authentication_service, get_user_service
from app.models.user import User
from app.services.authentication_service import AuthenticationService
from app.services.user_service import UserService


def get_current_application(
    authorization: str = Header(...),
    auth_service: AuthenticationService = Depends(
        get_authentication_service,
    ),
):
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must use the Bearer scheme. Example: Bearer <token>",
        )

    token = authorization.replace("Bearer ", "")

    payload = auth_service.validate_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The provided token is invalid or has expired. Please obtain a new token.",
        )

    if payload.get("type") != "application":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Application token required.",
        )

    return payload


def get_current_user(
    authorization: str = Header(...),
    auth_service: AuthenticationService = Depends(
        get_authentication_service,
    ),
    user_service: UserService = Depends(get_user_service),
):
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must use the Bearer scheme. Example: Bearer <token>",
        )

    token = authorization.replace("Bearer ", "")

    payload = auth_service.validate_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The provided token is invalid or has expired. Please obtain a new token.",
        )

    if payload.get("type") != "user":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. User token required.",
        )

    user = user_service.get_by_id(payload["sub"])

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user.",
        )

    return user


def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )

    return current_user
