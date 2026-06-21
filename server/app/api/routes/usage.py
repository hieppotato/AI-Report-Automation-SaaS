from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user, get_organization_service, get_usage_service
from app.core.exceptions import NotFoundError
from app.schemas.auth import CurrentUser
from app.schemas.usage import UsageCurrentResponse
from app.services.organization_service import OrganizationService
from app.services.usage_service import UsageService

router = APIRouter()


@router.get("/current", response_model=UsageCurrentResponse)
def get_current_usage(
    organization_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_organization_service),
    usage_service: UsageService = Depends(get_usage_service),
) -> UsageCurrentResponse:
    if not org_service.get_membership(organization_id, current_user.id):
        raise NotFoundError("Organization not found.")
    return usage_service.get_current_usage(organization_id)
