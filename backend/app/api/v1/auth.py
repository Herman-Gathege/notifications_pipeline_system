#backend/app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_auth_service, get_db, get_user_service
from app.schemas.auth import (
    TokenRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserTokenResponse,
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
    api_key_service = APIKeyService(APIKeyRepository(db))
    user_service = get_user_service(db)
    return AuthenticationService(api_key_service, user_service)


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
            detail="The API key or secret is incorrect. Please verify your credentials and try again.",
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
        application_id=decoded.get("sub"),
    )


@router.post("/register", response_model=UserTokenResponse)
def register(
    payload: UserRegister,
    db: Session = Depends(get_db),
):
    service = get_auth_service(db)

    try:
        user = service.register_user(
            email=payload.email,
            password=payload.password,
            name=payload.name,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    token_data = service.login_user(payload.email, payload.password)

    if token_data is None:
        raise HTTPException(
            status_code=400,
            detail="Registration succeeded but automatic login failed. Please log in.",
        )

    return UserTokenResponse(
        access_token=token_data["access_token"],
        user=token_data["user"],
    )


@router.post("/login", response_model=UserTokenResponse)
def login(
    payload: UserLogin,
    db: Session = Depends(get_db),
):
    service = get_auth_service(db)

    user = service.user_service.get_by_email(payload.email)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="No account found with this email. Please verify your email address or register.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Your account has been deactivated. Please contact an administrator.",
        )

    if not service.user_service.authenticate(payload.email, payload.password):
        raise HTTPException(
            status_code=401,
            detail="The password you entered is incorrect. Please try again.",
        )

    token_data = service.login_user(payload.email, payload.password)

    if token_data is None:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during login. Please try again.",
        )

    return UserTokenResponse(
        access_token=token_data["access_token"],
        user=token_data["user"],
    )
