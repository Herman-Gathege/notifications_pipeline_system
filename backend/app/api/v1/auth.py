#backend/app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
# from app.repositories.application_repository import ApplicationRepository
from app.schemas.auth import (
    TokenRequest,
    TokenResponse,
    ValidateTokenRequest,
    ValidateTokenResponse,
)
from app.repositories.apikey_repository import APIKeyRepository
from app.services.apikey_service import APIKeyService
from app.services.authentication_service import AuthenticationService

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


def get_auth_service(db: Session):
    repository = APIKeyRepository(db)
    apikey_service = APIKeyService(repository)

    return AuthenticationService(apikey_service)


@router.post("/token", response_model=TokenResponse)
def generate_token(
    payload: TokenRequest,
    db: Session = Depends(get_db),
):
    service = get_auth_service(db)

    token = service.create_token(
        payload.api_key,
        payload.secret,
    )

    if token is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials.",
        )

    return TokenResponse(access_token=token)


@router.post(
    "/validate",
    response_model=ValidateTokenResponse,
)
def validate_token(
    payload: ValidateTokenRequest,
    db: Session = Depends(get_db),
):
    service = get_auth_service(db)

    decoded = service.validate_token(payload.token)

    if decoded is None:
        return ValidateTokenResponse(valid=False)

    return ValidateTokenResponse(
        valid=True,
        application_id=decoded["sub"],
    )