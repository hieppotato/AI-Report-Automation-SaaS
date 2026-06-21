from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.deps import get_audit_service, require_org_member
from app.schemas.audit import AuditEventResponse
from app.schemas.auth import OrganizationContext
from app.schemas.pagination import PaginatedResponse, PaginationParams, get_pagination_params
from app.services.audit_service import AuditService

router = APIRouter()


@router.get("/{organization_id}/audit-events", response_model=PaginatedResponse[AuditEventResponse])
def list_audit_events(
    organization_id: UUID,
    _: OrganizationContext = Depends(require_org_member),
    pagination: PaginationParams = Depends(get_pagination_params),
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    actor_id: UUID | None = None,
    action: str | None = None,
    service: AuditService = Depends(get_audit_service),
) -> PaginatedResponse[dict]:
    return service.list_events(
        organization_id,
        pagination,
        date_from=date_from,
        date_to=date_to,
        actor_id=actor_id,
        action=action,
    )
