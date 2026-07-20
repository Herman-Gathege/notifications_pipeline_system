#backend/app/api/v1/applications.py
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.repositories.application_repository import ApplicationRepository
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdate,
)
from app.services.application_service import ApplicationService

router = APIRouter(prefix="/applications", tags=["Applications"])


def get_service(db: Session):
    repository = ApplicationRepository(db)
    return ApplicationService(repository)


@router.post("", response_model=ApplicationResponse, status_code=201)
def create_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
):
    service = get_service(db)

    try:
        return service.create_application(payload.name)

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=list[ApplicationResponse])
def list_applications(
    db: Session = Depends(get_db),
):
    return get_service(db).get_all()


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: UUID,
    db: Session = Depends(get_db),
):
    application = get_service(db).get_by_id(application_id)

    if application is None:
        raise HTTPException(404, "Application not found.")

    return application

@router.patch("/{application_id}", response_model=ApplicationResponse)
def update_application(
    application_id: UUID,
    payload: ApplicationUpdate,
    db: Session = Depends(get_db),
):
    service = get_service(db)

    application = service.update(
        application_id=application_id,
        payload=payload,
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found.",
        )

    return application


@router.delete("/{application_id}", status_code=204)
def delete_application(
    application_id: UUID,
    db: Session = Depends(get_db),
):
    deleted = get_service(db).delete(application_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Application not found.",
        )