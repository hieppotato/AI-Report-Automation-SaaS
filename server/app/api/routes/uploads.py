from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile, status

from app.api.deps import get_storage_service, get_upload_service, get_usage_service, require_org_member
from app.schemas.auth import OrganizationContext
from app.schemas.pagination import PaginatedResponse, PaginationParams, get_pagination_params
from app.schemas.upload import UploadCreate, UploadResponse
from app.services.storage_service import StorageService
from app.services.usage_service import UsageService
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


@router.post(
    "/{organization_id}/uploads/file",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_file(
    organization_id: UUID,
    file: UploadFile = File(...),
    context: OrganizationContext = Depends(require_org_member),
    storage_service: StorageService = Depends(get_storage_service),
    upload_service: UploadService = Depends(get_upload_service),
    usage_service: UsageService = Depends(get_usage_service),
) -> dict:
    content = await file.read()
    usage_service.enforce_storage_upload(organization_id, len(content))
    await file.seek(0)
    stored_file = await storage_service.upload_organization_file(organization_id, file)
    return upload_service.create_upload(
        organization_id,
        context.user_id,
        UploadCreate(
            file_name=stored_file["file_name"],
            file_path=stored_file["file_path"],
            mime_type=stored_file["mime_type"],
            size_bytes=stored_file["size_bytes"],
            status="uploaded",
        ),
    )


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
