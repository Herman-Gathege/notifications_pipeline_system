# app/api/security.py

from fastapi import Depends, Header, HTTPException, status

from app.api.dependencies import get_authentication_service
from app.services.authentication_service import AuthenticationService


def get_current_application(
    authorization: str = Header(...),
    auth_service: AuthenticationService = Depends(
        get_authentication_service,
    ),
):
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bearer token",
        )

    token = authorization.replace("Bearer ", "")

    payload = auth_service.validate_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    return payload