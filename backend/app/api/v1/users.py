# backend/app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_user_service
from app.api.security import get_current_user, require_admin
from app.models.user import User
from app.schemas.user import (
    PasswordReset,
    UserCreate,
    UserResponse,
    UserUpdate,
)
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


def get_service(db: Session = Depends(get_db)) -> UserService:
    return get_user_service(db)


@router.get("", response_model=list[UserResponse])
def list_users(
    service: UserService = Depends(get_service),
    current_user: User = Depends(require_admin),
):
    return service.get_all()


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    service: UserService = Depends(get_service),
    current_user: User = Depends(require_admin),
):
    user = service.get_by_id(user_id)

    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")

    return user


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    service: UserService = Depends(get_service),
    current_user: User = Depends(require_admin),
):
    try:
        user = service.create_user(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    payload: UserUpdate,
    service: UserService = Depends(get_service),
    current_user: User = Depends(require_admin),
):
    if payload.role is not None and user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot change your own role.",
        )

    if payload.is_active is False and user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account.",
        )

    try:
        user = service.update_user(user_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")

    return user


@router.post("/{user_id}/reset-password", status_code=status.HTTP_204_NO_CONTENT)
def reset_user_password(
    user_id: str,
    payload: PasswordReset,
    service: UserService = Depends(get_service),
    current_user: User = Depends(require_admin),
):
    user = service.reset_password(user_id, payload.password)

    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: str,
    service: UserService = Depends(get_service),
    current_user: User = Depends(require_admin),
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own account.",
        )

    success = service.delete_user(user_id)

    if not success:
        raise HTTPException(status_code=404, detail="User not found.")