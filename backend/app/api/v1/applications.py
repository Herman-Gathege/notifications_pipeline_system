# backend/app/api/v1/applications.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.api.security import get_current_user, require_admin
from app.models.user import User
from app.repositories.application_repository import ApplicationRepository
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdate,
)
from app.services.application_service import ApplicationService
from app.repositories.apikey_repository import APIKeyRepository
from app.services.apikey_service import APIKeyService

router = APIRouter(prefix="/applications", tags=["Applications"])


def get_service(db: Session):
    application_repository = ApplicationRepository(db)

    api_key_repository = APIKeyRepository(db)
    api_key_service = APIKeyService(api_key_repository)

    return ApplicationService(
        application_repository,
        api_key_service,
    )


def serialize_application(application, show_secret: bool = False):
    result = {
        "id": application.id,
        "name": application.name,
        "secret": application.secret if show_secret else None,
        "status": "active" if application.status else "inactive",
        "created_at": application.created_at,
        "updated_at": application.updated_at,
    }

    if show_secret and application.api_keys:
        result["api_key"] = application.api_keys[0].token

    return result


def assert_owner_or_admin(application, current_user: User):
    if current_user.role != "admin" and application.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this application.",
        )


@router.post("", response_model=ApplicationResponse, status_code=201)
def create_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = get_service(db)

    try:
        application, api_key = service.create_application(payload.name, owner_id=current_user.id)

        response = serialize_application(application, show_secret=True)
        response["api_key"] = api_key.token
        return response

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=list[ApplicationResponse])
def list_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = get_service(db)

    if current_user.role == "admin":
        applications = service.get_all()
    else:
        applications = ApplicationRepository(db).get_by_owner(current_user.id)

    return [
        serialize_application(application, show_secret=False)
        for application in applications
    ]


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = get_service(db)
    application = service.get_by_id(application_id)

    if application is None:
        raise HTTPException(404, "Application not found.")

    assert_owner_or_admin(application, current_user)

    return serialize_application(application, show_secret=False)


@router.patch("/{application_id}", response_model=ApplicationResponse)
def update_application(
    application_id: str,
    payload: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = get_service(db)
    application = service.get_by_id(application_id)

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found.",
        )

    assert_owner_or_admin(application, current_user)

    application = service.update(
        application_id=application_id,
        payload=payload,
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found.",
        )

    return serialize_application(application, show_secret=False)


@router.delete("/{application_id}", status_code=204)
def delete_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = get_service(db)
    application = service.get_by_id(application_id)

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found.",
        )

    assert_owner_or_admin(application, current_user)

    deleted = service.delete(application_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Application not found.",
        )
