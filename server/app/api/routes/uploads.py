from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.api.deps import get_upload_service, require_org_member
from app.schemas.auth import OrganizationContext
from app.schemas.pagination import PaginatedResponse, PaginationParams, get_pagination_params
from app.schemas.upload import UploadCreate, UploadResponse
from app.services.upload_service import UploadService

router = APIRouter()


@router.post(
    "/{organization_id}/uploads",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_upload(
    organization_id: UUID,
    payload: UploadCreate,
    context: OrganizationContext = Depends(require_org_member),
    service: UploadService = Depends(get_upload_service),
) -> dict:
    return service.create_upload(organization_id, context.user_id, payload)


@router.get("/{organization_id}/uploads", response_model=PaginatedResponse[UploadResponse])
def list_uploads(
    organization_id: UUID,
    _: OrganizationContext = Depends(require_org_member),
    pagination: PaginationParams = Depends(get_pagination_params),
    service: UploadService = Depends(get_upload_service),
) -> PaginatedResponse[dict]:
    return service.list_uploads(organization_id, pagination)


@router.get("/{organization_id}/uploads/{upload_id}", response_model=UploadResponse)
def get_upload(
    organization_id: UUID,
    upload_id: UUID,
    _: OrganizationContext = Depends(require_org_member),
    service: UploadService = Depends(get_upload_service),
) -> dict:
    return service.get_upload(organization_id, upload_id)
