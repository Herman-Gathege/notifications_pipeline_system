from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_template_service
from app.api.security import get_current_user, require_admin
from app.schemas.template import (
    TemplateCreate,
    TemplateResponse,
    TemplateUpdate,
)
from app.services.template_service import TemplateService
from app.models.user import User

router = APIRouter(
    prefix="/templates",
    tags=["Templates"],
)


@router.post(
    "",
    response_model=TemplateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_template(
    data: TemplateCreate,
    current_user: User = Depends(require_admin),
    service: TemplateService = Depends(get_template_service),
):
    return service.create(data)


@router.get(
    "",
    response_model=list[TemplateResponse],
)
def list_templates(
    current_user: User = Depends(get_current_user),
    service: TemplateService = Depends(get_template_service),
):
    return service.list()


@router.patch(
    "/{template_id}",
    response_model=TemplateResponse,
)
def update_template(
    template_id: str,
    data: TemplateUpdate,
    current_user: User = Depends(require_admin),
    service: TemplateService = Depends(get_template_service),
):
    template = service.update(
        template_id,
        data,
    )

    if template is None:
        raise HTTPException(
            status_code=404,
            detail="Template not found",
        )

    return template


@router.delete(
    "/{template_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_template(
    template_id: str,
    current_user: User = Depends(require_admin),
    service: TemplateService = Depends(get_template_service),
):
    success = service.delete(template_id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Template not found",
        )

    return