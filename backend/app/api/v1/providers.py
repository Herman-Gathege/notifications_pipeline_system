# backend/app/api/v1/providers.py
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_provider_service
from app.schemas.provider import (
    ProviderCreate,
    ProviderResponse,
    ProviderTestRequest,
    ProviderTestResponse,
    ProviderUpdate,
)
from app.services.provider_service import ProviderService

router = APIRouter(
    prefix="/providers",
    tags=["Providers"],
)


@router.post(
    "",
    response_model=ProviderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_provider(
    data: ProviderCreate,
    service: ProviderService = Depends(get_provider_service),
):
    return service.create(data)


@router.get(
    "",
    response_model=list[ProviderResponse],
)
def list_providers(
    service: ProviderService = Depends(get_provider_service),
):
    return service.list()


@router.patch(
    "/{provider_id}",
    response_model=ProviderResponse,
)
def update_provider(
    provider_id: str,
    data: ProviderUpdate,
    service: ProviderService = Depends(get_provider_service),
):
    provider = service.update(
        provider_id,
        data,
    )

    if provider is None:
        raise HTTPException(
            status_code=404,
            detail="Provider not found",
        )

    return provider


# @router.post(
#     "/test",
#     response_model=ProviderTestResponse,
# )
# def test_provider(
#     data: ProviderTestRequest,
#     service: ProviderService = Depends(get_provider_service),
# ):
#     return service.test_provider(data)


@router.delete(
    "/{provider_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_provider(
    provider_id: str,
    service: ProviderService = Depends(get_provider_service),
):
    success = service.delete(provider_id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Provider not found",
        )

    return

@router.post(
    "/{provider_id}/test",
    response_model=ProviderTestResponse,
)
def test_provider(
    provider_id: str,
    data: ProviderTestRequest,
    service: ProviderService = Depends(get_provider_service),
):
    return service.test_provider(
        provider_id=provider_id,
        recipient=data.recipient,
    )