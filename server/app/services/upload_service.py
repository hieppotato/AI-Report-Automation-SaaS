from uuid import UUID

from app.core.exceptions import NotFoundError
from app.repositories.upload_repo import UploadRepository
from app.schemas.pagination import PaginatedResponse, PaginationParams
from app.schemas.upload import UploadCreate


class UploadService:
    def __init__(self, repo: UploadRepository) -> None:
        self.repo = repo

    def create_upload(self, organization_id: UUID, uploaded_by: UUID, payload: UploadCreate) -> dict:
        return self.repo.create_upload(organization_id, uploaded_by, payload)

    def list_uploads(self, organization_id: UUID, pagination: PaginationParams) -> PaginatedResponse[dict]:
        items, total = self.repo.list_uploads(organization_id, pagination.limit, pagination.offset)
        return PaginatedResponse(items=items, total=total, limit=pagination.limit, offset=pagination.offset)

    def get_upload(self, organization_id: UUID, upload_id: UUID) -> dict:
        upload = self.repo.get_upload_by_id(organization_id, upload_id)
        if not upload:
            raise NotFoundError("Upload not found.")
        return upload
